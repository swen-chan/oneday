export interface CalendarDay {
  dayIndex: number;
  momentsPost: string;
  groupTopic: string;
  dmScript: string;
}

export interface CalendarPackageResponse {
  brandName: string;
  monthTheme: string;
  generatedBy: string;
  days: CalendarDay[];
  failedDays: { dayIndex: number; reason: string }[];
}

export const contentPackagePresets = [
  {
    id: "weekly",
    name: "7 天陪跑包",
    days: 7,
    goal: "新主题启动",
    theme: "睡眠修复 · 7 天陪跑",
  },
  {
    id: "activation",
    name: "14 天降温唤醒包",
    days: 14,
    goal: "拉回低互动成员",
    theme: "温和回访 · 重新连接",
  },
  {
    id: "camp",
    name: "21 天主题营包",
    days: 21,
    goal: "月度营期交付",
    theme: "深度休息 · 21 天练习营",
  },
] as const;

export const contentDayOptions = [3, 7, 14, 30] as const;

export const contentToneOptions = [
  { id: "warm", label: "温柔陪伴", prompt: "温柔陪伴语气" },
  { id: "calm", label: "专业克制", prompt: "专业克制语气" },
  { id: "light", label: "轻松日常", prompt: "轻松日常语气" },
] as const;

export const contentChannelOptions = [
  {
    id: "all",
    label: "全渠道",
    hint: "朋友圈 / 群 / 私信",
    prompt: "朋友圈、群话题、私信三渠道",
    fields: ["momentsPost", "groupTopic", "dmScript"] as const,
  },
  {
    id: "moments",
    label: "朋友圈",
    hint: "公开种草",
    prompt: "朋友圈单渠道",
    fields: ["momentsPost"] as const,
  },
  {
    id: "group",
    label: "群话题",
    hint: "社群互动",
    prompt: "社群话题单渠道",
    fields: ["groupTopic"] as const,
  },
  {
    id: "dm",
    label: "私信",
    hint: "一对一触达",
    prompt: "私信触达单渠道",
    fields: ["dmScript"] as const,
  },
] as const;

export type ContentPackageId = (typeof contentPackagePresets)[number]["id"] | "custom";
export type ContentToneId = (typeof contentToneOptions)[number]["id"];
export type ContentChannelId = (typeof contentChannelOptions)[number]["id"];
export type ContentField = "momentsPost" | "groupTopic" | "dmScript";

export const contentFieldLabels: Record<ContentField, string> = {
  momentsPost: "朋友圈",
  groupTopic: "群话题",
  dmScript: "私信话术",
};

export interface ContentPackageResult {
  packageName: string;
  requestedDays: number;
  theme: string;
  toneId: ContentToneId;
  toneLabel: string;
  channelId: ContentChannelId;
  channelLabel: string;
  channelHint: string;
  channelFields: ContentField[];
  generatedAt: string;
  calendar: CalendarPackageResponse;
}

export interface ContentPackageFavorite extends ContentPackageResult {
  id: string;
  favoriteName: string;
  savedAt: string;
}

