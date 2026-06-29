import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { ReportSection } from "../components/Cards";
import { demoData } from "../data/demoData";

export function ReportPreview() {
  const [ctaState, setCtaState] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <section className="mb-6">
        <p className="text-sm font-medium text-dawn-orange">Final Report</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-night-blue">
          {demoData.finalReport.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-text">
          这份报告会把 14 天的行动记录整理成一份可复盘、可继续推进的阶段成果。
        </p>
      </section>

      <div className="flex-1 space-y-3">
        {demoData.finalReport.sections.map((section) => (
          <ReportSection key={section.title} title={section.title} bullets={section.bullets} />
        ))}

        {ctaState ? (
          <p className="rounded-[18px] bg-dawn-orange/10 px-4 py-3 text-sm font-medium text-dawn-orange">
            {ctaState}
          </p>
        ) : null}
      </div>

      <div className="mt-8 space-y-3">
        <PrimaryButton onClick={() => setCtaState("已记录咨询意向")}>
          {demoData.finalReport.primaryCta}
        </PrimaryButton>
        <SecondaryButton onClick={() => setCtaState("已准备邀请朋友一起开始")}>
          {demoData.finalReport.secondaryCta}
        </SecondaryButton>
      </div>
    </div>
  );
}
