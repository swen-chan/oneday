"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// One Day 私域运营台：账号入口 → 该品牌的工作台。
// 多租户叙事：每个品牌有自己的群数据、健康分和内容默认值。

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3210";

interface Brand {
  id: string;
  name: string;
  industry: string;
  tagline: string;
  defaultTheme: string;
  groupId: string | null;
  memberCount: number;
}

interface Member {
  alias: string;
  displayName?: string;
  lastActiveAt: string;
  messageCount: number;
}

interface Dashboard {
  groupId: string;
  groupName: string;
  referenceDate: string;
  layers: { active: Member[]; cooling: Member[]; sleeping: Member[] };
  summary: {
    total: number;
    activeCount: number;
    coolingCount: number;
    sleepingCount: number;
    activeRatio: number;
    healthScore: number;
  };
}

interface CalendarDay {
  dayIndex: number;
  momentsPost: string;
  groupTopic: string;
  dmScript: string;
}

interface CalendarPackage {
  brandName: string;
  monthTheme: string;
  generatedBy: string;
  days: CalendarDay[];
}

const contentPackagePresets = [
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

const contentDayOptions = [3, 7, 14, 30] as const;

type ContentPackageId = (typeof contentPackagePresets)[number]["id"] | "custom";
type EntryMode = "login" | "register";
type ContentField = "momentsPost" | "groupTopic" | "dmScript";
type DemoWorkspace = "login" | "console" | "member" | "workspaces";
type DemoRole = "owner" | "operator" | "member";
type ManageableUserRole = "operator" | "member";
type ConsoleUserStatus = "active" | "paused";

interface ConsoleUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  status: ConsoleUserStatus;
  lastActiveAt: string;
}

const contentToneOptions = [
  { id: "warm", label: "温柔陪伴", prompt: "温柔陪伴语气" },
  { id: "calm", label: "专业克制", prompt: "专业克制语气" },
  { id: "light", label: "轻松日常", prompt: "轻松日常语气" },
] as const;

