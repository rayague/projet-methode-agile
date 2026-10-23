import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "accent-gradient text-white shadow-[0_10px_30px_-10px_var(--accent-glow)] hover:brightness-110 active:brightness-95",
  secondary:
    "glass text-[var(--text)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]",
  ghost:
    "text-[var(--muted)] hover:bg-white/[0.06] hover:text-[var(--text)]",
  outline:
    "border border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:bg-white/[0.05]",
  danger:
    "border border-[rgba(251,113,133,0.25)] bg-[rgba(251,113,133,0.12)] text-[#fecdd3] hover:bg-[rgba(251,113,133,0.2)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-2 rounded-xl px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-2xl px-5 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "secondary", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "focus-ring inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
