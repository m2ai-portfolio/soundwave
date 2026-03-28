import type { TTSProvider, TTSOptions, AudioResult } from "./tts-interface";

// Stub — implement when needed
export class GoogleTTS implements TTSProvider {
  name = "google-tts";

  async generateAudio(_text: string, _options: TTSOptions): Promise<AudioResult> {
    throw new Error("Google TTS provider not yet implemented");
  }
}
