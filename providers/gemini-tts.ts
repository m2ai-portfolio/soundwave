import { GoogleGenAI } from "@google/genai";
import { writeFileSync } from "fs";
import { execSync } from "child_process";
import type { TTSProvider, TTSOptions, AudioResult } from "./tts-interface";
import { getAudioDurationMs } from "../src/lib/audio-utils";

// Gemini TTS voices: Zephyr, Puck, Charon, Kore, Fenrir, Aoede, Leda,
// Orus, Schedar, Achernar, Gacrux, Procyon, etc.
const DEFAULT_VOICE = "Kore";

function pcmToWav(pcmBuffer: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export class GeminiTTS implements TTSProvider {
  name = "gemini-tts";
  private client: GoogleGenAI;
  private defaultVoice: string;

  constructor(apiKey: string, voice?: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.defaultVoice = voice || DEFAULT_VOICE;
  }

  async generateAudio(text: string, options: TTSOptions): Promise<AudioResult> {
    const voice = options.voiceId || this.defaultVoice;

    const response = await this.client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: text,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    });

    // Extract PCM audio data from response
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (!part?.inlineData?.data) {
      throw new Error("No audio data in Gemini TTS response");
    }

    const pcmBuffer = Buffer.from(part.inlineData.data, "base64");

    // Convert PCM to WAV (Gemini outputs raw PCM at 24kHz)
    const wavBuffer = pcmToWav(pcmBuffer, 24000);

    // Write WAV, then convert to MP3 via ffmpeg for smaller files
    const wavPath = options.outputPath.replace(/\.mp3$/, ".wav");
    writeFileSync(wavPath, wavBuffer);

    // Convert WAV to MP3
    execSync(
      `npx remotion ffmpeg -i "${wavPath}" -y -q:a 2 "${options.outputPath}" 2>/dev/null`,
    );

    // Clean up WAV
    try {
      require("fs").unlinkSync(wavPath);
    } catch {
      // ignore
    }

    const durationMs = getAudioDurationMs(options.outputPath);

    return {
      filePath: options.outputPath,
      durationMs,
    };
  }
}
