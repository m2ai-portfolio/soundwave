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
