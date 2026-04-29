import {
  Stack,
  Textarea,
  TextInput,
  SegmentedControl,
  NumberInput,
  Title,
  Text,
  SimpleGrid,
} from "@mantine/core";
import type { WizardPayloadT } from "../lib/wizardSchema";

type Props = {
  value: WizardPayloadT["context"];
  onChange: (v: WizardPayloadT["context"]) => void;
};

export function StepContext({ value, onChange }: Props) {
  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Context</Title>
        <Text c="dimmed" size="sm">
          Tell the agent why this deck exists and what success looks like.
        </Text>
      </div>
      <Textarea
        label="Purpose"
        placeholder="What problem does this deck solve, and what should the audience understand or do afterward?"
        minRows={3}
        autosize
        required
        value={value.purpose}
        onChange={(e) => onChange({ ...value, purpose: e.currentTarget.value })}
      />
      <Textarea
        label="Single key message"
        placeholder="If they remember one thing, what is it?"
        minRows={2}
        autosize
        required
        value={value.keyMessage}
        onChange={(e) => onChange({ ...value, keyMessage: e.currentTarget.value })}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Stack gap={6}>
          <Text size="sm" fw={500}>
            Tone
          </Text>
          <SegmentedControl
            value={value.tone}
            onChange={(v) =>
              onChange({ ...value, tone: v as WizardPayloadT["context"]["tone"] })
            }
            data={[
              { label: "Executive", value: "executive" },
              { label: "Technical", value: "technical" },
              { label: "Sales", value: "sales" },
              { label: "Workshop", value: "workshop" },
            ]}
          />
        </Stack>
        <NumberInput
          label="Approximate slide count"
          min={3}
          max={40}
          required
          value={value.lengthSlides}
          onChange={(v) =>
            onChange({
              ...value,
              lengthSlides: typeof v === "number" ? v : Number(v) || 10,
            })
          }
        />
      </SimpleGrid>
      <TextInput
        label="Call to action (optional)"
        placeholder="e.g. Approve the rollout for the Q4 cohort"
        value={value.cta ?? ""}
        onChange={(e) => onChange({ ...value, cta: e.currentTarget.value })}
      />
    </Stack>
  );
}
