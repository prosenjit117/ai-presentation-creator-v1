// Streaming AI client. Calls our same-origin /api/ai/chat proxy
// (which forwards to devs.ai with the server-side API key).
export type Message = { role: "user" | "assistant" | "system"; content: string };

export type StreamCallbacks = {
  onDelta: (text: string) => void;
  onComplete: () => void;
  onError: (err: string) => void;
  onEvent?: (eventName: string, data: unknown) => void;
};

// Browser-side watchdog: if NO bytes (not even SSE keep-alive `: ping`s) arrive
// for this long, abort the request. The proxy injects keep-alives every 15s
// while the agent is silent, so a 90s gap means the proxy itself is gone or
// network is severed. Hard ceiling that matches the proxy's 10-min total.
const NO_BYTES_TIMEOUT_MS = 90_000;
const TOTAL_TIMEOUT_MS = 10 * 60_000;

export async function sendMessages(
  messages: Message[],
  cb: StreamCallbacks,
  signal?: AbortSignal,
  modelOverride?: string,
): Promise<void> {
  // Combine the user's abort signal with our own watchdog timers so any of
  // them can stop the stream cleanly.
  const watchdog = new AbortController();
  const onUserAbort = () => watchdog.abort();
  if (signal) {
    if (signal.aborted) watchdog.abort();
    else signal.addEventListener("abort", onUserAbort);
  }
  const totalTimer = setTimeout(() => {
    watchdog.abort();
    cb.onError(
      `Request timed out after ${Math.round(TOTAL_TIMEOUT_MS / 60_000)} minutes. ` +
        `The agent may have gotten stuck in a tool-calling loop. Try again with a shorter brief.`,
    );
  }, TOTAL_TIMEOUT_MS);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      watchdog.abort();
      cb.onError(
        `No data received for ${Math.round(NO_BYTES_TIMEOUT_MS / 1000)} seconds. ` +
          `The connection to the agent appears to be lost. Click "Re-run generation" to retry.`,
      );
    }, NO_BYTES_TIMEOUT_MS);
  };
  const cleanupTimers = () => {
    clearTimeout(totalTimer);
    if (idleTimer) clearTimeout(idleTimer);
    if (signal) signal.removeEventListener("abort", onUserAbort);
  };

  let res: Response;
  try {
    resetIdleTimer();
    res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        modelOverride
          ? { messages, model: modelOverride }
          : { messages },
      ),
      signal: watchdog.signal,
    });
  } catch (e) {
    cleanupTimers();
    const isAbort =
      signal?.aborted ||
      watchdog.signal.aborted ||
      (e instanceof DOMException && e.name === "AbortError") ||
      (e instanceof Error && /abort/i.test(e.message));
    if (isAbort) return; // user stopped, component unmounted, or watchdog fired (already surfaced its own error)
    cb.onError(e instanceof Error ? e.message : "Network error");
    return;
  }
  if (!res.ok || !res.body) {
    cleanupTimers();
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    cb.onError(`Request failed (${res.status}): ${detail || res.statusText}`);
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let currentData = "";
  let completed = false;
  const fireComplete = () => {
    if (completed) return;
    completed = true;
    cb.onComplete();
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Any byte (including SSE `: ping` keep-alive comments from the proxy)
      // resets the idle watchdog. This is the whole point of the heartbeat.
      resetIdleTimer();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData = line.slice(6);
        } else if (line.startsWith(":")) {
          // SSE keep-alive comment
        } else if (line === "") {
          if (currentEvent && currentData) {
            try {
              const parsed = JSON.parse(currentData);
              cb.onEvent?.(currentEvent, parsed);
              // Skip platform-internal "suggested_actions" follow-up messages -
              // they arrive as role:"system" after the real agent message and
              // would otherwise pollute streamed text / fire complete twice.
              const role = (parsed as { role?: string }).role;
              const isPlatformInternal = role === "system";
              if (
                currentEvent === "message.delta" &&
                parsed.content?.text &&
                !isPlatformInternal
              ) {
                cb.onDelta(parsed.content.text);
              } else if (currentEvent === "message.error") {
                cb.onError(parsed.error || "Stream error");
              }
              // NOTE: we deliberately do NOT fire onComplete on
              // "message.complete" here. The Devs.ai stream emits multiple
              // message.complete events per response (one for the agent reply,
              // one for the auto-generated "suggested_actions" panel). We only
              // fire onComplete when the HTTP body actually ends (done=true
              // from reader.read), which is the true end of the conversation.
            } catch {
              /* skip malformed */
            }
          }
          currentEvent = "";
          currentData = "";
        }
      }
    }
  } catch (e) {
    // Abort during read() shows up as AbortError / "BodyStreamBuffer was aborted".
    // Treat any abort (user-initiated, unmount, or watchdog) as a clean stop.
    const isAbort =
      signal?.aborted ||
      watchdog.signal.aborted ||
      (e instanceof DOMException && e.name === "AbortError") ||
      (e instanceof Error && /abort/i.test(e.message));
    cleanupTimers();
    if (!isAbort) {
      cb.onError(e instanceof Error ? e.message : "Stream read error");
      return;
    }
    return;
  }
  cleanupTimers();
  fireComplete();
}

