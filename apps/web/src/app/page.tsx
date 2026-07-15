"use client";

import { type FormEvent, useEffect, useState } from "react";

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

type ContentPackageId = (typeof contentPackagePresets)[number]["id"] | "custom";
type EntryMode = "login" | "register";

const demoAccountPresets = [
  {
    label: "JING 运营账号",
    email: "jing@oneday.demo",
    password: "demo-1234",
  },
  {
    label: "山语运营账号",
    email: "shanyu@oneday.demo",
    password: "demo-1234",
  },
  {
    label: "绿原运营账号",
    email: "lvyuan@oneday.demo",
    password: "demo-1234",
  },
] as const;

function daysAgo(iso: string, ref: string): string {
  const d = Math.floor(
    (new Date(ref).getTime() - new Date(iso).getTime()) / 86400000,
  );
  return d <= 0 ? "今天" : `${d} 天前`;
}

export default function DemoConsole() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [calendar, setCalendar] = useState<CalendarPackage | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [entryNotice, setEntryNotice] = useState<string | null>(null);
  const [theme, setTheme] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<ContentPackageId>("weekly");
  const [customPackageName, setCustomPackageName] = useState("自建内容包");
  const [customPackageDays, setCustomPackageDays] = useState(10);
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
  const demoAccounts = brands.map((b, index) => {
    const preset =
      demoAccountPresets[index] ?? {
        label: `${b.name} 运营账号`,
        email: `brand${index + 1}@oneday.demo`,
        password: `OneDay${index + 1}`,
      };
    return { ...preset, brand: b };
  });

  useEffect(() => {
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

  const enterBrand = async (b: Brand) => {
    setLoading(b.id);
    setError(null);
    try {
      if (b.groupId) {
        const dash = await fetch(`${API}/api/groups/${b.groupId}/dashboard`);
        setDashboard((await dash.json()) as Dashboard);
      }
      setBrand(b);
      setSelectedPackageId("weekly");
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
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = demoAccounts.find(
      (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase(),
    );
    if (!account || account.password !== loginPassword) {
      setError("邮箱或密码不正确");
      setEntryNotice(null);
      return;
    }
    await enterBrand(account.brand);
  };

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setError("请完整填写注册信息");
      setEntryNotice(null);
      return;
    }
    if (brands.length === 0) {
      setError("演示数据准备中，请稍后再试");
      setEntryNotice(null);
      return;
    }
    setError(null);
    setEntryNotice(null);
    await enterBrand(brands[0]);
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
          monthTheme: `${activePackageName} · ${theme}`,
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

  // ---------- 品牌账号入口 ----------
  if (!brand) {
    return (
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="mb-4 text-sm font-medium text-brand">One Day 私域运营台</p>
          <h1 className="text-4xl font-bold leading-tight">登录品牌账号，进入私域运营工作台</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-ink-soft">
            为大健康与疗愈品牌管理私域健康看板、互动提醒与内容包生成。每个账号进入后只看到绑定品牌的数据。
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
              {entryMode === "login" ? "登录 One Day" : "注册品牌账号"}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {entryMode === "login"
                ? "输入邮箱和密码，进入已绑定的品牌工作台。"
                : "填写账号与品牌信息，提交开通申请。"}
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
            演示环境 · 每个账号只展示绑定品牌
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
          onClick={() => {
            setBrand(null);
            setDashboard(null);
            setCalendar(null);
            setGeneratedPackageName("");
            setExpandedLayers({});
          }}
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
                引擎：{calendar.generatedBy === "template" ? "模板（演示）" : calendar.generatedBy} · 已过合规护栏
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
              <p className="mt-2 text-xs text-ink-muted">1-31 天自由配置</p>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            {selectedPackageId === "custom" && (
              <>
                <input
                  value={customPackageName}
                  onChange={(e) => setCustomPackageName(e.target.value)}
                  className="w-48 rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand"
                  placeholder="内容包名称"
                />
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={customPackageDays}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10);
                    setCustomPackageDays(Number.isNaN(next) ? 1 : Math.min(31, Math.max(1, next)));
                  }}
                  className="w-28 rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand"
                  aria-label="内容包天数"
                />
              </>
            )}
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-72 rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-brand"
              placeholder="内容主题"
            />
            <button
              onClick={() => void generate()}
              disabled={loading !== null}
              className="rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:opacity-50"
            >
              {loading === "calendar"
                ? "生成中…"
                : `生成 ${activePackageName}（${activePackageDays} 天）`}
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
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {calendar.days.map((day) => (
                <div key={day.dayIndex} className="rounded-2xl border border-line bg-surface p-5">
                  <p className="mb-3 text-xs font-medium tracking-widest text-ink-muted">
                    DAY {day.dayIndex}
                  </p>
                  <div className="flex flex-col gap-3 text-sm leading-relaxed">
                    <div>
                      <p className="mb-1 text-xs text-brand">朋友圈</p>
                      <p className="text-ink-soft">{day.momentsPost}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-brand">群话题</p>
                      <p className="text-ink-soft">{day.groupTopic}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-brand">私信话术</p>
                      <p className="text-ink-soft">{day.dmScript}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-muted">
        演示环境 · 品牌与成员均为确定性合成数据 · AI 输出经医疗宣称护栏过滤 · 真实授权/租户隔离将在接真实数据前实现
      </footer>
    </div>
  );
}
