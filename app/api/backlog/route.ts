import { buildBacklog, type RawBacklog } from "@/lib/backlog";
import { streamText } from "@/lib/gemini";
import { BACKLOG_SCHEMA, backlogPrompt } from "@/lib/prompts";
import { badRequest, errorMessage, readSynthesis } from "@/lib/server/request";
import { eventStream } from "@/lib/sse";

/**
 * Generates the backlog from the validated synthesis. The JSON is streamed
 * so the client can show how many stories are written; the final backlog is
 * checked and numbered by buildBacklog before it is sent.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { synthesis?: unknown } | null;
  const synthesis = readSynthesis(body?.synthesis);
  if (!synthesis || synthesis.fonctionnalites.length === 0) {
    return badRequest("Validez d’abord une synthèse contenant des fonctionnalités.");
  }

  return eventStream(async (send) => {
    let json = "";
    let reported = 0;
    for await (const text of streamText({
      system: backlogPrompt(synthesis),
      turns: [{ role: "user", content: "Génère le backlog complet." }],
      schema: BACKLOG_SCHEMA,
      thinking: "low",
      signal: request.signal,
    })) {
      json += text;
      const stories = json.split('"jeVeux"').length - 1;
      if (stories !== reported) {
        reported = stories;
        send({ type: "progress", stories });
      }
    }
    let raw: RawBacklog;
    try {
      raw = JSON.parse(json) as RawBacklog;
    } catch {
      throw new Error("Backlog illisible");
    }
    send({ type: "result", data: buildBacklog(raw, synthesis) });
  }, errorMessage);
}
