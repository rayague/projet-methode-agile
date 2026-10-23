export type Role = "user" | "assistant";

export type MessageStatus = "complete" | "streaming";

export type Accent = "violet" | "cyan" | "emerald" | "rose";

export type Density = "comfortable" | "compact";

export type ModelId = "xscrum-pro" | "xscrum-fast" | "xscrum-reason";

export type PresenceStatus = "online" | "away" | "focus";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  status: MessageStatus;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  messages: Message[];
}

export interface Settings {
  accent: Accent;
  density: Density;
  reduceMotion: boolean;
  timestamps: boolean;
  model: ModelId;
  temperature: number;
  displayName: string;
  email: string;
  status: PresenceStatus;
}
