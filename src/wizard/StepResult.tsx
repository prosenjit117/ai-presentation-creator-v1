import { useState } from "react";
import {
  Stack,
  Title,
  Text,
  Button,
  Group,
  Card,
  Anchor,
  Badge,
  Alert,
  Textarea,
  Divider,
  SimpleGrid,
  CopyButton,
  ActionIcon,
  Tooltip,
  Code,
  ScrollArea,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCopy,
  IconExternalLink,
  IconPlayerPlay,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import type { AgentResultT, WizardPayloadT } from "../lib/wizardSchema";

type Props = {
  result: AgentResultT | null;
  payload: WizardPayloadT;
  rawCapture?: { streamed: string; jsonBlock: string | null } | null;
  onRefine: (instruction: string) => void;
  onBackToGenerate?: () => void;
};

function presentationIdToEmbedUrl(id: string): string {
  return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`;
}

const MCP_FAILURE_PHRASES = [
  "mcp",
  "drive mcp",
  "google drive",
  "tools were not available",
  "tool not available",
  "no tools",
  "not available in this session",
  "could not call",
  "unable to call",
  "did not modify",
  "was not modified",
  "not executed",
  "no batchupdate",
  "unchanged",
  "not a newly produced deck",
];

function detectMcpFailure(
  result: AgentResultT,
  payload: WizardPayloadT,
): { failed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const warnText = result.warnings.join(" ").toLowerCase();
  const matched = MCP_FAILURE_PHRASES.filter((p) => warnText.includes(p));
  if (matched.length) {
    reasons.push(`Agent warning(s) indicate MCP wasn't used: ${matched.slice(0, 3).join(", ")}`);
  }
  // The agent returned the user-supplied reference URL unchanged
  if (
    payload.design.referenceSlidesUrl &&
    result.presentationUrl === payload.design.referenceSlidesUrl
  ) {
    reasons.push(
      "Returned presentationUrl equals the reference deck URL you supplied — that deck is for inspiration only and should never be returned as the result.",
    );
  }
  // Refinement run that returned a different ID than expected
  if (
    payload.refinement &&
    result.presentationId !== payload.refinement.previousPresentationId
  ) {
    reasons.push(
      "This was a refinement run, but the agent returned a different presentationId than the one being refined — the refinement was likely not applied.",
    );
  }
  return { failed: reasons.length > 0, reasons };
}

