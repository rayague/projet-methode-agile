import type { Conversation, Settings } from "@/lib/types";

const CONVERSATIONS_KEY = "xscrum.conversations.v1";
const SETTINGS_KEY = "xscrum.settings.v1";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadConversations(): Conversation[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Conversation[];
  } catch {
    return null;
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations),
    );
  } catch {
    // Storage can be unavailable or full — the UI keeps working in memory.
  }
}

export function loadSettings(): Partial<Settings> | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Partial<Settings>;
  } catch {
    return null;
  }
}

export function saveSettings(settings: Settings) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures.
  }
}

export function clearStorage() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(CONVERSATIONS_KEY);
    window.localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // Ignore storage failures.
  }
}
