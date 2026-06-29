import { PrimaryButton } from "../components/Button";
import { ActionCard } from "../components/Cards";
import { demoData, type DemoTask } from "../data/demoData";

type ActionCardPageProps = {
  onComplete: () => void;
};

type TaskListProps = {
  tasks: readonly DemoTask[];
  itemClassName: string;
  badgeClassName: string;
};

function TaskList({ tasks, itemClassName, badgeClassName }: TaskListProps) {
  return (
    <ol className="space-y-3">
      {tasks.map((task, index) => (
        <li key={task.id} className={`flex gap-3 rounded-[18px] p-4 ${itemClassName}`}>
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${badgeClassName}`}
          >
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-night-blue">{task.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-text">{task.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ActionCardPage({ onComplete }: ActionCardPageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mb-6">
        <p className="text-sm font-medium text-dawn-orange">Daily 3+3</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-night-blue">
          今日 3+3 行动卡
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-text">
          今天不用改变一生，只需要把今天过回自己手里。
        </p>
      </section>

      <div className="flex-1 space-y-4">
        <div role="region" aria-label="对内修复">
          <ActionCard
            title="对内修复"
            subtitle="先把身体、情绪和节律拉回稳定。"
            className="border-growth-green/30 bg-growth-green/5 shadow-[inset_4px_0_0_rgba(76,122,93,0.45)]"
            titleClassName="text-growth-green"
          >
            <TaskList
              tasks={demoData.tasks.internal}
              itemClassName="bg-growth-green/10"
              badgeClassName="bg-growth-green text-warm-white"
            />
          </ActionCard>
        </div>

        <div role="region" aria-label="对外输出">
          <ActionCard
            title="对外输出"
            subtitle="再用表达、连接和作品推动生活向前。"
            className="border-dawn-orange/35 bg-dawn-orange/5 shadow-[inset_4px_0_0_rgba(245,158,91,0.5)]"
            titleClassName="text-dawn-orange"
          >
            <TaskList
              tasks={demoData.tasks.external}
              itemClassName="bg-dawn-orange/10"
              badgeClassName="bg-dawn-orange text-warm-white"
            />
          </ActionCard>
        </div>
      </div>

      <PrimaryButton onClick={onComplete} className="mt-8">
        完成今日打卡
      </PrimaryButton>
    </div>
  );
}
