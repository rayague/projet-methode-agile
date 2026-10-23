import {
  FIBONACCI,
  PRIORITIES,
  SPLIT_THRESHOLD,
  type Backlog,
  type Criterion,
  type Epic,
  type Priority,
  type Project,
  type Story,
  type Synthesis,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Shapes returned by the model (validated here, never trusted as is)  */
/* ------------------------------------------------------------------ */

export interface RawStory {
  epicId?: string;
  titre: string;
  enTantQue: string;
  jeVeux: string;
  afinDe: string;
  priorite: string;
  estimation: number;
  criteres: Criterion[];
  sources: string[];
}

export interface RawBacklog {
  epics: {
    titre: string;
    description: string;
    sources: string[];
    stories: RawStory[];
  }[];
}

export type EditAction =
  | "ajouter"
  | "modifier"
  | "supprimer"
  | "decouper"
  | "ajouterEpic";

export interface RawOperation {
  action: EditAction;
  /** Story ID for modifier / supprimer / decouper. */
  cible: string;
  /** New epic for ajouterEpic. */
  epic?: { titre: string; description: string };
  stories: RawStory[];
  raison: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const storyId = (n: number) => `US-${String(n).padStart(2, "0")}`;
export const epicId = (n: number) => `EP-${String(n).padStart(2, "0")}`;

export function snapFibonacci(value: number): number {
  if (!Number.isFinite(value) || value <= 1) return 1;
  return FIBONACCI.reduce((best, step) =>
    Math.abs(step - value) < Math.abs(best - value) ? step : best,
  );
}

export const needsSplit = (story: Story) => story.estimation > SPLIT_THRESHOLD;

/** Comparison key used to detect duplicate stories. */
export function storyKey(story: Pick<Story, "enTantQue" | "jeVeux">) {
  return `${story.enTantQue} ${story.jeVeux}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function synthesisIds(synthesis: Synthesis): Set<string> {
  return new Set(
    [
      ...synthesis.objectifs,
      ...synthesis.utilisateurs,
      ...synthesis.fonctionnalites,
      ...synthesis.contraintes,
    ].map((item) => item.id),
  );
}

const clean = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

/** The model sometimes repeats the template words: they are added on display. */
const stripLead = (value: string, lead: RegExp) =>
  clean(value).replace(lead, "").trim();

function toPriority(value: string): Priority {
  const match = PRIORITIES.find(
    (priority) => priority.toLowerCase() === clean(value).toLowerCase(),
  );
  return match ?? "Should";
}

function toStory(
  raw: RawStory,
  id: string,
  epic: string,
  valid: Set<string>,
): Story {
  return {
    id,
    epicId: epic,
    titre: clean(raw.titre),
    enTantQue: stripLead(raw.enTantQue, /^en tant qu[e']\s*/i),
    jeVeux: stripLead(raw.jeVeux, /^je veux\s*/i),
    afinDe: stripLead(raw.afinDe, /^afin d[e']\s*/i),
    priorite: toPriority(raw.priorite),
    estimation: snapFibonacci(Number(raw.estimation)),
    criteres: (raw.criteres ?? [])
      .map((criterion) => ({
        etantDonne: stripLead(criterion.etantDonne, /^(étant donné|etant donne)\s*(que|qu')?\s*/i),
        quand: stripLead(criterion.quand, /^quand\s*/i),
        alors: stripLead(criterion.alors, /^alors\s*/i),
      }))
      .filter((criterion) => criterion.quand && criterion.alors),
    sources: [...new Set((raw.sources ?? []).map(clean))].filter((source) =>
      valid.has(source),
    ),
    statut: "active",
  };
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Turns the model output into a backlog with guaranteed properties: unique
 * sequential IDs, every story attached to an epic, Fibonacci estimates,
 * sources limited to real synthesis items, no duplicates.
 */
export function buildBacklog(raw: RawBacklog, synthesis: Synthesis) {
  const valid = synthesisIds(synthesis);
  const epics: Epic[] = [];
  const stories: Story[] = [];
  const seen = new Set<string>();
  const warnings: string[] = [];
  let nextStory = 1;
  let nextEpic = 1;

  for (const rawEpic of raw.epics ?? []) {
    const id = epicId(nextEpic++);
    epics.push({
      id,
      titre: clean(rawEpic.titre),
      description: clean(rawEpic.description),
      sources: (rawEpic.sources ?? []).map(clean).filter((s) => valid.has(s)),
    });
    for (const rawStory of rawEpic.stories ?? []) {
      const story = toStory(rawStory, storyId(nextStory), id, valid);
      if (!story.jeVeux) continue;
      const key = storyKey(story);
      if (seen.has(key)) {
        warnings.push(`Doublon ignoré : « ${story.titre} »`);
        continue;
      }
      seen.add(key);
      stories.push(story);
      nextStory++;
    }
  }

  // An epic without any story carries nothing for the team.
  const used = new Set(stories.map((story) => story.epicId));
  const backlog: Backlog = {
    epics: epics.filter((epic) => used.has(epic.id)),
    stories,
    nextStory,
    nextEpic,
  };
  return { backlog, warnings };
}

/* ------------------------------------------------------------------ */
/* Natural-language edits                                              */
/* ------------------------------------------------------------------ */

/**
 * Applies the operations decided by the model. Archived stories keep their
 * ID and new stories take the next free number, so the other stories are
 * never renumbered.
 */
export function applyOperations(
  current: Backlog,
  operations: RawOperation[],
  synthesis: Synthesis,
) {
  const valid = synthesisIds(synthesis);
  const backlog: Backlog = {
    epics: [...current.epics],
    stories: current.stories.map((story) => ({ ...story })),
    nextStory: current.nextStory,
    nextEpic: current.nextEpic,
  };
  const changes: string[] = [];
  const warnings: string[] = [];
  const touched: string[] = [];

  const activeStory = (id: string) =>
    backlog.stories.find(
      (story) =>
        story.statut === "active" &&
        story.id.toUpperCase() === clean(id).toUpperCase(),
    );
  const epicExists = (id: string | undefined) =>
    backlog.epics.some((epic) => epic.id === clean(id));
  const isDuplicate = (story: Story, ignoreId?: string) => {
    const key = storyKey(story);
    return backlog.stories.some(
      (other) =>
        other.statut === "active" &&
        other.id !== ignoreId &&
        storyKey(other) === key,
    );
  };
  const addStories = (raws: RawStory[], fallbackEpic: string) => {
    const created: string[] = [];
    for (const raw of raws) {
      const epic = epicExists(raw.epicId) ? clean(raw.epicId) : fallbackEpic;
      const story = toStory(raw, storyId(backlog.nextStory), epic, valid);
      if (!story.jeVeux) continue;
      if (isDuplicate(story)) {
        warnings.push(`Doublon ignoré : « ${story.titre} »`);
        continue;
      }
      backlog.stories.push(story);
      backlog.nextStory++;
      created.push(story.id);
      touched.push(story.id);
    }
    return created;
  };

  for (const op of operations) {
    const reason = clean(op.raison);
    switch (op.action) {
      case "ajouterEpic": {
        if (!op.epic?.titre) break;
        const id = epicId(backlog.nextEpic++);
        backlog.epics.push({
          id,
          titre: clean(op.epic.titre),
          description: clean(op.epic.description),
          sources: [],
        });
        const created = addStories(
          op.stories.map((story) => ({ ...story, epicId: id })),
          id,
        );
        changes.push(
          `${id} « ${clean(op.epic.titre)} » créé${created.length ? ` avec ${created.join(", ")}` : ""}`,
        );
        break;
      }
      case "ajouter": {
        const fallback = epicExists(op.cible)
          ? clean(op.cible)
          : (backlog.epics[0]?.id ?? "");
        if (!fallback) {
          warnings.push("Aucun epic pour rattacher la story.");
          break;
        }
        const created = addStories(op.stories, fallback);
        if (created.length) changes.push(`${created.join(", ")} ajoutée(s)`);
        break;
      }
      case "modifier": {
        const target = activeStory(op.cible);
        const raw = op.stories[0];
        if (!target || !raw) {
          warnings.push(`Story introuvable : ${op.cible}`);
          break;
        }
        const epic = epicExists(raw.epicId) ? clean(raw.epicId) : target.epicId;
        const updated = toStory(raw, target.id, epic, valid);
        if (isDuplicate(updated, target.id)) {
          warnings.push(`${target.id} : la modification créerait un doublon.`);
          break;
        }
        Object.assign(target, updated);
        touched.push(target.id);
        changes.push(`${target.id} modifiée${reason ? ` (${reason})` : ""}`);
        break;
      }
      case "supprimer": {
        const target = activeStory(op.cible);
        if (!target) {
          warnings.push(`Story introuvable : ${op.cible}`);
          break;
        }
        target.statut = "archivee";
        target.note = `Supprimée${reason ? ` : ${reason}` : ""}`;
        changes.push(`${target.id} supprimée (archivée)`);
        break;
      }
      case "decouper": {
        const target = activeStory(op.cible);
        if (!target) {
          warnings.push(`Story introuvable : ${op.cible}`);
          break;
        }
        if (op.stories.length < 2) {
          warnings.push(`${target.id} : un découpage demande au moins deux stories.`);
          break;
        }
        // The original leaves the active set first so its parts are not
        // mistaken for duplicates of it.
        target.statut = "archivee";
        const created = addStories(op.stories, target.epicId);
        if (created.length < 2) {
          target.statut = "active";
          backlog.stories = backlog.stories.filter(
            (story) => !created.includes(story.id),
          );
          backlog.nextStory -= created.length;
          touched.splice(touched.length - created.length);
          warnings.push(`${target.id} : découpage incomplet, rien n’a changé.`);
          break;
        }
        target.note = `Découpée en ${created.join(", ")}`;
        changes.push(`${target.id} découpée en ${created.join(", ")} (originale archivée)`);
        break;
      }
    }
  }

  return { backlog, changes, warnings, touched };
}

/* ------------------------------------------------------------------ */
/* Figures and exports                                                 */
/* ------------------------------------------------------------------ */

export function backlogStats(backlog: Backlog) {
  const active = backlog.stories.filter((story) => story.statut === "active");
  return {
    epics: backlog.epics.length,
    stories: active.length,
    points: active.reduce((sum, story) => sum + story.estimation, 0),
    toSplit: active.filter(needsSplit).length,
  };
}

/** French elision: « que étudiant » → « qu’étudiant », « de accéder » → « d’accéder ». */
export function elide(word: "que" | "de", next: string) {
  return /^[aeiouyhàâäéèêëîïôöûü]/i.test(next.trim())
    ? `${word.slice(0, -1)}’${next.trim()}`
    : `${word} ${next.trim()}`;
}

export const formatStory = (story: Story) =>
  `En tant ${elide("que", story.enTantQue)}, je veux ${story.jeVeux}, afin ${elide("de", story.afinDe)}.`;

export const givenText = (criterion: Criterion) => `Étant donné ${elide("que", criterion.etantDonne)}`;

export const formatCriterion = (criterion: Criterion) =>
  `${givenText(criterion)}, quand ${criterion.quand}, alors ${criterion.alors}.`;

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "projet"
  );
}

export function exportFilename(project: Project, extension: string) {
  return `backlog-${slug(project.title)}.${extension}`;
}

/** CSV for Excel (French locale): « ; » separator, BOM, CRLF. */
export function toCSV(project: Project) {
  const backlog = project.backlog;
  if (!backlog) return "";
  const epicTitle = new Map(backlog.epics.map((epic) => [epic.id, epic.titre]));
  const cell = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;
  const header = [
    "ID",
    "Epic",
    "Titre",
    "User story",
    "Priorité",
    "Estimation (pts)",
    "À découper",
    "Critères d’acceptation (Gherkin)",
    "Sources",
  ];
  const rows = backlog.stories
    .filter((story) => story.statut === "active")
    .map((story) => [
      story.id,
      `${story.epicId} · ${epicTitle.get(story.epicId) ?? ""}`,
      story.titre,
      formatStory(story),
      story.priorite,
      story.estimation,
      needsSplit(story) ? "Oui" : "Non",
      story.criteres.map(formatCriterion).join("\n"),
      story.sources.join(", "),
    ]);
  return `﻿${[header, ...rows]
    .map((row) => row.map(cell).join(";"))
    .join("\r\n")}`;
}

export function toMarkdown(project: Project) {
  const { backlog, synthesis } = project;
  if (!backlog) return "";
  const stats = backlogStats(backlog);
  const lines: string[] = [
    `# Backlog — ${project.title}`,
    "",
    `${stats.epics} epics · ${stats.stories} user stories · ${stats.points} points`,
    "",
  ];
  if (synthesis) {
    const list = (title: string, items: Synthesis["objectifs"]) => {
      lines.push(`**${title}**`, "");
      items.forEach((item) => lines.push(`- ${item.id} — ${item.text}`));
      lines.push("");
    };
    lines.push("## Synthèse validée", "", synthesis.contexte, "");
    list("Objectifs", synthesis.objectifs);
    list("Utilisateurs", synthesis.utilisateurs);
    list("Fonctionnalités", synthesis.fonctionnalites);
    list("Contraintes", synthesis.contraintes);
  }
  for (const epic of backlog.epics) {
    const stories = backlog.stories.filter(
      (story) => story.epicId === epic.id && story.statut === "active",
    );
    if (stories.length === 0) continue;
    lines.push(`## ${epic.id} — ${epic.titre}`, "", epic.description, "");
    for (const story of stories) {
      lines.push(
        `### ${story.id} — ${story.titre}`,
        "",
        formatStory(story),
        "",
        `- Priorité : ${story.priorite}`,
        `- Estimation : ${story.estimation} pts${needsSplit(story) ? " — **à découper**" : ""}`,
        `- Sources : ${story.sources.join(", ") || "—"}`,
        "",
        "Critères d’acceptation :",
        "",
        "```gherkin",
        ...story.criteres.flatMap((criterion) => [
          givenText(criterion),
          `Quand ${criterion.quand}`,
          `Alors ${criterion.alors}`,
          "",
        ]),
        "```",
        "",
      );
    }
  }
  return lines.join("\n");
}

export function toJSON(project: Project) {
  return JSON.stringify(
    {
      projet: project.title,
      synthese: project.synthesis,
      backlog: project.backlog,
      historique: project.history.map(({ version, createdAt, label, changes }) => ({
        version,
        date: new Date(createdAt).toISOString(),
        label,
        changes,
      })),
    },
    null,
    2,
  );
}
