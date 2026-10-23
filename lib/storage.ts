import type { Project } from "@/lib/types";

const PROJECTS_KEY = "xscrum.projects.v1";
/** Demo data of the first prototype: removed from every browser. */
const LEGACY_KEYS = ["xscrum.conversations.v1", "xscrum.settings.v1"];

function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadProjects(): Project[] {
  const store = storage();
  if (!store) return [];
  try {
    LEGACY_KEYS.forEach((key) => store.removeItem(key));
    const parsed: unknown = JSON.parse(store.getItem(PROJECTS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    // A reply interrupted by a reload can never finish.
    return (parsed as Project[]).map((project) => ({
      ...project,
      messages: project.messages.map((message) =>
        message.status === "streaming" ? { ...message, status: "error" } : message,
      ),
    }));
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]) {
  try {
    storage()?.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // Storage full or blocked: the app keeps working in memory.
  }
}
