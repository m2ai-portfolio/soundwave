import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import type { TitleProps, SoundwaveTheme } from "../lib/types";

export const TitleScene: React.FC<{
  props: TitleProps;
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

  const headingSlide = interpolate(frame, [0, 25], [40, 0], {
    extrapolateRight: "clamp",
  });

  const subheadingSlide = interpolate(frame, [10, 35], [30, 0], {
    extrapolateRight: "clamp",
  });

  const bgColor = props.background || theme.background;
  const isImage = bgColor && (bgColor.endsWith(".png") || bgColor.endsWith(".jpg") || bgColor.endsWith(".jpeg"));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: isImage ? undefined : bgColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity,
        fontFamily: theme.fontFamily || "Inter, system-ui, sans-serif",
      }}
    >
      {isImage && (
        <Img
          src={staticFile(bgColor)}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {props.logo && (
        <Img
          src={staticFile(props.logo)}
          style={{
            width: 120,
            height: 120,
            marginBottom: 30,
            transform: `translateY(${headingSlide}px)`,
          }}
        />
      )}

      <h1
        style={{
          color: theme.primary,
          fontSize: 72,
          fontWeight: 800,
          textAlign: "center",
          margin: 0,
          padding: "0 80px",
          transform: `translateY(${headingSlide}px)`,
          textShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        {props.heading}
      </h1>

      {props.subheading && (
        <p
          style={{
            color: theme.text,
            fontSize: 36,
            fontWeight: 400,
            textAlign: "center",
            margin: 0,
            marginTop: 20,
            padding: "0 100px",
            transform: `translateY(${subheadingSlide}px)`,
            opacity: interpolate(frame, [10, 30], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          {props.subheading}
        </p>
      )}
    </AbsoluteFill>
  );
};
