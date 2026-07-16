"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  allMemberTasks,
  buildMemberFeedback,
  canAccessMemberWorkspace,
  completeMemberCheckin,
  concernOptions,
  createMemberProgramState,
  demoSessionStorageKey,
  goalOptions,
  memberHomeRoute,
  memberProgramStorageKey,
  parseMemberProgramState,
  serializeMemberProgramState,
  stateOptions,
  updateMemberCheckinDraft,
  type DemoSessionLike,
  type MemberAssessment,
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
          title="3. 14 天目标"
          description="选一个希望在 14 天里逐步看见的方向。"
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

function TodayView({
  session,
  program,
  onStartCheckin,
  onViewFeedback,
  onReassess,
  onReset,
  onLogout,
}: {
  session: DemoSessionLike;
  program: MemberProgramState;
  onStartCheckin: () => void;
  onViewFeedback: () => void;
  onReassess: () => void;
  onReset: () => void;
  onLogout: () => void;
}) {
  const displayDay = Math.min(program.completedDays + (program.lastCheckin ? 0 : 1), 14);
  const progressPercent = Math.round((program.completedDays / 14) * 100);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow="One Day 会员工作区"
        title="今天只完成 3+3"
        body="你的任务由本次状态选择按规则生成。每一条都保持低门槛，先完成今天，再决定明天。"
        onLogout={onLogout}
      />

      <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_0.55fr]">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand">今日行动卡</p>
              <h2 className="mt-1 text-2xl font-bold">Day {displayDay} / 14</h2>
            </div>
            <span className="rounded-full bg-bg px-4 py-2 text-xs text-ink-muted">
              已完成 {program.completedDays} 天
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="14 天进度"
            aria-valuemin={0}
            aria-valuemax={14}
            aria-valuenow={program.completedDays}
            className="mt-5 h-2 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-bold">今日状态</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {program.lastCheckin
              ? `Day ${program.lastCheckin.day} 已提交，可查看模板反馈。`
              : "任务已生成，完成后提交今日打卡。"}
          </p>
        </div>
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
        {program.lastCheckin ? (
          <button
            type="button"
            onClick={onViewFeedback}
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white"
          >
            查看 Day {program.lastCheckin.day} 模板反馈
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartCheckin}
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white"
          >
            开始今日打卡
          </button>
        )}
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
  onSaveDraft,
  onSubmit,
  onBack,
  onLogout,
}: {
  session: DemoSessionLike;
  program: MemberProgramState;
  onSaveDraft: (taskIds: string[]) => void;
  onSubmit: (taskIds: string[], blockerProvided: boolean, feedbackFocusProvided: boolean) => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [checkedIds, setCheckedIds] = useState(program.draftCompletedTaskIds);
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
        title="今日打卡"
        body="勾选今天完成的 6 个任务，再留下一个卡点和一个希望获得反馈的方向。自由文本只在当前页面使用，不写入 localStorage。"
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
  const feedback = buildMemberFeedback(program);
  const checkin = program.lastCheckin;
  if (!feedback || !checkin) return <LoadingWorkspace />;
  const totalTasks = allMemberTasks(program).length;
  const completionPercent = Math.round((checkin.completedTaskIds.length / totalTasks) * 100);
  const journeyPercent = Math.round((program.completedDays / 14) * 100);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <WorkspaceHeader
        session={session}
        eyebrow="Day 1 完成"
        title={feedback.title}
        body="这是基于任务完成数量与是否填写复盘项生成的固定模板，不调用真实 AI，也不会根据自由文本做诊断或疗效判断。"
        onLogout={onLogout}
      />

      <section className="grid gap-5 lg:grid-cols-[1fr_0.65fr]">
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
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink-muted">14 天进度</p>
                <p className="mt-2 text-3xl font-bold">Day {program.completedDays} / 14</p>
              </div>
              <span className="text-sm font-medium text-brand">{journeyPercent}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${journeyPercent}%` }} />
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

  const storageKey = useMemo(
    () => (session ? memberProgramStorageKey(session.email) : null),
    [session],
  );

  useEffect(() => {
    const nextSession = readDemoSession();
    setSession(nextSession);
    if (nextSession && canAccessMemberWorkspace(nextSession)) {
      const key = memberProgramStorageKey(nextSession.email);
      setProgram(parseMemberProgramState(window.localStorage.getItem(key)));
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
    if (view === "feedback" && program && !program.lastCheckin) {
      router.replace("/member/today");
    }
  }, [booted, program, router, session, view]);

  const persistProgram = (nextProgram: MemberProgramState) => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, serializeMemberProgramState(nextProgram));
    setProgram(nextProgram);
  };

  const logout = () => {
    window.localStorage.removeItem(demoSessionStorageKey);
    setSession(null);
    router.push("/");
  };

  const resetDemo = () => {
    if (storageKey) window.localStorage.removeItem(storageKey);
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
    return (
      <TodayView
        session={session}
        program={program}
        onStartCheckin={() => router.push("/member/checkin")}
        onViewFeedback={() => router.push("/member/feedback")}
        onReassess={() => router.push("/member/onboarding")}
        onReset={resetDemo}
        onLogout={logout}
      />
    );
  }
  if (view === "checkin") {
    return (
      <CheckinView
        session={session}
        program={program}
        onSaveDraft={(taskIds) => persistProgram(updateMemberCheckinDraft(program, taskIds))}
        onSubmit={(taskIds, blockerProvided, feedbackFocusProvided) => {
          persistProgram(
            completeMemberCheckin(program, taskIds, blockerProvided, feedbackFocusProvided),
          );
          router.push("/member/feedback");
        }}
        onBack={() => router.push("/member/today")}
        onLogout={logout}
      />
    );
  }
  if (!program.lastCheckin) return <LoadingWorkspace />;
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