const contentChannelOptions = [
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

type ContentToneId = (typeof contentToneOptions)[number]["id"];
type ContentChannelId = (typeof contentChannelOptions)[number]["id"];

const contentFieldLabels: Record<ContentField, string> = {
  momentsPost: "朋友圈",
  groupTopic: "群话题",
  dmScript: "私信话术",
};

const demoPasswordDigest = "186bf572";

function digestDemoPassword(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const demoAccountPresets = [
  {
    label: "JING 负责人账号",
    email: "jing@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["owner"] as const,
  },
  {
    label: "山语运营账号",
    email: "shanyu@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["operator"] as const,
  },
  {
    label: "绿原运营账号",
    email: "lvyuan@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["operator"] as const,
  },
] as const;

const memberDemoAccounts = [
  {
    label: "JING 会员账号",
    email: "member@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["member"] as const,
  },
  {
    label: "双角色体验账号",
    email: "dual@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["operator", "member"] as const,
  },
] as const;

const demoSessionKey = "oneday-demo-role-session";
const consoleUsersStoragePrefix = "oneday-console-users";

const userRoleLabels: Record<DemoRole, string> = {
  owner: "品牌负责人",
  operator: "管理员",
  member: "普通用户",
};

const userStatusLabels: Record<ConsoleUserStatus, string> = {
  active: "启用",
  paused: "停用",
};

const manageableUserRoleOptions: { id: ManageableUserRole; label: string }[] = [
  { id: "operator", label: userRoleLabels.operator },
  { id: "member", label: userRoleLabels.member },
];

interface DemoSession {
  email: string;
  label: string;
  roles: DemoRole[];
  brandId?: string;
  brandName?: string;
}

interface DemoAccount {
  label: string;
  email: string;
  passwordDigest: string;
  roles: readonly DemoRole[];
  brand?: Brand;
}

function hasConsoleRole(roles: readonly DemoRole[]) {
  return roles.includes("owner") || roles.includes("operator");
}

function hasOwnerRole(roles: readonly DemoRole[] | undefined) {
  return roles?.includes("owner") ?? false;
}

function consoleUsersStorageKey(brandId: string) {
  return `${consoleUsersStoragePrefix}:${brandId}`;
}

function defaultConsoleUsers(brand: Brand, session: DemoSession | null): ConsoleUser[] {
  const sessionIsBrandOwner =
    session?.brandId === brand.id && hasOwnerRole(session.roles);
  const ownerEmail = sessionIsBrandOwner ? session.email : `owner+${brand.id}@oneday.demo`;
  const ownerName = sessionIsBrandOwner ? session.label : `${brand.name} 品牌负责人`;
  return [
    {
      id: `${brand.id}-owner`,
      name: ownerName,
      email: ownerEmail,
      role: "owner",
      status: "active",
      lastActiveAt: "今天",
    },
    {
      id: `${brand.id}-operator`,
      name: `${brand.name} 内容运营`,
      email: `operator+${brand.id}@oneday.demo`,
      role: "operator",
      status: "active",
      lastActiveAt: "昨天",
    },
    {
      id: `${brand.id}-member`,
      name: `${brand.name} 会员代表`,
      email: `member+${brand.id}@oneday.demo`,
      role: "member",
      status: "active",
      lastActiveAt: "3 天前",
    },
  ];
}

function readConsoleUsers(brand: Brand, session: DemoSession | null): ConsoleUser[] {
  const fallback = defaultConsoleUsers(brand, session);
  const raw = window.localStorage.getItem(consoleUsersStorageKey(brand.id));
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as ConsoleUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    const hasOwner = parsed.some((user) => user.role === "owner");
    if (!hasOwner) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveConsoleUsers(brandId: string, users: ConsoleUser[]) {
  window.localStorage.setItem(consoleUsersStorageKey(brandId), JSON.stringify(users));
}

function saveDemoSession(session: DemoSession) {
  window.localStorage.setItem(demoSessionKey, JSON.stringify(session));
}

function readDemoSession(): DemoSession | null {
  const raw = window.localStorage.getItem(demoSessionKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed.email || !Array.isArray(parsed.roles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function daysAgo(iso: string, ref: string): string {
  const d = Math.floor(
    (new Date(ref).getTime() - new Date(iso).getTime()) / 86400000,
  );
  return d <= 0 ? "今天" : `${d} 天前`;
}

export function RoleRoutedDemo({
  initialWorkspace = "login",
}: {
  initialWorkspace?: DemoWorkspace;
}) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [calendar, setCalendar] = useState<CalendarPackage | null>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [entryNotice, setEntryNotice] = useState<string | null>(null);
  const [consoleUsers, setConsoleUsers] = useState<ConsoleUser[]>([]);
  const [userEditingId, setUserEditingId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<ManageableUserRole>("operator");
  const [userStatus, setUserStatus] = useState<ConsoleUserStatus>("active");
  const [userNotice, setUserNotice] = useState<string | null>(null);
  const [theme, setTheme] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<ContentPackageId>("weekly");
  const [selectedToneId, setSelectedToneId] = useState<ContentToneId>("warm");
  const [selectedChannelId, setSelectedChannelId] = useState<ContentChannelId>("all");
  const [customPackageName, setCustomPackageName] = useState("自建内容包");
  const [customPackageDays, setCustomPackageDays] = useState(7);
  const [generatedPackageName, setGeneratedPackageName] = useState("");
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPreset = contentPackagePresets.find((p) => p.id === selectedPackageId);
  const activePackageName =
    selectedPackageId === "custom"
      ? customPackageName.trim() || "自建内容包"
      : selectedPreset?.name ?? "内容包";
  const activePackageDays =
    selectedPackageId === "custom" ? customPackageDays : selectedPreset?.days ?? 7;
  const usesPresetDayOption = contentDayOptions.some((day) => day === activePackageDays);
  const activeTone =
    contentToneOptions.find((tone) => tone.id === selectedToneId) ?? contentToneOptions[0];
  const activeChannel =
    contentChannelOptions.find((channel) => channel.id === selectedChannelId) ??
    contentChannelOptions[0];
  const demoAccounts: DemoAccount[] = brands.map((b, index) => {
    const preset =
      demoAccountPresets[index] ?? {
        label: `${b.name} 运营账号`,
        email: `brand${index + 1}@oneday.demo`,
        passwordDigest: demoPasswordDigest,
        roles: ["operator"] as const,
      };
    return { ...preset, brand: b };
  });
  const roleDemoAccounts: DemoAccount[] = memberDemoAccounts.map((account) => ({
    ...account,
    brand: hasConsoleRole(account.roles) ? brands[0] : undefined,
  }));
  const allDemoAccounts = [...demoAccounts, ...roleDemoAccounts];

  const resetUserForm = useCallback(() => {
    setUserEditingId(null);
    setUserName("");
    setUserEmail("");
    setUserRole("operator");
    setUserStatus("active");
  }, []);

  const persistConsoleUsers = (nextUsers: ConsoleUser[]) => {
    if (!brand) return;
    setConsoleUsers(nextUsers);
    saveConsoleUsers(brand.id, nextUsers);
  };

  const startUserEdit = (user: ConsoleUser) => {
    if (user.role === "owner") {
      setUserNotice("负责人账号不能在此表单里编辑");
      return;
    }
    setUserEditingId(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserStatus(user.status);
    setUserNotice(null);
  };

  const submitConsoleUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!brand || !hasOwnerRole(session?.roles)) return;
    const trimmedName = userName.trim();
    const trimmedEmail = userEmail.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      setUserNotice("请填写用户姓名和邮箱");
      return;
    }
    const duplicatedEmail = consoleUsers.some(
      (user) => user.email.toLowerCase() === trimmedEmail && user.id !== userEditingId,
    );
    if (duplicatedEmail) {
      setUserNotice("该邮箱已在当前品牌下");
      return;
    }
    const nextUsers = userEditingId
      ? consoleUsers.map((user) =>
          user.id === userEditingId && user.role !== "owner"
            ? {
                ...user,
                name: trimmedName,
                email: trimmedEmail,
                role: userRole,
                status: userStatus,
                lastActiveAt: "刚刚",
              }
            : user,
        )
      : [
          ...consoleUsers,
          {
            id: `${brand.id}-${Date.now()}`,
            name: trimmedName,
            email: trimmedEmail,
            role: userRole,
            status: userStatus,
            lastActiveAt: "刚刚",
          },
        ];
    persistConsoleUsers(nextUsers);
    setUserNotice(userEditingId ? "用户信息已更新" : "用户已加入当前品牌");
    resetUserForm();
  };

  const toggleUserStatus = (userId: string) => {
    if (!brand || !hasOwnerRole(session?.roles)) return;
    const user = consoleUsers.find((item) => item.id === userId);
    if (!user || user.role === "owner") {
      setUserNotice("负责人账号不能停用");
      return;
    }
    const nextUsers = consoleUsers.map((item) => {
      const nextStatus: ConsoleUserStatus = item.status === "active" ? "paused" : "active";
      return item.id === userId ? { ...item, status: nextStatus } : item;
    });
    persistConsoleUsers(nextUsers);
    setUserNotice(user.status === "active" ? "用户已停用" : "用户已启用");
  };

  const removeConsoleUser = (userId: string) => {
    if (!brand || !hasOwnerRole(session?.roles)) return;
    const user = consoleUsers.find((item) => item.id === userId);
    if (!user || user.role === "owner") {
      setUserNotice("负责人账号不能删除");
      return;
    }
    persistConsoleUsers(consoleUsers.filter((item) => item.id !== userId));
    setUserNotice("用户已从当前品牌移除");
    if (userEditingId === userId) resetUserForm();
  };

  const resetConsoleUserData = () => {
    if (!brand || !hasOwnerRole(session?.roles)) return;
    const nextUsers = defaultConsoleUsers(brand, session);
    persistConsoleUsers(nextUsers);
    resetUserForm();
    setUserNotice("用户管理数据已重置");
  };

  useEffect(() => {
    setSession(readDemoSession());
    const boot = async () => {
      try {
        await fetch(`${API}/api/demo/seed`, { method: "POST" });
        const res = await fetch(`${API}/api/brands`);
        const body = (await res.json()) as { brands: Brand[] };
        setBrands(body.brands);
      } catch {
        setError("无法连接 API（请确认后端在 3210 端口运行）");
      }
    };
    void boot();
  }, []);

  const routeSession = (nextSession: DemoSession) => {
    saveDemoSession(nextSession);
    setSession(nextSession);
    if (nextSession.roles.length > 1) {
      router.push("/workspaces");
      return;
    }
    if (nextSession.roles.includes("member")) {
      router.push("/member");
      return;
    }
    router.push("/console");
  };

  const enterBrand = useCallback(async (b: Brand) => {
    setLoading(b.id);
    setError(null);
    try {
      if (b.groupId) {
        const dash = await fetch(`${API}/api/groups/${b.groupId}/dashboard`);
        setDashboard((await dash.json()) as Dashboard);
      }
      setBrand(b);
      setConsoleUsers(readConsoleUsers(b, session));
      resetUserForm();
      setUserNotice(null);
      setSelectedPackageId("weekly");
      setSelectedToneId("warm");
      setSelectedChannelId("all");
      setTheme(contentPackagePresets[0].theme);
      setCustomPackageName(`${b.name} 自建内容包`);
      setCustomPackageDays(10);
      setCalendar(null);
      setGeneratedPackageName("");
      setExpandedLayers({});
    } catch {
      setError("载入品牌数据失败");
    } finally {
      setLoading(null);
    }
  }, [resetUserForm, session]);

  const sessionBrandId = session?.brandId;
  const sessionRoles = session?.roles;

  useEffect(() => {
    if (initialWorkspace !== "console") return;
    if (!sessionRoles || !hasConsoleRole(sessionRoles)) return;
    if (brands.length === 0 || !sessionBrandId) return;
    const routeBrand = brands.find((b) => b.id === sessionBrandId);
    if (!routeBrand || brand?.id === routeBrand.id) return;
    void enterBrand(routeBrand);
  }, [brand?.id, brands, enterBrand, initialWorkspace, sessionBrandId, sessionRoles]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = allDemoAccounts.find(
      (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase(),
    );
    if (!account || account.passwordDigest !== digestDemoPassword(loginPassword)) {
      setError("邮箱或密码不正确");
      setEntryNotice(null);
      return;
    }
    const hasWorkspaceRole = hasConsoleRole(account.roles);
    const primaryBrand = hasWorkspaceRole ? account.brand ?? brands[0] : undefined;
    routeSession({
      email: account.email,
      label: account.label,
      roles: [...account.roles],
      brandId: primaryBrand?.id,
      brandName: primaryBrand?.name,
    });
  };

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setError("请完整填写注册信息");
      setEntryNotice(null);
      return;
    }
    if (brands.length === 0) {
      setError("数据准备中，请稍后再试");
      setEntryNotice(null);
      return;
    }
    setError(null);
    setEntryNotice(null);
    routeSession({
      email: registerEmail.trim(),
      label: `${registerName.trim()} 品牌负责人`,
      roles: ["owner"],
      brandId: brands[0].id,
      brandName: brands[0].name,
    });
  };

  const generate = async () => {
    if (!brand) return;
    setLoading("calendar");
    setError(null);
    try {
      const res = await fetch(`${API}/api/content-calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brand.name,
          industry: brand.industry,
          monthTheme: `${activePackageName} · ${theme || brand.defaultTheme} · ${
            activeTone.prompt
          } · ${activeChannel.prompt}`,
          days: activePackageDays,
        }),
      });
      setCalendar((await res.json()) as CalendarPackage);
      setGeneratedPackageName(activePackageName);
    } catch {
      setError("内容生成失败");
    } finally {
      setLoading(null);
    }
  };

  const logout = () => {
    window.localStorage.removeItem(demoSessionKey);
    setSession(null);
    setBrand(null);
    setDashboard(null);
    setCalendar(null);
    setConsoleUsers([]);
    resetUserForm();
    setUserNotice(null);
    setGeneratedPackageName("");
    setExpandedLayers({});
    router.push("/");
  };

  const returnToLogin = () => {
    router.push("/");
  };

  if (initialWorkspace !== "login" && !session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
        <div className="rounded-3xl border border-line bg-surface p-8">
          <p className="mb-3 text-sm font-medium text-brand">One Day</p>
          <h1 className="text-2xl font-bold">请先登录</h1>
          <p className="mt-3 text-sm leading-7 text-ink-soft">
            请先从统一登录入口进入对应工作区。
          </p>
          <button
            type="button"
            onClick={returnToLogin}
            className="mt-6 rounded-full bg-brand px-5 py-3 text-sm font-medium text-white"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  if (initialWorkspace === "member") {
    if (!session?.roles.includes("member")) {
      return (
        <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
          <div className="rounded-3xl border border-line bg-surface p-8">
            <p className="mb-3 text-sm font-medium text-warn">角色不匹配</p>
            <h1 className="text-2xl font-bold">当前账号没有会员工作区权限</h1>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              请回到统一登录入口，使用会员或双角色账号进入。
            </p>
            <button
              type="button"
              onClick={returnToLogin}
              className="mt-6 rounded-full bg-brand px-5 py-3 text-sm font-medium text-white"
            >
              返回登录
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="mb-2 text-sm font-medium text-brand">One Day 会员工作区</p>
            <h1 className="text-3xl font-bold">今天先把自己照顾回来</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
              {session.label} · 网页端 C 端首屏。这里先验证统一登录后的会员工作区承接，完整移动体验留到下一阶段。
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-ink-muted transition hover:text-ink"
          >
            退出账号 ↩
          </button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-line bg-surface p-6">
            <p className="text-xs font-medium tracking-widest text-ink-muted">TODAY</p>
            <h2 className="mt-3 text-xl font-bold">今日 3 步照护</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["身体", "2 分钟呼吸扫描，标记今天最需要被照顾的位置。"],
                ["情绪", "写下一句此刻真实感受，不需要解释。"],
                ["行动", "选一个 15 分钟以内能完成的小行动。"],
              ].map(([label, body]) => (
                <div key={label} className="rounded-2xl bg-bg px-4 py-4">
                  <p className="text-sm font-bold">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-6 rounded-full border border-brand px-5 py-3 text-sm font-medium text-brand"
            >
              开始今日打卡
            </button>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-line bg-surface p-6">
              <p className="text-sm font-medium text-ink-muted">阶段进度</p>
              <p className="mt-3 text-3xl font-bold">Day 1 / 7</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                先用网页端承接 C 端会员路径；移动端/PWA 下一阶段再系统适配。
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-brand-soft p-6">
              <p className="text-sm font-medium text-brand">AI 反馈预览</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                完成打卡后，One Day 会生成一段温和反馈和下一步建议。
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-muted">
          One Day · 会员工作区 · 今日照护与成长反馈
        </footer>
      </div>
    );
  }

  if (initialWorkspace === "workspaces") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8">
          <p className="mb-3 text-sm font-medium text-brand">One Day 工作区选择</p>
          <h1 className="text-3xl font-bold">选择这次要进入的身份</h1>
          <p className="mt-3 text-sm text-ink-soft">
            {session?.label} · 你拥有多个工作区权限，可以选择这次要进入的身份。
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            disabled={!session?.roles.includes("operator")}
            onClick={() => router.push("/console")}
            className="rounded-3xl border border-line bg-surface p-6 text-left transition hover:border-brand disabled:opacity-50"
          >
            <p className="text-sm font-medium text-brand">品牌运营台</p>
            <h2 className="mt-3 text-xl font-bold">进入 B 端 Console</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              查看私域健康看板，生成内容包，管理品牌侧运营动作。
            </p>
          </button>
          <button
            type="button"
            disabled={!session?.roles.includes("member")}
            onClick={() => router.push("/member")}
            className="rounded-3xl border border-line bg-surface p-6 text-left transition hover:border-brand disabled:opacity-50"
          >
            <p className="text-sm font-medium text-brand">会员体验区</p>
            <h2 className="mt-3 text-xl font-bold">进入 C 端 Member</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              查看今日照护任务、打卡入口、反馈与进度预览。
            </p>
          </button>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-8 text-sm text-ink-muted transition hover:text-ink"
        >
          退出账号 ↩
        </button>
      </div>
    );
  }

  if (initialWorkspace === "console" && !hasConsoleRole(session?.roles ?? [])) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
        <div className="rounded-3xl border border-line bg-surface p-8">
          <p className="mb-3 text-sm font-medium text-warn">角色不匹配</p>
          <h1 className="text-2xl font-bold">当前账号没有品牌运营台权限</h1>
          <p className="mt-3 text-sm leading-7 text-ink-soft">
            请使用品牌运营账号，或用双角色账号在工作区选择页切换身份。
          </p>
          <button
            type="button"
            onClick={returnToLogin}
            className="mt-6 rounded-full bg-brand px-5 py-3 text-sm font-medium text-white"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  if (initialWorkspace === "console" && !brand) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
        <div className="rounded-3xl border border-line bg-surface p-8">
          <p className="mb-3 text-sm font-medium text-brand">品牌运营台</p>
          <h1 className="text-2xl font-bold">正在进入工作区</h1>
          <p className="mt-3 text-sm leading-7 text-ink-soft">
            正在读取 {session?.brandName ?? "绑定品牌"} 的工作区数据。
          </p>
        </div>
      </div>
    );
  }

  // ---------- 品牌账号入口 ----------
  if (!brand) {
    return (
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="mb-4 text-sm font-medium text-brand">One Day 统一入口</p>
          <h1 className="text-4xl font-bold leading-tight">
            <span className="block">今天怎样度过，</span>
            <span className="block">一生便怎样展开。</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-ink-soft">
            登录 One Day，进入你的品牌运营台或会员空间。
          </p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
            {["健康看板", "互动提醒", "内容包"].map((label) => (
              <div key={label} className="rounded-2xl border border-line bg-surface px-3 py-4">
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <main className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-2 rounded-full bg-bg p-1 text-sm">
            {(
              [
                ["login", "登录"],
                ["register", "注册"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setEntryMode(mode);
                  setError(null);
                  setEntryNotice(null);
                }}
                className={`rounded-full px-4 py-2 font-medium transition ${
                  entryMode === mode ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <header className="mb-6">
            <h2 className="text-xl font-bold">
              {entryMode === "login" ? "登录 One Day" : "注册 One Day 账号"}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {entryMode === "login"
                ? "输入邮箱和密码，系统会按账号角色进入对应工作区。"
                : "填写账号信息，创建后先进入品牌运营台。"}
            </p>
          </header>

          {error && (
            <p className="mb-6 rounded-xl bg-warn-soft px-4 py-3 text-center text-sm text-warn">
              {error}
            </p>
          )}
          {entryNotice && (
            <p className="mb-6 rounded-xl bg-brand-soft px-4 py-3 text-center text-sm text-brand">
              {entryNotice}
            </p>
          )}

          {entryMode === "login" ? (
            <>
              <form onSubmit={(event) => void login(event)} className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-medium">
                  邮箱
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand"
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  密码
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand"
                    placeholder="输入密码"
                    autoComplete="current-password"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading !== null || brands.length === 0}
                  className="rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "登录中…" : "登录"}
                </button>
              </form>

            </>
          ) : (
            <form onSubmit={register} className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">
                用户名
                <input
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand"
                  placeholder="请输入用户名"
                  autoComplete="name"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                邮箱
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                密码
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-brand"
                  placeholder="设置密码"
                  autoComplete="new-password"
                />
              </label>
              <button
                type="submit"
                disabled={loading !== null || brands.length === 0}
                className="rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "创建中…" : "创建账号"}
              </button>
            </form>
          )}
          <footer className="mt-6 border-t border-line pt-4 text-xs text-ink-muted">
            One Day · 统一账号入口 · 按角色进入对应工作区
          </footer>
        </main>
      </div>
    );
  }

  // ---------- 品牌工作台 ----------
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-end justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-bold text-white">
              {brand.name.slice(0, 1)}
            </span>
            <h1 className="text-2xl font-bold">{brand.name}</h1>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs text-brand">
              {brand.industry}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-ink-muted transition hover:text-ink"
        >
          退出账号 ↩
        </button>
      </header>

      {error && (
        <p className="mb-6 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
      )}

      {dashboard && (
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-6">
            <h2 className="text-lg font-bold">私域健康看板</h2>
            <span className="text-sm text-ink-muted">
              {dashboard.groupName} · {dashboard.summary.total} 名成员
            </span>
          </div>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-brand p-6 text-white">
              <p className="text-sm opacity-80">私域健康分</p>
              <p className="mt-2 text-4xl font-bold">{dashboard.summary.healthScore}</p>
              <p className="mt-1 text-xs opacity-70">按活跃度加权：活跃计满分，降温计一半</p>
            </div>
            {(
              [
                ["活跃", dashboard.summary.activeCount, "7 天内有互动", "text-brand bg-brand-soft"],
                ["降温", dashboard.summary.coolingCount, "8-30 天未互动", "text-warn bg-warn-soft"],
                ["沉睡", dashboard.summary.sleepingCount, "超过 30 天", "text-sleep bg-sleep-soft"],
              ] as const
            ).map(([label, count, hint, cls]) => (
              <div key={label} className="rounded-2xl border border-line bg-surface p-6">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                  {label}
                </span>
                <p className="mt-3 text-3xl font-bold">{count}</p>
                <p className="mt-1 text-xs text-ink-muted">{hint}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                ["活跃成员", dashboard.layers.active],
                ["降温成员 · 建议本周触达", dashboard.layers.cooling],
                ["沉睡成员 · 唤醒优先级最高", dashboard.layers.sleeping],
              ] as const
            ).map(([title, members]) => {
              const isExpanded = expandedLayers[title] ?? false;
              const visibleMembers = isExpanded ? members : members.slice(0, 8);
              return (
                <div key={title} className="rounded-2xl border border-line bg-surface p-5">
                  <h3 className="mb-3 text-sm font-medium text-ink-soft">{title}</h3>
                  <ul
                    className={`flex flex-col gap-2 ${
                      isExpanded ? "max-h-72 overflow-y-auto pr-1" : ""
                    }`}
                  >
                    {visibleMembers.map((m) => (
                      <li key={m.alias} className="flex items-center justify-between text-sm">
                        <span>{m.displayName ?? m.alias}</span>
                        <span className="text-xs text-ink-muted">
                          {daysAgo(m.lastActiveAt, dashboard.referenceDate)} · {m.messageCount} 条
                        </span>
                      </li>
                    ))}
                    {members.length > 8 && (
                      <li>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedLayers((prev) => ({
                              ...prev,
                              [title]: !isExpanded,
                            }))
                          }
                          className="text-xs text-ink-muted transition hover:text-brand"
                        >
                          {isExpanded ? "收起名单" : `…还有 ${members.length - 8} 人`}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">用户管理</h2>
            <p className="mt-1 text-sm text-ink-muted">
              品牌负责人管理管理员和普通用户，owner 权限保留给负责人账号
            </p>
          </div>
          {hasOwnerRole(session?.roles) && (
            <button
              type="button"
              onClick={resetConsoleUserData}
              className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-muted transition hover:border-brand hover:text-brand"
            >
              重置数据
            </button>
          )}
        </div>

        {!hasOwnerRole(session?.roles) ? (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-sm font-bold">仅品牌负责人可管理用户</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              当前账号可使用健康看板与内容包工作台；管理员和普通用户的增删改停用由 owner 账号处理。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <form
              onSubmit={submitConsoleUser}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">
                    {userEditingId ? "编辑用户" : "新增用户"}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    可创建管理员或普通用户，owner 不在此表单开放
                  </p>
                </div>
                {userEditingId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetUserForm();
                      setUserNotice(null);
                    }}
                    className="text-xs text-ink-muted transition hover:text-brand"
                  >
                    取消编辑
                  </button>
                )}
              </div>

              {userNotice && (
                <p className="mb-4 rounded-xl bg-brand-soft px-3 py-2 text-xs text-brand">
                  {userNotice}
                </p>
              )}

              <div className="grid gap-3">
                <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                  姓名
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                    placeholder="如：内容运营 A"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                  邮箱
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                    placeholder="name@company.com"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                    角色
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as ManageableUserRole)}
                      className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                    >
                      {manageableUserRoleOptions.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                    状态
                    <select
                      value={userStatus}
                      onChange={(e) => setUserStatus(e.target.value as ConsoleUserStatus)}
                      className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                    >
                      <option value="active">启用</option>
                      <option value="paused">停用</option>
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {userEditingId ? "保存修改" : "新增用户"}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">当前品牌用户</h3>
                <span className="text-xs text-ink-muted">{consoleUsers.length} 人</span>
              </div>
              <div className="grid gap-3">
                {consoleUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-line bg-bg px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{user.name}</p>
                        <p className="mt-1 text-xs text-ink-muted">{user.email}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
                          {userRoleLabels[user.role]}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            user.status === "active"
                              ? "bg-brand-soft text-brand"
                              : "bg-warn-soft text-warn"
                          }`}
                        >
                          {userStatusLabels[user.status]}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-ink-muted">最近活跃：{user.lastActiveAt}</p>
                      {user.role === "owner" ? (
                        <p className="text-xs text-ink-muted">负责人账号保留</p>
                      ) : (
                        <div className="flex flex-wrap gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => startUserEdit(user)}
                            className="font-medium text-brand"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user.id)}
                            className="font-medium text-ink-muted transition hover:text-brand"
                          >
                            {user.status === "active" ? "停用" : "启用"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeConsoleUser(user.id)}
                            className="font-medium text-warn"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">内容包工作台</h2>
              <p className="mt-1 text-sm text-ink-muted">
                选择服务包模板，或为当前品牌自建内容包
              </p>
            </div>
            {calendar && (
              <span className="text-xs text-ink-muted">
                引擎：{calendar.generatedBy === "template" ? "模板" : calendar.generatedBy} · 已过合规护栏
              </span>
            )}
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-4">
            {contentPackagePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedPackageId(preset.id);
                  setTheme(preset.theme);
                  setCalendar(null);
                  setGeneratedPackageName("");
                }}
                className={`rounded-2xl border p-4 text-left transition hover:border-brand ${
                  selectedPackageId === preset.id
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-surface"
                }`}
              >
                <p className="text-xs text-ink-muted">{preset.goal}</p>
                <h3 className="mt-2 text-sm font-bold">{preset.name}</h3>
                <p className="mt-2 text-xs text-ink-muted">{preset.days} 天内容节奏</p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedPackageId("custom");
                setCalendar(null);
                setGeneratedPackageName("");
              }}
              className={`rounded-2xl border p-4 text-left transition hover:border-brand ${
                selectedPackageId === "custom"
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-surface"
              }`}
            >
              <p className="text-xs text-ink-muted">订阅客户自建</p>
              <h3 className="mt-2 text-sm font-bold">自建内容包</h3>
              <p className="mt-2 text-xs text-ink-muted">预设天数 + 自定义</p>
            </button>
          </div>

          <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
            <div
              className={`grid gap-3 ${
                selectedPackageId === "custom"
                  ? "lg:grid-cols-[1fr_1.15fr_1.7fr]"
                  : "lg:grid-cols-[1fr_1.7fr]"
              }`}
            >
              {selectedPackageId === "custom" && (
                <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                  内容包名称
                  <input
                    value={customPackageName}
                    onChange={(e) => setCustomPackageName(e.target.value)}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
                    placeholder="如：私域唤醒包"
                  />
                </label>
              )}
              <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                内容主题
                <input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
                  placeholder="如：睡眠修复"
                />
              </label>
              <div className="grid gap-1.5 text-xs font-medium text-ink-muted">
                <p>天数</p>
                <span className="flex flex-wrap gap-2">
                  {contentDayOptions.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedPackageId("custom");
                        setCustomPackageDays(day);
                        setCalendar(null);
                        setGeneratedPackageName("");
                      }}
                      className={`rounded-full border px-3 py-2 text-xs font-medium transition hover:border-brand ${
                        activePackageDays === day
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-white text-ink-muted"
                      }`}
                    >
                      {day} 天
                    </button>
                  ))}
                  <span
                    className={`flex items-center rounded-full border px-3 text-xs font-medium transition focus-within:border-brand ${
                      selectedPackageId === "custom" && !usesPresetDayOption
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-white text-ink-muted"
                    }`}
                  >
                    自定义
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={activePackageDays}
                      onChange={(e) => {
                        const next = Number.parseInt(e.target.value, 10);
                        setSelectedPackageId("custom");
                        setCustomPackageDays(
                          Number.isNaN(next) ? 1 : Math.min(31, Math.max(1, next)),
                        );
                        setCalendar(null);
                        setGeneratedPackageName("");
                      }}
                      onFocus={() => {
                        setSelectedPackageId("custom");
                      }}
                      className="ml-2 w-11 bg-transparent py-2 text-center text-xs font-medium text-ink outline-none"
                      aria-label="自定义内容包天数"
                    />
                    <span className="ml-1">天</span>
                  </span>
                </span>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-ink-muted">语气</p>
                <div className="grid grid-cols-3 gap-2">
                  {contentToneOptions.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => {
                        setSelectedToneId(tone.id);
                        setCalendar(null);
                        setGeneratedPackageName("");
                      }}
                      className={`rounded-full border px-3 py-2 text-xs font-medium transition hover:border-brand ${
                        selectedToneId === tone.id
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-white text-ink-muted"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-ink-muted">渠道</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {contentChannelOptions.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => {
                        setSelectedChannelId(channel.id);
                        setCalendar(null);
                        setGeneratedPackageName("");
                      }}
                      className={`rounded-xl border px-3 py-2 text-left transition hover:border-brand ${
                        selectedChannelId === channel.id
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-white"
                      }`}
                    >
                      <span className="block text-xs font-medium">{channel.label}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        {channel.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => void generate()}
              disabled={loading !== null}
              className="w-full rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:opacity-50"
            >
              {loading === "calendar" ? "生成中…" : `生成 ${activePackageDays} 天内容包`}
            </button>
          </div>
        </div>
        {calendar && (
          <div>
            <div className="mb-4 rounded-2xl bg-brand-soft px-5 py-4">
              <p className="text-sm font-medium text-brand">
                {generatedPackageName || activePackageName} · {calendar.days.length} 天
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {brand.name} 专属内容包 · {calendar.monthTheme}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                输出渠道：{activeChannel.hint} · 语气：{activeTone.label}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {calendar.days.map((day) => (
                <div key={day.dayIndex} className="rounded-2xl border border-line bg-surface p-5">
                  <p className="mb-3 text-xs font-medium tracking-widest text-ink-muted">
                    DAY {day.dayIndex}
                  </p>
                  <div className="flex flex-col gap-3 text-sm leading-relaxed">
                    {(activeChannel.fields as readonly ContentField[]).map((field) => (
                      <div key={field}>
                        <p className="mb-1 text-xs text-brand">{contentFieldLabels[field]}</p>
                        <p className="text-ink-soft">{day[field]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-muted">
        One Day · 私域运营台 · AI 输出经医疗宣称护栏过滤
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return <RoleRoutedDemo initialWorkspace="login" />;
}
