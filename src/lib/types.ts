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

// --- Scene Types ---

export interface TitleScene {
  type: "title";
  narration: string;
  props: TitleProps;
}

export interface ShowcaseScene {
  type: "showcase";
  narration: string;
  props: ShowcaseProps;
}

export interface CallToActionScene {
  type: "callToAction";
  narration: string;
  props: CTAProps;
}

export interface ScreenRecordingScene {
  type: "screenRecording";
  narration: string;
  props: ScreenRecordingProps;
}

export type Scene = TitleScene | ShowcaseScene | CallToActionScene | ScreenRecordingScene;

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
