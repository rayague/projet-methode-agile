import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "right" | "left";

const sideClasses: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
};

export function Tooltip({
  label,
  side = "top",
  children,
  className,
}: {
  label: string;
  side?: TooltipSide;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[120] hidden whitespace-nowrap rounded-lg border border-[var(--border)] bg-[#12121c]/95 px-2 py-1 text-[11px] font-medium text-[var(--text)] opacity-0 shadow-xl transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 sm:block",
          sideClasses[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
