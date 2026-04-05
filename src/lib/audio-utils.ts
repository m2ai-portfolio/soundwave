import { execSync } from "child_process";

/**
 * Get audio file duration in milliseconds using ffprobe.
 * Uses Remotion's bundled ffprobe binary.
 */
export function getAudioDurationMs(filePath: string): number {
  const result = execSync(
    `npx remotion ffprobe -v quiet -print_format json -show_format "${filePath}"`,
    { encoding: "utf-8" },
  );
  const parsed = JSON.parse(result);
  return Math.round(parseFloat(parsed.format.duration) * 1000);
}
