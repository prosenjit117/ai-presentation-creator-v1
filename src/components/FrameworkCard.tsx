import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { AnalyticalFramework, NarrativeFramework } from "../data/frameworks";

export function NarrativeFrameworkCard({
  fw,
  selected,
  onSelect,
}: {
  fw: NarrativeFramework;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Card
      withBorder
      radius="md"
      padding="md"
      style={{
        cursor: "pointer",
        borderColor: selected ? "var(--mantine-color-royal-6)" : undefined,
        borderWidth: selected ? 2 : 1,
      }}
      onClick={() => onSelect(fw.id)}
    >
      <Stack gap={6}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={600} size="sm">
            {fw.name}
          </Text>
          {fw.default && (
            <Badge size="xs" color="royal" variant="light">
              default
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {fw.use}
        </Text>
      </Stack>
    </Card>
  );
}

export function AnalyticalFrameworkCard({
  fw,
  selected,
  onToggle,
}: {
  fw: AnalyticalFramework;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Card
      withBorder
      radius="md"
      padding="md"
      style={{
        cursor: "pointer",
        borderColor: selected ? "var(--mantine-color-royal-6)" : undefined,
        borderWidth: selected ? 2 : 1,
      }}
      onClick={() => onToggle(fw.id)}
    >
      <Stack gap={4}>
        <Text fw={600} size="sm">
          {fw.name}
        </Text>
        <Text size="xs" c="dimmed">
          {fw.use}
        </Text>
      </Stack>
    </Card>
  );
}
