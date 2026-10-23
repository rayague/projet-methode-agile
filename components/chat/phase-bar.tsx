"use client";

import type { ReactNode } from "react";
import { Check, FileText, LayoutList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-projects";
import { THEMES, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

function Working({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-[12px] text-[var(--muted)]" role="status">
      <Loader2 className="size-3.5 animate-spin text-[var(--accent)]" />
      {label}
    </p>
  );
}

/** What the assistant has understood, and the next step once it is allowed. */
export function PhaseBar({ project }: { project: Project }) {
  const { busy, progress, generateSynthesis, generateBacklog, setView } = useProjects();

  let content: ReactNode = null;

  if (busy === "synthesis") {
    content = <Working label="Rédaction de la synthèse…" />;
  } else if (busy === "backlog") {
    content = (
      <Working
        label={`Génération du backlog… ${progress ? `${progress} user stor${progress > 1 ? "ies" : "y"} rédigée${progress > 1 ? "s" : ""}` : "analyse de la synthèse"}`}
      />
    );
  } else if (project.phase === "discovery") {
    const coverage = project.coverage;
    content = (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ul className="flex flex-1 flex-wrap items-center gap-1.5" aria-label="Compréhension du besoin">
          {THEMES.map((theme) => {
            const covered = !!coverage?.themes[theme.key];
            return (
              <li
                key={theme.key}
                title={theme.required ? "Thème nécessaire à la synthèse" : "Thème facultatif"}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                  covered
                    ? "border-[rgba(52,211,153,0.3)] text-[var(--success)]"
                    : "border-[var(--border)] text-[var(--faint)]",
                )}
              >
                {covered ? <Check className="size-3" /> : null}
                {theme.label}
                {theme.required && !covered ? <span aria-hidden>*</span> : null}
              </li>
            );
          })}
        </ul>
        {coverage?.ready ? (
          <Button variant="primary" size="sm" onClick={generateSynthesis} disabled={!!busy}>
            <FileText className="size-3.5" /> Générer la synthèse
          </Button>
        ) : null}
      </div>
    );
  } else if (project.phase === "synthesis") {
    content = project.synthesisValidated ? (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[var(--muted)]">Synthèse validée : le backlog peut être généré.</p>
        <Button variant="primary" size="sm" onClick={generateBacklog} disabled={!!busy}>
          <LayoutList className="size-3.5" /> Générer le backlog
        </Button>
      </div>
    ) : (
      <p className="text-[12px] text-[var(--muted)]">
        Relisez la synthèse. Pour la corriger, écrivez la précision ci-dessous ; sinon, validez-la.
      </p>
    );
  } else if (project.phase === "backlog") {
    content = (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[var(--muted)]">
          Demandez une modification : ajouter, modifier, supprimer ou découper une story.
        </p>
        <Button variant="outline" size="sm" onClick={() => setView("backlog")}>
          <LayoutList className="size-3.5" /> Voir le backlog
        </Button>
      </div>
    );
  }

  if (!content) return null;
  return <div className="mx-auto w-full max-w-3xl px-4 pb-2 sm:px-6">{content}</div>;
}
