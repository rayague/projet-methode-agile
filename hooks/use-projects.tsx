"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { backlogStats } from "@/lib/backlog";
import { readEvents } from "@/lib/sse";
import { loadProjects, saveProjects } from "@/lib/storage";
import type {
  Backlog,
  BacklogVersion,
  ChatTurn,
  Coverage,
  Message,
  Project,
  Synthesis,
} from "@/lib/types";
import { uid } from "@/lib/utils";

export type Busy = "chat" | "synthesis" | "backlog" | "edit";
export type View = "chat" | "backlog";

export interface EditResult {
  reply: string;
  changes: string[];
  warnings: string[];
}

interface ProjectsContextValue {
  hydrated: boolean;
  projects: Project[];
  activeProject: Project | null;
  busy: Busy | null;
  /** Stories written so far while the backlog is generated. */
  progress: number;
  view: View;
  setView: (view: View) => void;
  /** Outcome of the last natural-language edit, and the stories it touched. */
  lastEdit: EditResult | null;
  touched: string[];
  newProject: () => void;
  selectProject: (id: string) => void;
  renameProject: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  deleteProject: (id: string) => void;
  send: (text: string) => void;
  generateSynthesis: () => void;
  validateSynthesis: () => void;
  reopenSynthesis: () => void;
  generateBacklog: () => void;
  restoreVersion: (version: number) => void;
  stop: () => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

const DEFAULT_TITLE = "Nouveau projet";

const WELCOME = `Bonjour, je suis **XScrum AI**. Je transforme votre idée en **backlog Scrum** exploitable par votre équipe.

1. **Décrivez votre projet** librement, avec vos mots : pas de formulaire.
2. Je vous pose quelques questions ciblées pour bien comprendre votre besoin.
3. Vous relisez et validez la **synthèse**, puis je génère le **backlog** : epics, user stories, critères d’acceptation et estimations.

Pour commencer, quel projet souhaitez-vous réaliser ?`;

const subscribeNoop = () => () => {};

const message = (
  role: Message["role"],
  content: string,
  extra: Partial<Message> = {},
): Message => ({
  id: uid("msg"),
  role,
  content,
  createdAt: Date.now(),
  status: "complete",
  kind: "text",
  ...extra,
});

/** Text turns of the conversation, as sent to the API. */
const turnsOf = (messages: Message[]): ChatTurn[] =>
  messages
    .filter((m) => (m.kind ?? "text") === "text" && m.status === "complete" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));

/** Turns since the backlog was generated: the context of an edit. */
const editTurnsOf = (messages: Message[]) => {
  const start = messages.findLastIndex((m) => m.kind === "backlog");
  return turnsOf(messages.slice(start + 1)).slice(-10);
};