// Extract the JSON block most likely to be the AgentResult from a streamed
// assistant message. Strategy:
//   1. Find every fenced ```json``` block.
//   2. Prefer the LAST one that parses AND contains "presentationUrl" or
//      "presentation_url" (the agent's required final answer).
//   3. Otherwise return the last fenced block.
//   4. Otherwise look for an unfenced top-level object containing
//      "presentationUrl" or "presentation_url".
export function extractJsonBlock(text: string): string | null {
  const fenced: string[] = [];
  const re = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) fenced.push(m[1].trim());

  // Prefer fenced blocks containing presentationUrl/presentation_url
  for (let i = fenced.length - 1; i >= 0; i--) {
    const b = fenced[i];
    if (/"presentation[_]?url"/i.test(b)) {
      try {
        JSON.parse(b);
        return b;
      } catch {
        /* fall through */
      }
    }
  }
  if (fenced.length > 0) return fenced[fenced.length - 1];

  // Fallback: scan for an unfenced top-level object with presentationUrl
  const idx = text.search(/"presentation[_]?url"/i);
  if (idx >= 0) {
    // Walk backward to find opening brace, forward for matching close.
    let start = idx;
    while (start >= 0 && text[start] !== "{") start--;
    if (start < 0) return null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

// Coerce the agent's raw JSON into the v2 AgentResult shape. The agent has
// many baked-in habits from prior versions of this app (snake_case keys,
// `layoutId` instead of `visualLayoutId`, missing `predefinedLayout`, etc.).
// Rather than fail validation and drop the result, we normalize first.
//
// This function is conservative: it only renames/defaults known fields and
// never invents data. If the input is fundamentally malformed it returns
// the original object so Zod can surface the real error.
export function coerceAgentResult(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  // Aliasing helper
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (k in obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  };

  const presentationUrl =
    pick("presentationUrl", "presentation_url", "url") ??
    (() => {
      // Try to derive from presentationId if URL missing
      const id = pick("presentationId", "presentation_id", "id");
      return typeof id === "string" && id.length > 0
        ? `https://docs.google.com/presentation/d/${id}/edit`
        : undefined;
    })();

  const presentationId =
    pick("presentationId", "presentation_id", "id") ??
    (() => {
      // Try to extract from URL
      if (typeof presentationUrl === "string") {
        const match = presentationUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
        if (match) return match[1];
      }
      return undefined;
    })();

  const slidesRaw =
    pick("slidesPlanned", "slides_planned", "slides", "plan", "deckPlan") ?? [];
  const slidesPlanned = Array.isArray(slidesRaw)
    ? slidesRaw.map((s, i) => {
        if (!s || typeof s !== "object") return s;
        const sObj = s as Record<string, unknown>;
        const sPick = (...keys: string[]) => {
          for (const k of keys) {
            if (k in sObj && sObj[k] !== undefined && sObj[k] !== null) return sObj[k];
          }
          return undefined;
        };
        const idx = sPick("index", "slideIndex", "position", "n");
        return {
          index: typeof idx === "number" ? idx : Number(idx) || i + 1,
          title: String(sPick("title", "name", "headline") ?? ""),
          visualLayoutId: String(
            sPick("visualLayoutId", "visual_layout_id", "layoutId", "layout_id", "layout") ??
              "(unspecified)",
          ),
          predefinedLayout: String(
            sPick(
              "predefinedLayout",
              "predefined_layout",
              "googleLayout",
              "slidesLayout",
            ) ?? "BLANK",
          ),
          framework:
            sPick("framework", "analyticalFramework", "framework_id") !== undefined
              ? String(sPick("framework", "analyticalFramework", "framework_id"))
              : undefined,
          rationale: String(
            sPick("rationale", "reason", "why", "notes") ?? "",
          ),
        };
      })
    : [];

  const imagesRaw = pick("imagesGenerated", "images_generated", "images") ?? [];
  const imagesGenerated = Array.isArray(imagesRaw)
    ? imagesRaw
        .map((img) => {
          if (!img || typeof img !== "object") return null;
          const i = img as Record<string, unknown>;
          const url = i.url ?? i.image_url ?? i.imageUrl ?? i.src;
          if (typeof url !== "string") return null;
          return {
            url,
            purpose: String(i.purpose ?? i.prompt ?? i.caption ?? ""),
          };
        })
        .filter((x): x is { url: string; purpose: string } => x !== null)
    : [];

  const warningsRaw = pick("warnings", "warning", "issues") ?? [];
  const warnings = Array.isArray(warningsRaw)
    ? warningsRaw.map((w) => String(w))
    : typeof warningsRaw === "string"
      ? [warningsRaw]
      : [];

  return {
    presentationUrl,
    presentationId,
    slidesPlanned,
    imagesGenerated,
    warnings,
  };
}
