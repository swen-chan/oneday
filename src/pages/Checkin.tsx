import { useState } from "react";
import { PrimaryButton } from "../components/Button";
import { TaskCheckbox } from "../components/Cards";
import { demoData, type DemoTask } from "../data/demoData";

type CheckinProps = {
  onSubmit: () => void;
};

type TaskGroupProps = {
  title: string;
  tasks: readonly DemoTask[];
  checkedTasks: Record<string, boolean>;
  onToggle: (taskId: string, checked: boolean) => void;
};

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TaskGroup({ title, tasks, checkedTasks, onToggle }: TaskGroupProps) {
  return (
    <section role="group" aria-label={title} className="space-y-3">
      <h2 className="text-base font-semibold text-night-blue">{title}</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCheckbox
            key={task.id}
            label={task.title}
            checked={checkedTasks[task.id] ?? false}
            onChange={(checked) => onToggle(task.id, checked)}
          />
        ))}
      </div>
    </section>
  );
}

function TextAreaField({ label, value, onChange }: TextAreaFieldProps) {
  const id = label.replace(/\s/g, "-");

  return (
    <label htmlFor={id} className="block">
      <span className="text-base font-semibold text-night-blue">{label}</span>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-3 w-full resize-none rounded-[20px] border border-soft-gold/25 bg-cream/70 px-4 py-3 text-sm leading-6 text-night-blue outline-none transition placeholder:text-muted-text focus:border-dawn-orange"
      />
    </label>
  );
}

export function Checkin({ onSubmit }: CheckinProps) {
  const allTasks = [...demoData.tasks.internal, ...demoData.tasks.external];
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allTasks.map((task) => [task.id, false])),
  );
  const [blockerText, setBlockerText] = useState<string>(demoData.checkin.blockerExample);
  const [feedbackFocusText, setFeedbackFocusText] = useState<string>(
    demoData.checkin.feedbackFocusExample,
  );

  function toggleTask(taskId: string, checked: boolean) {
    setCheckedTasks((current) => ({
      ...current,
      [taskId]: checked,
    }));
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="mb-6">
        <p className="text-sm font-medium text-dawn-orange">Check-in</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-night-blue">今日打卡</h1>
        <p className="mt-3 text-sm leading-6 text-muted-text">
          勾选今天完成的动作，再留下最需要被看见的一点。
        </p>
      </section>

      <div className="flex-1 space-y-6">
        <TaskGroup
          title="对内 3 件事"
          tasks={demoData.tasks.internal}
          checkedTasks={checkedTasks}
          onToggle={toggleTask}
        />
        <TaskGroup
          title="对外 3 件事"
          tasks={demoData.tasks.external}
          checkedTasks={checkedTasks}
          onToggle={toggleTask}
        />
        <TextAreaField
          label={demoData.checkin.blockerLabel}
          value={blockerText}
          onChange={setBlockerText}
        />
        <TextAreaField
          label={demoData.checkin.feedbackFocusLabel}
          value={feedbackFocusText}
          onChange={setFeedbackFocusText}
        />
      </div>

      <PrimaryButton onClick={onSubmit} className="mt-8">
        {demoData.checkin.cta}
      </PrimaryButton>
    </div>
  );
}