export function StepResult({
  result,
  payload,
  rawCapture,
  onRefine,
  onBackToGenerate,
}: Props) {
  const [instruction, setInstruction] = useState("");

  if (!result) {
    // Diagnostic mode: a generation may have run but produced no validated
    // result. Show whatever we captured so the user can see what went wrong
    // instead of a blank "run Step 7" placeholder.
    const hasCapture =
      rawCapture && (rawCapture.streamed.length > 0 || rawCapture.jsonBlock);
    return (
      <Stack gap="md">
        <Title order={3}>Result</Title>
        {!hasCapture ? (
          <Alert color="yellow" icon={<IconAlertTriangle size={16} />} title="No result yet">
            <Stack gap="xs">
              <Text size="sm">
                Run Step 7 (Generate) first. The Designer agent's final JSON will populate this
                view.
              </Text>
              {onBackToGenerate && (
                <Group>
                  <Button
                    size="xs"
                    color="royal"
                    leftSection={<IconPlayerPlay size={14} />}
                    onClick={onBackToGenerate}
                  >
                    Go to Step 7
                  </Button>
                </Group>
              )}
            </Stack>
          </Alert>
        ) : (
          <>
            <Alert
              color="red"
              icon={<IconAlertTriangle size={16} />}
              title="Generation finished, but no valid AgentResult was extracted"
            >
              <Stack gap={6}>
                <Text size="sm">
                  The agent streamed {rawCapture!.streamed.length.toLocaleString()} characters
                  back. Inspect the raw output below to see whether it produced a JSON block, and
                  whether that block matches the expected schema (
                  <code>presentationUrl</code>, <code>presentationId</code>,{" "}
                  <code>slidesPlanned[]</code>, <code>imagesGenerated[]</code>,{" "}
                  <code>warnings[]</code>).
                </Text>
                {onBackToGenerate && (
                  <Group>
                    <Button
                      size="xs"
                      color="royal"
                      leftSection={<IconRefresh size={14} />}
                      onClick={onBackToGenerate}
                    >
                      Re-run generation
                    </Button>
                  </Group>
                )}
              </Stack>
            </Alert>

            {rawCapture!.jsonBlock && (
              <Card withBorder radius="md" p="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={600}>Extracted JSON block</Text>
                  <CopyButton value={rawCapture!.jsonBlock}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied!" : "Copy JSON"}>
                        <ActionIcon variant="default" size="sm" onClick={copy}>
                          <IconCopy size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <ScrollArea.Autosize mah={320}>
                  <Code block style={{ fontSize: 12 }}>
                    {rawCapture!.jsonBlock}
                  </Code>
                </ScrollArea.Autosize>
              </Card>
            )}

            <Card withBorder radius="md" p="md">
              <Group justify="space-between" mb="xs">
                <Text fw={600}>Full streamed agent output</Text>
                <Text size="xs" c="dimmed">
                  {rawCapture!.streamed.length.toLocaleString()} chars
                </Text>
              </Group>
              <ScrollArea.Autosize mah={400}>
                <Code block style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                  {rawCapture!.streamed || "(empty)"}
                </Code>
              </ScrollArea.Autosize>
            </Card>
          </>
        )}
      </Stack>
    );
  }

  const embedUrl = presentationIdToEmbedUrl(result.presentationId);
  const mcp = detectMcpFailure(result, payload);

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Result</Title>
        <Text c="dimmed" size="sm">
          The Designer agent finished. Preview the deck below or open it in Google Slides.
        </Text>
      </div>

      {mcp.failed && (
        <Alert
          color="red"
          icon={<IconAlertTriangle size={16} />}
          title="The agent couldn't actually create or modify slides"
        >
          <Stack gap={6}>
            {mcp.reasons.map((r, i) => (
              <Text key={i} size="sm">
                • {r}
              </Text>
            ))}
            <Divider my={4} />
            <Text size="sm" fw={600}>
              How to fix
            </Text>
            <Text size="sm">
              The agent must have a <b>Google Drive / Slides MCP</b> attached to call{" "}
              <code>createPresentation</code> and <code>updatePresentation</code>. The slide plan
              below may still be correct and brand-compliant — but no Google Slides deck was
              actually produced.
            </Text>
            <Text size="sm">
              In <b>Step 4 — Design</b>, paste the UUID of your real{" "}
              <i>AppDirect Presentation Creator and Designer</i> agent in the "Designer Agent
              override" field, or update <code>AI_AGENT_ID</code> in the server <code>.env</code>{" "}
              file and restart the dev server. Then re-run Step 7.
            </Text>
          </Stack>
        </Alert>
      )}

      <Group>
        <Button
          component="a"
          href={result.presentationUrl}
          target="_blank"
          rel="noreferrer"
          leftSection={<IconExternalLink size={16} />}
          color="royal"
        >
          Open in Google Slides
        </Button>
        <CopyButton value={result.presentationUrl}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied!" : "Copy presentation URL"}>
              <ActionIcon variant="default" size="lg" onClick={copy} aria-label="Copy URL">
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        <Badge color="teal" variant="light">
          {result.slidesPlanned.length} slides
        </Badge>
        {result.imagesGenerated.length > 0 && (
          <Badge color="purple" variant="light">
            {result.imagesGenerated.length} image(s)
          </Badge>
        )}
        {result.warnings.length > 0 && (
          <Badge color="yellow" variant="light">
            {result.warnings.length} warning(s)
          </Badge>
        )}
      </Group>

      {result.warnings.length > 0 && (
        <Alert color="yellow" title="Agent warnings" icon={<IconAlertTriangle size={16} />}>
          <Stack gap={2}>
            {result.warnings.map((w, i) => (
              <Text key={i} size="sm">
                • {w}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      <Card withBorder p={0} radius="md" style={{ overflow: "hidden" }}>
        <iframe
          title="Generated presentation"
          src={embedUrl}
          style={{ width: "100%", height: 480, border: 0, display: "block" }}
          allowFullScreen
        />
      </Card>

      <Divider label="Slide plan" labelPosition="left" />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {result.slidesPlanned.map((s) => (
          <Card key={s.index} withBorder p="md" radius="md">
            <Group justify="space-between" mb={4} wrap="nowrap">
              <Text fw={600} size="sm" style={{ minWidth: 0 }}>
                #{s.index} · {s.title}
              </Text>
              <Badge variant="light" color="royal" size="sm">
                {s.visualLayoutId}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mb={6}>
              {s.rationale}
            </Text>
            <Group gap={4}>
              <Badge size="xs" variant="outline">
                layout: {s.predefinedLayout}
              </Badge>
              {s.framework && (
                <Badge size="xs" variant="outline" color="teal">
                  {s.framework}
                </Badge>
              )}
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {result.imagesGenerated.length > 0 && (
        <>
          <Divider label="Generated images" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            {result.imagesGenerated.map((img, i) => (
              <Card key={i} withBorder p="xs" radius="md">
                <img
                  src={img.url}
                  alt={img.purpose}
                  style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }}
                />
                <Text size="xs" c="dimmed" mt={6}>
                  {img.purpose}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}

      <Divider label="Refine" labelPosition="left" />
      <Card withBorder p="md" radius="md">
        <Group gap={6} align="center" mb={4}>
          <IconSparkles size={16} />
          <Text fw={600}>Ask for changes</Text>
        </Group>
        <Text size="xs" c="dimmed" mb="sm">
          The agent will reopen{" "}
          <Anchor href={result.presentationUrl} target="_blank" rel="noreferrer">
            this same presentation
          </Anchor>{" "}
          and apply your edits via further <code>updatePresentation</code> calls — no new deck is
          created.
        </Text>
        <Textarea
          placeholder="e.g. Tighten the executive summary to 3 bullets and replace slide 5 with a quote layout."
          minRows={3}
          autosize
          value={instruction}
          onChange={(e) => setInstruction(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="sm">
          <Button
            leftSection={<IconRefresh size={16} />}
            color="royal"
            disabled={instruction.trim().length < 5}
            onClick={() => {
              onRefine(instruction.trim());
              setInstruction("");
            }}
          >
            Refine deck
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt={6}>
          A refinement re-runs Step 7 with{" "}
          <code>refinement.previousPresentationId = {result.presentationId.slice(0, 12)}…</code>
        </Text>
      </Card>
    </Stack>
  );
}
