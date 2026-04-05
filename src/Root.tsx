import "./index.css";
import { Composition } from "remotion";
import { z } from "zod";
import { ScriptVideo } from "./compositions/ScriptVideo";
import type { ScriptVideoProps } from "./compositions/ScriptVideo";
import type { SoundwaveScript, SceneWithTiming } from "./lib/types";

const scriptVideoSchema = z.object({
  script: z.any(),
  sceneTiming: z.any(),
});

// Sample script for Studio preview
const sampleScript: SoundwaveScript = {
  meta: {
    title: "Soundwave Demo",
    description: "A test video to verify scene rendering",
    fps: 30,
    width: 1920,
    height: 1080,
    theme: {
      primary: "#4a5e3f",
      secondary: "#7a9b6d",
      background: "#f4f6f3",
      text: "#ffffff",
    },
  },
  scenes: [
    {
      type: "title",
      narration: "Welcome to Soundwave",
      props: {
        heading: "Soundwave",
        subheading: "Programmatic Video Production",
      },
    },
    {
      type: "showcase",
      narration: "See what we can build",
      props: {
        images: ["assets/placeholder.png"],
        caption: "Built with Remotion + React",
        animation: "zoom",
      },
    },
    {
      type: "asciinema",
      narration: "Watch the pipeline in action",
      props: {
        cast: "casts/sample.cast",
        theme: "dark",
        showHeader: true,
        headerTitle: "soundwave pipeline",
        speed: 1,
      },
    },
    {
      type: "callToAction",
      narration: "Get started today",
      props: {
        heading: "Ready to Create?",
        buttonText: "Get Started",
        url: "soundwave.dev",
      },
    },
  ],
};

// Generate timing without audio (for Studio preview)
function generatePreviewTiming(
  script: SoundwaveScript,
): SceneWithTiming[] {
  const fps = script.meta.fps;
  const defaultDuration = 4 * fps; // 4 seconds per scene
  let currentFrame = 0;

  return script.scenes.map((scene) => {
    const timing: SceneWithTiming = {
      scene,
      audioDurationMs: 4000,
      audioPath: "",
      startFrame: currentFrame,
      durationInFrames: defaultDuration,
    };
    currentFrame += defaultDuration;
    return timing;
  });
}

const previewTiming = generatePreviewTiming(sampleScript);
const totalFrames = previewTiming.reduce(
  (sum, st) => sum + st.durationInFrames,
  0,
);

const defaultProps: ScriptVideoProps = {
  script: sampleScript,
  sceneTiming: previewTiming,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ScriptVideo"
        schema={scriptVideoSchema}
        component={ScriptVideo}
        durationInFrames={totalFrames}
        fps={sampleScript.meta.fps}
        width={sampleScript.meta.width}
        height={sampleScript.meta.height}
        defaultProps={defaultProps}
      />
    </>
  );
};
