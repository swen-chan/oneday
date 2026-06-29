import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
};

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7e8_0%,#faf6ef_45%,#efe3d3_100%)] px-4 py-6 font-sans text-night-blue sm:px-6 sm:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[390px] flex-col overflow-hidden rounded-[24px] border border-soft-gold/20 bg-warm-white p-6 shadow-[0_24px_80px_rgba(31,42,68,0.12)] sm:min-h-[760px]">
        {children}
      </section>
    </main>
  );
}
