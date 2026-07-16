"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  advanceMemberDemoDay,
  allMemberTasks,
  buildMemberFeedback,
  canAccessMemberWorkspace,
  canSubmitMemberCheckin,
  completeMemberCheckin,
  concernOptions,
  createMemberProgramState,
  demoSessionStorageKey,
  formatMemberDate,
  goalOptions,
  latestMemberCheckin,
  legacyMemberProgramStorageKey,
  memberCheckinDraftForDate,
  memberCompletedDays,
  memberEffectiveTodayDateKey,
  memberHomeRoute,
  memberJourneyDayNumber,
  memberJourneyDays,
  memberJourneyLength,
  memberProgramStorageKey,
  parseMemberProgramState,
  resetMemberDemoDay,
  serializeMemberProgramState,
  stateOptions,
  updateMemberCheckinDraft,
  type DemoSessionLike,
  type MemberAssessment,
  type MemberJourneyDay,
  type MemberProgramState,
  type MemberTask,
} from "./memberPlan";

export type MemberWorkspaceView = "home" | "onboarding" | "today" | "checkin" | "feedback";

function readDemoSession(): DemoSessionLike | null {
  const raw = window.localStorage.getItem(demoSessionStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DemoSessionLike>;
    if (
      typeof parsed.email !== "string" ||
      typeof parsed.label !== "string" ||
      !Array.isArray(parsed.roles) ||
      !parsed.roles.every((role) => typeof role === "string")
    ) {
      return null;
    }
    return {
      email: parsed.email,
      label: parsed.label,
      roles: parsed.roles,
    };
  } catch {
    return null;
  }
}

function WorkspaceHeader({
  session,
  eyebrow,
  title,
  body,
  onLogout,
}: {
  session: DemoSessionLike;
  eyebrow: string;
  title: string;
  body: string;
  onLogout: () => void;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-5 border-b border-line pb-6">
      <div>
        <p className="mb-2 text-sm font-medium text-brand">{eyebrow}</p>
        <h1 className="text-3xl font-bold leading-tight">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft">{body}</p>
        <p className="mt-2 text-xs text-ink-muted">{session.label} · 网页端会员体验</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="text-sm text-ink-muted transition hover:text-ink"
      >
        退出账号 ↩
      </button>
    </header>
  );
}

function WorkspaceFooter() {
  return (
    <footer className="mt-14 border-t border-line pt-6 text-xs leading-6 text-ink-muted">
      One Day · 会员工作区 · 状态了解与行动建议不构成医疗诊断或治疗方案
    </footer>
  );
}

function AccessGate({
  title,
  body,
  onReturn,
}: {
  title: string;
  body: string;
  onReturn: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-line bg-surface p-8">
        <p className="mb-3 text-sm font-medium text-warn">One Day 会员工作区</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-ink-soft">{body}</p>
        <button
          type="button"
          onClick={onReturn}
          className="mt-6 rounded-full bg-brand px-5 py-3 text-sm font-medium text-white"
        >
          返回统一登录
        </button>
      </div>
    </div>
  );
}

function LoadingWorkspace() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-line bg-surface p-8 text-sm text-ink-soft">
        正在准备会员工作区…
      </div>
    </div>
  );
}

