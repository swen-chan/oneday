type TimelineItem = {
  day: number;
  title: string;
};

type TimelineProps = {
  items: readonly TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.day} className="flex gap-3 rounded-[20px] bg-cream/70 p-4">
          <span className="shrink-0 rounded-full bg-dawn-orange/15 px-3 py-1 text-xs font-semibold text-dawn-orange">
            Day {item.day}
          </span>
          <span className="text-sm font-medium text-night-blue">{item.title}</span>
        </li>
      ))}
    </ol>
  );
}
