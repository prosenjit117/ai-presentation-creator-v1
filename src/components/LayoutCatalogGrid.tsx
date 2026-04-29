import { Badge, Card, Checkbox, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { visualLayouts, type VisualLayout, type LayoutTone } from "../data/layouts";

const toneColor: Record<LayoutTone, string> = {
  light: "gray",
  dark: "navy",
  split: "violet",
  "dark-gradient": "royal",
  "teal-gradient": "teal",
};

const toneLabel: Record<LayoutTone, string> = {
  light: "Light",
  dark: "Dark",
  split: "Split",
  "dark-gradient": "Dark gradient",
  "teal-gradient": "Teal gradient",
};

export function LayoutCatalogGrid({
  selected,
  onChange,
  readOnly = false,
}: {
  selected: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
}) {
  const toggle = (id: string) => {
    if (readOnly || !onChange) return;
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
      {visualLayouts.map((l: VisualLayout) => {
        const isSel = selected.includes(l.id);
        return (
          <Card
            key={l.id}
            withBorder
            radius="md"
            padding="md"
            style={{
              cursor: readOnly ? "default" : "pointer",
              borderColor: isSel ? "var(--mantine-color-royal-6)" : undefined,
              borderWidth: isSel ? 2 : 1,
              opacity: readOnly && !isSel ? 0.5 : 1,
            }}
            onClick={() => toggle(l.id)}
          >
            <Stack gap={6}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Text fw={600} size="sm">
                  {l.name}
                </Text>
                {!readOnly && (
                  <Checkbox
                    checked={isSel}
                    onChange={() => toggle(l.id)}
                    onClick={(e) => e.stopPropagation()}
                    size="xs"
                    aria-label={`Select ${l.name}`}
                  />
                )}
              </Group>
              <Group gap={6}>
                <Badge variant="light" color={toneColor[l.tone]} size="xs">
                  {toneLabel[l.tone]}
                </Badge>
                <Badge variant="default" size="xs">
                  {l.predefinedLayout}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {l.use}
              </Text>
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
