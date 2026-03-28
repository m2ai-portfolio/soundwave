import type { TTSProvider, TTSOptions, AudioResult } from "./tts-interface";

// Stub — implement when needed
export class OpenAITTS implements TTSProvider {
  name = "openai-tts";

  async generateAudio(_text: string, _options: TTSOptions): Promise<AudioResult> {
    throw new Error("OpenAI TTS provider not yet implemented");
  }
}
