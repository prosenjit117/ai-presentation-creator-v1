import { Stack, TextInput, Select, Title, Text, SimpleGrid } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import type { WizardPayloadT } from "../lib/wizardSchema";

type Props = {
  value: WizardPayloadT["basics"];
  onChange: (v: WizardPayloadT["basics"]) => void;
};

export function StepBasics({ value, onChange }: Props) {
  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Basics</Title>
        <Text c="dimmed" size="sm">
          Quick metadata for the deck.
        </Text>
      </div>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Presentation title"
          placeholder="e.g. Q3 Marketplace Billing Update"
          required
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.currentTarget.value })}
        />
        <Select
          label="Audience"
          required
          placeholder="Select an audience"
          data={[
            "Executive leadership",
            "Sales engineering",
            "Customer success",
            "Engineering",
            "Workshop participants",
            "External customer",
          ]}
          value={value.audience || null}
          onChange={(v) => onChange({ ...value, audience: v ?? "" })}
          searchable
        />
        <TextInput
          label="Author"
          required
          placeholder="Your name"
          value={value.author}
          onChange={(e) => onChange({ ...value, author: e.currentTarget.value })}
        />
        <DatePickerInput
          label="Date"
          required
          placeholder="Pick a date"
          value={value.date ? new Date(value.date) : null}
          onChange={(d) => {
            const iso = d ? new Date(d as string | Date).toISOString().slice(0, 10) : "";
            onChange({ ...value, date: iso });
          }}
        />
      </SimpleGrid>
    </Stack>
  );
}
