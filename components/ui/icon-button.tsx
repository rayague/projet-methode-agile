import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

type IconButtonVariant = "ghost" | "glass" | "danger";

const variants: Record<IconButtonVariant, string> = {
  ghost:
    "text-[var(--muted)] hover:bg-white/[0.07] hover:text-[var(--text)]",
  glass:
    "glass text-[var(--muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
  danger:
    "text-[var(--muted)] hover:bg-[rgba(251,113,133,0.14)] hover:text-[#fda4af]",
};

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: IconButtonVariant;
  active?: boolean;
  tooltipSide?: "top" | "bottom" | "right" | "left";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function IconButton({
  label,
  variant = "ghost",
  active = false,
  tooltipSide = "top",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label} side={tooltipSide}>
      <button
        type={type}
        aria-label={label}
        aria-pressed={active || undefined}
        className={cn(
          "focus-ring inline-flex shrink-0 items-center justify-center rounded-xl transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
          size === "sm" ? "size-8" : "size-9",
          variants[variant],
          active &&
            "bg-[rgba(var(--accent-rgb),0.14)] text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.2)]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
}
