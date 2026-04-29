import { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  Burger,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  Title,
  Badge,
  Alert,
  Anchor,
  Box,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconArrowRight,
  IconBrandGoogleDrive,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconPalette,
  IconPresentation,
  IconRestore,
  IconSparkles,
  IconUserCircle,
  IconFileDescription,
  IconFiles,
  IconRoute,
  IconWand,
} from "@tabler/icons-react";
import { stepValidators } from "./lib/wizardSchema";
import type { AgentResultT, WizardPayloadT } from "./lib/wizardSchema";
import { StepBasics } from "./wizard/StepBasics";
import { StepContext } from "./wizard/StepContext";
import { StepSources } from "./wizard/StepSources";
import { StepDesign } from "./wizard/StepDesign";
import { StepFramework } from "./wizard/StepFramework";
import { StepReview } from "./wizard/StepReview";
import { StepGenerate } from "./wizard/StepGenerate";
import { StepResult } from "./wizard/StepResult";
import { brandTokens, brandColorOrder } from "./data/brand";
import { visualLayouts } from "./data/layouts";
import { agentCapabilities } from "./data/capabilities";

type View = "landing" | "wizard";

const STEP_DEFS = [
  { label: "Basics", description: "Metadata", icon: IconFileDescription },
  { label: "Context", description: "Why & what", icon: IconUserCircle },
  { label: "Sources", description: "Notes & files", icon: IconFiles },
  { label: "Design", description: "Layout hints", icon: IconLayoutGrid },
  { label: "Framework", description: "Narrative", icon: IconRoute },
  { label: "Review", description: "Final brief", icon: IconWand },
  { label: "Generate", description: "AI run", icon: IconSparkles },
  { label: "Result", description: "Open deck", icon: IconPresentation },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDraft: WizardPayloadT = {
  basics: { title: "", audience: "", author: "", date: todayIso() },
  context: {
    purpose: "",
    keyMessage: "",
    tone: "executive",
    lengthSlides: 10,
    cta: "",
  },
  sources: { notes: "", attachments: [], links: [] },
  design: {
    referenceSlidesUrl: undefined,
    preferredLayoutIds: [],
    rhythm: "balanced",
    generateHeroImage: false,
    includeAgenda: true,
    includeThankYou: true,
  },
  framework: {
    narrativeId: "pyramid",
    analyticalIds: [],
    freeformOutline: undefined,
  },
};

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [opened, { toggle }] = useDisclosure();
  const [draft, setDraft] = useLocalStorage<WizardPayloadT>({
    key: "presentation-creator:draft:v3",
    defaultValue: emptyDraft,
  });
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<AgentResultT | null>(null);
  const [rawCapture, setRawCapture] = useState<{
    streamed: string;
    jsonBlock: string | null;
  } | null>(null);

  // Validate per step (gates Next button).
  const stepValid = useMemo(() => {
    return [
      stepValidators.basics.safeParse(draft.basics).success,
      stepValidators.context.safeParse(draft.context).success,
      stepValidators.sources.safeParse(draft.sources).success,
      stepValidators.design.safeParse(draft.design).success,
      stepValidators.framework.safeParse(draft.framework).success,
      true, // review
      true, // generate
      true, // result
    ];
  }, [draft]);

  useEffect(() => {
    if (view === "wizard") window.scrollTo({ top: 0 });
  }, [active, view]);

  function next() {
    setActive((i) => Math.min(i + 1, STEP_DEFS.length - 1));
  }
  function prev() {
    setActive((i) => Math.max(i - 1, 0));
  }
  function reset() {
    setDraft(emptyDraft);
    setActive(0);
    setResult(null);
    setRawCapture(null);
  }

  function handleRefine(instruction: string) {
    if (!result) return;
    setDraft({
      ...draft,
      refinement: {
        previousPresentationId: result.presentationId,
        previousPresentationUrl: result.presentationUrl,
        instruction,
      },
    });
    setActive(6); // back to Generate
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={
        view === "wizard"
          ? { width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {view === "wizard" && (
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            )}
            <Group gap={8}>
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background:
                    "linear-gradient(135deg,#011B58 0%,#0629D3 60%,#ABE7FF 100%)",
                }}
              />
              <Stack gap={0}>
                <Text fw={700} size="sm">
                  AI Presentation Creator
                </Text>
                <Text size="xs" c="dimmed" mt={-2}>
                  AppDirect brand · v1
                </Text>
              </Stack>
            </Group>
          </Group>
          <Group gap="xs">
            {view === "wizard" ? (
              <>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconRestore size={14} />}
                  onClick={reset}
                >
                  Reset draft
                </Button>
                <Button variant="default" size="xs" onClick={() => setView("landing")}>
                  Home
                </Button>
              </>
            ) : (
              <Button
                size="xs"
                color="royal"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => setView("wizard")}
              >
                Start a deck
              </Button>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      {view === "wizard" && (
        <AppShell.Navbar p="md">
          <Stack gap="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Steps
            </Text>
            {STEP_DEFS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === active;
              const reachable = i <= active || stepValid.slice(0, i).every(Boolean);
              return (
                <Card
                  key={s.label}
                  withBorder
                  radius="md"
                  p="xs"
                  onClick={() => reachable && setActive(i)}
                  style={{
                    cursor: reachable ? "pointer" : "not-allowed",
                    opacity: reachable ? 1 : 0.5,
                    background: isActive ? "rgba(6,41,211,0.1)" : undefined,
                    borderColor: isActive ? "var(--mantine-color-royal-6)" : undefined,
                  }}
                >
                  <Group gap="xs" wrap="nowrap">
                    <Icon size={16} />
                    <Stack gap={0} style={{ minWidth: 0 }}>
                      <Text size="sm" fw={isActive ? 600 : 500}>
                        {i + 1}. {s.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {s.description}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </AppShell.Navbar>
      )}

      <AppShell.Main>
        {view === "landing" ? (
          <Landing onStart={() => setView("wizard")} />
        ) : (
          <Container size="lg">
            <Stack gap="lg">
              <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
                {STEP_DEFS.map((s) => (
                  <Stepper.Step key={s.label} label={s.label} description={s.description} />
                ))}
              </Stepper>

              <Card withBorder radius="lg" p="xl">
                {active === 0 && (
                  <StepBasics
                    value={draft.basics}
                    onChange={(basics) => setDraft({ ...draft, basics })}
                  />
                )}
                {active === 1 && (
                  <StepContext
                    value={draft.context}
                    onChange={(context) => setDraft({ ...draft, context })}
                  />
                )}
                {active === 2 && (
                  <StepSources
                    value={draft.sources}
                    onChange={(sources) => setDraft({ ...draft, sources })}
                  />
                )}
                {active === 3 && (
                  <StepDesign
                    value={draft.design}
                    onChange={(design) => setDraft({ ...draft, design })}
                    agentIdOverride={draft.agentIdOverride}
                    onAgentIdOverrideChange={(id) =>
                      setDraft({ ...draft, agentIdOverride: id })
                    }
                  />
                )}
                {active === 4 && (
                  <StepFramework
                    value={draft.framework}
                    onChange={(framework) => setDraft({ ...draft, framework })}
                  />
                )}
                {active === 5 && <StepReview payload={draft} />}
                {active === 6 && (
                  <StepGenerate
                    payload={draft}
                    result={result}
                    onResult={(r) => {
                      setResult(r);
                      // Clear refinement so next click of Generate doesn't keep refining unintentionally.
                      const next = { ...draft };
                      delete next.refinement;
                      setDraft(next);
                    }}
                    onRawCapture={setRawCapture}
                  />
                )}
                {active === 7 && (
                  <StepResult
                    result={result}
                    payload={draft}
                    rawCapture={rawCapture}
                    onRefine={handleRefine}
                    onBackToGenerate={() => setActive(6)}
                  />
                )}
              </Card>

              <Group justify="space-between">
                <Button
                  variant="default"
                  onClick={prev}
                  disabled={active === 0}
                  leftSection={<IconChevronLeft size={16} />}
                >
                  Back
                </Button>
                <Group gap="xs">
                  {active < 5 && !stepValid[active] && (
                    <Badge color="yellow" variant="light">
                      Fill required fields to continue
                    </Badge>
                  )}
                  {active === 7 ? (
                    <Button onClick={() => setActive(6)} variant="light">
                      Re-run generation
                    </Button>
                  ) : (
                    <Button
                      onClick={next}
                      color="royal"
                      rightSection={<IconChevronRight size={16} />}
                      disabled={active < 5 && !stepValid[active]}
                    >
                      {active === 6 ? "Continue to result" : "Next"}
                    </Button>
                  )}
                </Group>
              </Group>
            </Stack>
          </Container>
        )}
      </AppShell.Main>
    </AppShell>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  const heroSwatches = brandColorOrder.slice(0, 6).map((k) => brandTokens.colors[k].hex);

  return (
    <Container size="lg">
      <Stack gap="xl" py="xl">
        <Stack gap="sm" align="flex-start">
          <Badge color="royal" variant="light" size="lg">
            <Group gap={6} align="center">
              <IconSparkles size={12} />
              <span>AppDirect AI Presentation Creator</span>
            </Group>
          </Badge>
          <Title order={1} style={{ maxWidth: 760, lineHeight: 1.15 }}>
            Brand-perfect Google Slides decks, generated by your Designer agent.
          </Title>
          <Text c="dimmed" size="lg" style={{ maxWidth: 720 }}>
            An 8-step wizard captures your brief, then asks the{" "}
            <strong>{agentCapabilities.agentName}</strong> agent — which has Google Drive MCP and
            Gemini 3 Pro Image access — to build the deck. The agent owns the brand system; this
            UI never re-paints brand rules into prompts.
          </Text>
          <Group mt="md">
            <Button
              size="md"
              color="royal"
              rightSection={<IconArrowRight size={16} />}
              onClick={onStart}
            >
              Start the wizard
            </Button>
            <Button
              size="md"
              variant="default"
              component="a"
              href="https://devs.ai"
              target="_blank"
              rel="noreferrer"
            >
              About devs.ai
            </Button>
          </Group>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="lg" p="lg">
            <Group gap={8} mb="xs">
              <IconPalette size={18} color="#0629D3" />
              <Text fw={600}>9-color brand palette</Text>
            </Group>
            <Text size="sm" c="dimmed" mb="xs">
              Navy, Cloud, Sky, Royal, Mint, Forest, Coral, Marigold, Purple — the agent never
              ventures outside this set.
            </Text>
            <Group gap={6}>
              {heroSwatches.map((hex) => (
                <Box
                  key={hex}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: hex,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              ))}
            </Group>
          </Card>
          <Card withBorder radius="lg" p="lg">
            <Group gap={8} mb="xs">
              <IconLayoutGrid size={18} color="#0629D3" />
              <Text fw={600}>{visualLayouts.length} visual layouts</Text>
            </Group>
            <Text size="sm" c="dimmed">
              The agent paints from a curated library of cover, divider, content, two/three-column,
              chart, stats-callout, quote, and closing layouts.
            </Text>
          </Card>
          <Card withBorder radius="lg" p="lg">
            <Group gap={8} mb="xs">
              <IconBrandGoogleDrive size={18} color="#0629D3" />
              <Text fw={600}>Google Drive MCP</Text>
            </Group>
            <Text size="sm" c="dimmed">
              <code>createPresentation</code>, <code>updatePresentation</code> (createSlide,
              createShape, createImage, createTable, updateTextStyle, updateShapeProperties),{" "}
              <code>getPageThumbnail</code>, and more.
            </Text>
          </Card>
        </SimpleGrid>

        <Alert
          color="royal"
          variant="light"
          icon={<IconAlertCircle size={16} />}
          title="How this app works"
        >
          <Text size="sm">
            This UI never calls Google APIs directly. It composes a <i>structured brief</i> (your
            inputs + a tight delivery contract) and sends it to your Designer agent at{" "}
            <Anchor href="https://devs.ai" target="_blank" rel="noreferrer">
              devs.ai
            </Anchor>
            . The agent uses its baked-in brand instructions, knowledge base, and 22 consulting
            skills to plan the deck, then executes <code>createPresentation</code> +{" "}
            <code>updatePresentation</code> via the Drive MCP. We never re-paste palette hexes,
            layout descriptions, or framework definitions — the agent already has them.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
