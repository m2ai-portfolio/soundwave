import { createHash } from "crypto";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import type { TTSProvider, AudioResult } from "../providers/tts-interface";
import type { SoundwaveScript } from "../src/lib/types";
import Database from "better-sqlite3";

interface AudioManifest {
  sceneIndex: number;
  narration: string;
  filePath: string;
  durationMs: number;
}

function narrationHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

export async function generateAllAudio(
  script: SoundwaveScript,
  scriptId: string,
  provider: TTSProvider,
  db: Database.Database,
  audioDir: string,
): Promise<AudioManifest[]> {
  const scriptAudioDir = path.join(audioDir, scriptId);
  if (!existsSync(scriptAudioDir)) {
    mkdirSync(scriptAudioDir, { recursive: true });
  }

  const results: AudioManifest[] = [];

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const narration = scene.narration;

    if (!narration || narration.trim() === "") {
      results.push({
        sceneIndex: i,
        narration: "",
        filePath: "",
        durationMs: 0,
      });
      continue;
    }

    const hash = narrationHash(narration);

    // Check cache
    const cached = db
      .prepare(
        "SELECT file_path, duration_ms FROM audio_files WHERE narration_hash = ? AND provider = ?",
      )
      .get(hash, provider.name) as
      | { file_path: string; duration_ms: number }
      | undefined;

    if (cached && existsSync(cached.file_path)) {
      console.log(`  Scene ${i}: cached (${cached.duration_ms}ms)`);
      results.push({
        sceneIndex: i,
        narration,
        filePath: cached.file_path,
        durationMs: cached.duration_ms,
      });
      continue;
    }

    // Generate new audio
    const outputPath = path.join(scriptAudioDir, `scene-${i}.mp3`);
    console.log(`  Scene ${i}: generating TTS...`);

    const audio: AudioResult = await provider.generateAudio(narration, {
      outputPath,
    });

    // Cache in DB
    const id = `${scriptId}-${i}`;
    db.prepare(
      `INSERT OR REPLACE INTO audio_files (id, script_id, scene_index, narration_hash, provider, file_path, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, scriptId, i, hash, provider.name, audio.filePath, audio.durationMs);

    console.log(`  Scene ${i}: done (${audio.durationMs}ms)`);

    results.push({
      sceneIndex: i,
      narration,
      filePath: audio.filePath,
      durationMs: audio.durationMs,
    });
  }

  return results;
}
