/**
 * Parser for asciicast v2 format.
 * Spec: https://docs.asciinema.org/manual/asciicast/v2/
 *
 * Line 1: JSON header {version, width, height, ...}
 * Lines 2+: JSON arrays [timestamp, event_type, data]
 */

export interface CastHeader {
  version: number;
  width: number;
  height: number;
  timestamp?: number;
  duration?: number;
  title?: string;
  env?: Record<string, string>;
}

export interface CastEvent {
  timestamp: number;
  type: string;
  data: string;
}

export interface ParsedCast {
  header: CastHeader;
  events: CastEvent[];
}

/**
 * Parse an asciicast v2 file content string.
 */
export function parseCastFile(content: string): ParsedCast {
  const lines = content.trim().split("\n");
  if (lines.length === 0) {
    throw new Error("Empty cast file");
  }

  const header: CastHeader = JSON.parse(lines[0]);
  if (header.version !== 2) {
    throw new Error(`Unsupported asciicast version: ${header.version}`);
  }

  const events: CastEvent[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const [timestamp, type, data] = JSON.parse(line);
      events.push({ timestamp, type, data });
    } catch {
      // Skip malformed lines
    }
  }

  return { header, events };
}

/**
 * Replay terminal output events up to the given time.
 * Returns the accumulated terminal text at that point.
 * Handles basic control: \r (carriage return), \n (newline).
 * Does not implement full VT100 escape sequence emulation.
 */
export function getTerminalStateAtTime(
  events: CastEvent[],
  timeSeconds: number,
  speed: number = 1,
): string {
  let output = "";

  for (const event of events) {
    const adjustedTime = event.timestamp / speed;
    if (adjustedTime > timeSeconds) break;

    if (event.type === "o") {
      // Process basic control characters
      for (const char of event.data) {
        if (char === "\r") {
          // Carriage return: move to start of current line
          const lastNewline = output.lastIndexOf("\n");
          output = output.substring(0, lastNewline + 1);
        } else {
          output += char;
        }
      }
    }
  }

  // Strip ANSI escape sequences for clean display
  return output.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
}

/**
 * Get the total duration of a cast recording in seconds.
 */
export function getCastDuration(events: CastEvent[]): number {
  if (events.length === 0) return 0;
  return events[events.length - 1].timestamp;
}
