"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminManagementDialog } from "../console/AdminManagementDialog";
import { MemberDetailDialog } from "../console/MemberDetailDialog";
import {
  authenticateAdminAccount,
  demoPasswordDigest,
  digestDemoPassword,
  readAdminAccounts,
  saveAdminAccounts,
  type AdminAccount,
} from "../console/adminAccounts";
import { CommercialDashboard } from "../console/CommercialDashboard";
import { ContentPackageWorkbench } from "../console/ContentPackageWorkbench";
import {
  hotelOptions,
  type ConsoleAccess,
  type HotelId,
} from "../console/commercialData";

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

type EntryMode = "login" | "register";
type DemoWorkspace = "login" | "console" | "member" | "workspaces";
type DemoRole = "owner" | "operator" | "member";

const demoAccountPresets = [
  {
    label: "JING 负责人账号",
    email: "jing@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["owner"] as const,
    allowedHotelIds: hotelOptions.map((hotel) => hotel.id),
  },
  {
    label: "山语运营账号",
    email: "shanyu@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["operator"] as const,
    allowedHotelIds: ["wumingchu"] as const,
  },
  {
    label: "绿原运营账号",
    email: "lvyuan@oneday.demo",
    passwordDigest: demoPasswordDigest,
    roles: ["operator"] as const,
    allowedHotelIds: ["junting"] as const,
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
    allowedHotelIds: ["wumingchu"] as const,
  },
] as const;

const demoSessionKey = "oneday-demo-role-session";

interface DemoSession {
  email: string;
  label: string;
  roles: DemoRole[];
  brandId?: string;
  brandName?: string;
  allowedHotelIds?: HotelId[];
}

interface DemoAccount {
  label: string;
  email: string;
  passwordDigest: string;
  roles: readonly DemoRole[];
  allowedHotelIds?: readonly HotelId[];
  brand?: Brand;
}

function hasConsoleRole(roles: readonly DemoRole[]) {
  return roles.includes("owner") || roles.includes("operator");
}

