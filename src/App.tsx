import { useMemo, useState } from "react";
import { demoData } from "./data/demoData";

type FlowStep = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  primaryCta?: string;
};

export default function App() {
  const flowSteps = useMemo<FlowStep[]>(
    () => [
      {
        id: "landing",
        eyebrow: "One Day Demo",
        title: demoData.productName,
        body: demoData.landing.headline,
        primaryCta: demoData.landing.cta,
      },
      {
        id: "intake",
        eyebrow: "Intake",
        title: "当前状态了解",
        body: "先快速了解你的困扰、当前状态，以及 14 天后希望看到的变化。",
        primaryCta: demoData.intake.cta,
      },
      {
        id: "action-card",
        eyebrow: "Daily 3+3",
        title: "今日 3+3 行动卡",
        body: "今天不用改变一生，只需要把今天过回自己手里。",
        primaryCta: "完成今日打卡",
      },
      {
        id: "checkin",
        eyebrow: "Check-in",
        title: "今日打卡",
        body: "记录今天完成的对内修复和对外输出，再交给 One Day 生成反馈。",
        primaryCta: demoData.checkin.cta,
      },
      {
        id: "feedback",
        eyebrow: "AI Feedback",
        title: demoData.feedback.title,
        body: "One Day 会把今日行动转化为温暖、及时、可继续执行的成长反馈。",
        primaryCta: demoData.feedback.primaryCta,
      },
      {
        id: "progress",
        eyebrow: "14-Day Journey",
        title: demoData.progress.title,
        body: `Day ${demoData.currentDay} / ${demoData.totalDays}，当前状态：${demoData.progress.status}。`,
        primaryCta: demoData.progress.cta,
      },
      {
        id: "report-preview",
        eyebrow: "Final Report",
        title: demoData.finalReport.title,
        body: "结营报告会汇总身体节律、情绪状态、对外输出记录和下一阶段建议。",
        primaryCta: demoData.finalReport.primaryCta,
      },
    ],
    [],
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = flowSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === flowSteps.length - 1;

  function goNext() {
    setCurrentStepIndex((index) => Math.min(index + 1, flowSteps.length - 1));
  }

  function goBack() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10 font-sans text-night-blue">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[390px] flex-col rounded-[24px] bg-warm-white p-6 shadow-sm">
        <header className="mb-12 flex min-h-10 items-center justify-between gap-4 text-sm">
          {isFirstStep ? (
            <span className="font-medium text-dawn-orange">One Day Demo</span>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-soft-gold/40 px-4 py-2 font-medium text-night-blue"
            >
              返回
            </button>
          )}
          <span aria-label="页面进度" className="font-medium text-muted-text">
            {currentStepIndex + 1} / {flowSteps.length}
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-3 text-sm font-medium text-dawn-orange">{currentStep.eyebrow}</p>
          <h1 className="text-3xl font-semibold leading-tight">{currentStep.title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-text">{currentStep.body}</p>
        </div>

        {currentStep.primaryCta ? (
          <button
            type="button"
            onClick={isLastStep ? undefined : goNext}
            className="mt-12 w-full rounded-full bg-night-blue px-5 py-4 text-base font-semibold text-warm-white shadow-sm"
          >
            {currentStep.primaryCta}
          </button>
        ) : null}
      </section>
    </main>
  );
}
