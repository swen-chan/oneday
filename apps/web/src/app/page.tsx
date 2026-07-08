"use client";

import { useState } from "react";

// One Day 私域运营台 · 演示页（合成数据）。
// demo 模式：一键载入合成群 → 健康看板；输入主题 → 生成内容日历。

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3210";

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

function daysAgo(iso: string, ref: string): string {
  const d = Math.floor(
    (new Date(ref).getTime() - new Date(iso).getTime()) / 86400000,
  );
  return d <= 0 ? "今天" : `${d} 天前`;
}

export default function DemoConsole() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [calendar, setCalendar] = useState<CalendarPackage | null>(null);
  const [theme, setTheme] = useState("睡眠修复 · 深度休息");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seed = async () => {
    setLoading("seed");
    setError(null);
    try {
      const res = await fetch(`${API}/api/demo/seed`, { method: "POST" });
      const body = (await res.json()) as { groupId: string };
      const dash = await fetch(`${API}/api/groups/${body.groupId}/dashboard`);
      setDashboard((await dash.json()) as Dashboard);
    } catch {
      setError("无法连接 API（请确认后端在 3210 端口运行）");
    } finally {
      setLoading(null);
    }
  };

  const generate = async () => {
    setLoading("calendar");
    setError(null);
    try {
      const res = await fetch(`${API}/api/content-calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: "JING",
          industry: "疗愈",
          monthTheme: theme,
          days: 7,
        }),
      });
      setCalendar((await res.json()) as CalendarPackage);
    } catch {
      setError("内容生成失败");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-end justify-between border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold">One Day 私域运营台</h1>
          <p className="mt-1 text-sm text-ink-muted">
            AI 私域运营平台 · 演示环境（全部为合成数据，无真实用户信息）
          </p>
        </div>
        <button
          onClick={seed}
          disabled={loading !== null}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading === "seed" ? "载入中…" : "一键载入演示数据"}
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
              <p className="mt-2 text-4xl font-bold">
                {dashboard.summary.healthScore}
              </p>
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
            ).map(([title, members]) => (
              <div key={title} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="mb-3 text-sm font-medium text-ink-soft">{title}</h3>
                <ul className="flex flex-col gap-2">
                  {members.slice(0, 8).map((m) => (
                    <li
                      key={m.alias}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{m.displayName ?? m.alias}</span>
                      <span className="text-xs text-ink-muted">
                        {daysAgo(m.lastActiveAt, dashboard.referenceDate)} ·{" "}
                        {m.messageCount} 条
                      </span>
                    </li>
                  ))}
                  {members.length > 8 && (
                    <li className="text-xs text-ink-muted">
                      …还有 {members.length - 8} 人
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-bold">内容日历生成</h2>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-64 rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-brand"
            placeholder="本月主题"
          />
          <button
            onClick={generate}
            disabled={loading !== null}
            className="rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:opacity-50"
          >
            {loading === "calendar" ? "生成中…" : "生成 7 天内容包"}
          </button>
          {calendar && (
            <span className="text-xs text-ink-muted">
              引擎：{calendar.generatedBy === "template" ? "模板（演示）" : calendar.generatedBy} · 已过合规护栏
            </span>
          )}
        </div>
        {calendar && (
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
        )}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-muted">
        演示环境 · 数据为确定性合成（40 名虚拟成员 / 60 天群聊）· AI 输出经医疗宣称护栏过滤
      </footer>
    </div>
  );
}
