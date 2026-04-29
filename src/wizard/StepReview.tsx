import { Stack, Title, Text, Accordion, Code, ScrollArea, Badge, Group, Card } from "@mantine/core";
import { IconShield } from "@tabler/icons-react";
import { BrandPalette } from "../components/BrandPalette";
import { LayoutCatalogGrid } from "../components/LayoutCatalogGrid";
import { AgentCapabilitiesPanel } from "../components/AgentCapabilitiesPanel";
import { SystemPromptInspector } from "../components/SystemPromptInspector";
import { buildSystemPrompt, buildUserPrompt } from "../lib/buildPrompts";
import { narrativeFrameworksById, analyticalFrameworksById } from "../data/frameworks";
import type { WizardPayloadT } from "../lib/wizardSchema";

type Props = { payload: WizardPayloadT };

export function StepReview({ payload }: Props) {
  const sys = buildSystemPrompt();
  const usr = buildUserPrompt(payload);
  const narrative = narrativeFrameworksById[payload.framework.narrativeId];
  const analytics = payload.framework.analyticalIds
    .map((id) => analyticalFrameworksById[id]?.name ?? id)
    .join(", ");

  return (
    <Stack gap="lg">
      <div>
        <Title order={3}>Review</Title>
        <Text c="dimmed" size="sm">
          What the Designer agent will receive on Generate. In v3 the wizard owns the full
          operating spec — brand, layouts, frameworks, geometry, and a Slides-API construction
          kit — and embeds it on every call with an OVERRIDE NOTICE that supersedes the agent's
          baked instructions.
        </Text>
      </div>

      <Card withBorder radius="md" p="md" style={{ borderColor: "var(--mantine-color-royal-6)" }}>
        <Group gap="xs" mb={6}>
          <IconShield size={16} />
          <Text fw={600} size="sm">
            Wizard-owned spec
          </Text>
          <Badge color="royal" variant="filled" size="sm">
            v3
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          The system prompt below begins with an OVERRIDE NOTICE telling the agent to ignore its
          baked-in palette, skills, and Knowledge Retrieval for this conversation and follow only
          the spec the wizard provides.
        </Text>
      </Card>

      <BrandPalette />

      <Stack gap={6}>
        <Title order={4}>Selected framework</Title>
        <Text size="sm">
          <b>Narrative:</b> {narrative?.name ?? payload.framework.narrativeId} —{" "}
          <Text span c="dimmed" size="sm">
            {narrative?.use ?? "(custom)"}
          </Text>
        </Text>
        <Text size="sm">
          <b>Analytical:</b> {analytics || "(none)"}
        </Text>
      </Stack>

      {payload.design.preferredLayoutIds.length > 0 && (
        <Stack gap={6}>
          <Title order={4}>Preferred visual layouts (hint)</Title>
          <LayoutCatalogGrid selected={payload.design.preferredLayoutIds} readOnly />
        </Stack>
      )}

      <AgentCapabilitiesPanel />

      <Stack gap={6}>
        <Title order={4}>System &amp; user prompt inspector</Title>
        <Text size="xs" c="dimmed">
          Confirm the OVERRIDE NOTICE + brand + layouts + frameworks + construction kit are all
          assembled correctly before clicking Generate.
        </Text>
        <SystemPromptInspector systemPrompt={sys} userPrompt={usr} />
      </Stack>

      <Accordion variant="separated" radius="md">
        <Accordion.Item value="payload">
          <Accordion.Control>
            <Text fw={600}>Wizard payload (JSON)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <ScrollArea.Autosize mah={300}>
              <Code block style={{ fontSize: 12 }}>
                {JSON.stringify(payload, null, 2)}
              </Code>
            </ScrollArea.Autosize>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