const favoriteStorageVersion = 1;
export const maxContentPackageFavorites = 40;
const favoriteStoragePrefix = "oneday-content-package-favorites:v1";
const contentFields = new Set<ContentField>(["momentsPost", "groupTopic", "dmScript"]);
const toneIds = new Set<ContentToneId>(contentToneOptions.map((option) => option.id));
const channelIds = new Set<ContentChannelId>(contentChannelOptions.map((option) => option.id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCalendarDay(value: unknown): CalendarDay | null {
  if (!isRecord(value)) return null;
  if (!Number.isInteger(value.dayIndex) || Number(value.dayIndex) < 1) return null;
  if (
    !isNonEmptyString(value.momentsPost) ||
    !isNonEmptyString(value.groupTopic) ||
    !isNonEmptyString(value.dmScript)
  ) {
    return null;
  }
  return {
    dayIndex: Number(value.dayIndex),
    momentsPost: value.momentsPost,
    groupTopic: value.groupTopic,
    dmScript: value.dmScript,
  };
}

export function parseCalendarPackageResponse(value: unknown): CalendarPackageResponse | null {
  if (!isRecord(value)) return null;
  if (
    !isNonEmptyString(value.brandName) ||
    !isNonEmptyString(value.monthTheme) ||
    !isNonEmptyString(value.generatedBy) ||
    !Array.isArray(value.days)
  ) {
    return null;
  }
  const days = value.days.map(parseCalendarDay);
  if (days.length === 0 || days.some((day) => day === null)) return null;
  const rawFailedDays = Array.isArray(value.failedDays) ? value.failedDays : [];
  const failedDays = rawFailedDays.flatMap((failedDay) => {
    if (!isRecord(failedDay)) return [];
    if (!Number.isInteger(failedDay.dayIndex) || !isNonEmptyString(failedDay.reason)) return [];
    return [{ dayIndex: Number(failedDay.dayIndex), reason: failedDay.reason }];
  });
  return {
    brandName: value.brandName,
    monthTheme: value.monthTheme,
    generatedBy: value.generatedBy,
    days: days as CalendarDay[],
    failedDays,
  };
}

function parseContentPackageResult(value: unknown): ContentPackageResult | null {
  if (!isRecord(value)) return null;
  if (
    !isNonEmptyString(value.packageName) ||
    !Number.isInteger(value.requestedDays) ||
    Number(value.requestedDays) < 1 ||
    Number(value.requestedDays) > 31 ||
    !isNonEmptyString(value.theme) ||
    !isNonEmptyString(value.toneId) ||
    !toneIds.has(value.toneId as ContentToneId) ||
    !isNonEmptyString(value.toneLabel) ||
    !isNonEmptyString(value.channelId) ||
    !channelIds.has(value.channelId as ContentChannelId) ||
    !isNonEmptyString(value.channelLabel) ||
    !isNonEmptyString(value.channelHint) ||
    !Array.isArray(value.channelFields) ||
    !isNonEmptyString(value.generatedAt)
  ) {
    return null;
  }
  const channelFields = value.channelFields.filter(
    (field): field is ContentField => typeof field === "string" && contentFields.has(field as ContentField),
  );
  if (channelFields.length !== value.channelFields.length || channelFields.length === 0) return null;
  const calendar = parseCalendarPackageResponse(value.calendar);
  if (!calendar) return null;
  return {
    packageName: value.packageName,
    requestedDays: Number(value.requestedDays),
    theme: value.theme,
    toneId: value.toneId as ContentToneId,
    toneLabel: value.toneLabel,
    channelId: value.channelId as ContentChannelId,
    channelLabel: value.channelLabel,
    channelHint: value.channelHint,
    channelFields,
    generatedAt: value.generatedAt,
    calendar,
  };
}

function parseFavorite(value: unknown): ContentPackageFavorite | null {
  if (!isRecord(value)) return null;
  const result = parseContentPackageResult(value);
  if (
    !result ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.favoriteName) ||
    !isNonEmptyString(value.savedAt)
  ) {
    return null;
  }
  return {
    ...result,
    id: value.id,
    favoriteName: value.favoriteName,
    savedAt: value.savedAt,
  };
}

export function contentFavoriteStorageKey(brandId: string, accountId: string) {
  return `${favoriteStoragePrefix}:${encodeURIComponent(brandId)}:${encodeURIComponent(
    accountId.trim().toLowerCase(),
  )}`;
}

export function readContentPackageFavorites(
  storage: Pick<Storage, "getItem">,
  brandId: string,
  accountId: string,
): ContentPackageFavorite[] {
  const raw = storage.getItem(contentFavoriteStorageKey(brandId, accountId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== favoriteStorageVersion || !Array.isArray(parsed.favorites)) {
      return [];
    }
    return parsed.favorites
      .map(parseFavorite)
      .filter((favorite): favorite is ContentPackageFavorite => favorite !== null)
      .slice(0, maxContentPackageFavorites);
  } catch {
    return [];
  }
}

export function writeContentPackageFavorites(
  storage: Pick<Storage, "setItem">,
  brandId: string,
  accountId: string,
  favorites: readonly ContentPackageFavorite[],
) {
  try {
    storage.setItem(
      contentFavoriteStorageKey(brandId, accountId),
      JSON.stringify({
        version: favoriteStorageVersion,
        favorites: favorites.slice(0, maxContentPackageFavorites),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function createContentPackageFavorite(
  result: ContentPackageResult,
  favoriteName: string,
  options: { id?: string; savedAt?: string } = {},
): ContentPackageFavorite {
  const savedAt = options.savedAt ?? new Date().toISOString();
  const id =
    options.id ??
    `content-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    ...result,
    calendar: {
      ...result.calendar,
      days: result.calendar.days.map((day) => ({ ...day })),
      failedDays: result.calendar.failedDays.map((failedDay) => ({ ...failedDay })),
    },
    channelFields: [...result.channelFields],
    id,
    favoriteName: favoriteName.trim(),
    savedAt,
  };
}

export function addContentPackageFavorite(
  favorites: readonly ContentPackageFavorite[],
  favorite: ContentPackageFavorite,
) {
  return [favorite, ...favorites.filter((item) => item.id !== favorite.id)].slice(
    0,
    maxContentPackageFavorites,
  );
}

export function renameContentPackageFavorite(
  favorites: readonly ContentPackageFavorite[],
  favoriteId: string,
  favoriteName: string,
) {
  const normalizedName = favoriteName.trim();
  if (!normalizedName) return [...favorites];
  return favorites.map((favorite) =>
    favorite.id === favoriteId ? { ...favorite, favoriteName: normalizedName } : favorite,
  );
}

export function removeContentPackageFavorite(
  favorites: readonly ContentPackageFavorite[],
  favoriteId: string,
) {
  return favorites.filter((favorite) => favorite.id !== favoriteId);
}
