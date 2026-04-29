import { z } from "zod";

// ---- WizardPayload (v2) ----

export const Tone = z.enum(["executive", "technical", "sales", "workshop"]);
export const Rhythm = z.enum(["balanced", "mostly-light", "mostly-dark"]);

export const Basics = z.object({
  title: z.string().min(3),
  audience: z.string(),
  author: z.string(),
  date: z.string(),
});

export const Context = z.object({
  purpose: z.string().min(10),
  keyMessage: z.string().min(5),
  tone: Tone,
  lengthSlides: z.number().int().min(3).max(40),
  cta: z.string().optional(),
});

export const Attachment = z.object({
  name: z.string(),
  mime: z.string(),
  textContent: z.string(),
});

export const Sources = z.object({
  notes: z.string().default(""),
  attachments: z.array(Attachment).default([]),
  links: z.array(z.string().url()).default([]),
});

export const Design = z.object({
  // optional reference deck the agent may getPresentation() on for inspiration only (no copy)
  referenceSlidesUrl: z.string().url().optional(),
  preferredLayoutIds: z.array(z.string()).default([]),
  rhythm: Rhythm.default("balanced"),
  generateHeroImage: z.boolean().default(false),
  includeAgenda: z.boolean().default(true),
  includeThankYou: z.boolean().default(true),
});

export const Framework = z.object({
  narrativeId: z.string().default("pyramid"),
  analyticalIds: z.array(z.string()).default([]),
  freeformOutline: z.string().optional(),
});

export const Refinement = z.object({
  previousPresentationId: z.string(),
  previousPresentationUrl: z.string().url(),
  instruction: z.string(),
});

export const WizardPayload = z.object({
  basics: Basics,
  context: Context,
  sources: Sources,
  design: Design,
  framework: Framework,
  refinement: Refinement.optional(),
  // out-of-band per-run override (not part of the brief sent to the agent)
  agentIdOverride: z.string().optional(),
});

export type WizardPayloadT = z.infer<typeof WizardPayload>;
export type DesignT = z.infer<typeof Design>;
export type FrameworkT = z.infer<typeof Framework>;
export type RefinementT = z.infer<typeof Refinement>;
export type AttachmentT = z.infer<typeof Attachment>;

// ---- AgentResult (final fenced JSON the agent must return) ----

export const SlidePlan = z.object({
  index: z.number().int().min(1),
  title: z.string(),
  visualLayoutId: z.string(),
  predefinedLayout: z.string(),
  framework: z.string().optional(),
  rationale: z.string(),
});

export const ImageGenerated = z.object({
  url: z.string().url(),
  purpose: z.string(),
});

export const AgentResult = z.object({
  presentationUrl: z.string().url(),
  presentationId: z.string(),
  slidesPlanned: z.array(SlidePlan),
  imagesGenerated: z.array(ImageGenerated).default([]),
  warnings: z.array(z.string()).default([]),
});

export type AgentResultT = z.infer<typeof AgentResult>;
export type SlidePlanT = z.infer<typeof SlidePlan>;

// ---- Per-step validators (used to gate the Stepper Next button) ----

export const stepValidators = {
  basics: Basics,
  context: Context,
  sources: Sources,
  design: Design,
  framework: Framework,
};
