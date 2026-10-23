"use client";

import { Check, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-projects";
import type { Synthesis, SynthesisItem } from "@/lib/types";
import { cn, focusComposer } from "@/lib/utils";

function Section({ title, items }: { title: string; items: SynthesisItem[] }) {
  return (
    <section>
      <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--faint)]">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="mt-1.5 text-[13px] italic text-[var(--faint)]">Non précisé</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex gap-2 text-[13px] leading-6 text-[var(--text)]">
              <span className="mt-[3px] h-fit shrink-0 rounded-md bg-white/[0.06] px-1.5 font-mono text-[10px] leading-[18px] text-[var(--muted)]">
                {item.id}
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * One version of the synthesis. Only the current version, while the
 * project is in the synthesis phase, carries the review actions.
 */
export function SynthesisCard({ synthesis, current }: { synthesis: Synthesis; current: boolean }) {
  const { activeProject, busy, validateSynthesis, reopenSynthesis } = useProjects();
  const validated = !!activeProject?.synthesisValidated;
  const reviewing = current && activeProject?.phase === "synthesis";

  return (
    <div
      className={cn(
        "mt-3 rounded-2xl border p-4 sm:p-5",
        current
          ? "border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(14,14,24,0.85)]"
          : "border-[var(--border)] bg-[rgba(14,14,24,0.5)] opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-[var(--text)]">Synthèse du besoin</h3>
        {current && validated ? (
          <span className="flex items-center gap-1 rounded-full bg-[rgba(52,211,153,0.12)] px-2 py-0.5 text-[11px] text-[var(--success)]">
            <Check className="size-3" /> Validée
          </span>
        ) : !current ? (
          <span className="text-[11px] text-[var(--faint)]">Version précédente</span>
        ) : null}
      </div>

      <p className="mt-3 text-[13px] leading-6 text-[var(--muted)]">{synthesis.contexte}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Section title="Objectifs" items={synthesis.objectifs} />
        <Section title="Utilisateurs" items={synthesis.utilisateurs} />
        <Section title="Fonctionnalités" items={synthesis.fonctionnalites} />
        <Section title="Contraintes" items={synthesis.contraintes} />
      </div>

      {reviewing ? (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
          {validated ? (
            <Button variant="ghost" size="sm" onClick={reopenSynthesis} disabled={!!busy}>
              <PencilLine className="size-3.5" /> Modifier la synthèse
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={focusComposer} disabled={!!busy}>
                <PencilLine className="size-3.5" /> Corriger
              </Button>
              <Button variant="primary" size="sm" onClick={validateSynthesis} disabled={!!busy}>
                <Check className="size-3.5" /> Valider la synthèse
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
