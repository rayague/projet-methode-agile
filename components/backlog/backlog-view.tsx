"use client";

import { Fragment, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  History,
  Loader2,
  RotateCcw,
  Scissors,
} from "lucide-react";
import { Composer } from "@/components/chat/composer";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-projects";
import {
  backlogStats,
  exportFilename,
  formatStory,
  givenText,
  needsSplit,
  toCSV,
  toJSON,
  toMarkdown,
} from "@/lib/backlog";
import type { Priority, Project, Story } from "@/lib/types";
import { cn, downloadFile, formatDateTime } from "@/lib/utils";

const PRIORITY_STYLE: Record<Priority, string> = {
  Must: "border-[rgba(251,113,133,0.35)] text-[#fda4af]",
  Should: "border-[rgba(251,191,36,0.35)] text-[#fcd34d]",
  Could: "border-[rgba(34,211,238,0.35)] text-[#67e8f9]",
  "Won't": "border-[var(--border-strong)] text-[var(--faint)]",
};

const EXPORTS = [
  { label: "Excel (CSV)", ext: "csv", type: "text/csv;charset=utf-8", build: toCSV },
  { label: "Markdown", ext: "md", type: "text/markdown;charset=utf-8", build: toMarkdown },
  { label: "JSON", ext: "json", type: "application/json", build: toJSON },
] as const;

function Stat({ value, label, warn = false }: { value: number; label: string; warn?: boolean }) {
  return (
    <div className="min-w-20">
      <p className={cn("text-xl font-medium tabular-nums", warn ? "text-[#fcd34d]" : "text-[var(--text)]")}>
        {value}
      </p>
      <p className="text-[11px] text-[var(--faint)]">{label}</p>
    </div>
  );
}

