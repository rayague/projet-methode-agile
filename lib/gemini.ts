/**
 * Minimal Gemini REST client, server side only (route handlers). The key is
 * read from GOOGLE_API_KEY (.env.local) and sent in a header, never in a URL.
 * No SDK: two endpoints are all the app needs.
 */
import type { ChatTurn } from "@/lib/types";

export const MODEL = "gemini-3.5-flash-lite";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type Thinking = "minimal" | "low" | "medium" | "high";

interface Request {
  system: string;
  turns: ChatTurn[];
  /** JSON Schema: the answer is then guaranteed to be JSON of that shape. */
  schema?: object;
  thinking?: Thinking;
  signal?: AbortSignal;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

function apiKey() {
  const key = process.env.GOOGLE_API_KEY?.trim();
  if (!key) {
    throw new GeminiError(
      "Clé API absente : renseignez GOOGLE_API_KEY dans .env.local puis relancez le serveur.",
      500,
    );
  }
  return key;
}

/** Gemini wants alternating turns starting with the user. */
function toContents(turns: ChatTurn[]) {
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const turn of turns) {
    const text = turn.content.trim();
    if (!text) continue;
    const role = turn.role === "user" ? "user" : "model";
    if (contents.length === 0 && role === "model") continue;
    const last = contents[contents.length - 1];
    if (last?.role === role) last.parts[0].text += `\n\n${text}`;
    else contents.push({ role, parts: [{ text }] });
  }
  // Gemini rejects a request that ends with a model turn.
  if (contents.at(-1)?.role === "model") {
    contents.push({ role: "user", parts: [{ text: "Poursuis à partir de la conversation ci-dessus." }] });
  }
  return contents;
}

function body({ system, turns, schema, thinking = "minimal" }: Request) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: toContents(turns),
    generationConfig: {
      thinkingConfig: { thinkingLevel: thinking },
      ...(schema
        ? { responseMimeType: "application/json", responseJsonSchema: schema }
        : {}),
    },
  });
}

async function call(method: string, request: Request) {
  let response: Response;
  try {
    response = await fetch(`${BASE}/${MODEL}:${method}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey() },
      body: body(request),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    if ((error as Error).name === "AbortError") throw error;
    throw new GeminiError("Le service d’IA est injoignable. Vérifiez la connexion.");
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[gemini] ${response.status} ${detail.slice(0, 500)}`);
    if (response.status === 429) {
      throw new GeminiError("Quota de l’API atteint. Réessayez dans un instant.", 429);
    }
    if (response.status === 400 && /API key/i.test(detail)) {
      throw new GeminiError("Clé API refusée par Google. Vérifiez GOOGLE_API_KEY.", 401);
    }
    throw new GeminiError(`Erreur du service d’IA (${response.status}).`);
  }
  return response;
}

type Candidate = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
};

const textOf = (data: Candidate) =>
  data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

export async function generateJson<T>(request: Request & { schema: object }): Promise<T> {
  const response = await call("generateContent", request);
  const data = (await response.json()) as Candidate;
  const text = textOf(data);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiError("Réponse de l’IA illisible. Réessayez.");
  }
}

/** Yields the answer as it is written. */
export async function* streamText(request: Request): AsyncGenerator<string> {
  const response = await call("streamGenerateContent?alt=sse", request);
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line.startsWith("data:")) continue;
      try {
        const text = textOf(JSON.parse(line.slice(5)) as Candidate);
        if (text) yield text;
      } catch {
        // A malformed event is skipped; the next ones carry on.
      }
    }
  }
}
