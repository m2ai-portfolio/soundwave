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

// --- Annotation schemas (percentage-based coordinates 0-100) ---

const annotationBaseSchema = {
  startFrame: z.number().int().optional(),
  endFrame: z.number().int().optional(),
  color: z.string().optional(),
  strokeWidth: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
};

const arrowAnnotationSchema = z.object({
  kind: z.literal("arrow"),
  x1: z.number().min(0).max(100),
  y1: z.number().min(0).max(100),
  x2: z.number().min(0).max(100),
  y2: z.number().min(0).max(100),
  ...annotationBaseSchema,
});

const boxAnnotationSchema = z.object({
  kind: z.literal("box"),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  fill: z.string().optional(),
  ...annotationBaseSchema,
});

const circleAnnotationSchema = z.object({
  kind: z.literal("circle"),
  cx: z.number().min(0).max(100),
  cy: z.number().min(0).max(100),
  r: z.number().min(0).max(100),
  ...annotationBaseSchema,
});

const textAnnotationSchema = z.object({
  kind: z.literal("text"),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  text: z.string(),
  fontSize: z.number().optional(),
  startFrame: z.number().int().optional(),
  endFrame: z.number().int().optional(),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

const annotationSchema = z.discriminatedUnion("kind", [
  arrowAnnotationSchema,
  boxAnnotationSchema,
  circleAnnotationSchema,
  textAnnotationSchema,
]);

const annotationsSchema = z.array(annotationSchema).optional();

// --- Scene schemas ---

const titleSceneSchema = z.object({
  type: z.literal("title"),
  narration: z.string(),
  audioFile: z.string().optional(),
  annotations: annotationsSchema,
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
  audioFile: z.string().optional(),
  annotations: annotationsSchema,
  props: z.object({
    images: z.array(z.string()).min(1),
    caption: z.string().optional(),
    animation: z.enum(["zoom", "pan", "fade"]).optional(),
  }),
});

const ctaSceneSchema = z.object({
  type: z.literal("callToAction"),
  narration: z.string(),
  audioFile: z.string().optional(),
  annotations: annotationsSchema,
  props: z.object({
    heading: z.string(),
    url: z.string().optional(),
    buttonText: z.string().optional(),
    logo: z.string().optional(),
  }),
});

const screenRecordingSceneSchema = z.object({
  type: z.literal("screenRecording"),
  narration: z.string(),
  audioFile: z.string().optional(),
  annotations: annotationsSchema,
  props: z.object({
    clip: z.string(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    muteOriginal: z.boolean().optional(),
  }),
});

const asciinemaSceneSchema = z.object({
  type: z.literal("asciinema"),
  narration: z.string(),
  audioFile: z.string().optional(),
  annotations: annotationsSchema,
  props: z.object({
    cast: z.string(),
    theme: z.enum(["dark", "light", "monokai", "solarized"]).optional(),
    fontSize: z.number().optional(),
    showHeader: z.boolean().optional(),
    headerTitle: z.string().optional(),
    speed: z.number().optional(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
  }),
});

const sceneSchema = z.discriminatedUnion("type", [
  titleSceneSchema,
  showcaseSceneSchema,
  ctaSceneSchema,
  screenRecordingSceneSchema,
  asciinemaSceneSchema,
]);

export const soundwaveScriptSchema = z.object({
  meta: metaSchema,
  scenes: z.array(sceneSchema).min(1),
});

export type ValidatedScript = z.infer<typeof soundwaveScriptSchema>;
