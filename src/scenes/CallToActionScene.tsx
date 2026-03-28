import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import type { CTAProps, SoundwaveTheme } from "../lib/types";

export const CallToActionScene: React.FC<{
  props: CTAProps;
  theme: SoundwaveTheme;
}> = ({ props, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const headingScale = interpolate(frame, [0, 25], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  const buttonSlide = interpolate(frame, [15, 40], [50, 0], {
    extrapolateRight: "clamp",
  });
  const buttonOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle pulse on button after it appears
  const pulse = frame > 50
    ? interpolate(frame % 60, [0, 30, 60], [1, 1.03, 1])
    : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity,
        fontFamily: theme.fontFamily || "Inter, system-ui, sans-serif",
      }}
    >
      {props.logo && (
        <Img
          src={staticFile(props.logo)}
          style={{
            width: 80,
            height: 80,
            marginBottom: 30,
            opacity: fadeIn,
          }}
        />
      )}

      <h1
        style={{
          color: theme.text,
          fontSize: 64,
          fontWeight: 800,
          textAlign: "center",
          margin: 0,
          padding: "0 100px",
          transform: `scale(${headingScale})`,
        }}
      >
        {props.heading}
      </h1>

      {props.buttonText && (
        <div
          style={{
            marginTop: 40,
            transform: `translateY(${buttonSlide}px) scale(${pulse})`,
            opacity: buttonOpacity,
          }}
        >
          <div
            style={{
              backgroundColor: theme.primary,
              color: theme.text,
              padding: "18px 48px",
              borderRadius: 12,
              fontSize: 32,
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {props.buttonText}
          </div>
        </div>
      )}

      {props.url && (
        <p
          style={{
            color: theme.secondary,
            fontSize: 24,
            marginTop: 20,
            opacity: buttonOpacity,
          }}
        >
          {props.url}
        </p>
      )}
    </AbsoluteFill>
  );
};
