import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { Annotation } from "../../lib/types";

const FADE_FRAMES = 5;

interface AnnotationOverlayProps {
  annotations: Annotation[];
  sceneDurationInFrames: number;
}

function getAnnotationOpacity(
  frame: number,
  startFrame: number | undefined,
  endFrame: number | undefined,
  sceneDuration: number,
  baseOpacity: number,
): number {
  const start = startFrame ?? 0;
  const end = endFrame ?? sceneDuration;

  if (frame < start || frame > end) return 0;

  const fadeIn = interpolate(frame, [start, start + FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [end - FADE_FRAMES, end],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return Math.min(fadeIn, fadeOut) * baseOpacity;
}

const RenderAnnotation: React.FC<{
  annotation: Annotation;
  frame: number;
  sceneDuration: number;
}> = ({ annotation, frame, sceneDuration }) => {
  const opacity = getAnnotationOpacity(
    frame,
    annotation.startFrame,
    annotation.endFrame,
    sceneDuration,
    annotation.opacity ?? 1,
  );

  if (opacity <= 0) return null;

  const color = annotation.color ?? "#ff0000";

  switch (annotation.kind) {
    case "arrow": {
      const sw = annotation.strokeWidth ?? 0.5;
      const markerId = `arrow-${annotation.x1}-${annotation.y1}`;
      return (
        <g opacity={opacity}>
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={color} />
            </marker>
          </defs>
          <line
            x1={annotation.x1}
            y1={annotation.y1}
            x2={annotation.x2}
            y2={annotation.y2}
            stroke={color}
            strokeWidth={sw}
            markerEnd={`url(#${markerId})`}
          />
        </g>
      );
    }
    case "box": {
      const sw = annotation.strokeWidth ?? 0.5;
      return (
        <rect
          x={annotation.x}
          y={annotation.y}
          width={annotation.width}
          height={annotation.height}
          stroke={color}
          strokeWidth={sw}
          fill={annotation.fill ?? "none"}
          opacity={opacity}
        />
      );
    }
    case "circle": {
      const sw = annotation.strokeWidth ?? 0.5;
      return (
        <circle
          cx={annotation.cx}
          cy={annotation.cy}
          r={annotation.r}
          stroke={color}
          strokeWidth={sw}
          fill="none"
          opacity={opacity}
        />
      );
    }
    case "text": {
      const fontSize = annotation.fontSize ?? 4;
      return (
        <foreignObject
          x={annotation.x}
          y={annotation.y}
          width={100 - annotation.x}
          height={100 - annotation.y}
          opacity={opacity}
        >
          <div
            style={{
              color,
              fontSize: `${fontSize}px`,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 700,
              whiteSpace: "pre-wrap",
            }}
          >
            {annotation.text}
          </div>
        </foreignObject>
      );
    }
    default:
      return null;
  }
};

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  sceneDurationInFrames,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 10 }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        {annotations.map((annotation, i) => (
          <RenderAnnotation
            key={i}
            annotation={annotation}
            frame={frame}
            sceneDuration={sceneDurationInFrames}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
