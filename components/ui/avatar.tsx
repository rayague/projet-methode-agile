import { cn, initials } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

const presenceColors = {
  online: "bg-[var(--success)]",
  away: "bg-[var(--warning)]",
  focus: "bg-[var(--accent)]",
};

export function Avatar({
  name,
  size = "md",
  presence,
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  presence?: keyof typeof presenceColors;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] font-semibold uppercase tracking-wide text-white shadow-[0_6px_18px_-6px_var(--accent-glow)]",
          sizes[size],
        )}
      >
        {initials(name)}
      </span>
      {presence ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--bg-elevated)]",
            presenceColors[presence],
          )}
        />
      ) : null}
    </span>
  );
}
