import path from "path";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { SoundwaveScript, SceneWithTiming } from "../src/lib/types";
import { SCENE_PADDING_SECONDS, MIN_SCENE_SECONDS } from "../src/lib/theme";
import { parseCastFile, getCastDuration } from "../src/lib/asciinema-parser";

function getVideoDurationSeconds(filePath: string): number {
  const result = execSync(
    `npx remotion ffprobe -v quiet -print_format json -show_format "${filePath}"`,
    { encoding: "utf-8" },
  );
  const parsed = JSON.parse(result);
  return parseFloat(parsed.format.duration);
}

interface AudioManifest {
  sceneIndex: number;
  filePath: string;
  durationMs: number;
}

export function computeSceneTiming(
  script: SoundwaveScript,
  audioManifest: AudioManifest[],
): { sceneTiming: SceneWithTiming[]; totalFrames: number } {
  const fps = script.meta.fps;
  const sceneTiming: SceneWithTiming[] = [];
  let currentFrame = 0;

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const audio = audioManifest.find((a) => a.sceneIndex === i);
    const audioDurationMs = audio?.durationMs || 0;

    // For screen recordings, duration = clip segment length (not TTS-driven)
    // For other scenes, duration = TTS audio + padding
    let durationSeconds: number;

    if (scene.type === "screenRecording") {
      const clipPath = path.resolve("public", scene.props.clip);
      const clipDuration = getVideoDurationSeconds(clipPath);
      const start = scene.props.startTime || 0;
      const end = scene.props.endTime || clipDuration;
      durationSeconds = end - start;
    } else if (scene.type === "asciinema") {
      // Parse cast file to determine playback duration
      const castPath = path.resolve("public", scene.props.cast);
      try {
        const castContent = readFileSync(castPath, "utf-8");
        const parsed = parseCastFile(castContent);
        const speed = scene.props.speed ?? 1;
        const startTime = scene.props.startTime ?? 0;
        const castTotalDuration = getCastDuration(parsed.events);
        const castPlaybackSeconds = (castTotalDuration - startTime) / speed;
        // Take max of cast duration and audio duration
        const audioDurationSeconds = audioDurationMs / 1000;
        durationSeconds = Math.max(
          MIN_SCENE_SECONDS,
          Math.max(castPlaybackSeconds, audioDurationSeconds) + SCENE_PADDING_SECONDS,
        );
      } catch {
        // Fallback to audio-based timing if cast file can't be read
        durationSeconds = Math.max(
          MIN_SCENE_SECONDS,
          audioDurationMs / 1000 + SCENE_PADDING_SECONDS,
        );
      }
    } else {
      durationSeconds = Math.max(
        MIN_SCENE_SECONDS,
        audioDurationMs / 1000 + SCENE_PADDING_SECONDS,
      );
    }

    const durationInFrames = Math.ceil(durationSeconds * fps);

    // Audio path relative to public/ for staticFile()
    let audioPath = "";
    if (audio?.filePath) {
      // Copy audio to public/ so staticFile() can find it
      audioPath = `audio/${path.basename(path.dirname(audio.filePath))}/${path.basename(audio.filePath)}`;
    }

    sceneTiming.push({
      scene,
      audioDurationMs,
      audioPath,
      startFrame: currentFrame,
      durationInFrames,
    });

    currentFrame += durationInFrames;
  }

  return { sceneTiming, totalFrames: currentFrame };
}

export async function renderVideo(
  script: SoundwaveScript,
  sceneTiming: SceneWithTiming[],
  totalFrames: number,
  outputPath: string,
): Promise<{ outputPath: string; durationMs: number }> {
  const entryPoint = path.resolve(process.cwd(), "src/index.ts");

  console.log("Bundling project...");
  const bundled = await bundle({
    entryPoint,
    onProgress: (progress) => {
      if (progress % 25 === 0) console.log(`  Bundle: ${progress}%`);
    },
  });

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundled,
    id: "ScriptVideo",
    inputProps: { script, sceneTiming },
  });

  // Override duration with computed total
  composition.durationInFrames = totalFrames;
  composition.width = script.meta.width;
  composition.height = script.meta.height;
  composition.fps = script.meta.fps;

  console.log(
    `Rendering ${totalFrames} frames (${(totalFrames / script.meta.fps).toFixed(1)}s)...`,
  );
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: { script, sceneTiming },
    onProgress: ({ renderedFrames }) => {
      if (renderedFrames % 60 === 0) {
        console.log(`  Rendered ${renderedFrames}/${totalFrames}`);
      }
    },
  });

  const durationMs = Math.round((totalFrames / script.meta.fps) * 1000);
  console.log(`Rendered: ${outputPath} (${(durationMs / 1000).toFixed(1)}s)`);

  return { outputPath, durationMs };
}
