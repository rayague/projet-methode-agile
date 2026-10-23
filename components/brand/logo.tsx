import { useId } from "react";
import { cn } from "@/lib/utils";

export function Logo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gradientId = `logo-gradient-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const glowId = `logo-glow-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn(
        "shrink-0 drop-shadow-[0_0_16px_var(--accent-glow)]",
        className,
      )}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="6"
          y1="4"
          x2="42"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
        <radialGradient
          id={glowId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(24 24) rotate(90) scale(22)"
        >
          <stop stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="var(--bg-elevated)" />
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="14"
        fill={`url(#${glowId})`}
      />
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="13.5"
        stroke={`url(#${gradientId})`}
        strokeOpacity="0.65"
      />
      <path
        d="M15.5 15.5L32.5 32.5"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M32.5 15.5L15.5 32.5"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      <circle cx="24" cy="24" r="2.4" fill="white" fillOpacity="0.92" />
    </svg>
  );
}
