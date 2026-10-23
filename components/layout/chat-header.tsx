"use client";

import { Check, Menu } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useProjects } from "@/hooks/use-projects";
import type { Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: { phase: Phase; label: string }[] = [
  { phase: "discovery", label: "Découverte" },
  { phase: "synthesis", label: "Synthèse" },
  { phase: "backlog", label: "Backlog" },
];

export function ChatHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { activeProject, view, setView } = useProjects();
  const current = STEPS.findIndex((step) => step.phase === activeProject?.phase);
  const stories = activeProject?.backlog?.stories.filter((s) => s.statut === "active").length;

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 px-3 sm:px-5">
      <IconButton label="Ouvrir le menu" onClick={onOpenSidebar} className="lg:hidden">
        <Menu className="size-4.5" />
      </IconButton>

      <h1 className="min-w-0 flex-1 truncate text-sm text-[var(--muted)]">
        {activeProject?.title ?? ""}
      </h1>

      {activeProject ? (
        <ol aria-label="Étapes du projet" className="hidden items-center gap-1 md:flex">
          {STEPS.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={step.phase} className="flex items-center gap-1">
                {index > 0 ? <span className="h-px w-4 bg-[var(--border-strong)]" /> : null}
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]",
                    active
                      ? "bg-[rgba(var(--accent-rgb),0.14)] text-[var(--text)]"
                      : done
                        ? "text-[var(--muted)]"
                        : "text-[var(--faint)]",
                  )}
                >
                  {done ? (
                    <Check className="size-3 text-[var(--success)]" />
                  ) : (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        active ? "bg-[var(--accent)]" : "bg-[var(--faint)]",
                      )}
                    />
                  )}
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {activeProject?.backlog ? (
        <div role="tablist" className="flex rounded-xl border border-[var(--border)] p-0.5">
          {(
            [
              { id: "chat", label: "Conversation" },
              { id: "backlog", label: `Backlog · ${stories}` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={view === tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                "focus-ring rounded-lg px-2.5 py-1 text-[12px] transition-colors",
                view === tab.id
                  ? "bg-white/[0.08] text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
}
