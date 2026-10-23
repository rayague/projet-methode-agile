"use client";

import {
  Layers,
  RefreshCw,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useChat } from "@/hooks/use-chat-store";
import { SUGGESTIONS } from "@/lib/seed";
import { greeting } from "@/lib/utils";

const icons: Record<(typeof SUGGESTIONS)[number]["icon"], LucideIcon> = {
  sparkles: Sparkles,
  layers: Layers,
  refresh: RefreshCw,
  target: Target,
};

export function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (prompt: string) => void;
}) {
  const { settings } = useChat();
  const firstName = settings.displayName.split(" ")[0];

  return (
    <div className="animate-rise mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 py-12">
      <h2 className="text-balance text-center text-2xl font-medium tracking-tight text-[var(--text)] sm:text-[28px]">
        {greeting()}
        {firstName ? (
          <>
            , <span className="accent-text">{firstName}</span>
          </>
        ) : null}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Que construit-on aujourd’hui ?
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = icons[suggestion.icon];
          return (
            <button
              key={suggestion.title}
              type="button"
              onClick={() => onSuggestion(suggestion.prompt)}
              className="focus-ring flex items-center gap-2 rounded-full border border-[var(--border)] px-3.5 py-2 text-[13px] text-[var(--muted)] transition-colors hover:border-[var(--border-strong)] hover:bg-white/[0.04] hover:text-[var(--text)]"
            >
              <Icon className="size-3.5 text-[var(--accent)]" />
              {suggestion.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
