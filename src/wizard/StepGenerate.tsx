import { useCallback, useEffect, useRef, useState } from "react";
import {
  Stack,
  Title,
  Text,
  Button,
  Group,
  Card,
  Timeline,
  Badge,
  ScrollArea,
  Alert,
  Code,
  Loader,
  Anchor,
  List,
  CopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBook2,
  IconBrandGoogleDrive,
  IconCheck,
  IconExternalLink,
  IconLock,
  IconPhoto,
  IconPlayerPlay,
  IconPlayerStop,
  IconRobot,
  IconSearch,
  IconSparkles,
  IconTool,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import type { WizardPayloadT, AgentResultT } from "../lib/wizardSchema";
import { AgentResult } from "../lib/wizardSchema";
import { buildSystemPrompt, buildUserPrompt } from "../lib/buildPrompts";
import {
  coerceAgentResult,
  extractJsonBlock,
  sendMessages,
  type Message,
} from "../lib/aiClient";

const JSON_RECOVERY_NUDGE = [
  "Your previous response did not include the required final JSON block.",
  "",
  "Output ONLY the JSON block now — a single fenced ```json``` block matching the AgentResult",
  "schema from the system prompt. NO prose before or after the block.",
  "",
  "If you already created the presentation via MCP, use the actual presentationId/presentationUrl",
  "you got back from `createPresentation`. If you did NOT create the presentation, do that now",
  "(call `createPresentation` then any required `updatePresentation` batchUpdate calls), and only",
  "then return the JSON block.",
  "",
  "Required shape (substitute real values, do not invent IDs):",
  "```json",
  "{",
  '  "presentationUrl": "https://docs.google.com/presentation/d/.../edit",',
  '  "presentationId": "...",',
  '  "slidesPlanned": [',
  '    { "index": 1, "title": "...", "visualLayoutId": "...", "predefinedLayout": "BLANK", "rationale": "..." }',
  "  ],",
  '  "imagesGenerated": [],',
  '  "warnings": []',
  "}",
  "```",
].join("\n");

type LogKind = "agent" | "tool-drive" | "tool-image" | "tool-knowledge" | "tool" | "info" | "error" | "result";

type LogEntry = {
  ts: number;
  kind: LogKind;
  text: string;
};

type AccessError = {
  toolName: string;
  rawOutput: string;
  parsedMessage: string | null;
  parsedCode: string | number | null;
  statusKind: "permission" | "not-found" | "auth" | "unknown";
};

type Props = {
  payload: WizardPayloadT;
  result: AgentResultT | null;
  onResult: (r: AgentResultT) => void;
  onRawCapture?: (raw: { streamed: string; jsonBlock: string | null }) => void;
};

// Inspect a tool.message output to decide whether it represents an access /
// permission failure that the user can fix by sharing the deck or correcting
// the URL. Returns null if the output looks like a normal success.
function classifyMcpError(rawOutput: string, statusFromEvent: string | undefined): AccessError | null {
  if (!rawOutput && (statusFromEvent ?? "ok") === "ok") return null;

  // Parse JSON-shaped MCP outputs first so we can pull out provider message/code.
  let parsedMessage: string | null = null;
  let parsedCode: string | number | null = null;
  try {
    const obj = JSON.parse(rawOutput);
    if (obj && typeof obj === "object") {
      const o = obj as Record<string, unknown>;
      const err = (o.error ?? o.err ?? o) as Record<string, unknown> | undefined;
      const m = err && (err.message ?? err.msg ?? err.error_description);
      const c = err && (err.code ?? err.status);
      if (typeof m === "string") parsedMessage = m;
      if (typeof c === "string" || typeof c === "number") parsedCode = c;
    }
  } catch {
    // Not JSON; fall through to substring matching on the raw output.
  }

  const haystack = `${rawOutput} ${parsedMessage ?? ""}`.toLowerCase();
  const isErrorStatus = (statusFromEvent ?? "").toLowerCase() === "error";
  const codeIsErrorish =
    typeof parsedCode === "number"
      ? parsedCode >= 400
      : typeof parsedCode === "string"
        ? /^4\d\d|5\d\d|denied|forbidden|unauth|not_found/i.test(parsedCode)
        : false;
  if (!isErrorStatus && !codeIsErrorish && !/error|denied|forbidden|unauth|permission|not.?found/i.test(haystack)) {
    return null;
  }

  let statusKind: AccessError["statusKind"] = "unknown";
  if (
    haystack.includes("permission_denied") ||
    haystack.includes("permission denied") ||
    haystack.includes("does not have permission") ||
    haystack.includes("forbidden") ||
    haystack.includes("403") ||
    haystack.includes("insufficientpermissions") ||
    haystack.includes("the caller does not have")
  ) {
    statusKind = "permission";
  } else if (
    haystack.includes("not_found") ||
    haystack.includes("not found") ||
    haystack.includes("requested entity was not found") ||
    haystack.includes("404")
  ) {
    statusKind = "not-found";
  } else if (
    haystack.includes("unauthenticated") ||
    haystack.includes("unauthorized") ||
    haystack.includes("invalid_grant") ||
    haystack.includes("401")
  ) {
    statusKind = "auth";
  }

  return {
    toolName: "",
    rawOutput,
    parsedMessage,
    parsedCode,
    statusKind,
  };
}

// Classify a tool name into a coarse category for icon/color in the timeline.
function classifyTool(name: string | undefined): LogKind {
  if (!name) return "tool";
  const n = name.toLowerCase();
  if (
    n.includes("presentation") ||
    n.includes("slide") ||
    n.includes("drive") ||
    n.includes("file") ||
    n.includes("doc") ||
    n.includes("sheet") ||
    n.includes("page")
  ) {
    return "tool-drive";
  }
  if (n.includes("image") || n.includes("gemini") || n.includes("photo")) return "tool-image";
  if (n.includes("knowledge") || n.includes("retrieval") || n.includes("search")) return "tool-knowledge";
  return "tool";
}

export function StepGenerate({ payload, result, onResult, onRawCapture }: Props) {
  const [running, setRunning] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [rawJsonBlock, setRawJsonBlock] = useState<string | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [accessError, setAccessError] = useState<AccessError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamedRef = useRef("");
  const conversationRef = useRef<Message[]>([]);
  const toolCallCountRef = useRef(0);

  useEffect(() => () => abortRef.current?.abort(), []);

  const pushLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  // Try to validate the streamed response into an AgentResult.
  // Returns one of: { kind: "ok", data }, { kind: "no-json" }, { kind: "schema-fail", msg }.
  type ValidateResult =
    | { kind: "ok"; data: AgentResultT }
    | { kind: "no-json" }
    | { kind: "schema-fail"; msg: string };
  const tryValidate = useCallback((streamedText: string): ValidateResult => {
    const block = extractJsonBlock(streamedText);
    if (!block) return { kind: "no-json" };

    let rawObj: unknown;
    try {
      rawObj = JSON.parse(block);
    } catch {
      return { kind: "no-json" }; // treat malformed as missing for recovery purposes
    }

    const coerced = coerceAgentResult(rawObj);
    let parsed = AgentResult.safeParse(coerced);
    if (!parsed.success) parsed = AgentResult.safeParse(rawObj);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .slice(0, 5)
        .map((e) => `${e.path.map(String).join(".") || "(root)"}: ${e.message}`)
        .join("; ");
      return { kind: "schema-fail", msg };
    }
    return { kind: "ok", data: parsed.data };
  }, []);

  // Streaming callbacks shared by both the initial call and the recovery call.
  const buildCallbacks = useCallback(
    (onDone: () => void) => ({
      onDelta: (t: string) => {
        streamedRef.current += t;
        setStreamed(streamedRef.current);
      },
      onEvent: (name: string, data: unknown) => {
        if (name === "tool.call.created") {
          toolCallCountRef.current++;
          const d = data as { name?: string; id?: string };
          pushLog({
            ts: Date.now(),
            kind: classifyTool(d.name),
            text: `MCP → ${d.name ?? "tool"} ${d.id ? `(${d.id.slice(0, 8)})` : ""}`,
          });
        } else if (name === "tool.call.complete") {
          const d = data as { call?: { name?: string; arguments?: unknown } };
          const argStr = d.call?.arguments
            ? JSON.stringify(d.call.arguments).slice(0, 200)
            : "";
          pushLog({
            ts: Date.now(),
            kind: classifyTool(d.call?.name),
            text: `MCP ✓ ${d.call?.name ?? "tool"}${argStr ? ` · ${argStr}` : ""}`,
          });
        } else if (name === "tool.message") {
          const d = data as {
            metadata?: { status?: string };
            status?: string;
            output?: string;
            name?: string;
          };
          const status = d.metadata?.status ?? d.status ?? "ok";
          const rawOutput = d.output ?? "";
          const preview = rawOutput.slice(0, 200);
          pushLog({
            ts: Date.now(),
            kind: status === "error" ? "error" : classifyTool(d.name),
            text: `MCP result [${status}]${preview ? ` · ${preview}` : ""}`,
          });
          // Inspect for access / permission failures and surface a dedicated
          // alert with the verbatim MCP error so the user can fix sharing.
          const detected = classifyMcpError(rawOutput, status);
          if (detected) {
            setAccessError({ ...detected, toolName: d.name ?? "MCP tool" });
          }
        } else if (name === "message.created") {
          const d = data as { role?: string; messageId?: string };
          if (d.role !== "system") {
            pushLog({
              ts: Date.now(),
              kind: "info",
              text: `Agent started message ${d.messageId?.slice(0, 8) ?? ""}`,
            });
          }
        } else if (name === "message.complete") {
          const d = data as {
            role?: string;
            outputTokens?: number;
            timingMetadata?: { e2eTimeMs?: number };
          };
          if (d.role !== "system") {
            const t = d.timingMetadata?.e2eTimeMs;
            pushLog({
              ts: Date.now(),
              kind: "info",
              text: `Message complete · ${d.outputTokens ?? "?"} output tokens${
                t ? ` · ${(t / 1000).toFixed(1)}s` : ""
              }`,
            });
          }
        }
      },
      onComplete: onDone,
      onError: (msg: string) => {
        setRunning(false);
        setError(msg);
        pushLog({ ts: Date.now(), kind: "error", text: msg });
      },
    }),
    [pushLog],
  );

  // Validate-or-recover: called after every stream completes. If validation
  // succeeds, fires onResult. If JSON is missing or malformed, automatically
  // sends a tightly-scoped follow-up nudge using the conversation history
  // (one recovery attempt per run). If schema mismatches, surface the issues.
  const handleStreamEnd = useCallback(async () => {
    const final = streamedRef.current;
    pushLog({
      ts: Date.now(),
      kind: "info",
      text: `Stream finished (${final.length.toLocaleString()} chars, ${toolCallCountRef.current} MCP tool call(s)).`,
    });

    const v = tryValidate(final);

    if (v.kind === "ok") {
      pushLog({
        ts: Date.now(),
        kind: "result",
        text: `Validated AgentResult: ${v.data.slidesPlanned.length} slide(s) planned, ${v.data.imagesGenerated.length} image(s) generated.`,
      });
      const block = extractJsonBlock(final);
      setRawJsonBlock(block);
      onRawCapture?.({ streamed: final, jsonBlock: block });
      setRunning(false);
      onResult(v.data);
      return;
    }

    if (v.kind === "schema-fail") {
      const block = extractJsonBlock(final);
      setRawJsonBlock(block);
      onRawCapture?.({ streamed: final, jsonBlock: block });
      pushLog({
        ts: Date.now(),
        kind: "error",
        text: `Schema validation failed: ${v.msg}`,
      });
      setValidationError(v.msg);
      setError(
        "The agent returned JSON, but it doesn't match the AgentResult schema. See details below — you can re-run, or move to Step 8 to inspect the raw output.",
      );
      setRunning(false);
      return;
    }

    // v.kind === "no-json": try ONE recovery follow-up before giving up.
    if (recoveryAttempted) {
      onRawCapture?.({ streamed: final, jsonBlock: null });
      pushLog({
        ts: Date.now(),
        kind: "error",
        text: "No JSON block found, even after recovery follow-up. Step 8 will show the raw output for inspection.",
      });
      setError(
        "The agent didn't return a JSON block, even after an automatic recovery follow-up. Open Step 8 to see the raw output. You can also click Generate again — large transcripts can occasionally distract the model.",
      );
      setRunning(false);
      return;
    }

    pushLog({
      ts: Date.now(),
      kind: "info",
      text: `No JSON block in first response (${toolCallCountRef.current} MCP tool call(s) seen). Sending automatic recovery follow-up asking for JSON only…`,
    });
    setRecoveryAttempted(true);

    // Append the assistant turn + a focused follow-up to the conversation.
    conversationRef.current = [
      ...conversationRef.current,
      { role: "assistant", content: final },
      { role: "user", content: JSON_RECOVERY_NUDGE },
    ];

    if (!abortRef.current || abortRef.current.signal.aborted) {
      abortRef.current = new AbortController();
    }
    const agentOverride = payload.agentIdOverride?.trim();
    await sendMessages(
      conversationRef.current,
      buildCallbacks(handleStreamEnd),
      abortRef.current.signal,
      agentOverride || undefined,
    );
  }, [buildCallbacks, onRawCapture, onResult, payload.agentIdOverride, pushLog, recoveryAttempted, tryValidate]);

  async function run() {
    setRunning(true);
    setError(null);
    setValidationError(null);
    setRawJsonBlock(null);
    setRecoveryAttempted(false);
    setAccessError(null);
    setLogs([]);
    setStreamed("");
    streamedRef.current = "";
    toolCallCountRef.current = 0;
    abortRef.current = new AbortController();

    pushLog({
      ts: Date.now(),
      kind: "info",
      text: "Composing brief and contacting Designer agent…",
    });

    const sys = buildSystemPrompt();
    const usr = buildUserPrompt(payload);

    const agentOverride = payload.agentIdOverride?.trim();
    if (agentOverride) {
      pushLog({
        ts: Date.now(),
        kind: "info",
        text: `Using Designer agent override: ${agentOverride}`,
      });
    }

    conversationRef.current = [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ];

    await sendMessages(
      conversationRef.current,
      buildCallbacks(handleStreamEnd),
      abortRef.current.signal,
      agentOverride || undefined,
    );
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
    pushLog({ ts: Date.now(), kind: "info", text: "Stopped by user." });
  }

  function bulletForKind(k: LogKind) {
    switch (k) {
      case "tool-drive":
        return <IconBrandGoogleDrive size={11} />;
      case "tool-image":
        return <IconPhoto size={11} />;
      case "tool-knowledge":
        return <IconBook2 size={11} />;
      case "tool":
        return <IconTool size={11} />;
      case "error":
        return <IconAlertTriangle size={11} />;
      case "result":
        return <IconCheck size={11} />;
      default:
        return <IconRobot size={11} />;
    }
  }

  function colorForKind(k: LogKind) {
    switch (k) {
      case "error":
        return "red";
      case "tool-drive":
        return "royal";
      case "tool-image":
        return "purple";
      case "tool-knowledge":
        return "teal";
      case "tool":
        return "navy";
      case "result":
        return "teal";
      default:
        return "gray";
    }
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Generate</Title>
        <Text c="dimmed" size="sm">
          Sends the brief to the Designer agent. The agent's MCP tool calls and reasoning stream
          live below.
        </Text>
      </div>

      <Group>
        {!running ? (
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={run}
            color="royal"
            disabled={running}
          >
            Generate presentation
          </Button>
        ) : (
          <Button leftSection={<IconPlayerStop size={16} />} onClick={stop} color="red">
            Stop
          </Button>
        )}
        {running && (
          <Group gap="xs">
            <Loader size="xs" />
            <Text size="sm" c="dimmed">
              Designer agent is working…
            </Text>
          </Group>
        )}
        {result && (
          <Badge color="teal" variant="light" leftSection={<IconCheck size={12} />}>
            Result ready · {result.slidesPlanned.length} slide(s)
          </Badge>
        )}
      </Group>

      {accessError && (
        <Alert
          color={accessError.statusKind === "permission" ? "orange" : "red"}
          icon={
            accessError.statusKind === "permission" ? (
              <IconLock size={16} />
            ) : accessError.statusKind === "not-found" ? (
              <IconSearch size={16} />
            ) : (
              <IconAlertTriangle size={16} />
            )
          }
          title={
            accessError.statusKind === "permission"
              ? "Reference deck access denied"
              : accessError.statusKind === "not-found"
                ? "Reference deck not found"
                : accessError.statusKind === "auth"
                  ? "Drive authentication failed"
                  : "MCP tool error"
          }
          variant="light"
        >
          <Stack gap="sm">
            <Text size="sm">
              {accessError.statusKind === "permission" &&
                "The Designer agent's Google account doesn't have access to the deck you provided. Slide creation cannot proceed until the deck is shared with the agent."}
              {accessError.statusKind === "not-found" &&
                "The Drive MCP couldn't find a presentation at the URL you provided. Either the file was deleted, the URL is wrong, or the file is in a Drive the agent cannot reach."}
              {accessError.statusKind === "auth" &&
                "The agent's Drive credentials were rejected (the OAuth token may have expired or been revoked). This is an agent-side issue — re-authenticate the agent's Drive connection in Devs.ai."}
              {accessError.statusKind === "unknown" &&
                "The MCP tool returned an error. The full response from the MCP server is shown below."}
            </Text>

            {payload.design.referenceSlidesUrl && (
              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                  Reference URL:
                </Text>
                <Anchor
                  href={payload.design.referenceSlidesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  style={{ wordBreak: "break-all" }}
                >
                  {payload.design.referenceSlidesUrl}{" "}
                  <IconExternalLink
                    size={11}
                    style={{ verticalAlign: "middle", marginLeft: 2 }}
                  />
                </Anchor>
              </Group>
            )}

            <Card withBorder radius="sm" p="xs" bg="dark.7">
              <Group justify="space-between" mb={4} wrap="nowrap">
                <Text size="xs" fw={600} c="orange.3">
                  Verbatim error from {accessError.toolName || "MCP server"}
                  {accessError.parsedCode != null ? ` · code ${accessError.parsedCode}` : ""}
                </Text>
                <CopyButton value={accessError.parsedMessage ?? accessError.rawOutput} timeout={1500}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied" : "Copy error"}>
                      <ActionIcon variant="subtle" color="gray" size="sm" onClick={copy}>
                        <Text size="xs">{copied ? "✓" : "⧉"}</Text>
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <ScrollArea.Autosize mah={160}>
                <Code block style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>
                  {accessError.parsedMessage ?? accessError.rawOutput ?? "(no message)"}
                </Code>
              </ScrollArea.Autosize>
            </Card>

            {accessError.statusKind === "permission" && (
              <div>
                <Text size="sm" fw={600} mb={4}>
                  How to fix
                </Text>
                <List size="sm" spacing={4}>
                  <List.Item>
                    Open the deck in Google Slides, click <b>Share</b>, and grant{" "}
                    <b>Editor</b> access to the Google account that the Designer agent's Drive
                    MCP is authenticated as.
                  </List.Item>
                  <List.Item>
                    If you don't know which Google account the agent uses, check the
                    Designer agent's Drive MCP configuration in Devs.ai.
                  </List.Item>
                  <List.Item>
                    Alternatively, set the deck's link sharing to{" "}
                    <b>Anyone with the link · Editor</b> as a quick test.
                  </List.Item>
                  <List.Item>
                    Or clear the Reference Slides URL on Step 4 to let the agent start
                    from a fresh blank presentation.
                  </List.Item>
                </List>
              </div>
            )}

            {accessError.statusKind === "not-found" && (
              <div>
                <Text size="sm" fw={600} mb={4}>
                  How to fix
                </Text>
                <List size="sm" spacing={4}>
                  <List.Item>
                    Verify the URL is a Google Slides presentation
                    (<Code>docs.google.com/presentation/d/&#123;ID&#125;</Code>). Open it
                    in your browser to confirm it loads.
                  </List.Item>
                  <List.Item>
                    Confirm the file hasn't been deleted or moved to Trash.
                  </List.Item>
                  <List.Item>
                    If the file is in a Shared Drive the agent cannot access, move it to a
                    location the agent cannot reach, or share it with the agent's account
                    explicitly.
                  </List.Item>
                </List>
              </div>
            )}

            {accessError.statusKind === "auth" && (
              <Text size="sm" c="dimmed">
                Re-authenticate the Designer agent's Google Drive connection in Devs.ai,
                then click Generate again.
              </Text>
            )}

            <Group>
              <Button
                size="xs"
                variant="light"
                color="orange"
                onClick={() => {
                  setAccessError(null);
                  void run();
                }}
                disabled={running}
              >
                I've fixed access — retry
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => setAccessError(null)}
              >
                Dismiss
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {error && (
        <Alert color="red" icon={<IconAlertTriangle size={16} />} title="Generation issue">
          <Stack gap={6}>
            <Text size="sm">{error}</Text>
            {validationError && (
              <Text size="xs" c="red.3" ff="monospace">
                {validationError}
              </Text>
            )}
          </Stack>
        </Alert>
      )}

      {rawJsonBlock && !result && (
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="xs">
            Raw JSON block from agent
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            The block was extracted but didn't validate. Step 8 will show this same block plus the
            full streamed text for inspection.
          </Text>
          <ScrollArea.Autosize mah={240}>
            <Code block style={{ fontSize: 12 }}>
              {rawJsonBlock}
            </Code>
          </ScrollArea.Autosize>
        </Card>
      )}

      <Card withBorder radius="md" p="md">
        <Group gap={6} align="center" mb="sm">
          <IconSparkles size={16} />
          <Text fw={600}>Activity</Text>
        </Group>
        {logs.length === 0 ? (
          <Text size="sm" c="dimmed">
            No activity yet. Click "Generate presentation" to start.
          </Text>
        ) : (
          <ScrollArea.Autosize mah={320}>
            <Timeline active={logs.length - 1} bulletSize={20} lineWidth={1}>
              {logs.map((l, i) => (
                <Timeline.Item key={i} bullet={bulletForKind(l.kind)} color={colorForKind(l.kind)}>
                  <Text size="xs" c="dimmed">
                    {new Date(l.ts).toLocaleTimeString()}
                  </Text>
                  <Text size="sm" style={{ wordBreak: "break-word" }}>
                    {l.text}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </ScrollArea.Autosize>
        )}
      </Card>

      {(running || streamed) && (
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Agent response (live)</Text>
            <Text size="xs" c="dimmed">
              {streamed.length.toLocaleString()} chars
            </Text>
          </Group>
          <ScrollArea.Autosize mah={360}>
            {streamed ? (
              <div className="md-preview">
                <ReactMarkdown>{streamed}</ReactMarkdown>
              </div>
            ) : (
              <Group gap="xs">
                <Loader size="xs" />
                <Text size="sm" c="dimmed">
                  Waiting for first token… (the agent may be calling MCP tools silently — watch the
                  Activity timeline above for tool events)
                </Text>
              </Group>
            )}
          </ScrollArea.Autosize>
        </Card>
      )}

      {result && (
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="xs">
            Validated AgentResult
          </Text>
          <Code block style={{ fontSize: 12 }}>
            {JSON.stringify(result, null, 2)}
          </Code>
        </Card>
      )}
    </Stack>
  );
}
