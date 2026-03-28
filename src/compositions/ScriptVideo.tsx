import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { SoundwaveScript, SceneWithTiming } from "../lib/types";
import { resolveTheme } from "../lib/theme";
import { TitleScene } from "../scenes/TitleScene";
import { ShowcaseScene } from "../scenes/ShowcaseScene";
import { CallToActionScene } from "../scenes/CallToActionScene";
import { ScreenRecordingScene } from "../scenes/ScreenRecordingScene";

export interface ScriptVideoProps extends Record<string, unknown> {
  script: SoundwaveScript;
  sceneTiming: SceneWithTiming[];
}

const SceneRenderer: React.FC<{
  scene: SoundwaveScript["scenes"][number];
  theme: SoundwaveScript["meta"]["theme"];
}> = ({ scene, theme }) => {
  const resolved = resolveTheme(theme);

  switch (scene.type) {
    case "title":
      return <TitleScene props={scene.props} theme={resolved} />;
    case "showcase":
      return <ShowcaseScene props={scene.props} theme={resolved} />;
    case "callToAction":
      return <CallToActionScene props={scene.props} theme={resolved} />;
    case "screenRecording":
      return <ScreenRecordingScene props={scene.props} theme={resolved} />;
    default:
      return null;
  }
};

export const ScriptVideo: React.FC<ScriptVideoProps> = ({
  script,
  sceneTiming,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: script.meta.theme.background }}>
      {sceneTiming.map((st, i) => (
        <Sequence
          key={i}
          from={st.startFrame}
          durationInFrames={st.durationInFrames}
          name={`${st.scene.type}-${i}`}
        >
          {st.audioPath && (
            <Audio src={staticFile(st.audioPath)} volume={1} />
          )}
          <SceneRenderer scene={st.scene} theme={script.meta.theme} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
