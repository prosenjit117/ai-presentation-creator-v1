import type { WizardPayloadT } from "./wizardSchema";
import { agentCapabilities } from "../data/capabilities";
import { brandTokens, brandGuidelinesMarkdown } from "../data/brand";
import { visualLayouts } from "../data/layouts";
import { narrativeFrameworks, analyticalFrameworks } from "../data/frameworks";
import { constructionKit } from "../data/constructionKit";

// ===========================================================================
// SYSTEM PROMPT (v3) — RICH, owned by the wizard.
// The wizard embeds the full operating spec on every call. The OVERRIDE NOTICE
// at the top tells the agent to ignore its baked-in brand/skills/Knowledge
// Retrieval for this conversation. This is the architectural inversion vs v2.
// Target length: ~12-18 KB.
// ===========================================================================
export function buildSystemPrompt(): string {
  const c = agentCapabilities.tools.googleDriveMcp;

  const sections: string[] = [];

  // 1) OVERRIDE NOTICE + EXECUTION MANDATE (top-of-context, highest priority)
  sections.push(
    [
      "OVERRIDE NOTICE",
      "================",
      "You are the \"AppDirect Presentation Creator and Designer\" agent. For this conversation,",
      "ignore your baked-in instructions, skills, knowledge-base content, and prior brand",
      "interpretations. Treat the spec below as the SINGLE SOURCE OF TRUTH. If anything in your",
      "stored knowledge contradicts this spec, prefer this spec.",
      "",
      "You are being used as a thin transport for your Google Drive MCP and Image Generation",
      "tools. The wizard owns the brand prompt, layouts, frameworks, geometry, and construction",
      "kit. Do not import outside knowledge from your previous instructions about colors,",
      "layouts, frameworks, or content rules. Use only what follows.",
      "",
      "EXECUTION MANDATE (read carefully — this overrides any default Q&A behavior)",
      "----------------------------------------------------------------------------",
      "This is NOT a Q&A or planning task. This IS a build-and-execute task.",
      "",
      "1. You MUST call the Google Drive MCP tools to actually create the presentation. Calling",
      "   `createPresentation` followed by `updatePresentation` batchUpdate requests is REQUIRED.",
      "   Narrating a plan without calling MCP tools is a FAILURE of this task.",
      "2. You MUST end your final assistant message with EXACTLY ONE fenced ```json``` block",
      "   matching the AGENT RESULT SCHEMA at the bottom of this prompt. Returning narrative",
      "   without that JSON block is a FAILURE of this task.",
      "3. Keep your prose minimal between MCP tool calls. Save your output budget for the JSON",
      "   block — it is the only deliverable that matters to the calling system.",
      "4. If the input brief is long (e.g. embedded transcripts), DO NOT echo or summarize it",
      "   back. Extract the key points, plan ~N slides, then go straight to MCP execution.",
      "",
      "Failure mode to avoid: producing a long planning narrative, running out of output tokens,",
      "and never reaching the MCP calls or the JSON block. To avoid this: execute first, narrate",
      "second, JSON-block last.",
    ].join("\n"),
  );

  // 2) Hard delivery contract
  sections.push(
    [
      "HARD DELIVERY CONTRACT",
      "======================",
      "- Build the deck via your Google Drive MCP. Start with `createPresentation` (16:9), then",
      "  use `updatePresentation` batchUpdate to add slides and paint visuals.",
      `- \`createSlide.predefinedLayout\` may only be one of: ${c.createSlidePredefinedLayouts.join(", ")}.`,
      "  For our 14 visual layouts, BLANK is almost always the right choice — we paint the",
      "  visuals via `createShape` + `updateShapeProperties`.",
      `- You may use ${c.updatePresentationRequestTypes.map((r) => `\`${r}\``).join(", ")}.`,
      `- \`createShape.shapeType\` may only be one of: ${c.createShapeShapeTypes.join(", ")}.`,
      "- You MAY NOT call `updateParagraphStyle` (not exposed by this MCP). Approximate paragraph",
      "  positioning via shape size + position.",
      "- You MAY NOT duplicate / clone a Drive file. (See referenceSlidesUrl rule below for the",
      "  supported way to build on top of an existing deck.)",
      "- If `design.generateHeroImage = true`, use the Image Generation tool (Gemini 3 Pro Image,",
      "  4:3) and embed the returned URL via `createImage`.",
      "- **If `design.referenceSlidesUrl` is provided, USE THAT PRESENTATION as the base deck for",
      "  this run.** Extract its `presentationId` from the URL, call `getPresentation` on it to",
      "  read its existing structure, then apply your `updatePresentation` batchUpdate calls",
      "  DIRECTLY to that same `presentationId`. Do NOT call `createPresentation`. Return that",
      "  same `presentationId` and `presentationUrl` in the final JSON result.",
      "  Only when `referenceSlidesUrl` is NOT provided should you start with `createPresentation`",
      "  (blank, 16:9).",
      "- Use ONLY the 9-color brand palette and ONLY the 14 visual layouts in this spec.",
    ].join("\n"),
  );

  // 3) BrandTokens JSON (verbatim)
  sections.push(
    [
      "BRAND TOKENS (authoritative)",
      "============================",
      "```json",
      JSON.stringify(brandTokens, null, 2),
      "```",
    ].join("\n"),
  );

  // 4) Brand guidelines markdown
  sections.push(
    [
      "BRAND GUIDELINES",
      "================",
      brandGuidelinesMarkdown,
    ].join("\n"),
  );

  // 5) Visual layouts (the only 14 the agent may use)
  sections.push(
    [
      "VISUAL LAYOUT CATALOG (14 — these are the ONLY allowed visual layouts)",
      "======================================================================",
      "```json",
      JSON.stringify(visualLayouts, null, 2),
      "```",
    ].join("\n"),
  );

  // 6) Framework catalog
  sections.push(
    [
      "FRAMEWORK CATALOG",
      "=================",
      "```json",
      JSON.stringify({ narrativeFrameworks, analyticalFrameworks }, null, 2),
      "```",
    ].join("\n"),
  );

  // 7) Geometry primer
  sections.push(
    [
      "GEOMETRY PRIMER (Google Slides API)",
      "===================================",
      "- Page size: `9144000 x 5143500 EMU` (16:9). Origin top-left.",
      "- Shape base size: `3000000 x 3000000 EMU`. Final rendered size = base * scale.",
      "  Position via `transform.translateX/translateY` in EMU from top-left.",
      "- Conversions: `1 inch = 914400 EMU`, `1 cm = 360000 EMU`, `1 pt = 12700 EMU`.",
      "- `Unit` enum: `EMU` for sizes/positions/outline weight/shadow blur; `PT` for fontSize,",
      "  indents, paragraph spacing.",
      "- All `transform` objects must include `unit: \"EMU\"`.",
    ].join("\n"),
  );

  // 8) Construction kit (the heart of v3)
  sections.push(
    [
      "CONSTRUCTION KIT (reusable batchUpdate fragments — clone these verbatim)",
      "========================================================================",
      "These are the ONLY shape recipes you should use. Substitute `{slidePageId}`, `{objectId}`,",
      "`{transform}`, and `{colorRgb01}` as needed. Compose composite recipes via the listed steps.",
      "",
      "```json",
      JSON.stringify(constructionKit, null, 2),
      "```",
    ].join("\n"),
  );

  // 9) Workflow
  sections.push(
    [
      "WORKFLOW (mandatory order, per slide)",
      "=====================================",
      "1. Establish the target presentation:",
      "   - If `design.referenceSlidesUrl` is provided in the brief, extract its `presentationId`",
      "     from the URL and use THAT as the target for all subsequent `updatePresentation` calls.",
      "     Call `getPresentation` once on it first to read its existing slide structure so your",
      "     additions or replacements compose cleanly with what is already there. Skip the blank",
      "     `createPresentation` call entirely.",
      "   - Otherwise, call `createPresentation` (blank, 16:9) and capture the resulting",
      "     `presentationId`.",
      "2. For each planned slide: `createSlide { predefinedLayout: BLANK }` (or another",
      "   predefined enum if it materially helps).",
      "3. Apply the chosen visual layout's recipe in this order:",
      "   a) background `fullSlideBackground` (with the layout's tone color)",
      "   b) `geometricPatternRight` if the layout calls for it",
      "   c) any callout cards / banners / strips from the construction kit",
      "   d) text shapes via `createShape` (TEXT_BOX) + `insertText` + the matching textRecipe",
      "   e) any images (`createImage`) — including those generated via the Image Generation tool",
      "4. After every slide, validate:",
      "   - chars per text run within bounds (title <= 8 words, bullets <= 5 lines, line <= 70 chars)",
      "   - no overflow (shorten content rather than shrinking fonts)",
      "   - colors restricted to the 9-palette",
      "   - fonts in {Inter, Arial}",
      "   - `predefinedLayout` and `visualLayoutId` recorded in your slide plan",
      "5. Final assistant message: ONE fenced ```json``` block matching the AgentResult schema",
      "   below. NO prose after the JSON.",
    ].join("\n"),
  );

  // 10) Refinement mode
  sections.push(
    [
      "REFINEMENT MODE",
      "===============",
      "If the user message contains `refinement.previousPresentationId`, do NOT create a new",
      "presentation. Open it via `getPresentation` and apply incremental `updatePresentation`",
      "calls. Return the SAME `presentationUrl` and `presentationId` in the JSON result, with",
      "an updated `slidesPlanned` reflecting the changes.",
    ].join("\n"),
  );

  // 11) JSON schema for AgentResult
  sections.push(
    [
      "AGENT RESULT SCHEMA (the exact shape of the final fenced JSON block)",
      "====================================================================",
      "```json",
      JSON.stringify(
        {
          presentationUrl: "string (URL)",
          presentationId: "string",
          slidesPlanned: [
            {
              index: "number (>= 1)",
              title: "string",
              visualLayoutId: "string (id from VisualLayoutCatalog)",
              predefinedLayout: "string (one of the predefinedLayout enum values)",
              framework: "string (optional, an analyticalFramework id)",
              rationale: "string",
            },
          ],
          imagesGenerated: [{ url: "string (URL)", purpose: "string" }],
          warnings: ["string"],
        },
        null,
        2,
      ),
      "```",
      "",
      "Return EXACTLY ONE fenced ```json block matching this schema. No prose after the block.",
    ].join("\n"),
  );

  return sections.join("\n\n");
}

