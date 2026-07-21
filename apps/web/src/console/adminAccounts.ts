import { hotelOptions, type HotelId } from "./commercialData";

export type AdminStatus = "active" | "paused";

export interface AdminAccount {
  id: string;
  brandId: string;
  username: string;
  email: string;
  passwordDigest: string;
  role: "operator";
  allowedHotelIds: HotelId[];
  status: AdminStatus;
  lastActiveAt: string;
}

export interface AdminAccountInput {
  username: string;
  email: string;
  password: string;
  allowedHotelIds: readonly HotelId[];
  status: AdminStatus;
}

export interface AdminMutationResult {
  accounts: AdminAccount[];
  account?: AdminAccount;
  error?: string;
}

export const demoPasswordDigest = "186bf572";
export const adminAccountsStoragePrefix = "oneday-console-admins";

export function digestDemoPassword(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function adminAccountsStorageKey(brandId: string) {
  return `${adminAccountsStoragePrefix}:${brandId}`;
}

export function defaultAdminAccounts(brandId: string): AdminAccount[] {
  return [
    {
      id: `${brandId}-admin-wumingchu`,
      brandId,
      username: "无名初酒店",
      email: "wumingchu@oneday.demo",
      passwordDigest: demoPasswordDigest,
      role: "operator",
      allowedHotelIds: ["wumingchu"],
      status: "active",
      lastActiveAt: "今天 08:30",
    },
    {
      id: `${brandId}-admin-junting`,
      brandId,
      username: "君亭酒店",
      email: "junting@oneday.demo",
      passwordDigest: demoPasswordDigest,
      role: "operator",
      allowedHotelIds: ["junting"],
      status: "active",
      lastActiveAt: "昨天 17:40",
    },
  ];
}

function knownHotelIds(hotelIds: readonly string[]) {
  const knownIds = new Set<HotelId>(hotelOptions.map((hotel) => hotel.id));
  return [...new Set(hotelIds)].filter((hotelId): hotelId is HotelId =>
    knownIds.has(hotelId as HotelId),
  );
}

function normalizeAdminAccount(value: unknown, brandId: string): AdminAccount | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AdminAccount>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.username !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.passwordDigest !== "string" ||
    !Array.isArray(candidate.allowedHotelIds) ||
    (candidate.status !== "active" && candidate.status !== "paused")
  ) {
    return null;
  }
  const allowedHotelIds = knownHotelIds(candidate.allowedHotelIds);
  if (allowedHotelIds.length === 0) return null;
  return {
    id: candidate.id,
    brandId,
    username: candidate.username,
    email: candidate.email.toLowerCase(),
    passwordDigest: candidate.passwordDigest,
    role: "operator",
    allowedHotelIds,
    status: candidate.status,
    lastActiveAt:
      typeof candidate.lastActiveAt === "string" ? candidate.lastActiveAt : "暂无记录",
  };
}

type AdminStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(storage?: AdminStorage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readAdminAccounts(
  brandId: string,
  storage?: AdminStorage,
): AdminAccount[] {
  const activeStorage = browserStorage(storage);
  if (!activeStorage) return defaultAdminAccounts(brandId);
  const raw = activeStorage.getItem(adminAccountsStorageKey(brandId));
  if (raw === null) return defaultAdminAccounts(brandId);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultAdminAccounts(brandId);
    const accounts = parsed
      .map((account) => normalizeAdminAccount(account, brandId))
      .filter((account): account is AdminAccount => account !== null);
    return accounts.length === parsed.length ? accounts : defaultAdminAccounts(brandId);
  } catch {
    return defaultAdminAccounts(brandId);
  }
}

export function saveAdminAccounts(
  brandId: string,
  accounts: readonly AdminAccount[],
  storage?: AdminStorage,
) {
  const activeStorage = browserStorage(storage);
  if (!activeStorage) return;
  activeStorage.setItem(adminAccountsStorageKey(brandId), JSON.stringify(accounts));
}

function normalizedInput(input: AdminAccountInput) {
  return {
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    allowedHotelIds: knownHotelIds(input.allowedHotelIds),
    status: input.status,
  };
}

function validateInput(
  accounts: readonly AdminAccount[],
  input: ReturnType<typeof normalizedInput>,
  editingId?: string,
) {
  if (!input.username || !input.email) return "请填写用户名和邮箱";
  if (input.allowedHotelIds.length === 0) return "请至少选择一家可管理酒店";
  const duplicateEmail = accounts.some(
    (account) => account.email === input.email && account.id !== editingId,
  );
  return duplicateEmail ? "该邮箱已存在" : null;
}

export function createAdminAccount(
  accounts: readonly AdminAccount[],
  brandId: string,
  input: AdminAccountInput,
  id: string,
): AdminMutationResult {
  const normalized = normalizedInput(input);
  const validationError = validateInput(accounts, normalized);
  if (validationError) return { accounts: [...accounts], error: validationError };
  if (!normalized.password.trim()) {
    return { accounts: [...accounts], error: "新增管理员时必须设置初始密码" };
  }
  const account: AdminAccount = {
    id,
    brandId,
    username: normalized.username,
    email: normalized.email,
    passwordDigest: digestDemoPassword(normalized.password),
    role: "operator",
    allowedHotelIds: normalized.allowedHotelIds,
    status: normalized.status,
    lastActiveAt: "尚未登录",
  };
  return { accounts: [...accounts, account], account };
}

export function updateAdminAccount(
  accounts: readonly AdminAccount[],
  accountId: string,
  input: AdminAccountInput,
): AdminMutationResult {
  const existing = accounts.find((account) => account.id === accountId);
  if (!existing) return { accounts: [...accounts], error: "管理员账号不存在" };
  const normalized = normalizedInput(input);
  const validationError = validateInput(accounts, normalized, accountId);
  if (validationError) return { accounts: [...accounts], error: validationError };
  const account: AdminAccount = {
    ...existing,
    username: normalized.username,
    email: normalized.email,
    passwordDigest: normalized.password.trim()
      ? digestDemoPassword(normalized.password)
      : existing.passwordDigest,
    role: "operator",
    allowedHotelIds: normalized.allowedHotelIds,
    status: normalized.status,
  };
  return {
    accounts: accounts.map((current) => (current.id === accountId ? account : current)),
    account,
  };
}

export function authenticateAdminAccount(
  accounts: readonly AdminAccount[],
  email: string,
  passwordDigest: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    accounts.find(
      (account) =>
        account.email === normalizedEmail &&
        account.passwordDigest === passwordDigest &&
        account.status === "active",
    ) ?? null
  );
}

export function hotelNamesForAccount(account: AdminAccount) {
  const nameById = new Map(hotelOptions.map((hotel) => [hotel.id, hotel.name]));
  return account.allowedHotelIds
    .map((hotelId) => nameById.get(hotelId))
    .filter((name): name is NonNullable<typeof name> => name !== undefined);
}
