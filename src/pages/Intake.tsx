import { useState } from "react";
import { PrimaryButton } from "../components/Button";
import { demoData, type IntakeOption } from "../data/demoData";

type IntakeProps = {
  onContinue: () => void;
};

type OptionGroupProps = {
  title: string;
  options: readonly IntakeOption[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

function OptionGroup({ title, options, selectedId, onSelect }: OptionGroupProps) {
  return (
    <section role="group" aria-label={title} className="space-y-3">
      <h2 className="text-base font-semibold text-night-blue">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = option.id === selectedId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect?.(option.id)}
              className={`min-h-12 rounded-[18px] border px-3 py-3 text-left text-sm font-medium leading-5 transition ${
                isSelected
                  ? "border-dawn-orange bg-dawn-orange/15 text-night-blue"
                  : "border-soft-gold/25 bg-cream/70 text-muted-text"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function Intake({ onContinue }: IntakeProps) {
  const [selectedConcern, setSelectedConcern] = useState(demoData.intake.concerns[0].id);

  return (
    <div className="flex flex-1 flex-col">
      <section className="mb-6">
        <p className="text-sm font-medium text-dawn-orange">Intake</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-night-blue">
          当前状态了解
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-text">
          先快速标记你今天的起点，One Day 会据此生成今天的 3+3 行动卡。
        </p>
      </section>

      <div className="flex-1 space-y-6">
        <OptionGroup
          title="当前最大困扰"
          options={demoData.intake.concerns}
          selectedId={selectedConcern}
          onSelect={setSelectedConcern}
        />
        <OptionGroup title="当前状态" options={demoData.intake.currentState} />
        <OptionGroup title="14 天后希望看到的变化" options={demoData.intake.desiredChanges} />
      </div>

      <PrimaryButton onClick={onContinue} className="mt-8">
        {demoData.intake.cta}
      </PrimaryButton>
    </div>
  );
}
