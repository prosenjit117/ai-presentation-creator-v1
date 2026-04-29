import { Badge, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconBrandGoogleDrive,
  IconPhoto,
  IconBook2,
  IconAlertTriangle,
  IconShield,
} from "@tabler/icons-react";
import { agentCapabilities } from "../data/capabilities";

export function AgentCapabilitiesPanel() {
  const c = agentCapabilities.tools;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <Title order={4}>Agent Capabilities</Title>
        <Group gap={6}>
          <Badge variant="light" color="royal" leftSection={<IconShield size={10} />}>
            Wizard owns the spec
          </Badge>
          <Badge variant="light" color="navy">
            {agentCapabilities.agentName}
          </Badge>
          <Badge variant="default">{agentCapabilities.modelId}</Badge>
        </Group>
      </Group>

      <Text size="xs" c="dimmed">
        Used as: {agentCapabilities.usedAs}
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
        {/* Drive MCP */}
        <Card withBorder radius="md" padding="md">
          <Stack gap={6}>
            <Group gap={6}>
              <ThemeIcon size="sm" variant="light" color="royal">
                <IconBrandGoogleDrive size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Google Drive MCP
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Tools: {c.googleDriveMcp.selectedTools.join(", ")}
            </Text>
            <Text size="xs" c="dimmed">
              updatePresentation request types:{" "}
              {c.googleDriveMcp.updatePresentationRequestTypes.join(", ")}
            </Text>
            <Text size="xs" c="dimmed">
              createSlide predefinedLayouts:{" "}
              {c.googleDriveMcp.createSlidePredefinedLayouts.join(", ")}
            </Text>
            <Text size="xs" c="dimmed">
              Shape types: {c.googleDriveMcp.createShapeShapeTypes.join(", ")}
            </Text>
          </Stack>
        </Card>

        {/* Image generation */}
        <Card withBorder radius="md" padding="md">
          <Stack gap={6}>
            <Group gap={6}>
              <ThemeIcon size="sm" variant="light" color="violet">
                <IconPhoto size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Image Generation
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Model: {c.imageGeneration.modelId}
            </Text>
            <Text size="xs" c="dimmed">
              Aspect: {c.imageGeneration.aspectRatio} · Samples: {c.imageGeneration.samples}
            </Text>
            <Text size="xs" c="dimmed">
              {c.imageGeneration.outputUsage}
            </Text>
          </Stack>
        </Card>

        {/* Knowledge retrieval */}
        <Card withBorder radius="md" padding="md">
          <Stack gap={6}>
            <Group gap={6}>
              <ThemeIcon size="sm" variant="light" color="teal">
                <IconBook2 size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Knowledge Retrieval
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {c.knowledgeRetrieval.note}
            </Text>
          </Stack>
        </Card>

        {/* MCP limits */}
        <Card withBorder radius="md" padding="md">
          <Stack gap={6}>
            <Group gap={6}>
              <ThemeIcon size="sm" variant="light" color="orange">
                <IconAlertTriangle size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                MCP limits the wizard respects
              </Text>
            </Group>
            <Stack gap={4}>
              {c.googleDriveMcp.limits.map((lim) => (
                <Text key={lim} size="xs" c="dimmed">
                  • {lim}
                </Text>
              ))}
            </Stack>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
