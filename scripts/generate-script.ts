import { GoogleGenAI } from "@google/genai";
import { soundwaveScriptSchema } from "../src/lib/schema";
import type { SoundwaveScript } from "../src/lib/types";

const SYSTEM_PROMPT = `You are a video script generator for Soundwave, a programmatic video production engine.

Given a brief, produce a JSON object matching the SoundwaveScript schema exactly. No markdown, no code fences — just raw JSON.

Schema:
{
  "meta": {
    "title": string,
    "description": string,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "theme": {
      "primary": string (hex color),
      "secondary": string (hex color),
      "background": string (hex color),
      "text": string (hex color),
      "fontFamily": string (optional, CSS font stack)
    }
  },
  "scenes": [
    // Available scene types:

    // Title scene — brand intro or closing card
    { "type": "title", "narration": "voiceover text", "props": { "heading": string, "subheading"?: string, "logo"?: string, "background"?: string } }

    // Showcase scene — display images with narration
    { "type": "showcase", "narration": "voiceover text", "props": { "images": [string], "caption"?: string, "animation"?: "zoom"|"pan"|"fade" } }

    // Call to action — closing CTA
    { "type": "callToAction", "narration": "voiceover text", "props": { "heading": string, "url"?: string, "buttonText"?: string, "logo"?: string } }

    // Asciinema scene — animated terminal recording
    { "type": "asciinema", "narration": "voiceover text", "props": { "cast": "casts/filename.cast", "theme"?: "dark"|"light"|"monokai"|"solarized", "fontSize"?: number, "showHeader"?: boolean, "headerTitle"?: string, "speed"?: number, "startTime"?: number } }
  ]

  // Optional per-scene fields (any scene type):
  // "audioFile": "audio/custom-narration.mp3"  — use a custom audio file instead of TTS
  // "annotations": [...]  — overlay annotations (arrow, box, circle, text) with percentage coordinates (0-100)
}

Guidelines:
- Keep narration natural and conversational, 1-3 sentences per scene
- Use 3-6 scenes total for a 30-60 second video
- Choose a theme that matches the subject matter
- Image paths in props should reference files in public/assets/ (e.g., "assets/screenshot-1.png")
- The narration drives scene duration — longer narration = longer scene
- Start with a title scene, end with a callToAction scene
- Vary scene types in between for visual interest`;

export async function generateScript(
  brief: string,
  apiKey: string,
  maxRetries = 3,
): Promise<SoundwaveScript> {
  const ai = new GoogleGenAI({ apiKey });

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const prompt = lastError
      ? `${brief}\n\nYour previous attempt had a validation error:\n${lastError}\n\nPlease fix the JSON and try again.`
      : brief;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) {
      lastError = "Empty response from model";
      console.error(`Attempt ${attempt}/${maxRetries}: Empty response`);
      continue;
    }

    try {
      const parsed = JSON.parse(text);
      const validated = soundwaveScriptSchema.parse(parsed);
      return validated as SoundwaveScript;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(
        `Attempt ${attempt}/${maxRetries}: Validation failed — ${lastError}`,
      );
    }
  }

  throw new Error(
    `Failed to generate valid script after ${maxRetries} attempts. Last error: ${lastError}`,
  );
}
