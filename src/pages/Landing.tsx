import { PrimaryButton } from "../components/Button";
import { demoData } from "../data/demoData";

type LandingProps = {
  onStart: () => void;
};

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col justify-center">
        <div className="mb-8 inline-flex w-fit items-center rounded-full bg-dawn-orange/15 px-4 py-2 text-sm font-semibold text-dawn-orange">
          Day {demoData.currentDay} / {demoData.totalDays}
        </div>

        <p className="text-sm font-medium text-muted-text">One Day</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-night-blue">
          {demoData.productName}
        </h1>
        <h2 className="mt-5 text-2xl font-semibold leading-snug text-night-blue">
          {demoData.landing.headline}
        </h2>
        <p className="mt-4 text-base leading-7 text-muted-text">{demoData.landing.subtitle}</p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {demoData.landing.valueCards.map((value) => (
            <div
              key={value}
              className="flex min-h-20 items-center justify-center rounded-[20px] border border-soft-gold/25 bg-cream/80 px-2 text-center text-sm font-semibold leading-5 text-night-blue"
            >
              {value}
            </div>
          ))}
        </div>
      </section>

      <PrimaryButton onClick={onStart} className="mt-8">
        {demoData.landing.cta}
      </PrimaryButton>
    </div>
  );
}
