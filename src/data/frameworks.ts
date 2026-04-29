// The agent's enabled consulting skills + analytical frameworks.
// Step 5 surfaces these so users pick a deck-narrative framework explicitly.
// The agent activates the matching skill internally.

export interface NarrativeFramework {
  id: string;
  name: string;
  default: boolean;
  use: string;
}

export interface AnalyticalFramework {
  id: string;
  name: string;
  use: string;
}

export const narrativeFrameworks: NarrativeFramework[] = [
  {
    id: "pyramid",
    name: "Pyramid Principle",
    default: true,
    use: "Answer-first: state recommendation, then MECE arguments, then evidence.",
  },
  {
    id: "scr",
    name: "Situation - Complication - Resolution",
    default: false,
    use: "Strategic recommendations, problem-solving decks, board briefings.",
  },
  {
    id: "scqa",
    name: "Situation - Complication - Question - Answer",
    default: false,
    use: "Analytical deep-dives, research, data-driven insight presentations.",
  },
  {
    id: "what-sowhat",
    name: "What - So What - Now What",
    default: false,
    use: "Operational reviews, performance updates, QBRs.",
  },
  {
    id: "options",
    name: "Options Assessment",
    default: false,
    use: "Compare 3-4 options against weighted criteria with a recommendation.",
  },
  {
    id: "thesis-anti",
    name: "Thesis - Antithesis - Synthesis",
    default: false,
    use: "Reconciling pros/cons of a strategic decision into a balanced recommendation.",
  },
  {
    id: "exec-summary",
    name: "Single Executive Summary slide",
    default: false,
    use: "One-slide narrative arc: Headline + Situation + Complication + Resolution + Key Metric.",
  },
  {
    id: "recommendation",
    name: "Single Recommendation slide",
    default: false,
    use: "One-slide recommended action with 3-4 supporting reasons.",
  },
];

export const analyticalFrameworks: AnalyticalFramework[] = [
  { id: "porters-5", name: "Porter's Five Forces", use: "Industry attractiveness / competitive dynamics." },
  { id: "swot", name: "SWOT Analysis", use: "Holistic situational assessment in a 2x2." },
  {
    id: "pestel",
    name: "PESTEL",
    use: "Macro-environmental factors (Political/Economic/Social/Technological/Environmental/Legal).",
  },
  { id: "value-chain", name: "Value Chain (Porter)", use: "Where value is created or where operational inefficiencies exist." },
  { id: "ansoff", name: "Ansoff Matrix", use: "Growth strategy options across product x market." },
  { id: "mck-7s", name: "McKinsey 7-S", use: "Org alignment / transformation readiness." },
  { id: "three-horizons", name: "McKinsey Three Horizons", use: "Innovation pipeline / portfolio across H1/H2/H3." },
  { id: "bcg-matrix", name: "BCG Growth-Share Matrix", use: "Portfolio prioritization (Stars/Cash Cows/Question Marks/Dogs)." },
  { id: "kotter-8", name: "Kotter's 8-Step Change", use: "Change management / transformation roadmap." },
  { id: "raci", name: "RACI Matrix", use: "Roles + responsibilities for initiatives." },
  { id: "platform-flywheel", name: "Platform Flywheel", use: "Sellers x Selection x Buyers x Revenue reinforcing loop." },
  {
    id: "build-buy-partner",
    name: "Build-Buy-Partner",
    use: "Capability/technology decision across speed/cost/control/risk.",
  },
  {
    id: "digital-maturity",
    name: "Digital Maturity Model",
    use: "Ad-hoc -> Developing -> Defined -> Managed -> Optimized.",
  },
];

export const narrativeFrameworksById = Object.fromEntries(
  narrativeFrameworks.map((f) => [f.id, f]),
) as Record<string, NarrativeFramework>;

export const analyticalFrameworksById = Object.fromEntries(
  analyticalFrameworks.map((f) => [f.id, f]),
) as Record<string, AnalyticalFramework>;
