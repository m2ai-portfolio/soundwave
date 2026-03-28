# Soundwave — Programmatic Video Production Engine

Standalone Remotion project that produces videos from text briefs. Pipeline: Brief → Gemini script → ElevenLabs TTS → React scenes → MP4.

## Quick Reference

- **Framework:** Remotion 4.0 (React-based video rendering)
- **Language:** TypeScript
- **LLM:** Gemini via `@google/genai` (GEMINI_API_KEY in ~/.env.shared)
- **TTS:** ElevenLabs (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID in ~/.env.shared)
- **Database:** SQLite at `data/soundwave.db`
- **Output:** MP4 videos in `output/`

## Commands

```bash
# Full pipeline: brief → MP4
npx tsx scripts/pipeline.ts "Create a 30 second demo video for ..."

# Pipeline with pre-written script
npx tsx scripts/pipeline.ts --script path/to/script.json

# Remotion Studio (visual preview)
npm run dev

# Type check
npx tsc --noEmit

# Render directly (no TTS, uses default props)
npx remotion render ScriptVideo output/test.mp4
```

## Architecture

```
Brief (text)
  → scripts/generate-script.ts (Gemini → SoundwaveScript JSON, Zod-validated)
  → scripts/generate-audio.ts  (TTS → MP3s + durations, cached by hash)
  → scripts/render-video.ts    (Remotion @remotion/renderer → MP4)
  → scripts/pipeline.ts        (orchestrates all steps)
```

## Core Contract: SoundwaveScript JSON

All video content is defined as a `SoundwaveScript` JSON object (see `src/lib/types.ts`). This is the contract between LLM output and Remotion input. Scene types: `title`, `showcase`, `callToAction`.

Scene duration = TTS audio length + 1.5s padding (configurable in `src/lib/theme.ts`).

## TTS Provider Interface

`providers/tts-interface.ts` defines the interface. Implementations:
- `providers/elevenlabs.ts` — active
- `providers/google-tts.ts` — stub
- `providers/openai-tts.ts` — stub

Swap providers by changing the instantiation in `scripts/pipeline.ts`.

## Adding New Scene Types

1. Create `src/scenes/NewScene.tsx` (React component, receives `props` + `theme`)
2. Add the scene type to `src/lib/types.ts` (interface + union)
3. Add Zod validation in `src/lib/schema.ts`
4. Register in `src/compositions/ScriptVideo.tsx` switch statement
5. Update the system prompt in `scripts/generate-script.ts`

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | TypeScript types for SoundwaveScript |
| `src/lib/schema.ts` | Zod validation schema |
| `src/compositions/ScriptVideo.tsx` | Main composition — maps scenes to Sequences |
| `scripts/pipeline.ts` | CLI entry point |
| `scripts/generate-script.ts` | Gemini script generation with retry |
| `scripts/generate-audio.ts` | TTS with SQLite caching |
| `scripts/render-video.ts` | Remotion render orchestration |
| `scripts/db.ts` | SQLite setup and migrations |

## Conventions

- Source `~/.env.shared` for all API keys — never create separate .env files
- Audio files cached by narration text hash — re-running same brief reuses audio
- All renders tracked in SQLite (scripts, audio_files, renders tables)
- Images go in `public/assets/` — referenced in scripts as `"assets/filename.png"`
