import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import type { ScreenRecordingProps, SoundwaveTheme } from "../lib/types";

export const ScreenRecordingScene: React.FC<{
  props: ScreenRecordingProps;
  theme: SoundwaveTheme;
}> = ({ props, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const muteOriginal = props.muteOriginal !== false; // default true
  const startTime = props.startTime || 0;

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        opacity,
      }}
    >
      <OffthreadVideo
        src={staticFile(props.clip)}
        startFrom={Math.round(startTime * fps)}
        volume={muteOriginal ? 0 : 1}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </AbsoluteFill>
  );
};
