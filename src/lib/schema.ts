import { z } from "zod";

const themeSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  background: z.string(),
  text: z.string(),
  fontFamily: z.string().optional(),
});

const metaSchema = z.object({
  title: z.string(),
  description: z.string(),
  fps: z.number().int().positive().default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  theme: themeSchema,
});

const titleSceneSchema = z.object({
  type: z.literal("title"),
  narration: z.string(),
  props: z.object({
    heading: z.string(),
    subheading: z.string().optional(),
    logo: z.string().optional(),
    background: z.string().optional(),
  }),
});

const showcaseSceneSchema = z.object({
  type: z.literal("showcase"),
  narration: z.string(),
  props: z.object({
    images: z.array(z.string()).min(1),
    caption: z.string().optional(),
    animation: z.enum(["zoom", "pan", "fade"]).optional(),
  }),
});

const ctaSceneSchema = z.object({
  type: z.literal("callToAction"),
  narration: z.string(),
  props: z.object({
    heading: z.string(),
    url: z.string().optional(),
    buttonText: z.string().optional(),
    logo: z.string().optional(),
  }),
});

const sceneSchema = z.discriminatedUnion("type", [
  titleSceneSchema,
  showcaseSceneSchema,
  ctaSceneSchema,
]);

export const soundwaveScriptSchema = z.object({
  meta: metaSchema,
  scenes: z.array(sceneSchema).min(1),
});

export type ValidatedScript = z.infer<typeof soundwaveScriptSchema>;
