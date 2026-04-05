# Remotion — Programmatic Video Production Engine

Standalone Remotion project that produces videos from text briefs or screen recordings. Pipeline: Brief → Gemini script → Gemini TTS → React scenes → MP4. Also supports post-production on raw screen recordings (video clips + TTS narration overlay).

## Quick Reference

- **Framework:** Remotion 4.0 (React-based video rendering)
- **Language:** TypeScript
- **LLM:** Gemini via `@google/genai` (GEMINI_API_KEY in ~/.env.shared)
- **TTS:** Gemini TTS (uses same GEMINI_API_KEY — no extra credentials needed)
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

All video content is defined as a `SoundwaveScript` JSON object (see `src/lib/types.ts`). This is the contract between LLM output and Remotion input. Scene types: `title`, `showcase`, `callToAction`, `screenRecording`, `asciinema`.

Scene duration = TTS audio length + 1.5s padding (configurable in `src/lib/theme.ts`).

### Custom Audio
Any scene can set `audioFile` (path relative to `public/`) to use a pre-recorded audio file instead of TTS. The pipeline probes its duration and skips TTS generation for that scene.

### Annotations
Any scene can include an `annotations` array with overlay shapes (arrow, box, circle, text). Coordinates are percentage-based (0-100). Each annotation supports `startFrame`, `endFrame`, `color`, `strokeWidth`, and `opacity`. Rendered as SVG overlay via `AnnotationOverlay.tsx`.

### Asciinema Scenes
The `asciinema` scene type renders animated terminal recordings from `.cast` files (asciicast v2 format). Props: `cast` (path in `public/casts/`), `theme` (dark/light/monokai/solarized), `fontSize`, `showHeader`, `headerTitle`, `speed`, `startTime`. Duration = max(cast playback, audio duration) + padding.

## TTS Provider Interface

`providers/tts-interface.ts` defines the interface. Implementations:
- `providers/gemini-tts.ts` — active (default, uses GEMINI_API_KEY)
- `providers/elevenlabs.ts` — available (needs credits)
- `providers/google-tts.ts` — stub (Google Cloud TTS, needs service account)
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
- Video clips go in `public/clips/` — referenced in scripts as `"clips/filename.mp4"`
