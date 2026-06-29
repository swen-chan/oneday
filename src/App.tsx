import { useMemo, useState } from "react";
import { PrimaryButton } from "./components/Button";
import { PhoneFrame } from "./components/PhoneFrame";
import { ProgressHeader } from "./components/ProgressHeader";
import { demoData } from "./data/demoData";
import { ActionCardPage } from "./pages/ActionCardPage";
import { Checkin } from "./pages/Checkin";
import { Feedback } from "./pages/Feedback";
import { Intake } from "./pages/Intake";
import { Landing } from "./pages/Landing";
import { Progress } from "./pages/Progress";
import { ReportPreview } from "./pages/ReportPreview";

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

  function goNext() {
    setCurrentStepIndex((index) => Math.min(index + 1, flowSteps.length - 1));
  }

  function goBack() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  function renderCurrentStep() {
    if (currentStep.id === "landing") {
      return <Landing onStart={goNext} />;
    }

    if (currentStep.id === "intake") {
      return <Intake onContinue={goNext} />;
    }

    if (currentStep.id === "action-card") {
      return <ActionCardPage onComplete={goNext} />;
    }

    if (currentStep.id === "checkin") {
      return <Checkin onSubmit={goNext} />;
    }

    if (currentStep.id === "feedback") {
      return <Feedback onViewProgress={goNext} />;
    }

    if (currentStep.id === "progress") {
      return <Progress onPreviewReport={goNext} />;
    }

    if (currentStep.id === "report-preview") {
      return <ReportPreview />;
    }

    return (
      <>
        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-3 text-sm font-medium text-dawn-orange">{currentStep.eyebrow}</p>
          <h1 className="text-3xl font-semibold leading-tight">{currentStep.title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-text">{currentStep.body}</p>
        </div>

        {currentStep.primaryCta ? (
          <PrimaryButton onClick={goNext} className="mt-12">
            {currentStep.primaryCta}
          </PrimaryButton>
        ) : null}
      </>
    );
  }

  return (
    <PhoneFrame>
      <ProgressHeader
        currentStep={currentStepIndex + 1}
        totalSteps={flowSteps.length}
        onBack={isFirstStep ? undefined : goBack}
      />
      {renderCurrentStep()}
    </PhoneFrame>
  );
}
