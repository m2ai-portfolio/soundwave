import { useCallback, useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { AsciinemaProps, SoundwaveTheme } from "../lib/types";
import { parseCastFile, getTerminalStateAtTime } from "../lib/asciinema-parser";
import type { CastEvent } from "../lib/asciinema-parser";
import { terminalThemes } from "../lib/terminal-themes";

export const AsciinemaScene: React.FC<{
  props: AsciinemaProps;
  theme: SoundwaveTheme;
}> = ({ props, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const [handle] = useState(() => delayRender("Loading cast file"));
  const [events, setEvents] = useState<CastEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const speed = props.speed ?? 1;
  const startTime = props.startTime ?? 0;
  const termTheme = terminalThemes[props.theme ?? "dark"];
  const fontSize = props.fontSize ?? 18;
  const showHeader = props.showHeader !== false;
  const headerTitle = props.headerTitle ?? "Terminal";

  const loadCast = useCallback(async () => {
    try {
      const url = staticFile(props.cast);
      const response = await fetch(url);
      const text = await response.text();
      const parsed = parseCastFile(text);
      setEvents(parsed.events);
      setLoaded(true);
      continueRender(handle);
    } catch (err) {
      console.error("Failed to load cast file:", err);
      setLoaded(true);
      continueRender(handle);
    }
  }, [props.cast, handle]);

  useEffect(() => {
    loadCast();
  }, [loadCast]);

  // Compute current playback time from frame
  const currentTime = startTime + (frame / fps) * speed;
  const terminalText = loaded ? getTerminalStateAtTime(events, currentTime, 1) : "";

  // Fade in/out
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

  // Split into lines for rendering
  const lines = terminalText.split("\n");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity,
        padding: 60,
      }}
    >
      <div
        style={{
          width: "90%",
          maxHeight: "85%",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title bar */}
        {showHeader && (
          <div
            style={{
              backgroundColor: "#3c3c3c",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#ff5f57",
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#febc2e",
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#28c840",
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                color: "#999",
                fontSize: 13,
                fontFamily: "monospace",
              }}
            >
              {headerTitle}
            </div>
          </div>
        )}

        {/* Terminal body */}
        <div
          style={{
            backgroundColor: termTheme.background,
            color: termTheme.foreground,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize,
            lineHeight: 1.5,
            padding: 24,
            flex: 1,
            overflow: "hidden",
            whiteSpace: "pre",
          }}
        >
          {lines.map((line, i) => (
            <div key={i}>{line || "\u00A0"}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
