import type { ReactNode } from "react";

type ActionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
};

type TaskCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

type MetricCardProps = {
  label: string;
  value: string;
};

type FeedbackCardProps = {
  title: string;
  body: string;
  tags?: readonly string[];
};

type ReportSectionProps = {
  title: string;
  bullets: readonly string[];
};

export function ActionCard({
  title,
  subtitle,
  children,
  className = "",
  titleClassName = "text-night-blue",
}: ActionCardProps) {
  return (
    <section
      className={`rounded-[24px] border border-soft-gold/20 bg-warm-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4">
        <h2 className={`text-lg font-semibold ${titleClassName}`}>{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-muted-text">{subtitle}</p> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function TaskCheckbox({ label, checked, onChange }: TaskCheckboxProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-soft-gold/20 bg-cream/60 px-4 py-3 text-sm font-medium text-night-blue">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-soft-gold text-growth-green accent-growth-green"
      />
      <span>{label}</span>
    </label>
  );
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <article className="rounded-[20px] border border-soft-gold/20 bg-cream/70 p-4">
      <p className="text-xs font-medium text-muted-text">{label}</p>
      <p className="mt-2 text-xl font-semibold text-night-blue">{value}</p>
    </article>
  );
}

export function FeedbackCard({ title, body, tags = [] }: FeedbackCardProps) {
  return (
    <section className="rounded-[24px] border border-soft-gold/30 bg-cream/70 p-5">
      <h2 className="text-lg font-semibold text-night-blue">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-muted-text">
        {body.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-growth-green/10 px-3 py-1 text-xs font-medium text-growth-green"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function ReportSection({ title, bullets }: ReportSectionProps) {
  return (
    <section className="rounded-[20px] border border-soft-gold/20 bg-warm-white p-4">
      <h2 className="text-base font-semibold text-night-blue">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-text">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
