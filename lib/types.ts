export type Role = "user" | "assistant";

export type MessageStatus = "complete" | "streaming" | "error";

/** text: chat turn · synthesis: synthesis card · backlog: generation summary. */
export type MessageKind = "text" | "synthesis" | "backlog";

export type Phase = "discovery" | "synthesis" | "backlog";

export const THEMES = [
  { key: "utilisateurs", label: "Utilisateurs", required: true },
  { key: "objectifs", label: "Objectifs", required: false },
  { key: "fonctionnalites", label: "Fonctionnalités", required: true },
  { key: "contraintes", label: "Contraintes", required: true },
  { key: "priorites", label: "Priorités", required: true },
  { key: "budgetDelais", label: "Budget et délais", required: false },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];

export interface Coverage {
  themes: Record<ThemeKey, boolean>;
  /** Every required theme is covered: the synthesis can be proposed. */
  ready: boolean;
}

export interface SynthesisItem {
  /** O1, U1, F1, C1… — referenced by the backlog for traceability. */
  id: string;
  text: string;
}

export interface Synthesis {
  contexte: string;
  objectifs: SynthesisItem[];
  utilisateurs: SynthesisItem[];
  fonctionnalites: SynthesisItem[];
  contraintes: SynthesisItem[];
}

export const PRIORITIES = ["Must", "Should", "Could", "Won't"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34] as const;
/** Stories estimated above this are flagged « à découper ». */
export const SPLIT_THRESHOLD = 13;

export interface Criterion {
  etantDonne: string;
  quand: string;
  alors: string;
}

export interface Story {
  id: string;
  epicId: string;
  titre: string;
  enTantQue: string;
  jeVeux: string;
  afinDe: string;
  priorite: Priority;
  estimation: number;
  criteres: Criterion[];
  /** Synthesis items this story comes from (O1, F2…). */
  sources: string[];
  statut: "active" | "archivee";
  /** Why the story was archived (deleted, split…). */
  note?: string;
}

export interface Epic {
  id: string;
  titre: string;
  description: string;
  sources: string[];
}

export interface Backlog {
  epics: Epic[];
  stories: Story[];
  /** Next free numbers: IDs are never reused, so numbering never breaks. */
  nextStory: number;
  nextEpic: number;
}

export interface BacklogVersion {
  version: number;
  createdAt: number;
  /** What caused the version: generation, a request, a restore. */
  label: string;
  changes: string[];
  backlog: Backlog;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  status: MessageStatus;
  kind?: MessageKind;
  /** Snapshot shown by a synthesis card. */
  synthesis?: Synthesis;
}

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  phase: Phase;
  messages: Message[];
  coverage: Coverage | null;
  synthesis: Synthesis | null;
  synthesisValidated: boolean;
  backlog: Backlog | null;
  history: BacklogVersion[];
}

/** Turn sent to the API: only the text of the conversation. */
export interface ChatTurn {
  role: Role;
  content: string;
}
