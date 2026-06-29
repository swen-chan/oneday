import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const baseButtonClasses =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export function PrimaryButton({ children, className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseButtonClasses} bg-night-blue text-warm-white shadow-sm hover:bg-night-blue/95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseButtonClasses} border border-soft-gold/50 bg-warm-white text-night-blue hover:bg-cream ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
