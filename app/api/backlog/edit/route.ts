import { applyOperations, type RawOperation } from "@/lib/backlog";
import { generateJson } from "@/lib/gemini";
import { EDIT_SCHEMA, editPrompt } from "@/lib/prompts";
import {
  badRequest,
  failure,
  readBacklog,
  readSynthesis,
  readTurns,
} from "@/lib/server/request";

/**
 * Natural-language change to the backlog: the model only decides the
 * operations; applying them (IDs, archiving, duplicates) is deterministic.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    turns?: unknown;
    synthesis?: unknown;
    backlog?: unknown;
  } | null;
  const turns = readTurns(body?.turns);
  const synthesis = readSynthesis(body?.synthesis);
  const backlog = readBacklog(body?.backlog);
  const last = turns[turns.length - 1];
  if (!synthesis || !backlog) return badRequest("Aucun backlog à modifier.");
  if (!last || last.role !== "user" || !last.content.trim()) {
    return badRequest("Décrivez la modification souhaitée.");
  }

  try {
    const result = await generateJson<{ reponse: string; operations: RawOperation[] }>({
      system: editPrompt(synthesis, backlog),
      turns,
      schema: EDIT_SCHEMA,
      thinking: "low",
      signal: request.signal,
    });
    const applied = applyOperations(backlog, result.operations ?? [], synthesis);
    return Response.json({ reply: result.reponse?.trim() ?? "", ...applied });
  } catch (error) {
    return failure(error);
  }
}
