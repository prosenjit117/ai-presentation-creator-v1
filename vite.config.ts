import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Long-stream tunables. Devs.ai agent calls that involve MCP tool execution
 * (createPresentation + many updatePresentation batches) routinely go silent
 * for 30-120s while the agent is running tools. Without heartbeats, any
 * intermediate proxy (CodeSandbox preview, Cloudflare, etc.) will close the
 * idle SSE connection and surface as "network error" in the browser.
 */
const KEEPALIVE_MS = 15_000; // SSE comment ping every 15s while waiting on upstream bytes
const MAX_STREAM_MS = 10 * 60_000; // 10 min hard ceiling — abort upstream if exceeded
const KEEPALIVE_FRAME = ": ping\n\n"; // SSE comment line — ignored by EventSource parsers

function aiProxyPlugin(): Plugin {
  let env: Record<string, string> = {};
  return {
    name: "ai-proxy",
    configureServer(server) {
      env = loadEnv("development", process.cwd(), "");

      server.middlewares.use("/api/ai/chat", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
          });
          res.end();
          return;
        }

        // Bookkeeping for cleanup
        const upstreamAbort = new AbortController();
        let keepaliveTimer: NodeJS.Timeout | null = null;
        let maxDurationTimer: NodeJS.Timeout | null = null;
        let lastUpstreamByteAt = Date.now();
        let upstreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

        const cleanup = (): void => {
          if (keepaliveTimer) {
            clearInterval(keepaliveTimer);
            keepaliveTimer = null;
          }
          if (maxDurationTimer) {
            clearTimeout(maxDurationTimer);
            maxDurationTimer = null;
          }
        };

        // If the BROWSER closes the connection (user clicks Stop, navigates away,
        // or refreshes) we abort the upstream fetch so we don't keep paying for
        // tokens on a request nobody is listening to.
        //
        // IMPORTANT: we listen on `res.on("close")`, NOT `req.on("close")`.
        // In Node's HTTP server, req.on("close") fires when the REQUEST stream
        // ends — which happens normally as soon as the POST body is fully
        // consumed by `for await (const chunk of req)`. That would abort the
        // upstream fetch on every healthy request. res.on("close") fires only
        // when the response writable stream closes, which is the actual
        // "client went away" signal we want.
        res.on("close", () => {
          if (!res.writableEnded) {
            // Response is closing without us calling res.end() → client disconnected.
            if (!upstreamAbort.signal.aborted) {
              upstreamAbort.abort();
            }
            if (upstreamReader) {
              upstreamReader.cancel().catch(() => {
                // ignore
              });
            }
          }
          cleanup();
        });

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");

          const apiKey = env.AI_API_KEY;
          const platformUrl = env.AI_PLATFORM_URL || "https://devs.ai";
          const agentId = body.model || env.AI_AGENT_ID;

          if (!apiKey || !agentId) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "AI_API_KEY/AI_AGENT_ID not configured" }));
            return;
          }

          // Hard ceiling — even with keep-alive, never let a single stream run
          // longer than MAX_STREAM_MS. This prevents runaway costs and orphaned
          // requests if the agent gets stuck in a tool-calling loop.
          maxDurationTimer = setTimeout(() => {
            // eslint-disable-next-line no-console
            console.warn(
              `[ai-proxy] Stream exceeded ${MAX_STREAM_MS}ms — aborting upstream`,
            );
            if (!upstreamAbort.signal.aborted) upstreamAbort.abort();
          }, MAX_STREAM_MS);

          const upstream = await fetch(`${platformUrl}/api/v1/chats/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: agentId,
              messages: body.messages,
              stream: true,
            }),
            signal: upstreamAbort.signal,
          });

          res.writeHead(upstream.status, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no", // disable proxy buffering (nginx, etc.)
          });

          if (!upstream.body) {
            cleanup();
            res.end();
            return;
          }

          // Heartbeat: while the agent is silent (no upstream bytes), inject
          // an SSE comment line every KEEPALIVE_MS. This keeps every proxy in
          // the chain from closing the idle connection.
          keepaliveTimer = setInterval(() => {
            const idleFor = Date.now() - lastUpstreamByteAt;
            if (idleFor >= KEEPALIVE_MS && !res.writableEnded) {
              try {
                res.write(KEEPALIVE_FRAME);
              } catch {
                // ignore — connection may be closing
              }
            }
          }, KEEPALIVE_MS);

          upstreamReader = upstream.body.getReader();
          try {
            while (true) {
              const { done, value } = await upstreamReader.read();
              if (done) break;
              lastUpstreamByteAt = Date.now();
              if (!res.writableEnded) {
                res.write(value);
              }
            }
          } finally {
            cleanup();
            if (!res.writableEnded) res.end();
          }
        } catch (err) {
          cleanup();
          // Distinguish abort-by-client from real failures
          const aborted =
            (err instanceof DOMException && err.name === "AbortError") ||
            (err instanceof Error && /abort/i.test(err.message));
          if (aborted) {
            // already ended in the abort handler — just bail
            try {
              if (!res.writableEnded) res.end();
            } catch {
              // ignore
            }
            return;
          }
          try {
            if (!res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
            }
            if (!res.writableEnded) {
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : "Proxy error",
                }),
              );
            }
          } catch {
            // ignore
          }
        }
      });
    },
  };
}

export default defineConfig({
  optimizeDeps: { exclude: ["@electric-sql/pglite"] },
  plugins: [react(), aiProxyPlugin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
