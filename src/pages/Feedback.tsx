import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { FeedbackCard } from "../components/Cards";
import { demoData } from "../data/demoData";

type FeedbackProps = {
  onViewProgress: () => void;
};

export function Feedback({ onViewProgress }: FeedbackProps) {
  const [regenerated, setRegenerated] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <section className="mb-6">
        <p className="text-sm font-medium text-dawn-orange">AI Feedback</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-night-blue">
          {demoData.feedback.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-text">
          根据今天的打卡内容，One Day 会给出及时、克制、可继续执行的反馈。
        </p>
      </section>

      <div className="flex-1 space-y-4">
        <FeedbackCard
          title="今日反馈"
          body={demoData.feedback.body}
          tags={demoData.feedback.tags}
        />

        {regenerated ? (
          <p className="rounded-[18px] bg-growth-green/10 px-4 py-3 text-sm font-medium text-growth-green">
            已为你更新一版反馈语气
          </p>
        ) : null}
      </div>

      <div className="mt-8 space-y-3">
        <PrimaryButton onClick={onViewProgress}>{demoData.feedback.primaryCta}</PrimaryButton>
        <SecondaryButton onClick={() => setRegenerated(true)}>
          {demoData.feedback.secondaryCta}
        </SecondaryButton>
      </div>
    </div>
  );
}