// ===========================================================================
// USER PROMPT (v3) — clean markdown brief composed from the wizard payload.
// ===========================================================================
export function buildUserPrompt(payload: WizardPayloadT): string {
  const { basics, context, sources, design, framework, refinement } = payload;

  const lines: string[] = [];

  if (refinement) {
    lines.push("## REFINEMENT REQUEST");
    lines.push(`- Previous presentationId: ${refinement.previousPresentationId}`);
    lines.push(`- Previous URL: ${refinement.previousPresentationUrl}`);
    lines.push(`- Change request: ${refinement.instruction}`);
    lines.push("");
    lines.push("Open the existing presentation and apply incremental `updatePresentation` calls.");
    lines.push("Do NOT create a new deck. Return the same presentationId/URL.");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("## Brief");
  lines.push("");
  lines.push(`**Title:** ${basics.title}`);
  lines.push(`**Audience:** ${basics.audience || "(unspecified)"}`);
  lines.push(`**Author:** ${basics.author || "(unspecified)"}`);
  lines.push(`**Date:** ${basics.date || "(unspecified)"}`);
  lines.push(`**Tone:** ${context.tone}`);
  lines.push(`**Target length:** ${context.lengthSlides} slides`);
  if (context.cta) lines.push(`**Call to action:** ${context.cta}`);
  lines.push("");

  lines.push("## Purpose");
  lines.push(context.purpose);
  lines.push("");

  lines.push("## Key message (single sentence the audience must take away)");
  lines.push(context.keyMessage);
  lines.push("");

  lines.push("## Sources");
  lines.push("");
  lines.push("### Notes");
  lines.push(sources.notes?.trim() ? sources.notes : "(none)");
  lines.push("");

  lines.push("### Attachments");
  if (sources.attachments.length === 0) {
    lines.push("(none)");
  } else {
    for (const a of sources.attachments) {
      const excerpt = (a.textContent || "").slice(0, 2000);
      lines.push(`- **${a.name}** (${a.mime}) — inline excerpt:`);
      lines.push("  > " + excerpt.replace(/\n/g, "\n  > "));
    }
  }
  lines.push("");

  lines.push("### Links");
  if (sources.links.length === 0) {
    lines.push("(none)");
  } else {
    for (const l of sources.links) lines.push(`- ${l}`);
  }
  lines.push("");

  lines.push("## Design hints");
  lines.push(
    `- Preferred visual layouts (in priority order): ${
      design.preferredLayoutIds.length ? design.preferredLayoutIds.join(", ") : "(agent decides)"
    }`,
  );
  lines.push(`- Light/Dark rhythm: ${design.rhythm}`);
  lines.push(`- Include agenda slide: ${design.includeAgenda}`);
  lines.push(`- Include Thank You slide: ${design.includeThankYou}`);
  lines.push(
    `- Hero image: ${
      design.generateHeroImage
        ? "yes — please generate via Gemini 3 Pro Image (4:3) and embed"
        : "no"
    }`,
  );
  lines.push(
    `- Reference Slides URL (USE THIS as the base deck — apply updatePresentation calls directly to its presentationId; do NOT call createPresentation): ${design.referenceSlidesUrl || "(none — start from a blank createPresentation)"}`,
  );
  lines.push("");

  lines.push("## Framework");
  lines.push(`- Narrative: ${framework.narrativeId}`);
  lines.push(
    `- Analytical (apply where natural, do not force): ${
      framework.analyticalIds.length ? framework.analyticalIds.join(", ") : "(none)"
    }`,
  );
  lines.push(
    `- Outline (optional): ${
      framework.freeformOutline?.trim() ? "\n\n" + framework.freeformOutline : "(agent designs)"
    }`,
  );
  lines.push("");

  lines.push("## Delivery — EXECUTE NOW");
  lines.push("");
  lines.push(
    "Do not produce a planning narrative or restate the brief. Go directly to MCP execution:",
  );
  lines.push("");
  lines.push(
    "1. **Plan briefly** (1-3 sentences max): for each of the ~" +
      payload.context.lengthSlides +
      " slides pick a `visualLayoutId`, `predefinedLayout`, and (optional) analytical framework.",
  );
  lines.push(
    "2. **Execute via Google Drive MCP**: call `createPresentation` to get a real `presentationId`,",
    "   then a sequence of `updatePresentation` batchUpdate calls applying the construction-kit",
    "   recipes from the system prompt. Calling MCP is REQUIRED — narrating a plan without MCP",
    "   calls is a failure.",
  );
  lines.push(
    "3. **Return the JSON block**: end your final message with EXACTLY ONE fenced ```json``` block",
    "   matching the AgentResult schema in the system prompt. Use the actual `presentationId` and",
    "   `presentationUrl` returned by `createPresentation`. NO prose after the JSON.",
  );
  lines.push("");
  lines.push(
    "Reminder: the calling system parses ONLY the JSON block. Long narration burns output tokens",
    "with no benefit. Stay concise; let the MCP tool calls do the work.",
  );

  return lines.join("\n");
}
