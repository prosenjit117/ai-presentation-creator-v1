import { SimpleGrid, Stack, Text, Textarea, Title } from "@mantine/core";
import { AnalyticalFrameworkCard, NarrativeFrameworkCard } from "../components/FrameworkCard";
import { analyticalFrameworks, narrativeFrameworks } from "../data/frameworks";
import type { WizardPayloadT } from "../lib/wizardSchema";

type Props = {
  value: WizardPayloadT["framework"];
  onChange: (v: WizardPayloadT["framework"]) => void;
};

export function StepFramework({ value, onChange }: Props) {
  const toggleAnalytical = (id: string) => {
    onChange({
      ...value,
      analyticalIds: value.analyticalIds.includes(id)
        ? value.analyticalIds.filter((x) => x !== id)
        : [...value.analyticalIds, id],
    });
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Framework</Title>
        <Text c="dimmed" size="sm">
          Pick the deck-narrative framework. Optionally pick one or more analytical frameworks the
          agent should weave in where natural (e.g. SWOT inside a section, Porter's 5 in the
          competitive context slide).
        </Text>
      </div>

      <Stack gap={6}>
        <Title order={5}>Narrative framework</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {narrativeFrameworks.map((fw) => (
            <NarrativeFrameworkCard
              key={fw.id}
              fw={fw}
              selected={value.narrativeId === fw.id}
              onSelect={(id) => onChange({ ...value, narrativeId: id })}
            />
          ))}
        </SimpleGrid>
      </Stack>

      <Stack gap={6}>
        <Title order={5}>Analytical frameworks (optional, multi-select)</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
          {analyticalFrameworks.map((fw) => (
            <AnalyticalFrameworkCard
              key={fw.id}
              fw={fw}
              selected={value.analyticalIds.includes(fw.id)}
              onToggle={toggleAnalytical}
            />
          ))}
        </SimpleGrid>
      </Stack>

      <Textarea
        label="Optional outline / structure"
        description="If you already have a draft outline, paste it here. Otherwise the agent will design the structure."
        placeholder="1. Title&#10;2. Why now&#10;3. Recommendation&#10;4. ..."
        minRows={4}
        autosize
        value={value.freeformOutline ?? ""}
        onChange={(e) =>
          onChange({ ...value, freeformOutline: e.currentTarget.value || undefined })
        }
      />
    </Stack>
  );
}