function StoryRow({
  story,
  open,
  highlighted,
  sourceText,
  onToggle,
}: {
  story: Story;
  open: boolean;
  highlighted: boolean;
  sourceText: Map<string, string>;
  onToggle: () => void;
}) {
  const archived = story.statut === "archivee";
  const split = !archived && needsSplit(story);
  return (
    <Fragment>
      <tr
        onClick={onToggle}
        className={cn(
          "cursor-pointer border-t border-[var(--border)] align-top transition-colors hover:bg-white/[0.025]",
          highlighted && "bg-[rgba(var(--accent-rgb),0.09)]",
          archived && "opacity-50",
        )}
      >
        <td className="py-3 pl-4 pr-2">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`Critères d’acceptation de ${story.id}`}
            className="focus-ring flex items-center gap-1 rounded font-mono text-[12px] text-[var(--muted)]"
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            {story.id}
          </button>
        </td>
        <td className="py-3 pr-4">
          <p className={cn("text-[13px] font-medium text-[var(--text)]", archived && "line-through")}>
            {story.titre}
          </p>
          <p className="mt-0.5 text-[13px] leading-6 text-[var(--muted)]">
            {formatStory(story)}
          </p>
          {archived && story.note ? (
            <p className="mt-1 text-[11px] text-[var(--faint)]">Archivée · {story.note}</p>
          ) : null}
        </td>
        <td className="py-3 pr-4">
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", PRIORITY_STYLE[story.priorite])}>
            {story.priorite}
          </span>
        </td>
        <td className="py-3 pr-4">
          <span className={cn("text-[13px] tabular-nums", split ? "text-[#fcd34d]" : "text-[var(--text)]")}>
            {story.estimation}
          </span>
          {split ? (
            <span className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] text-[#fcd34d]">
              <Scissors className="size-3" /> à découper
            </span>
          ) : null}
        </td>
        <td className="py-3 pr-4">
          <span className="flex flex-wrap gap-1">
            {story.sources.map((source) => (
              <span
                key={source}
                title={sourceText.get(source)}
                className="rounded-md bg-white/[0.06] px-1.5 font-mono text-[10px] leading-[18px] text-[var(--muted)]"
              >
                {source}
              </span>
            ))}
          </span>
        </td>
      </tr>
      {open ? (
        <tr className={cn(highlighted && "bg-[rgba(var(--accent-rgb),0.09)]", archived && "opacity-50")}>
          <td />
          <td colSpan={4} className="pb-4 pr-4">
            <ol className="space-y-2">
              {story.criteres.map((criterion, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2 font-mono text-[12px] leading-5 text-[var(--muted)]"
                >
                  <span className="text-[var(--accent)]">Étant donné</span>{" "}
                  {givenText(criterion).replace(/^Étant donné /, "")}
                  <br />
                  <span className="text-[var(--accent)]">Quand</span> {criterion.quand}
                  <br />
                  <span className="text-[var(--accent)]">Alors</span> {criterion.alors}
                </li>
              ))}
            </ol>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function HistoryPanel({ project }: { project: Project }) {
  const { restoreVersion, busy } = useProjects();
  const latest = project.history.at(-1)?.version;
  return (
    <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[rgba(14,14,24,0.85)] p-4">
      <h3 className="text-sm font-medium text-[var(--text)]">Historique des versions</h3>
      <ol className="mt-3 space-y-3">
        {[...project.history].reverse().map((entry) => (
          <li key={entry.version} className="flex gap-3 text-[13px]">
            <span className="mt-0.5 h-fit rounded-md bg-white/[0.06] px-1.5 font-mono text-[11px] text-[var(--muted)]">
              v{entry.version}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[var(--text)]">{entry.label}</p>
              <p className="text-[11px] text-[var(--faint)]">{formatDateTime(entry.createdAt)}</p>
              <ul className="mt-1 space-y-0.5 text-[12px] text-[var(--muted)]">
                {entry.changes.map((change, index) => (
                  <li key={index}>· {change}</li>
                ))}
              </ul>
            </div>
            {entry.version !== latest ? (
              <Button variant="ghost" size="sm" onClick={() => restoreVersion(entry.version)} disabled={!!busy}>
                <RotateCcw className="size-3.5" /> Restaurer
              </Button>
            ) : (
              <span className="text-[11px] text-[var(--success)]">Actuelle</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function BacklogView() {
  const { activeProject: project, busy, lastEdit, touched } = useProjects();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const sourceText = useMemo(() => {
    const synthesis = project?.synthesis;
    if (!synthesis) return new Map<string, string>();
    return new Map(
      [
        ...synthesis.objectifs,
        ...synthesis.utilisateurs,
        ...synthesis.fonctionnalites,
        ...synthesis.contraintes,
      ].map((item) => [item.id, item.text]),
    );
  }, [project?.synthesis]);

  if (!project?.backlog) return null;
  const backlog = project.backlog;
  const stats = backlogStats(backlog);
  const archivedCount = backlog.stories.length - stats.stories;
  const visible = backlog.stories.filter((story) => showArchived || story.statut === "active");
  const allOpen = visible.length > 0 && visible.every((story) => expanded.has(story.id));

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll-area min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-6">
              <Stat value={stats.epics} label="epics" />
              <Stat value={stats.stories} label="user stories" />
              <Stat value={stats.points} label="points" />
              <Stat value={stats.toSplit} label="à découper" warn={stats.toSplit > 0} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={showHistory ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowHistory((value) => !value)}
              >
                <History className="size-3.5" /> v{project.history.at(-1)?.version ?? 1}
              </Button>
              {EXPORTS.map((format) => (
                <Button
                  key={format.ext}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadFile(exportFilename(project, format.ext), format.build(project), format.type)
                  }
                >
                  <Download className="size-3.5" /> {format.label}
                </Button>
              ))}
            </div>
          </div>

          {lastEdit ? (
            <div className="mt-4 rounded-2xl border border-[rgba(var(--accent-rgb),0.3)] bg-[rgba(14,14,24,0.85)] px-4 py-3 text-[13px]">
              <p className="text-[var(--text)]">{lastEdit.reply}</p>
              {lastEdit.changes.length ? (
                <ul className="mt-1.5 space-y-0.5 text-[12px] text-[var(--muted)]">
                  {lastEdit.changes.map((change, index) => (
                    <li key={index}>· {change}</li>
                  ))}
                </ul>
              ) : null}
              {lastEdit.warnings.map((warning, index) => (
                <p key={index} className="mt-1 flex items-center gap-1.5 text-[12px] text-[#fcd34d]">
                  <AlertTriangle className="size-3.5" /> {warning}
                </p>
              ))}
            </div>
          ) : null}

          {showHistory ? <HistoryPanel project={project} /> : null}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 text-[12px]">
            {archivedCount > 0 ? (
              <label className="flex cursor-pointer items-center gap-1.5 text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Stories archivées ({archivedCount})
              </label>
            ) : null}
            <button
              type="button"
              onClick={() =>
                setExpanded(allOpen ? new Set() : new Set(visible.map((story) => story.id)))
              }
              className="focus-ring rounded-lg px-2 py-1 text-[var(--muted)] hover:text-[var(--text)]"
            >
              {allOpen ? "Masquer les critères" : "Afficher tous les critères"}
            </button>
          </div>

          {backlog.epics.map((epic) => {
            const stories = visible.filter((story) => story.epicId === epic.id);
            if (stories.length === 0) return null;
            const points = stories
              .filter((story) => story.statut === "active")
              .reduce((sum, story) => sum + story.estimation, 0);
            return (
              <section
                key={epic.id}
                className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(10,10,18,0.8)]"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[var(--text)]">
                      <span className="mr-2 font-mono text-[12px] text-[var(--accent)]">{epic.id}</span>
                      {epic.titre}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-[var(--muted)]">{epic.description}</p>
                  </div>
                  <p className="text-[11px] text-[var(--faint)]">
                    {stories.length} stor{stories.length > 1 ? "ies" : "y"} · {points} pts
                  </p>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-t border-[var(--border)] text-[11px] text-[var(--faint)]">
                        <th className="w-24 py-2 pl-4 font-normal">ID</th>
                        <th className="py-2 font-normal">User story</th>
                        <th className="w-24 py-2 font-normal">Priorité</th>
                        <th className="w-28 py-2 font-normal">Estimation</th>
                        <th className="w-32 py-2 font-normal">Sources</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stories.map((story) => (
                        <StoryRow
                          key={story.id}
                          story={story}
                          open={expanded.has(story.id)}
                          highlighted={touched.includes(story.id)}
                          sourceText={sourceText}
                          onToggle={() => toggle(story.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 shrink-0 pt-2">
        {busy === "edit" ? (
          <p className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 pb-2 text-[12px] text-[var(--muted)] sm:px-6" role="status">
            <Loader2 className="size-3.5 animate-spin text-[var(--accent)]" /> Modification du backlog…
          </p>
        ) : null}
        <Composer placeholder="Ex. : découpe la US-03 en deux, ajoute une story pour l’export PDF…" />
      </div>
    </div>
  );
}
