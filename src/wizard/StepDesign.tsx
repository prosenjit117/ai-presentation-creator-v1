import {
  Alert,
  Card,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconBulb, IconInfoCircle } from "@tabler/icons-react";
import { LayoutCatalogGrid } from "../components/LayoutCatalogGrid";
import type { WizardPayloadT } from "../lib/wizardSchema";

type Props = {
  value: WizardPayloadT["design"];
  onChange: (v: WizardPayloadT["design"]) => void;
  agentIdOverride?: string;
  onAgentIdOverrideChange: (v?: string) => void;
};

export function StepDesign({
  value,
  onChange,
  agentIdOverride,
  onAgentIdOverrideChange,
}: Props) {
  const defaultAgentId = import.meta.env.VITE_AI_AGENT_ID as string | undefined;
  const noMcpAgent =
    !agentIdOverride && (!defaultAgentId || /^claude|^gpt|^gemini|^o\d/i.test(defaultAgentId));

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Design hints</Title>
        <Text c="dimmed" size="sm">
          The agent owns the brand system end-to-end. These are <i>hints</i> — the agent decides
          the final layout choices.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md">
        Paste a <b>Reference Slides URL</b> below and the agent will{" "}
        <code>getPresentation()</code> that deck and apply <code>updatePresentation</code>{" "}
        batchUpdate calls <b>directly to it</b> — adding new slides into the existing presentation.
        Leave it blank and the agent will start from a fresh{" "}
        <code>createPresentation</code> (16:9) instead.
      </Alert>

      <TextInput
        label="Reference Slides URL (optional)"
        description="If provided, the agent uses this deck as the base — it adds slides into this presentation via batchUpdate and returns the same URL. If blank, the agent creates a new blank deck."
        placeholder="https://docs.google.com/presentation/d/..."
        value={value.referenceSlidesUrl ?? ""}
        onChange={(e) => {
          const v = e.currentTarget.value.trim();
          onChange({ ...value, referenceSlidesUrl: v || undefined });
        }}
      />

      <Stack gap={6}>
        <Text size="sm" fw={500}>
          Light/Dark slide rhythm
        </Text>
        <SegmentedControl
          value={value.rhythm}
          onChange={(v) =>
            onChange({ ...value, rhythm: v as WizardPayloadT["design"]["rhythm"] })
          }
          data={[
            { label: "Balanced", value: "balanced" },
            { label: "Mostly light", value: "mostly-light" },
            { label: "Mostly dark", value: "mostly-dark" },
          ]}
        />
        <Text size="xs" c="dimmed">
          Balanced: alternate every 3–5 slides. Mostly light/dark biases the agent's selection.
        </Text>
      </Stack>

      <Stack gap={4}>
        <Switch
          label="Include agenda slide near the start"
          checked={value.includeAgenda}
          onChange={(e) => onChange({ ...value, includeAgenda: e.currentTarget.checked })}
        />
        <Switch
          label="Include Thank You / Closing slide"
          checked={value.includeThankYou}
          onChange={(e) => onChange({ ...value, includeThankYou: e.currentTarget.checked })}
        />
        <Switch
          label="Generate a hero image (Gemini 3 Pro Image, 4:3) and embed via createImage"
          checked={value.generateHeroImage}
          onChange={(e) => onChange({ ...value, generateHeroImage: e.currentTarget.checked })}
        />
      </Stack>

      <Stack gap={6}>
        <Title order={5}>Preferred visual layouts (optional)</Title>
        <Text size="xs" c="dimmed">
          Pick any number to bias the agent's layout selection. Selection order is treated as
          priority. Empty = the agent decides everything.
        </Text>
        <LayoutCatalogGrid
          selected={value.preferredLayoutIds}
          onChange={(ids) => onChange({ ...value, preferredLayoutIds: ids })}
        />
      </Stack>

      <Card withBorder radius="md" padding="md">
        <Stack gap="xs">
          <Text fw={600} size="sm">
            Designer Agent override (optional, per-run)
          </Text>
          <Text size="xs" c="dimmed">
            Paste a Devs.ai agent UUID to override the default agent for this run only. Leave empty
            to use the agent linked in <code>.env</code>.
          </Text>
          <TextInput
            placeholder="e.g. c7b960d8-e667-413b-a083-f85c538ccef5"
            value={agentIdOverride ?? ""}
            onChange={(e) => {
              const v = e.currentTarget.value.trim();
              onAgentIdOverrideChange(v || undefined);
            }}
          />
          {noMcpAgent && (
            <Alert color="yellow" variant="light" icon={<IconBulb size={16} />} radius="md">
              The default agent id (<code>{defaultAgentId || "unset"}</code>) looks like a raw LLM
              model rather than a Devs.ai agent with Google Drive MCP tools. Without an MCP-capable
              agent the run will plan the deck but won't actually create one in Slides.
            </Alert>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
