type ProgressHeaderProps = {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  label?: string;
};

export function ProgressHeader({
  currentStep,
  totalSteps,
  onBack,
  label = "One Day Demo",
}: ProgressHeaderProps) {
  return (
    <header className="mb-10 flex min-h-10 items-center justify-between gap-4 text-sm">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-soft-gold/40 px-4 py-2 font-medium text-night-blue transition hover:bg-cream"
        >
          返回
        </button>
      ) : (
        <span className="font-medium text-dawn-orange">{label}</span>
      )}

      <span aria-label="页面进度" className="font-medium text-muted-text">
        {currentStep} / {totalSteps}
      </span>
    </header>
  );
}
