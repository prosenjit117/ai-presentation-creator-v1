import { Accordion, Badge, Card, Code, CopyButton, Group, Stack, Text, Tooltip, ActionIcon, ScrollArea } from "@mantine/core";
import { IconCopy, IconCheck, IconShield } from "@tabler/icons-react";

interface Props {
  systemPrompt: string;
  userPrompt: string;
}

function formatBytes(s: string): string {
  const bytes = new Blob([s]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function approxTokens(s: string): number {
  // rough char/4 estimate
  return Math.round(s.length / 4);
}

function PromptCard({ label, content, accent }: { label: string; content: string; accent: "wizard" | "user" }) {
  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs">
          {accent === "wizard" && (
            <Badge color="royal" variant="light" leftSection={<IconShield size={12} />}>
              Wizard owns this
            </Badge>
          )}
          <Text size="sm" fw={600}>
            {label}
          </Text>
          <Text size="xs" c="dimmed">
            {formatBytes(content)} · ~{approxTokens(content).toLocaleString()} tokens
          </Text>
        </Group>
        <CopyButton value={content}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied" : "Copy"}>
              <ActionIcon variant="subtle" color={copied ? "teal" : "gray"} onClick={copy}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      <ScrollArea.Autosize mah={400} type="auto">
        <Code block style={{ whiteSpace: "pre-wrap", fontSize: 11, lineHeight: 1.5 }}>
          {content}
        </Code>
      </ScrollArea.Autosize>
    </Card>
  );
}

/**
 * Inspector that shows the FULL computed system + user prompts that will be
 * sent to the agent. Step 6 of the wizard. v3-specific: surfaces the OVERRIDE
 * NOTICE prominently so users understand the wizard owns the spec.
 */
export function SystemPromptInspector({ systemPrompt, userPrompt }: Props) {
  const overrideNoticeVisible = systemPrompt.startsWith("OVERRIDE NOTICE");

  return (
    <Stack gap="md">
      {overrideNoticeVisible && (
        <Card withBorder radius="md" p="md" style={{ borderColor: "var(--mantine-color-royal-6)" }}>
          <Group gap="xs" mb={6}>
            <IconShield size={16} />
            <Text fw={600} size="sm">
              Override architecture
            </Text>
            <Badge color="royal" variant="filled" size="sm">
              v3
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            This wizard owns the full operating spec (brand, layouts, frameworks, geometry, construction kit). Every call begins with an OVERRIDE NOTICE telling the agent to ignore its baked-in instructions, skills, and Knowledge Retrieval and follow only this spec. The agent is used as a thin transport for its Google Drive MCP and Image Generation tools.
          </Text>
        </Card>
      )}

      <Accordion variant="separated" defaultValue={["system"]} multiple>
        <Accordion.Item value="system">
          <Accordion.Control>
            <Group gap="xs">
              <Text fw={600}>System prompt</Text>
              <Badge size="xs" color="royal" variant="light">
                {formatBytes(systemPrompt)}
              </Badge>
              <Text size="xs" c="dimmed">
                ~{approxTokens(systemPrompt).toLocaleString()} tokens
              </Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <PromptCard label="System message (sent on every call)" content={systemPrompt} accent="wizard" />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="user">
          <Accordion.Control>
            <Group gap="xs">
              <Text fw={600}>User prompt</Text>
              <Badge size="xs" color="navy" variant="light">
                {formatBytes(userPrompt)}
              </Badge>
              <Text size="xs" c="dimmed">
                ~{approxTokens(userPrompt).toLocaleString()} tokens
              </Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <PromptCard label="User brief (composed from your wizard inputs)" content={userPrompt} accent="user" />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
