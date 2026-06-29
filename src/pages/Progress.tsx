import { PrimaryButton } from "../components/Button";
import { MetricCard } from "../components/Cards";
import { Timeline } from "../components/Timeline";
import { demoData } from "../data/demoData";

type ProgressProps = {
  onPreviewReport: () => void;
};

export function Progress({ onPreviewReport }: ProgressProps) {
  const progressPercent = Math.round((demoData.currentDay / demoData.totalDays) * 100);

  return (
    <div className="flex flex-1 flex-col">
      <section className="mb-6">
        <p className="text-sm font-medium text-dawn-orange">14-Day Journey</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-night-blue">
          {demoData.progress.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-text">
          你正在把一天的行动，放进一段可以看见变化的 14 天旅程里。
        </p>
      </section>

      <div className="flex-1 space-y-5">
        <section className="rounded-[24px] border border-soft-gold/25 bg-cream/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-dawn-orange">
              Day {demoData.currentDay} / {demoData.totalDays}
            </span>
            <span className="text-xs font-medium text-muted-text">{progressPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="14 天进度"
            aria-valuemin={0}
            aria-valuemax={demoData.totalDays}
            aria-valuenow={demoData.currentDay}
            className="mt-4 h-3 overflow-hidden rounded-full bg-soft-gold/20"
          >
            <div
              className="h-full rounded-full bg-dawn-orange"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {demoData.progress.metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-night-blue">14 天关键节点</h2>
          <Timeline items={demoData.progress.timeline} />
        </section>
      </div>

      <PrimaryButton onClick={onPreviewReport} className="mt-8">
        {demoData.progress.cta}
      </PrimaryButton>
    </div>
  );
}
