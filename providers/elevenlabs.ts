import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { execSync } from "child_process";
import type { TTSProvider, TTSOptions, AudioResult } from "./tts-interface";

function getAudioDurationMs(filePath: string): number {
  // Use ffprobe to get duration — Remotion bundles ffmpeg
  const result = execSync(
    `npx remotion ffprobe -v quiet -print_format json -show_format "${filePath}"`,
    { encoding: "utf-8" },
  );
  const parsed = JSON.parse(result);
  return Math.round(parseFloat(parsed.format.duration) * 1000);
}

export class ElevenLabsTTS implements TTSProvider {
  name = "elevenlabs";
  private client: ElevenLabsClient;
  private defaultVoiceId: string;

  constructor(apiKey: string, voiceId: string) {
    this.client = new ElevenLabsClient({ apiKey });
    this.defaultVoiceId = voiceId;
  }

  async generateAudio(text: string, options: TTSOptions): Promise<AudioResult> {
    const voiceId = options.voiceId || this.defaultVoiceId;

    const audioStream = await this.client.textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    const writeStream = createWriteStream(options.outputPath);
    // audioStream is a Readable
    await pipeline(audioStream as unknown as NodeJS.ReadableStream, writeStream);

    const durationMs = getAudioDurationMs(options.outputPath);

    return {
      filePath: options.outputPath,
      durationMs,
    };
  }
}
