import { GeminiError } from "@/lib/gemini";
import type { ChatTurn } from "@/lib/types";

const MAX_TURNS = 60;
const MAX_CHARS = 6000;

/** Keeps only well-formed turns, trimmed to a reasonable size. */
export function readTurns(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (turn): turn is ChatTurn =>
        !!turn &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string",
    )
    .slice(-MAX_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_CHARS) }));
}

export function errorMessage(error: unknown) {
  if (error instanceof GeminiError) return error.message;
  console.error(error);
  return "Une erreur inattendue est survenue. Réessayez.";
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function failure(error: unknown) {
  const status = error instanceof GeminiError ? error.status : 500;
  return Response.json({ error: errorMessage(error) }, { status });
}

import type { Backlog, Synthesis } from "@/lib/types";

const isList = (value: unknown) => Array.isArray(value);

export function readSynthesis(value: unknown): Synthesis | null {
  const s = value as Synthesis | null;
  if (
    !s ||
    typeof s.contexte !== "string" ||
    ![s.objectifs, s.utilisateurs, s.fonctionnalites, s.contraintes].every(isList)
  ) {
    return null;
  }
  return s;
}

export function readBacklog(value: unknown): Backlog | null {
  const b = value as Backlog | null;
  if (!b || !isList(b.epics) || !isList(b.stories) || typeof b.nextStory !== "number") {
    return null;
  }
  return b;
}
