// 14 visual layouts (v3): now include `predefinedLayout` (almost always BLANK) and
// rich `use` descriptions the agent uses to drive createShape + updateShapeProperties.
export type LayoutTone = "light" | "dark" | "split" | "dark-gradient" | "teal-gradient";

export interface VisualLayout {
  id: string;
  name: string;
  tone: LayoutTone;
  predefinedLayout: string;
  use: string;
}

export const visualLayouts: VisualLayout[] = [
  {
    id: "title-cover",
    name: "Title (Cover)",
    tone: "dark-gradient",
    predefinedLayout: "BLANK",
    use: "Opening slide. Background: Navy with light center-left glow approximated by overlapping ELLIPSE shapes (Royal -> Sky alpha gradient). Title: thin white Inter, vertically centered middle-left, max 3 lines. Subtitle: bold UPPERCASE Sky, 1 line. Speaker info bottom-left: 'Name | Date' in white.",
  },
  {
    id: "section-divider",
    name: "Section Divider",
    tone: "teal-gradient",
    predefinedLayout: "BLANK",
    use: "Background: light Mint left -> Forest right approximated by overlapping RECTANGLEs with alpha. Title left-aligned vertical-center Navy thin Arial, max 2 lines. Subtitle below in bold UPPERCASE Royal.",
  },
  {
    id: "content-light",
    name: "Standard Content (Light)",
    tone: "light",
    predefinedLayout: "BLANK",
    use: "White background. Right ~25% has the geometric-pattern construction-kit recipe. Headline top-left, one line, Navy thin Inter. Content area below for text/bullets/charts/images.",
  },
  {
    id: "content-dark",
    name: "Standard Content (Dark)",
    tone: "dark",
    predefinedLayout: "BLANK",
    use: "Navy background + slightly-lighter-navy geometric pattern recipe on right ~25%. Headline top-left in Sky or White, thin Inter. Body text White or Sky.",
  },
  {
    id: "headline-subtitle",
    name: "Headline + Subtitle",
    tone: "light",
    predefinedLayout: "BLANK",
    use: "Same as content-light plus a Subtitle directly below the headline in bold UPPERCASE Navy.",
  },
  {
    id: "two-column",
    name: "Two-Column",
    tone: "light",
    predefinedLayout: "BLANK",
    use: "content-light + two equal columns (50/50) below the headline. Visually balanced. Use for text+text, text+image, pros+cons, before+after.",
  },
  {
    id: "three-column",
    name: "Three-Column",
    tone: "light",
    predefinedLayout: "BLANK",
    use: "content-light + three equal columns (33/33/33) below the headline. Concise per column.",
  },
  {
    id: "chart-diagram",
    name: "Chart / Diagram",
    tone: "dark",
    predefinedLayout: "BLANK",
    use: "Navy background. Title top-left in White/Sky up to 3 lines. Bullet description below. Right two-thirds: white/Cloud rectangular container holding the chart. Chart series colors in priority Navy -> Sky -> Mint -> Forest -> Royal.",
  },
  {
    id: "three-icons",
    name: "Centered Title + Three Icons",
    tone: "split",
    predefinedLayout: "BLANK",
    use: "Top half white, bottom half Cloud (split via two RECTANGLE backgrounds). Title centered top in Navy. Below: three columns each with an icon image (use Image Generation if needed) + 2-3 lines of caption text.",
  },
  {
    id: "stats-callout",
    name: "Stats Callout + Two-Column Bullets",
    tone: "light",
    predefinedLayout: "BLANK",
    use: "content-light + Royal banner card (right side) containing a large Mint/Sky stat number and white description. Two columns of bullets below, with the three-level bullet hierarchy.",
  },
  {
    id: "quote-with-bullets",
    name: "Quote + Two-Column Bullets",
    tone: "dark",
    predefinedLayout: "BLANK",
    use: "Navy background. Title top-left in Sky. Quote card variant (Sky/Royal/Mint) in a corner with quote marks. Two columns of light text bullets fill the rest.",
  },
  {
    id: "centered-stats-bullets",
    name: "Centered Stats + Two-Column Bullets",
    tone: "light",
    predefinedLayout: "BLANK",
    use: "content-light. Two columns of bullets in middle. Forest strip across bottom-left containing a Sky icon/number + white description.",
  },
  {
    id: "full-quote",
    name: "Full Quote (with headshot)",
    tone: "dark",
    predefinedLayout: "BLANK",
    use: "Navy background + geometric pattern. Left: headshot ELLIPSE/IMAGE placeholder + name (white) + title (bold UPPERCASE white). Right: large Sky quote text with large Sky quotation marks above.",
  },
  {
    id: "thank-you",
    name: "Thank You / Closing",
    tone: "dark-gradient",
    predefinedLayout: "BLANK",
    use: "Background like title-cover but with the glow centered. Centered 'Thank You' text in thin white. No other content.",
  },
];

export const toneLabel: Record<LayoutTone, string> = {
  light: "Light",
  dark: "Dark",
  split: "Split",
  "dark-gradient": "Dark gradient",
  "teal-gradient": "Teal gradient",
};

export const toneSwatch: Record<LayoutTone, string> = {
  light: "#F0F0F0",
  dark: "#011B58",
  split: "linear-gradient(180deg,#FFFFFF 50%,#F0F0F0 50%)",
  "dark-gradient": "linear-gradient(135deg,#011B58 0%,#0629D3 60%,#ABE7FF 100%)",
  "teal-gradient": "linear-gradient(90deg,#CDFDDA 0%,#014929 100%)",
};
