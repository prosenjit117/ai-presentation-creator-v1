import { useRef } from "react";
import {
  Stack,
  Textarea,
  Title,
  Text,
  Tabs,
  TagsInput,
  Button,
  Group,
  Card,
  ActionIcon,
} from "@mantine/core";
import {
  IconFileText,
  IconLink,
  IconNotes,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { WizardPayloadT } from "../lib/wizardSchema";

type Props = {
  value: WizardPayloadT["sources"];
  onChange: (v: WizardPayloadT["sources"]) => void;
};

export function StepSources({ value, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = [...value.attachments];
    for (const f of Array.from(files)) {
      if (f.size > 1_000_000) {
        notifications.show({
          color: "yellow",
          message: `${f.name} is larger than 1MB; only the first ~8KB of text content will be sent to the agent.`,
        });
      }
      try {
        const text = await f.text();
        next.push({ name: f.name, mime: f.type || "text/plain", textContent: text });
      } catch (e) {
        notifications.show({
          color: "red",
          message: `Could not read ${f.name}: ${e instanceof Error ? e.message : "error"}`,
        });
      }
    }
    onChange({ ...value, attachments: next });
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Sources</Title>
        <Text c="dimmed" size="sm">
          Notes, attachments, and links the agent should ground the deck in.
        </Text>
      </div>
      <Tabs defaultValue="notes">
        <Tabs.List>
          <Tabs.Tab value="notes" leftSection={<IconNotes size={16} />}>
            Notes
          </Tabs.Tab>
          <Tabs.Tab value="attachments" leftSection={<IconFileText size={16} />}>
            Attachments ({value.attachments.length})
          </Tabs.Tab>
          <Tabs.Tab value="links" leftSection={<IconLink size={16} />}>
            Links ({value.links.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="notes" pt="md">
          <Textarea
            placeholder="Paste any raw notes, talking points, or transcript fragments..."
            minRows={8}
            autosize
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.currentTarget.value })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="attachments" pt="md">
          <Stack gap="sm">
            <Group>
              <Button
                leftSection={<IconUpload size={16} />}
                onClick={() => fileInput.current?.click()}
                variant="light"
              >
                Upload .md / .txt / .csv
              </Button>
              <Text size="xs" c="dimmed">
                Files are read in the browser. Only the extracted text is sent to the agent.
              </Text>
            </Group>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".md,.txt,.csv,.json,text/*"
              style={{ display: "none" }}
              onChange={(e) => {
                handleFiles(e.target.files);
                if (fileInput.current) fileInput.current.value = "";
              }}
            />
            <Stack gap="xs">
              {value.attachments.map((a, i) => (
                <Card key={i} withBorder p="sm" radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={0} style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {a.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {a.mime} · {a.textContent.length.toLocaleString()} chars
                      </Text>
                    </Stack>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() =>
                        onChange({
                          ...value,
                          attachments: value.attachments.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
              {value.attachments.length === 0 && (
                <Text size="sm" c="dimmed">
                  No attachments yet.
                </Text>
              )}
            </Stack>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="links" pt="md">
          <TagsInput
            label="URLs"
            description="Press enter to add. Each must be a valid URL."
            placeholder="https://..."
            value={value.links}
            onChange={(links) => onChange({ ...value, links })}
            splitChars={[",", " "]}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
