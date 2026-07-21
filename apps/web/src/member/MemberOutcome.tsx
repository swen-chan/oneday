"use client";

import { useMemo, useState } from "react";
import {
  allMemberTasks,
  buildMemberFeedback,
  formatMemberDate,
  memberCompletedDays,
  type MemberCheckinSummary,
  type MemberProgramState,
} from "./memberPlan";
import {
  downloadMemberPoster,
  shareMemberPoster,
  type MemberPosterContent,
} from "./memberPoster";

function Celebration({ complete }: { complete: boolean }) {
  if (complete) {
    const sparks = [
      [10, 54],
      [20, 20],
      [34, 66],
      [48, 12],
      [62, 62],
      [76, 18],
      [88, 50],
    ] as const;
    return (
      <div
        className="relative h-20 overflow-hidden"
        aria-hidden="true"
        data-testid="member-celebration"
        data-variant="fireworks"
      >
        {sparks.map(([left, top], index) => (
          <span
            key={`${left}-${top}`}
            className={`absolute h-3 w-3 rounded-full motion-safe:animate-ping ${
              index % 2 ? "bg-warn" : "bg-brand"
            } motion-reduce:animate-none`}
            style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 90}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex h-20 items-center justify-center gap-3"
      aria-hidden="true"
      data-testid="member-celebration"
      data-variant="gentle"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className="h-3 w-3 rounded-full bg-brand/35 motion-safe:animate-pulse motion-reduce:animate-none"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function MemberOutcome({
  program,
  checkin,
}: {
  program: MemberProgramState;
  checkin: MemberCheckinSummary;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const feedback = buildMemberFeedback(program, checkin);
  const totalTasks = allMemberTasks(program).length;
  const complete = checkin.completedTaskIds.length === totalTasks;
  const posterContent = useMemo<MemberPosterContent | null>(() => {
    if (!feedback) return null;
    return {
      day: checkin.day,
      dateLabel: formatMemberDate(checkin.dateKey),
      completedCount: checkin.completedTaskIds.length,
      totalTasks,
      completedDays: memberCompletedDays(program),
      encouragement: feedback.encouragement,
      nextStep: feedback.nextStep,
    };
  }, [checkin, feedback, program, totalTasks]);

  if (!feedback || !posterContent) return null;

  const savePoster = () => {
    try {
      downloadMemberPoster(posterContent);
      setNotice("海报图片已开始保存。");
    } catch {
      setNotice("当前浏览器暂时无法保存，请稍后重试。");
    }
  };

  const sharePoster = async () => {
    try {
      const result = await shareMemberPoster(posterContent);
      setNotice(
        result === "shared"
          ? "已打开系统分享面板。"
          : result === "downloaded"
            ? "当前浏览器不支持图片分享，已改为保存海报。"
            : "已取消分享。",
      );
    } catch {
      setNotice("当前浏览器暂时无法分享或保存，请稍后重试。");
    }
  };

  return (
    <section className="rounded-[2rem] border border-brand/20 bg-brand-soft p-5 sm:p-7" data-testid="member-outcome">
      <div role="status" aria-live="polite" className="text-center">
        <Celebration complete={complete} />
        <p className="text-xs font-medium tracking-[0.18em] text-brand">
          {complete ? "FULL DAY" : "TODAY IS ENOUGH"}
        </p>
        <h2 className="mt-3 text-2xl font-bold">{feedback.title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
          {feedback.encouragement}
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-4">
          <div className="rounded-3xl bg-white/75 p-5">
            <p className="text-xs text-ink-muted">今日完成</p>
            <p className="mt-2 text-3xl font-bold">
              {checkin.completedTaskIds.length} / {totalTasks}
            </p>
          </div>
          <div className="rounded-3xl bg-white/75 p-5">
            <p className="text-xs font-medium text-brand">明天的一小步</p>
            <p className="mt-2 text-sm leading-7 text-ink-soft">{feedback.nextStep}</p>
          </div>
          <div className="rounded-3xl border border-dashed border-brand/25 p-4 text-xs leading-6 text-ink-muted">
            AI 风格文案本轮使用安全模板生成；快捷感受只保存选项，补充原文不写入浏览器，也不会出现在公开海报。
          </div>
        </div>

        <div>
          <div
            aria-label="One Day 今日海报预览"
            className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#f7f8f7_0%,#edf3f1_52%,#f7f0e4_100%)] p-7 shadow-sm"
          >
            <div className="absolute -right-12 top-10 h-40 w-40 rounded-full bg-brand/10" />
            <div className="absolute -bottom-14 -right-8 h-52 w-52 rounded-full bg-warn/10" />
            <div className="relative flex h-full flex-col">
              <p className="text-base font-bold tracking-[0.08em]">One Day</p>
              <p className="mt-3 text-[11px] font-medium tracking-[0.18em] text-brand">
                DAY {checkin.day} · {formatMemberDate(checkin.dateKey)}
              </p>
              <div className="mt-10">
                <p className="text-4xl font-bold tracking-tight">
                  {checkin.completedTaskIds.length} / {totalTasks}
                </p>
                <p className="mt-2 text-xs text-ink-muted">今天点亮的行动</p>
              </div>
              <p className="mt-8 text-lg font-semibold leading-8">{feedback.encouragement}</p>
              <div className="mt-auto rounded-3xl bg-white/70 p-4">
                <p className="text-[10px] font-medium tracking-[0.16em] text-brand">明天的一小步</p>
                <p className="mt-2 text-xs leading-6 text-ink-soft">{feedback.nextStep}</p>
              </div>
              <p className="mt-5 text-xs font-medium text-brand">今天怎样度过，一生便怎样展开。</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={savePoster}
              className="rounded-full border border-brand px-5 py-3 text-sm font-medium text-brand"
            >
              保存图片
            </button>
            <button
              type="button"
              onClick={() => void sharePoster()}
              className="rounded-full bg-brand px-5 py-3 text-sm font-medium text-white"
            >
              分享
            </button>
          </div>
          {notice ? (
            <p role="status" className="mt-3 text-center text-xs text-ink-muted">
              {notice}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
