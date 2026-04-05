// SoundwaveScript — Core contract between LLM output and Remotion input.
// All scene durations are derived from TTS audio length + padding.

export interface SoundwaveTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  fontFamily?: string;
}

export interface ScriptMeta {
  title: string;
  description: string;
  fps: number;
  width: number;
  height: number;
  theme: SoundwaveTheme;
}

// --- Scene Props ---

export interface TitleProps {
  heading: string;
  subheading?: string;
  logo?: string;
  background?: string;
}

export interface ShowcaseProps {
  images: string[];
  caption?: string;
  animation?: "zoom" | "pan" | "fade";
}

export interface CTAProps {
  heading: string;
  url?: string;
  buttonText?: string;
  logo?: string;
}

export interface ScreenRecordingProps {
  clip: string;              // path in public/clips/
  startTime?: number;        // seconds into clip to start (default 0)
  endTime?: number;          // seconds into clip to end (default: end of clip)
  muteOriginal?: boolean;    // strip original audio (default true)
}

// --- Annotation Types (percentage-based coordinates 0-100) ---

export interface ArrowAnnotation {
  kind: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  startFrame?: number;
  endFrame?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface BoxAnnotation {
  kind: "box";
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame?: number;
  endFrame?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  fill?: string;
}

export interface CircleAnnotation {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
  startFrame?: number;
  endFrame?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface TextAnnotation {
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  startFrame?: number;
  endFrame?: number;
  color?: string;
  opacity?: number;
}

export type Annotation = ArrowAnnotation | BoxAnnotation | CircleAnnotation | TextAnnotation;

// --- Asciinema Props ---

export interface AsciinemaProps {
  cast: string;                // path to .cast file in public/casts/
  theme?: "dark" | "light" | "monokai" | "solarized";
  fontSize?: number;
  showHeader?: boolean;
  headerTitle?: string;
  speed?: number;
  startTime?: number;
}

// --- Scene Types ---

export interface TitleScene {
  type: "title";
  narration: string;
  audioFile?: string;
  annotations?: Annotation[];
  props: TitleProps;
}

export interface ShowcaseScene {
  type: "showcase";
  narration: string;
  audioFile?: string;
  annotations?: Annotation[];
  props: ShowcaseProps;
}

export interface CallToActionScene {
  type: "callToAction";
  narration: string;
  audioFile?: string;
  annotations?: Annotation[];
  props: CTAProps;
}

export interface ScreenRecordingScene {
  type: "screenRecording";
  narration: string;
  audioFile?: string;
  annotations?: Annotation[];
  props: ScreenRecordingProps;
}

export interface AsciinemaScene {
  type: "asciinema";
  narration: string;
  audioFile?: string;
  annotations?: Annotation[];
  props: AsciinemaProps;
}

export type Scene = TitleScene | ShowcaseScene | CallToActionScene | ScreenRecordingScene | AsciinemaScene;

// --- Full Script ---

export interface SoundwaveScript {
  meta: ScriptMeta;
  scenes: Scene[];
}

// --- Runtime types (used by pipeline, not serialized) ---

export interface SceneWithTiming {
  scene: Scene;
  audioDurationMs: number;
  audioPath: string;
  startFrame: number;
  durationInFrames: number;
}

export interface AudioResult {
  filePath: string;
  durationMs: number;
}

export interface TTSOptions {
  voiceId?: string;
  speed?: number;
  outputPath: string;
}

export interface TTSProvider {
  name: string;
  generateAudio(text: string, options: TTSOptions): Promise<AudioResult>;
}

export interface RenderJob {
  id: string;
  scriptId: string;
  status: "pending" | "rendering" | "complete" | "failed";
  outputPath?: string;
  durationMs?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}