async function postJson<T>(url: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Erreur ${response.status}`);
  return data;
}

const isAbort = (error: unknown) => (error as Error)?.name === "AbortError";
const errorText = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Une erreur est survenue.";

export function ProjectsProvider({ children }: { children: ReactNode }) {
  // false during SSR and hydration: the boot screen hides local data until then.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [projects, setProjects] = useState<Project[]>(() =>
    typeof window === "undefined" ? [] : loadProjects(),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<View>("chat");
  const [lastEdit, setLastEdit] = useState<EditResult | null>(null);
  const [touched, setTouched] = useState<string[]>([]);
  const projectsRef = useRef(projects);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    projectsRef.current = projects;
    // Streaming writes many small updates: save once the reply is done.
    if (hydrated && busy !== "chat") saveProjects(projects);
  }, [projects, hydrated, busy]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeId) ?? null,
    [projects, activeId],
  );

  const patch = useCallback((id: string, update: (project: Project) => Partial<Project>) => {
    setProjects((list) =>
      list.map((project) =>
        project.id === id ? { ...project, ...update(project), updatedAt: Date.now() } : project,
      ),
    );
  }, []);

  const addMessages = useCallback(
    (id: string, ...messages: Message[]) =>
      patch(id, (project) => ({ messages: [...project.messages, ...messages] })),
    [patch],
  );

  const patchMessage = useCallback(
    (id: string, messageId: string, update: (message: Message) => Partial<Message>) =>
      patch(id, (project) => ({
        messages: project.messages.map((m) => (m.id === messageId ? { ...m, ...update(m) } : m)),
      })),
    [patch],
  );

  const begin = useCallback((kind: Busy) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(kind);
    return controller;
  }, []);

  const end = useCallback((controller: AbortController) => {
    if (abortRef.current === controller) {
      abortRef.current = null;
      setBusy(null);
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ---------------------------- projects ---------------------------- */

  const createProject = useCallback(() => {
    const now = Date.now();
    const project: Project = {
      id: uid("prj"),
      title: DEFAULT_TITLE,
      createdAt: now,
      updatedAt: now,
      pinned: false,
      phase: "discovery",
      messages: [message("assistant", WELCOME)],
      coverage: null,
      synthesis: null,
      synthesisValidated: false,
      backlog: null,
      history: [],
    };
    setProjects((list) => [project, ...list]);
    setActiveId(project.id);
    setView("chat");
    setLastEdit(null);
    setTouched([]);
    return project;
  }, []);

  const newProject = useCallback(() => {
    abortRef.current?.abort();
    createProject();
  }, [createProject]);

  const selectProject = useCallback((id: string) => {
    abortRef.current?.abort();
    setActiveId(id);
    setView("chat");
    setLastEdit(null);
    setTouched([]);
  }, []);

  const renameProject = useCallback(
    (id: string, title: string) => {
      const clean = title.trim();
      if (clean) patch(id, () => ({ title: clean.slice(0, 80) }));
    },
    [patch],
  );

  const togglePin = useCallback(
    (id: string) => patch(id, (project) => ({ pinned: !project.pinned })),
    [patch],
  );

  const deleteProject = useCallback((id: string) => {
    if (id === activeId) abortRef.current?.abort();
    setProjects((list) => list.filter((project) => project.id !== id));
    setActiveId((current) => (current === id ? null : current));
  }, [activeId]);

  /* ---------------------------- discovery --------------------------- */

  const chatTurn = useCallback(
    async (project: Project, text: string) => {
      const user = message("user", text);
      const reply = message("assistant", "", { status: "streaming" });
      addMessages(project.id, user, reply);
      const controller = begin("chat");
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ turns: turnsOf([...project.messages, user]) }),
          signal: controller.signal,
        });
        await readEvents(response, (event) => {
          if (event.type === "analysis") {
            patch(project.id, (current) => ({
              coverage: event.coverage as Coverage,
              title:
                current.title === DEFAULT_TITLE && event.title ? event.title : current.title,
            }));
          } else if (event.type === "delta") {
            patchMessage(project.id, reply.id, (m) => ({ content: m.content + event.text }));
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        });
        patchMessage(project.id, reply.id, (m) =>
          m.content.trim()
            ? { status: "complete" }
            : { status: "error", content: "Aucune réponse reçue. Réessayez." },
        );
      } catch (error) {
        patchMessage(project.id, reply.id, (m) =>
          isAbort(error)
            ? { status: m.content.trim() ? "complete" : "error", content: m.content || "Réponse interrompue." }
            : { status: "error", content: errorText(error) },
        );
      } finally {
        end(controller);
      }
    },
    [addMessages, begin, end, patch, patchMessage],
  );

  /* ---------------------------- synthesis --------------------------- */

  const requestSynthesis = useCallback(
    async (project: Project, correction?: Message) => {
      const controller = begin("synthesis");
      const messages = correction ? [...project.messages, correction] : project.messages;
      if (correction) addMessages(project.id, correction);
      try {
        const { synthesis, changes } = await postJson<{ synthesis: Synthesis; changes: string }>(
          "/api/synthesis",
          { turns: turnsOf(messages), current: correction ? project.synthesis : null },
          controller.signal,
        );
        patch(project.id, () => ({
          phase: "synthesis",
          synthesis,
          synthesisValidated: false,
        }));
        addMessages(
          project.id,
          message(
            "assistant",
            correction
              ? `Synthèse mise à jour${changes ? ` : ${changes}` : "."}`
              : "Voici la synthèse de votre besoin. Relisez-la : corrigez ce qui ne va pas, puis validez-la pour générer le backlog.",
            { kind: "synthesis", synthesis },
          ),
        );
      } catch (error) {
        if (!isAbort(error)) {
          addMessages(project.id, message("assistant", errorText(error), { status: "error" }));
        }
      } finally {
        end(controller);
      }
    },
    [addMessages, begin, end, patch],
  );

  const generateSynthesis = useCallback(() => {
    const project = projectsRef.current.find((p) => p.id === activeId);
    if (project && !busy) void requestSynthesis(project);
  }, [activeId, busy, requestSynthesis]);

  const validateSynthesis = useCallback(() => {
    if (activeId) patch(activeId, () => ({ synthesisValidated: true }));
  }, [activeId, patch]);

  const reopenSynthesis = useCallback(() => {
    if (activeId) patch(activeId, () => ({ synthesisValidated: false }));
  }, [activeId, patch]);

  /* ----------------------------- backlog ---------------------------- */

  const generateBacklog = useCallback(async () => {
    const project = projectsRef.current.find((p) => p.id === activeId);
    if (!project?.synthesis || !project.synthesisValidated || busy) return;
    const controller = begin("backlog");
    setProgress(0);
    const started = Date.now();
    try {
      const response = await fetch("/api/backlog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ synthesis: project.synthesis }),
        signal: controller.signal,
      });
      let result: { backlog: Backlog; warnings: string[] } | null = null;
      await readEvents(response, (event) => {
        if (event.type === "progress") setProgress(event.stories);
        else if (event.type === "result") result = event.data as typeof result;
        else if (event.type === "error") throw new Error(event.message);
      });
      const generated = result as { backlog: Backlog; warnings: string[] } | null;
      if (!generated || generated.backlog.stories.length === 0) {
        throw new Error("Le backlog généré est vide. Réessayez.");
      }
      const stats = backlogStats(generated.backlog);
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      const summary = `${stats.epics} epics, ${stats.stories} user stories, ${stats.points} points`;
      const version: BacklogVersion = {
        version: 1,
        createdAt: Date.now(),
        label: "Génération initiale",
        changes: [summary, ...generated.warnings],
        backlog: generated.backlog,
      };
      patch(project.id, () => ({ phase: "backlog", backlog: generated.backlog, history: [version] }));
      addMessages(
        project.id,
        message(
          "assistant",
          `Backlog généré en ${seconds} s : ${summary}${stats.toSplit ? `, dont ${stats.toSplit} à découper` : ""}. Vous pouvez maintenant l’affiner en langage naturel, par exemple « découpe la US-03 en deux ».`,
          { kind: "backlog" },
        ),
      );
      setLastEdit(null);
      setTouched([]);
      setView("backlog");
    } catch (error) {
      if (!isAbort(error)) {
        addMessages(project.id, message("assistant", errorText(error), { status: "error" }));
      }
    } finally {
      end(controller);
    }
  }, [activeId, addMessages, begin, busy, end, patch]);

  const editBacklog = useCallback(
    async (project: Project, text: string) => {
      if (!project.backlog || !project.synthesis) return;
      const user = message("user", text);
      addMessages(project.id, user);
      const controller = begin("edit");
      try {
        const result = await postJson<EditResult & { backlog: Backlog; touched: string[] }>(
          "/api/backlog/edit",
          {
            turns: editTurnsOf([...project.messages, user]),
            synthesis: project.synthesis,
            backlog: project.backlog,
          },
          controller.signal,
        );
        if (result.changes.length > 0) {
          patch(project.id, (current) => ({
            backlog: result.backlog,
            history: [
              ...current.history,
              {
                version: (current.history.at(-1)?.version ?? 0) + 1,
                createdAt: Date.now(),
                label: text,
                changes: result.changes,
                backlog: result.backlog,
              },
            ],
          }));
        }
        const details = [...result.changes, ...result.warnings.map((w) => `⚠ ${w}`)];
        addMessages(
          project.id,
          message(
            "assistant",
            [result.reply, ...details.map((line) => `- ${line}`)].filter(Boolean).join("\n"),
          ),
        );
        setLastEdit({ reply: result.reply, changes: result.changes, warnings: result.warnings });
        setTouched(result.touched ?? []);
      } catch (error) {
        if (!isAbort(error)) {
          const text = errorText(error);
          addMessages(project.id, message("assistant", text, { status: "error" }));
          setLastEdit({ reply: text, changes: [], warnings: [] });
        }
      } finally {
        end(controller);
      }
    },
    [addMessages, begin, end, patch],
  );

  const restoreVersion = useCallback(
    (version: number) => {
      if (!activeId || busy) return;
      patch(activeId, (project) => {
        const target = project.history.find((entry) => entry.version === version);
        if (!target) return {};
        return {
          backlog: target.backlog,
          history: [
            ...project.history,
            {
              version: (project.history.at(-1)?.version ?? 0) + 1,
              createdAt: Date.now(),
              label: `Restauration de la v${version}`,
              changes: [`Retour à l’état de la v${version}`],
              backlog: target.backlog,
            },
          ],
        };
      });
      setLastEdit(null);
      setTouched([]);
    },
    [activeId, busy, patch],
  );

  /* ------------------------------ send ------------------------------ */

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      const project =
        projectsRef.current.find((p) => p.id === activeId) ?? createProject();
      if (project.phase === "discovery") void chatTurn(project, text);
      else if (project.phase === "synthesis") {
        if (!project.synthesisValidated) void requestSynthesis(project, message("user", text));
      } else void editBacklog(project, text);
    },
    [activeId, busy, chatTurn, createProject, editBacklog, requestSynthesis],
  );

  const value = useMemo<ProjectsContextValue>(
    () => ({
      hydrated,
      projects,
      activeProject,
      busy,
      progress,
      view,
      setView,
      lastEdit,
      touched,
      newProject,
      selectProject,
      renameProject,
      togglePin,
      deleteProject,
      send,
      generateSynthesis,
      validateSynthesis,
      reopenSynthesis,
      generateBacklog: () => void generateBacklog(),
      restoreVersion,
      stop,
    }),
    [
      hydrated,
      projects,
      activeProject,
      busy,
      progress,
      view,
      lastEdit,
      touched,
      newProject,
      selectProject,
      renameProject,
      togglePin,
      deleteProject,
      send,
      generateSynthesis,
      validateSynthesis,
      reopenSynthesis,
      generateBacklog,
      restoreVersion,
      stop,
    ],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("useProjects doit être utilisé dans ProjectsProvider");
  return context;
}
