import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import type { ShowcaseProps, SoundwaveTheme } from "../lib/types";

export const ShowcaseScene: React.FC<{
  props: ShowcaseProps;
  theme: SoundwaveTheme;
}> = ({ props, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const images = props.images;
  const animation = props.animation || "zoom";

  // For multiple images, cycle through them
  const secondsPerImage = Math.max(3, (durationInFrames / fps) / images.length);
  const framesPerImage = Math.round(secondsPerImage * fps);
  const currentImageIndex = Math.min(
    Math.floor(frame / framesPerImage),
    images.length - 1,
  );
  const frameInImage = frame - currentImageIndex * framesPerImage;

  // Animation per image
  const scale =
    animation === "zoom"
      ? interpolate(frameInImage, [0, framesPerImage], [1, 1.08], {
          extrapolateRight: "clamp",
        })
      : 1;

  const translateX =
    animation === "pan"
      ? interpolate(frameInImage, [0, framesPerImage], [0, -30], {
          extrapolateRight: "clamp",
        })
      : 0;

  const imageOpacity =
    animation === "fade"
      ? interpolate(frameInImage, [0, 15], [0, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        opacity,
        fontFamily: theme.fontFamily || "Inter, system-ui, sans-serif",
      }}
    >
      {/* Image container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile(images[currentImageIndex])}
          style={{
            width: "90%",
            height: "85%",
            objectFit: "contain",
            transform: `scale(${scale}) translateX(${translateX}px)`,
            opacity: imageOpacity,
            borderRadius: 12,
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* Caption overlay */}
      {props.caption && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              color: theme.text,
              padding: "12px 32px",
              borderRadius: 8,
              fontSize: 28,
              fontWeight: 500,
              opacity: interpolate(frame, [15, 30], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            {props.caption}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
