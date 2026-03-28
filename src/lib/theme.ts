import type { SoundwaveTheme } from "./types";

export const DEFAULT_THEME: SoundwaveTheme = {
  primary: "#1a1a2e",
  secondary: "#16213e",
  background: "#0f0f23",
  text: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
};

export function resolveTheme(theme?: Partial<SoundwaveTheme>): SoundwaveTheme {
  return { ...DEFAULT_THEME, ...theme };
}

// Padding added after TTS audio per scene (in seconds)
export const SCENE_PADDING_SECONDS = 1.5;

// Minimum scene duration even if no narration (in seconds)
export const MIN_SCENE_SECONDS = 2;
