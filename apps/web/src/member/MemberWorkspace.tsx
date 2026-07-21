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
  memberCompletedDays,
  memberEffectiveTodayDateKey,
  memberHomeRoute,
  memberJourneyDays,
  memberJourneyLength,
  memberReflectionOptions,
  memberProgramStorageKey,
  memberTaskCompletedDays,
  parseMemberProgramState,
  resetMemberDemoDay,
  serializeMemberProgramState,
  stateOptions,
  updateMemberCheckinDraft,
  type DemoSessionLike,
  type MemberAssessment,
  type MemberJourneyDay,
  type MemberProgramState,
  type MemberReflectionChoice,
  type MemberTask,
} from "./memberPlan";
import { MemberOutcome } from "./MemberOutcome";

export type MemberWorkspaceView = "home" | "onboarding" | "today" | "checkin" | "feedback";

const emptyMemberTaskIds: string[] = [];

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
          生成我的 7 天 3+3 任务
        </button>
      </form>
      <WorkspaceFooter />
    </div>
  );
}

function TaskProgressGroup({
  program,
  tasks,
  tone,
}: {
  program: MemberProgramState;
  tasks: MemberTask[];
  tone: "internal" | "external";
}) {
  const cardTone =
    tone === "internal"
      ? "border-brand/20 bg-brand-soft"
      : "border-warn/20 bg-warn-soft";
  const progressTone = tone === "internal" ? "bg-brand" : "bg-warn";
  return (
    <ol className="grid gap-3">
      {tasks.map((task) => {
        const completedDays = memberTaskCompletedDays(program, task.id);
        return (
          <li key={task.id} className={`rounded-2xl border p-4 ${cardTone}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold">{task.title}</p>
              <span className="shrink-0 text-xs font-medium text-ink-muted">
                {completedDays} / {memberJourneyLength} 天
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-ink-soft">{task.description}</p>
            <div
              role="progressbar"
              aria-label={`${task.title}累计进度`}
              aria-valuemin={0}
              aria-valuemax={memberJourneyLength}
              aria-valuenow={completedDays}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80"
            >
              <div
                className={`h-full rounded-full transition-all motion-reduce:transition-none ${progressTone}`}
                style={{ width: `${(completedDays / memberJourneyLength) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CheckinBubbleGroup({
  program,
  title,
  tasks,
  tone,
  checkedIds,
  disabled,
  onToggle,
}: {
  program: MemberProgramState;
  title: string;
  tasks: MemberTask[];
  tone: "internal" | "external";
  checkedIds: string[];
  disabled: boolean;
  onToggle: (taskId: string) => void;
}) {
  const selectedTone =
    tone === "internal"
      ? "border-brand bg-[radial-gradient(circle_at_30%_20%,#7ca99b_0%,#4e7d6f_56%,#3f695d_100%)] text-white shadow-[0_18px_36px_rgba(78,125,111,0.28)]"
      : "border-warn bg-[radial-gradient(circle_at_30%_20%,#d3ad72_0%,#b0813f_58%,#8f662e_100%)] text-white shadow-[0_18px_36px_rgba(176,129,63,0.25)]";
  const idleTone =
    tone === "internal"
      ? "border-brand/25 bg-[radial-gradient(circle_at_30%_18%,#ffffff_0%,#edf5f2_42%,#dbeae5_100%)] text-brand shadow-[0_12px_28px_rgba(78,125,111,0.12)]"
      : "border-warn/25 bg-[radial-gradient(circle_at_30%_18%,#ffffff_0%,#fbf5ea_42%,#f1e2c7_100%)] text-warn shadow-[0_12px_28px_rgba(176,129,63,0.11)]";
  const sectionTone =
    tone === "internal"
      ? "border-brand/15 bg-brand-soft/45"
      : "border-warn/15 bg-warn-soft/45";
  const bubbleLayouts = [
    "motion-safe:-rotate-2 motion-safe:translate-y-2",
    "motion-safe:-translate-y-1 motion-safe:scale-[1.03]",
    "motion-safe:rotate-2 motion-safe:translate-y-3",
  ];

  return (
    <section
      aria-label={title}
      className={`relative overflow-hidden rounded-[2rem] border p-4 sm:p-5 ${sectionTone}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full border border-white/60 bg-white/20"
      />
      <p
        className={`relative mb-4 text-sm font-medium ${tone === "internal" ? "text-brand" : "text-warn"}`}
      >
        {title}
      </p>
      <div className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {tasks.map((task, index) => {
          const checked = checkedIds.includes(task.id);
          const completedDays = memberTaskCompletedDays(program, task.id);
          return (
            <button
              key={task.id}
              type="button"
              aria-pressed={checked}
              aria-label={`${task.title}，${checked ? "今日已完成" : "今日未完成"}，累计 ${completedDays}/7 天`}
              disabled={disabled}
              onClick={() => onToggle(task.id)}
              data-testid="checkin-bubble"
              data-bubble-index={index}
              className={`group relative aspect-square w-[calc(50%-0.25rem)] overflow-hidden rounded-full border px-3 py-3 text-center transition duration-300 sm:w-[calc(33.333%-0.5rem)] motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.06] motion-safe:active:scale-95 motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-default ${bubbleLayouts[index]} ${
                checked ? selectedTone : idleTone
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-[18%] top-[10%] h-[24%] w-[34%] -rotate-[24deg] rounded-full blur-[1px] ${
                  checked ? "bg-white/35" : "bg-white/80"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute bottom-[18%] right-[12%] h-2.5 w-2.5 rounded-full border ${
                  checked ? "border-white/55 bg-white/20" : "border-current/20 bg-white/50"
                } motion-safe:group-hover:-translate-y-2 motion-safe:group-hover:translate-x-1 motion-reduce:transform-none`}
              />
              <span
                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition motion-reduce:transition-none ${
                  checked ? "bg-white/20 text-white" : "bg-white/70"
                }`}
              >
                {checked ? "✓" : "✦"}
              </span>
              <span className="relative mx-auto mt-1.5 block max-w-[7.5rem] text-[11px] font-bold leading-4 sm:text-xs sm:leading-5">
                {task.title}
              </span>
              <span
                className={`relative mt-1 block text-[9px] sm:text-[10px] ${checked ? "text-white/75" : "text-ink-muted"}`}
              >
                累计 {completedDays}/7
              </span>
            </button>
          );
        })}
      </div>
    </section>
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
  onInspect,
}: {
  days: MemberJourneyDay[];
  onInspect?: (day: MemberJourneyDay) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" aria-label="7 天旅程">
      {days.map((day) => {
        const inspectable = Boolean(onInspect) && !day.isToday && day.status !== "locked";
        const disabled = !inspectable;
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
            aria-haspopup={inspectable ? "dialog" : undefined}
            aria-label={`Day ${day.day}，${formatMemberDate(day.dateKey)}，${journeyDayLabel(day)}`}
            onClick={() => inspectable && onInspect?.(day)}
            className={`min-h-16 rounded-2xl border px-1.5 py-2 text-center transition ${tone} ${
              disabled ? "cursor-default" : "hover:-translate-y-0.5 hover:shadow-sm"
            }`}
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
      <div className="rounded-3xl bg-bg p-5">
        <h3 className="text-lg font-bold">{journeyDayLabel(journeyDay)}</h3>
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
    <div>
      <div className="flex flex-wrap gap-2 text-xs">
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

function JourneyDayDialog({
  program,
  journeyDay,
  onClose,
}: {
  program: MemberProgramState;
  journeyDay: MemberJourneyDay;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 py-8 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="journey-day-dialog-title"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-brand">JOURNEY HISTORY</p>
            <h2 id="journey-day-dialog-title" className="mt-2 text-2xl font-bold">
              Day {journeyDay.day} 详情
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              {formatMemberDate(journeyDay.dateKey)} · {journeyDayLabel(journeyDay)}
            </p>
          </div>
          <button
            type="button"
            autoFocus
            aria-label="关闭历史详情"
            onClick={onClose}
            className="rounded-full border border-line px-3 py-2 text-xs text-ink-muted transition hover:border-brand hover:text-brand"
          >
            关闭
          </button>
        </div>
        <div className="mt-6">
          <JourneyDayDetail program={program} journeyDay={journeyDay} />
        </div>
      </section>
    </div>
  );
}

function TodayView({
  session,
  program,
  demoControlsEnabled,
  onSaveDraft,
  onSubmit,
  onAdvanceDemoDay,
  onResetDemoDay,
  onReassess,
  onReset,
  onLogout,
}: {
  session: DemoSessionLike;
  program: MemberProgramState;
  demoControlsEnabled: boolean;
  onSaveDraft: (taskIds: string[]) => void;
  onSubmit: (
    taskIds: string[],
    reflectionChoice: MemberReflectionChoice,
    noteProvided: boolean,
  ) => void;
  onAdvanceDemoDay: () => void;
  onResetDemoDay: () => void;
  onReassess: () => void;
  onReset: () => void;
  onLogout: () => void;
}) {
  const todayDateKey = memberEffectiveTodayDateKey(program);
  const journeyDays = memberJourneyDays(program, todayDateKey);
  const today = journeyDays.find((day) => day.isToday);
  const persistedCheckedIds =
    today?.checkin?.completedTaskIds ??
    (program.draftDateKey === todayDateKey
      ? program.draftCompletedTaskIds
      : emptyMemberTaskIds);
  const [checkedIds, setCheckedIds] = useState(persistedCheckedIds);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionChoice, setReflectionChoice] = useState<MemberReflectionChoice | null>(null);
  const [optionalNote, setOptionalNote] = useState("");
  const [historyDay, setHistoryDay] = useState<MemberJourneyDay | null>(null);

  useEffect(() => {
    setCheckedIds(persistedCheckedIds);
  }, [persistedCheckedIds]);

  useEffect(() => {
    setReflectionOpen(false);
    setReflectionChoice(null);
    setOptionalNote("");
    setHistoryDay(null);
  }, [today?.checkin?.dateKey, todayDateKey]);

  const displayDay = today?.day ?? (todayDateKey > journeyDays[6].dateKey ? 7 : 1);
  const canCheckin = canSubmitMemberCheckin(program, todayDateKey);
  const todayCheckin = today?.checkin;
  const completedDays = memberCompletedDays(program);
  const totalTasks = allMemberTasks(program).length;
  const hasJourneyHistory = journeyDays.some(
    (day) => !day.isToday && day.status !== "locked",
  );

  const toggleTask = (taskId: string) => {
    if (!canCheckin || todayCheckin) return;
    const next = checkedIds.includes(taskId)
      ? checkedIds.filter((id) => id !== taskId)
      : [...checkedIds, taskId];
    setCheckedIds(next);
    onSaveDraft(next);
    if (next.length === totalTasks) setReflectionOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow="One Day 会员工作区"
        title="今天，点亮你的 3+3"
        body="同一组对内 3 项与对外 3 项连续练习 7 天。每一天绑定真实日期；允许部分完成，也允许随时撤销尚未提交的选择。"
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
            <JourneyGrid days={journeyDays} onInspect={setHistoryDay} />
            {hasJourneyHistory ? (
              <p className="mt-3 text-xs text-ink-muted">点击过去的日期查看当天详情。</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-bold">今日进度</p>
          <p className="mt-3 text-4xl font-bold text-brand">
            {checkedIds.length} / {totalTasks}
          </p>
          <p className="mt-2 text-xs leading-6 text-ink-soft">
            {todayCheckin
              ? `Day ${todayCheckin.day} 已记录，同一天不能重复提交。`
              : canCheckin
                ? "点一下泡泡即完成，再点一次即可撤销。"
                : "本次 7 天旅程已结束，你仍可查看每天的安全摘要。"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="mb-5">
          <p className="text-sm font-medium text-brand">你的 7 天任务</p>
          <h2 className="mt-1 text-xl font-bold">每天重复同一组，慢慢看见累计</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-brand">对内 3 项</p>
            <TaskProgressGroup program={program} tasks={program.plan.internal} tone="internal" />
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-warn">对外 3 项</p>
            <TaskProgressGroup program={program} tasks={program.plan.external} tone="external" />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-line bg-surface p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-brand">今日 6 个泡泡</p>
            <h2 className="mt-1 text-xl font-bold">做到哪一个，就点亮哪一个</h2>
          </div>
          <span className="rounded-full bg-bg px-4 py-2 text-xs text-ink-muted">
            今日 {checkedIds.length}/{totalTasks}
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CheckinBubbleGroup
            program={program}
            title="对内 · 照顾自己的节奏"
            tasks={program.plan.internal}
            tone="internal"
            checkedIds={checkedIds}
            disabled={!canCheckin || Boolean(todayCheckin)}
            onToggle={toggleTask}
          />
          <CheckinBubbleGroup
            program={program}
            title="对外 · 完成一次真实行动"
            tasks={program.plan.external}
            tone="external"
            checkedIds={checkedIds}
            disabled={!canCheckin || Boolean(todayCheckin)}
            onToggle={toggleTask}
          />
        </div>

        {canCheckin && !todayCheckin ? (
          <div className="mt-7 border-t border-line pt-6">
            {!reflectionOpen ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-muted">
                  {checkedIds.length ? "不需要全部完成，今天做到这些也可以提交。" : "至少先点亮一个泡泡。"}
                </p>
                <button
                  type="button"
                  disabled={checkedIds.length === 0}
                  onClick={() => setReflectionOpen(true)}
                  className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  完成今天
                </button>
              </div>
            ) : (
              <div className="rounded-3xl bg-bg p-5 sm:p-6">
                <p className="text-sm font-bold">今天做完这些，感觉怎样？</p>
                <p className="mt-1 text-xs text-ink-muted">选择一个最接近的感受，再决定是否补一句话。</p>
                <div className="mt-4 flex flex-wrap gap-2" aria-label="今日快捷感受">
                  {memberReflectionOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={reflectionChoice === option.id}
                      onClick={() => setReflectionChoice(option.id)}
                      className={`rounded-full border px-4 py-2.5 text-xs transition ${
                        reflectionChoice === option.id
                          ? "border-brand bg-brand text-white"
                          : "border-line bg-white text-ink-soft"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <label className="mt-5 block text-xs font-medium text-ink-muted">
                  还想给今天留一句话（可选）
                  <input
                    value={optionalNote}
                    maxLength={80}
                    onChange={(event) => setOptionalNote(event.target.value)}
                    placeholder="例如：开始很难，但做完第一件后就顺了。"
                    className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                  />
                </label>
                <p className="mt-2 text-[11px] leading-5 text-ink-muted">
                  原文不会提交到后端，也不写入 localStorage 或分享海报；本轮只记录“是否补充”。
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!reflectionChoice}
                    onClick={() => {
                      if (!reflectionChoice) return;
                      onSubmit(checkedIds, reflectionChoice, Boolean(optionalNote.trim()));
                    }}
                    className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    生成今日鼓励与海报
                  </button>
                  <button
                    type="button"
                    onClick={() => setReflectionOpen(false)}
                    className="rounded-full border border-line px-5 py-3 text-sm text-ink-muted"
                  >
                    返回调整泡泡
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {todayCheckin ? (
        <div className="mt-6">
          <MemberOutcome program={program} checkin={todayCheckin} />
        </div>
      ) : null}

      <details className="mt-5 rounded-3xl border border-line bg-surface p-6">
        <summary className="cursor-pointer text-sm font-medium text-brand">为什么是这 3+3</summary>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-soft">
          {program.plan.rationale.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="text-brand">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-6 flex flex-wrap gap-3">
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
      {historyDay ? (
        <JourneyDayDialog
          program={program}
          journeyDay={historyDay}
          onClose={() => setHistoryDay(null)}
        />
      ) : null}
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
  if (!checkin) return <LoadingWorkspace />;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow={`Day ${checkin.day} 记录`}
        title="今天的结果已保留"
        body="旧的反馈链接继续可用；新的打卡流程会直接在今日页展示同一份鼓励、下一步与分享海报。"
        onLogout={onLogout}
      />

      <MemberOutcome program={program} checkin={checkin} />

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
    if (view === "checkin" && program) {
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
  if (view === "today") {
    const todayDateKey = memberEffectiveTodayDateKey(program);
    return (
      <TodayView
        session={session}
        program={program}
        demoControlsEnabled={demoControlsEnabled}
        onSaveDraft={(taskIds) =>
          persistProgram(updateMemberCheckinDraft(program, taskIds, todayDateKey))
        }
        onSubmit={(taskIds, reflectionChoice, noteProvided) =>
          persistProgram(
            completeMemberCheckin(
              program,
              taskIds,
              false,
              noteProvided,
              todayDateKey,
              reflectionChoice,
            ),
          )
        }
        onAdvanceDemoDay={() => persistProgram(advanceMemberDemoDay(program))}
        onResetDemoDay={() => persistProgram(resetMemberDemoDay(program))}
        onReassess={() => router.push("/member/onboarding")}
        onReset={resetDemo}
        onLogout={logout}
      />
    );
  }
  if (view === "checkin") {
    return <LoadingWorkspace />;
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
