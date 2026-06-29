import { PrimaryButton } from "../components/Button";
import { ActionCard } from "../components/Cards";
import { demoData, type DemoTask } from "../data/demoData";

type ActionCardPageProps = {
  onComplete: () => void;
};

type TaskListProps = {
  tasks: readonly DemoTask[];
};

function TaskList({ tasks }: TaskListProps) {
  return (
    <ol className="space-y-3">
      {tasks.map((task, index) => (
        <li key={task.id} className="flex gap-3 rounded-[18px] bg-cream/70 p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warm-white text-sm font-semibold text-dawn-orange">
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
          <ActionCard title="对内修复" subtitle="先把身体、情绪和节律拉回稳定。">
            <TaskList tasks={demoData.tasks.internal} />
          </ActionCard>
        </div>

        <div role="region" aria-label="对外输出">
          <ActionCard title="对外输出" subtitle="再用表达、连接和作品推动生活向前。">
            <TaskList tasks={demoData.tasks.external} />
          </ActionCard>
        </div>
      </div>

      <PrimaryButton onClick={onComplete} className="mt-8">
        完成今日打卡
      </PrimaryButton>
    </div>
  );
}