function hasOwnerRole(roles: readonly DemoRole[] | undefined) {
  return roles?.includes("owner") ?? false;
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
  const [session, setSession] = useState<DemoSession | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [entryNotice, setEntryNotice] = useState<string | null>(null);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  const [selectedHealthMember, setSelectedHealthMember] = useState<Member | null>(null);
  const [adminManagementOpen, setAdminManagementOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts: DemoAccount[] = brands.map((b, index) => {
    const preset =
      demoAccountPresets[index] ?? {
        label: `${b.name} 运营账号`,
        email: `brand${index + 1}@oneday.demo`,
        passwordDigest: demoPasswordDigest,
        roles: ["operator"] as const,
        allowedHotelIds: [hotelOptions[index % hotelOptions.length].id] as const,
      };
    return { ...preset, brand: b };
  });
  const roleDemoAccounts: DemoAccount[] = memberDemoAccounts.map((account) => ({
    ...account,
    brand: hasConsoleRole(account.roles) ? brands[0] : undefined,
  }));
  const allDemoAccounts = [...demoAccounts, ...roleDemoAccounts];

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
      setAdminAccounts(readAdminAccounts(b.id));
      setExpandedLayers({});
      setSelectedHealthMember(null);
      setAdminManagementOpen(false);
    } catch {
      setError("载入品牌数据失败");
    } finally {
      setLoading(null);
    }
  }, []);

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
    const normalizedEmail = loginEmail.trim().toLowerCase();
    const passwordDigest = digestDemoPassword(loginPassword);
    const staticAccount = allDemoAccounts.find(
      (account) => account.email.toLowerCase() === normalizedEmail,
    );
    let dynamicAccount: DemoAccount | undefined;
    for (const currentBrand of brands) {
      const adminAccount = authenticateAdminAccount(
        readAdminAccounts(currentBrand.id),
        normalizedEmail,
        passwordDigest,
      );
      if (adminAccount) {
        dynamicAccount = {
          label: adminAccount.username,
          email: adminAccount.email,
          passwordDigest: adminAccount.passwordDigest,
          roles: ["operator"],
          allowedHotelIds: adminAccount.allowedHotelIds,
          brand: currentBrand,
        };
        break;
      }
    }
    const account =
      staticAccount?.passwordDigest === passwordDigest ? staticAccount : dynamicAccount;
    if (!account) {
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
      allowedHotelIds: account.allowedHotelIds ? [...account.allowedHotelIds] : undefined,
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
      allowedHotelIds: hotelOptions.map((hotel) => hotel.id),
    });
  };

  const logout = () => {
    window.localStorage.removeItem(demoSessionKey);
    setSession(null);
    setBrand(null);
    setDashboard(null);
    setAdminAccounts([]);
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
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 overflow-hidden px-6 pb-12 pt-28 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-10 lg:pb-12 lg:pt-32">
        <header className="absolute left-6 top-8 lg:left-10 lg:top-12">
          <p className="text-xl font-semibold tracking-[0.08em] text-ink">One Day</p>
        </header>

        <section className="relative isolate py-8 sm:py-12 lg:py-0 lg:pl-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-1/2 -z-10 h-[26rem] w-[32rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(78,125,111,0.13),rgba(237,243,241,0.38)_42%,transparent_72%)] blur-2xl"
          />
          <h1 className="max-w-3xl font-semibold tracking-[0.02em]">
            <span className="block whitespace-nowrap text-[clamp(2.25rem,10.5vw,3rem)] leading-[1.18] text-ink lg:text-[clamp(2.75rem,4.4vw,3.5rem)]">
              今天怎样度过，
            </span>
            <span className="mt-3 block whitespace-nowrap text-[clamp(2rem,10.7vw,2.875rem)] leading-[1.14] text-brand sm:pl-[0.5em] lg:text-[clamp(3rem,5vw,4.25rem)]">
              一生便怎样展开。
            </span>
          </h1>
        </section>

        <main className="w-full max-w-xl justify-self-end rounded-3xl border border-line bg-surface p-6 shadow-sm">
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
        </main>
      </div>
    );
  }

  const canonicalStaticAccount = session
    ? allDemoAccounts.find(
        (account) =>
          account.email.toLowerCase() === session.email.toLowerCase() &&
          account.brand?.id === brand.id,
      )
    : undefined;
  const canonicalAdminAccount = session
    ? adminAccounts.find(
        (account) => account.email.toLowerCase() === session.email.toLowerCase(),
      )
    : undefined;
  const consoleAccess: ConsoleAccess = hasOwnerRole(session?.roles)
    ? { role: "owner", allowedHotelIds: hotelOptions.map((hotel) => hotel.id) }
    : {
        role: "operator",
        allowedHotelIds:
          canonicalAdminAccount?.allowedHotelIds ??
          canonicalStaticAccount?.allowedHotelIds ??
          [],
      };
  const updateAdminAccounts = (nextAccounts: AdminAccount[]) => {
    setAdminAccounts(nextAccounts);
    saveAdminAccounts(brand.id, nextAccounts);
  };

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
        <div className="flex items-center gap-4">
          {hasOwnerRole(session?.roles) && (
            <button
              type="button"
              onClick={() => setAdminManagementOpen(true)}
              className="text-sm text-ink-muted transition hover:text-brand"
            >
              管理员权限
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="text-sm text-ink-muted transition hover:text-ink"
          >
            退出账号 ↩
          </button>
        </div>
      </header>

      {adminManagementOpen && hasOwnerRole(session?.roles) && (
        <AdminManagementDialog
          brandId={brand.id}
          accounts={adminAccounts}
          onAccountsChange={updateAdminAccounts}
          onClose={() => setAdminManagementOpen(false)}
        />
      )}

      {error && (
        <p className="mb-6 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
      )}

      <CommercialDashboard
        brandId={brand.id}
        accountId={session!.email}
        access={consoleAccess}
      />

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
                      <li key={m.alias}>
                        <button
                          type="button"
                          aria-label={`查看${m.displayName ?? m.alias}详情`}
                          onClick={() => setSelectedHealthMember(m)}
                          className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                        >
                          <span>{m.displayName ?? m.alias}</span>
                          <span className="text-xs text-ink-muted">
                            {daysAgo(m.lastActiveAt, dashboard.referenceDate)}
                          </span>
                        </button>
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

      {selectedHealthMember && dashboard && (
        <MemberDetailDialog
          member={selectedHealthMember}
          referenceDate={dashboard.referenceDate}
          onClose={() => setSelectedHealthMember(null)}
        />
      )}

      <ContentPackageWorkbench
        key={`${brand.id}:${session!.email}`}
        brand={brand}
        accountId={session!.email}
        apiBase={API}
      />

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-muted">
        One Day · 私域运营台 · AI 输出经医疗宣称护栏过滤
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return <RoleRoutedDemo initialWorkspace="login" />;
}
