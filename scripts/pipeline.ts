#!/usr/bin/env npx tsx
/**
 * Soundwave Pipeline — Brief to MP4
 *
 * Usage:
 *   npx tsx scripts/pipeline.ts "Create a 30 second demo video for Sprinkle of Sage"
 *   npx tsx scripts/pipeline.ts --script path/to/script.json
 *   npx tsx scripts/pipeline.ts --no-audio "brief"     # Skip TTS, use default scene timing
 */
import path from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from "fs";
import { config } from "dotenv";
import { nanoid } from "nanoid";
import { generateScript } from "./generate-script";
import { generateAllAudio } from "./generate-audio";
import { computeSceneTiming, renderVideo } from "./render-video";
import { ensureAssets } from "./ensure-assets";
import { GeminiTTS } from "../providers/gemini-tts";
import { soundwaveScriptSchema } from "../src/lib/schema";
import { getDb } from "./db";
import type { SoundwaveScript } from "../src/lib/types";

// Load API keys
config({ path: path.resolve(process.env.HOME || "~", ".env.shared") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// TTS: Gemini TTS (uses same GEMINI_API_KEY as script generation)

async function main() {
  const rawArgs = process.argv.slice(2);
  const noAudio = rawArgs.includes("--no-audio");
  const args = rawArgs.filter((a) => a !== "--no-audio");

  if (args.length === 0) {
    console.error("Usage: npx tsx scripts/pipeline.ts \"<brief>\"");
    console.error("       npx tsx scripts/pipeline.ts --script <path.json>");
    console.error("       npx tsx scripts/pipeline.ts --no-audio \"<brief>\"");
    process.exit(1);
  }

  const db = getDb();
  const runId = nanoid(10);
  const audioDir = path.resolve("audio");
  const outputDir = path.resolve("output");

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  if (!existsSync(audioDir)) mkdirSync(audioDir, { recursive: true });

  let script: SoundwaveScript;
  let brief: string;

  // --- Step 1: Get or generate script ---
  if (args[0] === "--script" && args[1]) {
    console.log("Loading script from file...");
    const raw = readFileSync(args[1], "utf-8");
    script = soundwaveScriptSchema.parse(JSON.parse(raw)) as SoundwaveScript;
    brief = `[loaded from ${args[1]}]`;
  } else {
    brief = args.join(" ");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in ~/.env.shared");
      process.exit(1);
    }
    console.log(`\n[1/4] Generating script from brief...`);
    console.log(`  Brief: "${brief}"`);
    script = await generateScript(brief, GEMINI_API_KEY);
    console.log(`  Generated: "${script.meta.title}" (${script.scenes.length} scenes)`);
  }

  // Save script to DB
  db.prepare("INSERT INTO scripts (id, brief, script_json) VALUES (?, ?, ?)").run(
    runId,
    brief,
    JSON.stringify(script, null, 2),
  );

  // Save script JSON for inspection
  const scriptPath = path.join(outputDir, `${runId}-script.json`);
  writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  console.log(`  Script saved: ${scriptPath}`);

  // --- Step 1.5: Ensure all referenced images exist ---
  console.log(`\nChecking assets...`);
  const missingAssets = ensureAssets(script);
  if (missingAssets.length === 0) {
    console.log(`  All assets present`);
  } else {
    console.log(`  Created ${missingAssets.length} placeholder(s)`);
  }

  // --- Step 2: Generate TTS audio ---
  type AudioManifestItem = { sceneIndex: number; narration: string; filePath: string; durationMs: number };
  let audioManifest: AudioManifestItem[];

  if (noAudio) {
    console.log(`\n[2/4] Skipping TTS (--no-audio mode)...`);
    audioManifest = script.scenes.map((scene, i) => ({
      sceneIndex: i,
      narration: scene.narration || "",
      filePath: "",
      durationMs: 0,
    }));
  } else {
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in ~/.env.shared (needed for TTS)");
      process.exit(1);
    }
    console.log(`\n[2/4] Generating TTS audio (Gemini)...`);
    const ttsProvider = new GeminiTTS(GEMINI_API_KEY);
    audioManifest = await generateAllAudio(script, runId, ttsProvider, db, audioDir);

    // Copy audio files to public/ so Remotion's staticFile() can find them
    const publicAudioDir = path.resolve("public", "audio", runId);
    if (!existsSync(publicAudioDir)) mkdirSync(publicAudioDir, { recursive: true });
    for (const a of audioManifest) {
      if (a.filePath) {
        // Custom audio files are already in public/ -- check if path is already under public
        const publicDir = path.resolve("public");
        if (a.filePath.startsWith(publicDir)) {
          // Already in public, no copy needed -- update filePath to be relative for staticFile()
          continue;
        }
        const dest = path.join(publicAudioDir, path.basename(a.filePath));
        cpSync(a.filePath, dest);
      }
    }
  }

  // --- Step 3: Compute timing ---
  console.log(`\n[3/4] Computing scene timing...`);
  const { sceneTiming, totalFrames } = computeSceneTiming(script, audioManifest);
  const totalSeconds = totalFrames / script.meta.fps;
  console.log(`  Total: ${totalFrames} frames (${totalSeconds.toFixed(1)}s)`);
  for (const st of sceneTiming) {
    console.log(
      `  ${st.scene.type}: ${st.durationInFrames} frames (${(st.durationInFrames / script.meta.fps).toFixed(1)}s)`,
    );
  }

  // --- Step 4: Render video ---
  console.log(`\n[4/4] Rendering video...`);
  const outputPath = path.join(outputDir, `${runId}.mp4`);

  // Track render in DB
  const renderId = nanoid(10);
  db.prepare(
    "INSERT INTO renders (id, script_id, status) VALUES (?, ?, 'rendering')",
  ).run(renderId, runId);

  try {
    const result = await renderVideo(script, sceneTiming, totalFrames, outputPath);

    db.prepare(
      "UPDATE renders SET status = 'complete', output_path = ?, duration_ms = ?, completed_at = datetime('now') WHERE id = ?",
    ).run(result.outputPath, result.durationMs, renderId);

    console.log(`\nDone! Output: ${result.outputPath}`);
    console.log(`Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    console.log(`Run ID: ${runId}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    db.prepare(
      "UPDATE renders SET status = 'failed', error = ?, completed_at = datetime('now') WHERE id = ?",
    ).run(errorMsg, renderId);
    console.error(`\nRender failed: ${errorMsg}`);
    process.exit(1);
  }
}

main();
