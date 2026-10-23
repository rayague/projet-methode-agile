/** Server-sent events between the route handlers and the client. */

export type ServerEvent =
  | { type: "analysis"; coverage: import("@/lib/types").Coverage; title: string }
  | { type: "delta"; text: string }
  | { type: "progress"; stories: number }
  | { type: "result"; data: unknown }
  | { type: "error"; message: string }
  | { type: "done" };

/** Server: streams the events emitted by `run`, then closes. */
export function eventStream(
  run: (send: (event: ServerEvent) => void) => Promise<void>,
  onError: (error: unknown) => string,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ServerEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // The client went away: nothing to deliver.
        }
      };
      try {
        await run(send);
        send({ type: "done" });
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          send({ type: "error", message: onError(error) });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}

/** Client: calls `onEvent` for each event of a response. */
export async function readEvents(
  response: Response,
  onEvent: (event: ServerEvent) => void,
) {
  if (!response.ok || !response.body) {
    let message = `Erreur ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // Not JSON: keep the status.
    }
    throw new Error(message);
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (chunk.startsWith("data: ")) {
        onEvent(JSON.parse(chunk.slice(6)) as ServerEvent);
      }
    }
  }
}