function OptionGroup<T extends string>({
  title,
  description,
  options,
  value,
  onChange,
}: {
  title: string;
  description: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="rounded-3xl border border-line bg-surface p-6">
      <legend className="px-2 text-base font-bold">{title}</legend>
      <p className="mb-4 text-sm leading-6 text-ink-soft">{description}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <label
              key={option.id}
              className={`cursor-pointer rounded-2xl border px-4 py-4 text-sm leading-6 transition ${
                selected
                  ? "border-brand bg-brand-soft text-ink"
                  : "border-line bg-bg text-ink-soft hover:border-brand"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={selected}
                onChange={() => onChange(option.id)}
              />
              <span className="font-medium">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function OnboardingView({
  session,
  program,
  onSubmit,
  onLogout,
}: {
  session: DemoSessionLike;
  program: MemberProgramState | null;
  onSubmit: (assessment: MemberAssessment) => void;
  onLogout: () => void;
}) {
  const initialAssessment = program?.assessment ?? {
    concern: concernOptions[0].id,
    state: stateOptions[0].id,
    goal: goalOptions[0].id,
  };
  const [concern, setConcern] = useState(initialAssessment.concern);
  const [state, setState] = useState(initialAssessment.state);
  const [goal, setGoal] = useState(initialAssessment.goal);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ concern, state, goal });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow={program ? "重新测评" : "新会员起点"}
        title="先了解今天的起点"
        body="选择最接近当前情况的答案。One Day 会用固定规则生成今天的 3 条对内行动和 3 条对外行动，不调用真实 AI，也不做医疗判断。"
        onLogout={onLogout}
      />

      <form onSubmit={submit} className="grid gap-5">
        <OptionGroup
          title="1. 当前最大的困扰"
          description="选一个最希望今天先收口的问题。"
          options={concernOptions}
          value={concern}
          onChange={setConcern}
        />
        <OptionGroup
          title="2. 当前状态"
          description="按今天可用的精力与行动状态选择。"
          options={stateOptions}
          value={state}
          onChange={setState}
        />
        <OptionGroup
          title="3. 7 天目标"
          description="选一个希望在 7 天里逐步看见的方向。"
          options={goalOptions}
          value={goal}
          onChange={setGoal}
        />

        <div className="rounded-3xl border border-brand/20 bg-brand-soft p-5 text-sm leading-7 text-ink-soft">
          浏览器只保存所选选项、任务勾选与演示进度，不保存你在打卡里输入的自由文本。
        </div>
        <button
          type="submit"
          className="justify-self-start rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          生成我的 3+3 今日任务
        </button>
      </form>
      <WorkspaceFooter />
    </div>
  );
}

function TaskList({ tasks, tone }: { tasks: MemberTask[]; tone: "internal" | "external" }) {
  const cardTone =
    tone === "internal"
      ? "border-brand/20 bg-brand-soft"
      : "border-warn/20 bg-warn-soft";
  const badgeTone = tone === "internal" ? "bg-brand text-white" : "bg-warn text-white";
  return (
    <ol className="grid gap-3">
      {tasks.map((task, index) => (
        <li key={task.id} className={`rounded-2xl border p-4 ${cardTone}`}>
          <div className="flex gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeTone}`}
            >
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-bold">{task.title}</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{task.description}</p>
              <p className="mt-2 text-xs leading-5 text-ink-muted">依据：{task.basedOn}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function journeyDayLabel(day: MemberJourneyDay) {
  if (day.status === "recorded") return day.isToday ? "今天 · 已记录" : "已记录";
  if (day.status === "missed") return "未记录";
  if (day.status === "locked") return "未解锁";
  return "今天";
}

function JourneyGrid({
  days,
  selectedDay,
  onSelect,
}: {
  days: MemberJourneyDay[];
  selectedDay?: number;
  onSelect?: (day: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" aria-label="7 天旅程">
      {days.map((day) => {
        const selected = selectedDay === day.day;
        const disabled = day.status === "locked" || !onSelect;
        const tone =
          day.status === "recorded"
            ? "border-brand bg-brand text-white"
            : day.status === "missed"
              ? "border-warn/30 bg-warn-soft text-warn"
              : day.status === "locked"
                ? "border-line bg-sleep-soft text-sleep"
                : "border-brand bg-white text-brand";
        const icon =
          day.status === "recorded"
            ? "✓"
            : day.status === "missed"
              ? "—"
              : day.status === "locked"
                ? "锁"
                : "今天";
        return (
          <button
            key={day.dateKey}
            type="button"
            disabled={disabled}
            aria-current={day.isToday ? "step" : undefined}
            aria-pressed={onSelect ? selected : undefined}
            aria-label={`Day ${day.day}，${formatMemberDate(day.dateKey)}，${journeyDayLabel(day)}`}
            onClick={() => onSelect?.(day.day)}
            className={`min-h-16 rounded-2xl border px-1.5 py-2 text-center transition ${tone} ${
              selected ? "ring-2 ring-brand ring-offset-2" : ""
            } ${disabled ? "cursor-default" : "hover:-translate-y-0.5"}`}
          >
            <span className="block text-xs font-bold">Day {day.day}</span>
            <span className="mt-1 block text-[11px] font-medium">{icon}</span>
          </button>
        );
      })}
    </div>
  );
}

function JourneyDayDetail({
  program,
  journeyDay,
}: {
  program: MemberProgramState;
  journeyDay: MemberJourneyDay;
}) {
  const checkin = journeyDay.checkin;
  if (!checkin) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-6">
        <p className="text-sm font-medium text-brand">
          Day {journeyDay.day} · {formatMemberDate(journeyDay.dateKey)}
        </p>
        <h3 className="mt-2 text-xl font-bold">{journeyDayLabel(journeyDay)}</h3>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {journeyDay.status === "missed"
            ? "这一天没有记录，不影响你继续旅程。"
            : "今天可以完成 3 条对内行动和 3 条对外行动，提交后会在这里留下安全摘要。"}
        </p>
      </div>
    );
  }

  const completedTasks = allMemberTasks(program).filter((task) =>
    checkin.completedTaskIds.includes(task.id),
  );
  const internalIds = new Set(program.plan.internal.map((task) => task.id));
  const internalCount = completedTasks.filter((task) => internalIds.has(task.id)).length;
  const externalCount = completedTasks.length - internalCount;
  const feedback = buildMemberFeedback(program, checkin);

  return (
    <div className="rounded-3xl border border-brand/20 bg-surface p-6">
      <p className="text-sm font-medium text-brand">
        Day {checkin.day} · {formatMemberDate(checkin.dateKey)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-brand-soft px-3 py-2 text-brand">
          共完成 {completedTasks.length} 项
        </span>
        <span className="rounded-full bg-bg px-3 py-2 text-ink-soft">对内 {internalCount} 项</span>
        <span className="rounded-full bg-bg px-3 py-2 text-ink-soft">对外 {externalCount} 项</span>
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-bold">完成的任务</h3>
        {completedTasks.length ? (
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-ink-soft sm:grid-cols-2">
            {completedTasks.map((task) => (
              <li key={task.id} className="rounded-2xl bg-bg px-4 py-3">
                {task.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">这一天提交了记录，但没有勾选完成任务。</p>
        )}
      </div>
      {feedback ? (
        <div className="mt-5 border-t border-line pt-5">
          <h3 className="text-sm font-bold">模板反馈</h3>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{feedback.paragraphs[0]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {feedback.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-brand-soft px-3 py-2 text-xs text-brand">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TodayView({
  session,
  program,
  demoControlsEnabled,
  onStartCheckin,
  onViewFeedback,
  onAdvanceDemoDay,
  onResetDemoDay,
  onReassess,
  onReset,
  onLogout,
}: {
  session: DemoSessionLike;
  program: MemberProgramState;
  demoControlsEnabled: boolean;
  onStartCheckin: () => void;
  onViewFeedback: () => void;
  onAdvanceDemoDay: () => void;
  onResetDemoDay: () => void;
  onReassess: () => void;
  onReset: () => void;
  onLogout: () => void;
}) {
  const todayDateKey = memberEffectiveTodayDateKey(program);
  const journeyDays = memberJourneyDays(program, todayDateKey);
  const today = journeyDays.find((day) => day.isToday);
  const latest = latestMemberCheckin(program);
  const fallbackDay = today?.day ?? latest?.day ?? 1;
  const [selectedDay, setSelectedDay] = useState(fallbackDay);

  useEffect(() => {
    setSelectedDay(today?.day ?? latest?.day ?? 1);
  }, [latest?.day, today?.day, todayDateKey]);

  const selectedJourneyDay =
    journeyDays.find((day) => day.day === selectedDay) ?? journeyDays[0];
  const displayDay = today?.day ?? (todayDateKey > journeyDays[6].dateKey ? 7 : 1);
  const canCheckin = canSubmitMemberCheckin(program, todayDateKey);
  const todayCheckin = today?.checkin;
  const completedDays = memberCompletedDays(program);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow="One Day 会员工作区"
        title="今天只完成 3+3"
        body="你的任务由本次状态选择按规则生成。每一天绑定真实日期；过去没有提交会保留为未记录，但不会阻止你继续今天。"
        onLogout={onLogout}
      />

      <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_0.55fr]">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand">7 天旅程</p>
              <h2 className="mt-1 text-2xl font-bold">Day {displayDay} / 7</h2>
            </div>
            <span className="rounded-full bg-bg px-4 py-2 text-xs text-ink-muted">
              已记录 {completedDays} 天
            </span>
          </div>
          <div className="mt-5">
            <JourneyGrid
              days={journeyDays}
              selectedDay={selectedJourneyDay.day}
              onSelect={setSelectedDay}
            />
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-bold">今日状态</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {todayCheckin
              ? `Day ${todayCheckin.day} 已记录，同一天不能重复提交。`
              : canCheckin
                ? `Day ${today?.day} 已解锁，完成后可提交今天的打卡。`
                : "本次 7 天旅程已结束，你仍可查看每天的安全摘要。"}
          </p>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-[0.72fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-medium text-ink-muted">旅程说明</p>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            选择已记录或未记录的日期查看详情；未来日期保持锁定。状态同时使用文字、图标和颜色表达。
          </p>
        </div>
        <JourneyDayDetail program={program} journeyDay={selectedJourneyDay} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-medium text-brand">对内 3 条</p>
          <h2 className="mb-4 mt-1 text-xl font-bold">先整理自己的节奏</h2>
          <TaskList tasks={program.plan.internal} tone="internal" />
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-medium text-warn">对外 3 条</p>
          <h2 className="mb-4 mt-1 text-xl font-bold">再完成一次真实行动</h2>
          <TaskList tasks={program.plan.external} tone="external" />
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-line bg-surface p-6">
        <p className="text-sm font-medium text-brand">为什么是这 3+3</p>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-soft">
          {program.plan.rationale.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="text-brand">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        {todayCheckin ? (
          <button
            type="button"
            onClick={onViewFeedback}
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white"
          >
            查看 Day {todayCheckin.day} 模板反馈
          </button>
        ) : canCheckin ? (
          <button
            type="button"
            onClick={onStartCheckin}
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white"
          >
            开始 Day {today?.day} 打卡
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReassess}
          className="rounded-full border border-brand px-5 py-3 text-sm font-medium text-brand"
        >
          重新测评
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-line px-5 py-3 text-sm text-ink-muted"
        >
          重置演示
        </button>
      </div>

      {demoControlsEnabled ? (
        <details className="mt-6 rounded-3xl border border-dashed border-warn/40 bg-warn-soft p-5">
          <summary className="cursor-pointer text-sm font-bold text-warn">演示工具</summary>
          <p className="mt-3 text-xs leading-5 text-ink-soft">
            仅修改当前账号浏览器内的演示日期偏移，不修改系统时间，也不会影响其他账号。
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            当前模拟日期：{formatMemberDate(todayDateKey)} · Day {displayDay} / 7
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={displayDay >= memberJourneyLength}
              onClick={onAdvanceDemoDay}
              className="rounded-full bg-warn px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              模拟进入下一天
            </button>
            <button
              type="button"
              disabled={program.demoDayOffset === 0}
              onClick={onResetDemoDay}
              className="rounded-full border border-warn px-4 py-2 text-xs font-medium text-warn disabled:cursor-not-allowed disabled:opacity-40"
            >
              重置模拟日期
            </button>
          </div>
        </details>
      ) : null}
      <WorkspaceFooter />
    </div>
  );
}

function CheckinTaskGroup({
  title,
  tasks,
  checkedIds,
  onToggle,
}: {
  title: string;
  tasks: MemberTask[];
  checkedIds: string[];
  onToggle: (taskId: string, checked: boolean) => void;
}) {
  return (
    <fieldset className="rounded-3xl border border-line bg-surface p-6">
      <legend className="px-2 text-base font-bold">{title}</legend>
      <div className="grid gap-3">
        {tasks.map((task) => (
          <label key={task.id} className="flex cursor-pointer gap-3 rounded-2xl bg-bg p-4">
            <input
              type="checkbox"
              checked={checkedIds.includes(task.id)}
              onChange={(event) => onToggle(task.id, event.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
            />
            <span>
              <span className="block text-sm font-bold">{task.title}</span>
              <span className="mt-1 block text-xs leading-5 text-ink-muted">{task.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CheckinView({
  session,
  program,
  dateKey,
  onSaveDraft,
  onSubmit,
  onBack,
  onLogout,
}: {
  session: DemoSessionLike;
  program: MemberProgramState;
  dateKey: string;
  onSaveDraft: (taskIds: string[]) => void;
  onSubmit: (taskIds: string[], blockerProvided: boolean, feedbackFocusProvided: boolean) => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  const day = memberJourneyDayNumber(program.startedOn, dateKey);
  const [checkedIds, setCheckedIds] = useState(memberCheckinDraftForDate(program, dateKey));
  const [blocker, setBlocker] = useState("");
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const toggle = (taskId: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...checkedIds, taskId])]
      : checkedIds.filter((id) => id !== taskId);
    setCheckedIds(next);
    onSaveDraft(next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!blocker.trim() || !feedbackFocus.trim()) {
      setNotice("请填写“今天最大的卡点”和“最想获得反馈的一点”后再提交。 ");
      return;
    }
    onSubmit(checkedIds, true, true);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow="Check-in"
        title={`Day ${day} 今日打卡`}
        body={`${formatMemberDate(dateKey)} · 勾选今天完成的 6 个任务，再留下一个卡点和一个希望获得反馈的方向。自由文本只在当前页面使用，不写入 localStorage。`}
        onLogout={onLogout}
      />

      <form onSubmit={submit} className="grid gap-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <CheckinTaskGroup
            title="对内 3 件事"
            tasks={program.plan.internal}
            checkedIds={checkedIds}
            onToggle={toggle}
          />
          <CheckinTaskGroup
            title="对外 3 件事"
            tasks={program.plan.external}
            checkedIds={checkedIds}
            onToggle={toggle}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="rounded-3xl border border-line bg-surface p-6">
            <span className="text-base font-bold">今天最大的卡点</span>
            <span className="mt-1 block text-xs leading-5 text-ink-muted">
              仅用于生成本次模板反馈，不保存原文。
            </span>
            <textarea
              value={blocker}
              onChange={(event) => setBlocker(event.target.value)}
              rows={4}
              placeholder="例如：开始前犹豫了很久，最后只完成了最小版本。"
              className="mt-4 w-full resize-none rounded-2xl border border-line bg-bg px-4 py-3 text-sm leading-6 outline-none focus:border-brand"
            />
          </label>
          <label className="rounded-3xl border border-line bg-surface p-6">
            <span className="text-base font-bold">最想获得反馈的一点</span>
            <span className="mt-1 block text-xs leading-5 text-ink-muted">
              反馈会保持行动建议边界，不做医疗判断。
            </span>
            <textarea
              value={feedbackFocus}
              onChange={(event) => setFeedbackFocus(event.target.value)}
              rows={4}
              placeholder="例如：怎样让明天的第一步更容易开始？"
              className="mt-4 w-full resize-none rounded-2xl border border-line bg-bg px-4 py-3 text-sm leading-6 outline-none focus:border-brand"
            />
          </label>
        </div>

        {notice ? (
          <p role="alert" className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
            {notice}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white"
          >
            提交并查看模板反馈
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-line px-5 py-3 text-sm text-ink-muted"
          >
            返回今日任务
          </button>
        </div>
      </form>
      <WorkspaceFooter />
    </div>
  );
}

function FeedbackView({
  session,
  program,
  onBack,
  onReset,
  onLogout,
}: {
  session: DemoSessionLike;
  program: MemberProgramState;
  onBack: () => void;
  onReset: () => void;
  onLogout: () => void;
}) {
  const checkin = latestMemberCheckin(program);
  const feedback = buildMemberFeedback(program, checkin);
  if (!feedback || !checkin) return <LoadingWorkspace />;
  const totalTasks = allMemberTasks(program).length;
  const completionPercent = Math.round((checkin.completedTaskIds.length / totalTasks) * 100);
  const journeyDays = memberJourneyDays(program);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow={`Day ${checkin.day} 完成`}
        title={feedback.title}
        body="这是基于任务完成数量与是否填写复盘项生成的固定模板，不调用真实 AI，也不会根据自由文本做诊断或疗效判断。"
        onLogout={onLogout}
      />

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-brand/20 bg-brand-soft p-7">
          <p className="text-sm font-medium text-brand">今天已经被记录</p>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-ink-soft">
            {feedback.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {feedback.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/70 px-3 py-2 text-xs text-brand">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-3xl border border-line bg-surface p-6">
            <p className="text-sm text-ink-muted">今日任务完成</p>
            <p className="mt-2 text-3xl font-bold">
              {checkin.completedTaskIds.length} / {totalTasks}
            </p>
            <p className="mt-2 text-sm text-ink-soft">完成率 {completionPercent}%</p>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-ink-muted">7 天旅程</p>
                <p className="mt-2 text-3xl font-bold">Day {checkin.day} / 7</p>
              </div>
              <span className="text-xs text-ink-muted">已记录 {memberCompletedDays(program)} 天</span>
            </div>
            <div className="mt-4">
              <JourneyGrid days={journeyDays} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white"
        >
          返回今日任务
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-line px-5 py-3 text-sm text-ink-muted"
        >
          重置演示
        </button>
      </div>
      <WorkspaceFooter />
    </div>
  );
}

export function MemberWorkspace({ view }: { view: MemberWorkspaceView }) {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState<DemoSessionLike | null>(null);
  const [program, setProgram] = useState<MemberProgramState | null>(null);
  const [demoControlsEnabled, setDemoControlsEnabled] = useState(false);

  const storageKey = useMemo(
    () => (session ? memberProgramStorageKey(session.email) : null),
    [session],
  );

  useEffect(() => {
    const nextSession = readDemoSession();
    setSession(nextSession);
    setDemoControlsEnabled(new URLSearchParams(window.location.search).get("demoControls") === "1");
    if (nextSession && canAccessMemberWorkspace(nextSession)) {
      const key = memberProgramStorageKey(nextSession.email);
      const legacyKey = legacyMemberProgramStorageKey(nextSession.email);
      const currentRaw = window.localStorage.getItem(key);
      const restored = parseMemberProgramState(
        currentRaw ?? window.localStorage.getItem(legacyKey),
      );
      if (restored && !currentRaw) {
        window.localStorage.setItem(key, serializeMemberProgramState(restored));
        window.localStorage.removeItem(legacyKey);
      }
      setProgram(restored);
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!booted || !session || !canAccessMemberWorkspace(session)) return;
    if (view === "home") {
      router.replace(memberHomeRoute(program));
      return;
    }
    if (view !== "onboarding" && !program) {
      router.replace("/member/onboarding");
      return;
    }
    if (view === "feedback" && program && !latestMemberCheckin(program)) {
      router.replace("/member/today");
      return;
    }
    if (view === "checkin" && program && !canSubmitMemberCheckin(program)) {
      router.replace("/member/today");
    }
  }, [booted, program, router, session, view]);

  const persistProgram = (nextProgram: MemberProgramState) => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, serializeMemberProgramState(nextProgram));
    if (session) window.localStorage.removeItem(legacyMemberProgramStorageKey(session.email));
    setProgram(nextProgram);
  };

  const logout = () => {
    window.localStorage.removeItem(demoSessionStorageKey);
    setSession(null);
    router.push("/");
  };

  const resetDemo = () => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    if (session) window.localStorage.removeItem(legacyMemberProgramStorageKey(session.email));
    setProgram(null);
    router.push("/member/onboarding");
  };

  if (!booted) return <LoadingWorkspace />;
  if (!session) {
    return (
      <AccessGate
        title="请先登录"
        body="请先从统一登录入口进入会员工作区。"
        onReturn={() => router.push("/")}
      />
    );
  }
  if (!canAccessMemberWorkspace(session)) {
    return (
      <AccessGate
        title="当前账号没有会员权限"
        body="请使用会员账号，或使用双角色账号后选择会员体验区。"
        onReturn={() => router.push("/")}
      />
    );
  }
  if (view === "home") return <LoadingWorkspace />;
  if (view === "onboarding") {
    return (
      <OnboardingView
        key={program ? JSON.stringify(program.assessment) : "new-member"}
        session={session}
        program={program}
        onSubmit={(assessment) => {
          persistProgram(createMemberProgramState(assessment));
          router.push("/member/today");
        }}
        onLogout={logout}
      />
    );
  }
  if (!program) return <LoadingWorkspace />;
  const todayDateKey = memberEffectiveTodayDateKey(program);
  if (view === "today") {
    return (
      <TodayView
        session={session}
        program={program}
        demoControlsEnabled={demoControlsEnabled}
        onStartCheckin={() => router.push("/member/checkin")}
        onViewFeedback={() => router.push("/member/feedback")}
        onAdvanceDemoDay={() => persistProgram(advanceMemberDemoDay(program))}
        onResetDemoDay={() => persistProgram(resetMemberDemoDay(program))}
        onReassess={() => router.push("/member/onboarding")}
        onReset={resetDemo}
        onLogout={logout}
      />
    );
  }
  if (view === "checkin") {
    if (!canSubmitMemberCheckin(program, todayDateKey)) return <LoadingWorkspace />;
    return (
      <CheckinView
        session={session}
        program={program}
        dateKey={todayDateKey}
        onSaveDraft={(taskIds) =>
          persistProgram(updateMemberCheckinDraft(program, taskIds, todayDateKey))
        }
        onSubmit={(taskIds, blockerProvided, feedbackFocusProvided) => {
          persistProgram(
            completeMemberCheckin(
              program,
              taskIds,
              blockerProvided,
              feedbackFocusProvided,
              todayDateKey,
            ),
          );
          router.push("/member/feedback");
        }}
        onBack={() => router.push("/member/today")}
        onLogout={logout}
      />
    );
  }
  if (!latestMemberCheckin(program)) return <LoadingWorkspace />;
  return (
    <FeedbackView
      session={session}
      program={program}
      onBack={() => router.push("/member/today")}
      onReset={resetDemo}
      onLogout={logout}
    />
  );
}
