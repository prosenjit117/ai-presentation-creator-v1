// AppDirect brand tokens (v3): 9-color palette + typography.
// In v3, the wizard OWNS the brand spec and embeds it verbatim in the system prompt
// on every call (with an OVERRIDE NOTICE telling the agent to ignore its baked rules).
export const brandTokens = {
  colors: {
    primary: {
      id: "navy",
      name: "Navy",
      hex: "#011B58",
      rgb01: { red: 0.003921569, green: 0.105882354, blue: 0.34509805 },
      usage: "Primary backgrounds, headline text on light slides",
    },
    surface: {
      id: "cloud",
      name: "Cloud",
      hex: "#F0F0F0",
      rgb01: { red: 0.941, green: 0.941, blue: 0.941 },
      usage: "Light slide backgrounds, content areas",
    },
    onDark: {
      id: "sky",
      name: "Sky",
      hex: "#ABE7FF",
      rgb01: { red: 0.671, green: 0.906, blue: 1.0 },
      usage: "Accent highlights, subtitle text on dark, big-number callouts on dark",
    },
    accent: {
      id: "royal",
      name: "Royal",
      hex: "#0629D3",
      rgb01: { red: 0.024, green: 0.161, blue: 0.827 },
      usage: "Accent blocks, callout banners, quote backgrounds, subtitle text on light",
    },
    mint: {
      id: "mint",
      name: "Mint",
      hex: "#CDFDDA",
      rgb01: { red: 0.804, green: 0.992, blue: 0.855 },
      usage: "Accent blocks, quote card backgrounds (light variant), callout strips",
    },
    forest: {
      id: "forest",
      name: "Forest",
      hex: "#014929",
      rgb01: { red: 0.004, green: 0.286, blue: 0.161 },
      usage: "Accent blocks, callout strips, quote marks on light backgrounds",
    },
    coral: {
      id: "coral",
      name: "Coral",
      hex: "#F2555A",
      rgb01: { red: 0.949, green: 0.333, blue: 0.353 },
      usage: "Sparingly for secondary accents, data viz",
    },
    marigold: {
      id: "marigold",
      name: "Marigold",
      hex: "#FFA000",
      rgb01: { red: 1.0, green: 0.627, blue: 0.0 },
      usage: "Sparingly for secondary accents, data viz",
    },
    purple: {
      id: "purple",
      name: "Purple",
      hex: "#5326A5",
      rgb01: { red: 0.325, green: 0.149, blue: 0.647 },
      usage: "Sparingly for secondary accents, data viz",
    },
  },
  typography: {
    primaryFamily: "Inter",
    secondaryFamily: "Arial",
    weights: { thin: 200, light: 300, regular: 400, medium: 500, bold: 700 },
    case: { title: "Title Case", subtitle: "ALL UPPERCASE", body: "Sentence case" },
  },
  page: { aspect: "16:9", widthEmu: 9144000, heightEmu: 5143500 },
  shapeBaseEmu: { width: 3000000, height: 3000000 },
  voice: "Confident, consulting-oriented, succinct, outcome-focused.",
  ownership: "wizard" as const,
} as const;

export type BrandColorKey = keyof typeof brandTokens.colors;

// Ordered list for the BrandPalettePreview component
export const brandColorOrder: BrandColorKey[] = [
  "primary",
  "surface",
  "onDark",
  "accent",
  "mint",
  "forest",
  "coral",
  "marigold",
  "purple",
];

export const brandGuidelinesMarkdown = `# AppDirect Brand Guidelines (wizard-owned, override the agent's baked rules)

## Palette priority
- Navy \`#011B58\`: primary background on dark slides, headline text on light slides, dark card fills.
- Cloud \`#F0F0F0\`: light slide backgrounds, content area backgrounds.
- Sky \`#ABE7FF\`: subtitle text on dark slides, big-number callouts on dark slides, light text on Navy.
- Royal \`#0629D3\`: accent blocks, callout banners, subtitle text on light slides.
- Mint \`#CDFDDA\`: quote card backgrounds (light variant), accent strips.
- Forest \`#014929\`: callout strips, quote marks on light backgrounds.
- Coral / Marigold / Purple: sparingly for secondary accents and data viz only.

## Typography
- Inter for body content; weights 300 (light), 400 (regular), 500 (medium), 700 (bold).
- Arial only for divider/section title slides.
- Minimum body font size: 9pt. Never shrink to fit; always shorten content first.

## Voice
Confident, consulting-oriented, succinct, outcome-focused.

## Layout discipline
- Pick exactly one of the 14 visual layouts per slide.
- Apply construction-kit recipes verbatim where one fits; only deviate to satisfy content.
- Light/dark rhythm: do not place more than 3-4 consecutive slides of the same tone.
- Always include the AppDirect right-side geometric pattern on standard content slides.

## Anti-overflow rules
- Title <= 8 words. Body bullets <= 5 lines per slide. Line length <= 70 characters.
- If text won't fit, reduce content (or split the slide). Never reduce font below 9pt.
- Cards (darkCardBackground) must have at least 16pt internal padding.

## Output discipline
- Every assistant turn that completes a generation MUST end with a single fenced \`\`\`json block
  matching AgentResult. No prose after the JSON.
`;
