import { generateJson } from "@/lib/gemini";
import { SYNTHESIS_SCHEMA, synthesisPrompt, type RawSynthesis } from "@/lib/prompts";
import { badRequest, failure, readSynthesis, readTurns } from "@/lib/server/request";
import type { Synthesis, SynthesisItem } from "@/lib/types";

const items = (prefix: string, values: unknown): SynthesisItem[] =>
  (Array.isArray(values) ? values : [])
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .map((text, index) => ({ id: `${prefix}${index + 1}`, text }));

/**
 * Writes the structured synthesis from the conversation, or applies a
 * correction to the current one. Items get IDs (O1, U1, F1, C1) that the
 * backlog cites as sources.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    turns?: unknown;
    current?: unknown;
  } | null;
  const turns = readTurns(body?.turns);
  if (!turns.some((turn) => turn.role === "user")) {
    return badRequest("La conversation est vide : décrivez d’abord votre projet.");
  }
  const current = readSynthesis(body?.current);

  try {
    const raw = await generateJson<RawSynthesis>({
      system: synthesisPrompt(current),
      // A first synthesis follows the assistant's last question: ask for it.
      turns: current
        ? turns
        : [...turns, { role: "user", content: "Rédige maintenant la synthèse structurée de mon besoin." }],
      schema: SYNTHESIS_SCHEMA,
      thinking: "low",
      signal: request.signal,
    });
    const synthesis: Synthesis = {
      contexte: raw.contexte?.trim() ?? "",
      objectifs: items("O", raw.objectifs),
      utilisateurs: items("U", raw.utilisateurs),
      fonctionnalites: items("F", raw.fonctionnalites),
      contraintes: items("C", raw.contraintes),
    };
    return Response.json({ synthesis, changes: raw.changements?.trim() ?? "" });
  } catch (error) {
    return failure(error);
  }
}
