import { Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { brandTokens, brandColorOrder, type BrandColorKey } from "../data/brand";

function isLight(hex: string) {
  const v = hex.replace("#", "");
  const n = parseInt(v, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  // perceived luminance
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

export function BrandPalette() {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <Title order={4}>AppDirect Brand Palette</Title>
        <Text size="xs" c="dimmed">
          9 colors · agent owns full brand system
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 3 }} spacing="sm">
        {brandColorOrder.map((key) => {
          const c = brandTokens.colors[key as BrandColorKey];
          const fg = isLight(c.hex) ? "#011B58" : "#FFFFFF";
          return (
            <Card key={c.id} withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
              <div
                style={{
                  background: c.hex,
                  color: fg,
                  padding: 16,
                  minHeight: 90,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Text fw={700} size="sm">
                  {c.name}
                </Text>
                <Text size="xs" style={{ fontFamily: "ui-monospace, monospace", opacity: 0.85 }}>
                  {c.hex}
                </Text>
              </div>
              <Stack gap={2} p="xs">
                <Text size="xs" c="dimmed">
                  id: {c.id}
                </Text>
                <Text size="xs">{c.usage}</Text>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
      <Text size="xs" c="dimmed">
        Type: {brandTokens.typography.primaryFamily} · Page: {brandTokens.page.aspect} (
        {brandTokens.page.widthEmu.toLocaleString()} × {brandTokens.page.heightEmu.toLocaleString()} EMU) ·
        Voice: {brandTokens.voice}
      </Text>
    </Stack>
  );
}
