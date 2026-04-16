import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import type { PipVideoProps, SoundwaveTheme } from "../lib/types";

export const PipVideoScene: React.FC<{
  props: PipVideoProps;
  theme: SoundwaveTheme;
}> = ({ props, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width, height } = useVideoConfig();

  const muteOriginal = props.muteOriginal !== false; // default true
  const mainStart = props.mainStartTime || 0;
  const pipStart = props.pipStartTime || 0;
  const pipScale = props.pipScale ?? 0.25;
  const pipMarginPct = props.pipMarginPct ?? 3;
  const pipBorderWidth = props.pipBorderWidth ?? 3;
  const pipBorderColor = props.pipBorderColor ?? theme.primary;
  const position = props.pipPosition ?? "bottom-right";

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

  const pipW = Math.round(width * pipScale);
  const pipH = Math.round(pipW * (9 / 16));
  const marginPx = Math.round((pipMarginPct / 100) * Math.min(width, height));

  const pipStyle: React.CSSProperties = {
    position: "absolute",
    width: `${pipW}px`,
    height: `${pipH}px`,
    border: `${pipBorderWidth}px solid ${pipBorderColor}`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    overflow: "hidden",
    backgroundColor: theme.background,
  };

  if (position === "bottom-right") {
    pipStyle.right = marginPx;
    pipStyle.bottom = marginPx;
  } else if (position === "bottom-left") {
    pipStyle.left = marginPx;
    pipStyle.bottom = marginPx;
  } else if (position === "top-right") {
    pipStyle.right = marginPx;
    pipStyle.top = marginPx;
  } else {
    pipStyle.left = marginPx;
    pipStyle.top = marginPx;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        opacity,
      }}
    >
      <OffthreadVideo
        src={staticFile(props.mainClip)}
        startFrom={Math.round(mainStart * fps)}
        volume={muteOriginal ? 0 : 1}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <div style={pipStyle}>
        <OffthreadVideo
          src={staticFile(props.pipClip)}
          startFrom={Math.round(pipStart * fps)}
          volume={0}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
