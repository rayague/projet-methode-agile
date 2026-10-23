import { generateJson, streamText } from "@/lib/gemini";
import { ANALYSIS_PROMPT, ANALYSIS_SCHEMA, chatPrompt, type Analysis } from "@/lib/prompts";
import { badRequest, errorMessage, readTurns } from "@/lib/server/request";
import { eventStream } from "@/lib/sse";
import { THEMES, type Coverage, type ThemeKey } from "@/lib/types";

/**
 * Discovery turn. The assistant first analyses what the client has said
 * (themes covered, ambiguity, off-topic), then writes its reply guided by
 * that analysis — it reasons before it answers. Both arrive as events.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { turns?: unknown } | null;
  const turns = readTurns(body?.turns);
  const last = turns[turns.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return badRequest("Décrivez votre projet pour commencer.");
  }

  return eventStream(async (send) => {
    const analysis = await generateJson<Analysis>({
      system: ANALYSIS_PROMPT,
      turns,
      schema: ANALYSIS_SCHEMA,
      signal: request.signal,
    });
    const themes = Object.fromEntries(
      THEMES.map((theme) => [theme.key, !!analysis.themes?.[theme.key]?.couvert]),
    ) as Record<ThemeKey, boolean>;
    const coverage: Coverage = {
      themes,
      ready: THEMES.every((theme) => !theme.required || themes[theme.key]),
    };
    send({ type: "analysis", coverage, title: analysis.titre?.trim() ?? "" });

    const firstTurn = turns.filter((turn) => turn.role === "user").length === 1;
    for await (const text of streamText({
      system: chatPrompt(analysis, firstTurn),
      turns,
      signal: request.signal,
    })) {
      send({ type: "delta", text });
    }
  }, errorMessage);
}
