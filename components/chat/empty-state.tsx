"use client";

import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-projects";

const STEPS = ["Décrivez votre projet", "Validez la synthèse", "Obtenez le backlog"];

/** Home page: one action, start a project. */
export function EmptyState() {
  const { newProject } = useProjects();

  return (
    <div className="animate-rise mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <h2 className="text-balance text-[28px] font-medium leading-tight tracking-tight text-[var(--text)] sm:text-[34px]">
        De votre idée au <span className="accent-text">backlog Scrum</span>
      </h2>
      <p className="mt-3 max-w-md text-balance text-sm leading-6 text-[var(--muted)]">
        Décrivez votre projet avec vos mots. XScrum AI clarifie votre besoin, puis
        génère epics, user stories, critères d’acceptation et estimations.
      </p>
      <Button variant="primary" size="lg" className="mt-8" onClick={newProject}>
        <SquarePen className="size-4" /> Nouveau projet
      </Button>
      <ol className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-[var(--faint)]">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-full border border-[var(--border-strong)] text-[10px]">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
