/**
 * Parser for asciicast v2 format with grid-based terminal emulation.
 * Spec: https://docs.asciinema.org/manual/asciicast/v2/
 *
 * Line 1: JSON header {version, width, height, ...}
 * Lines 2+: JSON arrays [timestamp, event_type, data]
 *
 * Implements cursor movement, line/screen erase, and scrolling
 * to correctly render TUI applications like Claude Code.
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

interface TerminalState {
  grid: string[][];
  cursorRow: number;
  cursorCol: number;
  width: number;
  height: number;
  savedCursorRow: number;
  savedCursorCol: number;
}

function createTerminalState(width: number, height: number): TerminalState {
  const grid: string[][] = [];
  for (let r = 0; r < height; r++) {
    grid.push(new Array(width).fill(" "));
  }
  return {
    grid,
    cursorRow: 0,
    cursorCol: 0,
    width,
    height,
    savedCursorRow: 0,
    savedCursorCol: 0,
  };
}

function scrollUp(state: TerminalState): void {
  state.grid.shift();
  state.grid.push(new Array(state.width).fill(" "));
}

function handleCSI(paramStr: string, cmd: string, state: TerminalState): void {
  // Private mode sequences (e.g., ?2026h) -- ignore
  if (paramStr.startsWith("?") || paramStr.startsWith(">") || paramStr.startsWith("=")) {
    return;
  }

  const args = paramStr
    .split(";")
    .map((s) => {
      const n = parseInt(s, 10);
      return isNaN(n) ? 0 : n;
    });
  const n = args[0] || 1;

  switch (cmd) {
    case "A": // Cursor up
      state.cursorRow = Math.max(0, state.cursorRow - n);
      break;
    case "B": // Cursor down
      state.cursorRow = Math.min(state.height - 1, state.cursorRow + n);
      break;
    case "C": // Cursor right
      state.cursorCol = Math.min(state.width - 1, state.cursorCol + n);
      break;
    case "D": // Cursor left
      state.cursorCol = Math.max(0, state.cursorCol - n);
      break;
    case "H": // Cursor position (row;col, 1-based)
    case "f": {
      const row = (args[0] || 1) - 1;
      const col = (args[1] || 1) - 1;
      state.cursorRow = Math.max(0, Math.min(state.height - 1, row));
      state.cursorCol = Math.max(0, Math.min(state.width - 1, col));
      break;
    }
    case "G": // Cursor horizontal absolute (1-based)
      state.cursorCol = Math.max(0, Math.min(state.width - 1, n - 1));
      break;
    case "d": // Cursor vertical absolute (1-based)
      state.cursorRow = Math.max(0, Math.min(state.height - 1, n - 1));
      break;
    case "J": { // Erase in display
      const mode = args[0] || 0;
      if (mode === 2 || mode === 3) {
        // Erase entire screen
        for (let r = 0; r < state.height; r++) {
          state.grid[r].fill(" ");
        }
      } else if (mode === 0) {
        // Erase from cursor to end
        for (let c = state.cursorCol; c < state.width; c++) {
          state.grid[state.cursorRow][c] = " ";
        }
        for (let r = state.cursorRow + 1; r < state.height; r++) {
          state.grid[r].fill(" ");
        }
      } else if (mode === 1) {
        // Erase from start to cursor
        for (let r = 0; r < state.cursorRow; r++) {
          state.grid[r].fill(" ");
        }
        for (let c = 0; c <= state.cursorCol; c++) {
          state.grid[state.cursorRow][c] = " ";
        }
      }
      break;
    }
    case "K": { // Erase in line
      const mode = args[0] || 0;
      if (mode === 2) {
        state.grid[state.cursorRow].fill(" ");
      } else if (mode === 0) {
        for (let c = state.cursorCol; c < state.width; c++) {
          state.grid[state.cursorRow][c] = " ";
        }
      } else if (mode === 1) {
        for (let c = 0; c <= state.cursorCol; c++) {
          state.grid[state.cursorRow][c] = " ";
        }
      }
      break;
    }
    case "L": { // Insert lines
      const count = Math.min(n, state.height - state.cursorRow);
      for (let i = 0; i < count; i++) {
        state.grid.splice(state.height - 1, 1);
        state.grid.splice(state.cursorRow, 0, new Array(state.width).fill(" "));
      }
      break;
    }
    case "M": { // Delete lines
      const count = Math.min(n, state.height - state.cursorRow);
      for (let i = 0; i < count; i++) {
        state.grid.splice(state.cursorRow, 1);
        state.grid.push(new Array(state.width).fill(" "));
      }
      break;
    }
    case "P": { // Delete characters
      const count = Math.min(n, state.width - state.cursorCol);
      const row = state.grid[state.cursorRow];
      row.splice(state.cursorCol, count);
      while (row.length < state.width) row.push(" ");
      break;
    }
    case "@": { // Insert characters
      const count = Math.min(n, state.width - state.cursorCol);
      const row = state.grid[state.cursorRow];
      for (let i = 0; i < count; i++) {
        row.splice(state.cursorCol, 0, " ");
      }
      row.length = state.width;
      break;
    }
    case "S": { // Scroll up
      const count = Math.min(n, state.height);
      for (let i = 0; i < count; i++) scrollUp(state);
      break;
    }
    case "T": { // Scroll down
      const count = Math.min(n, state.height);
      for (let i = 0; i < count; i++) {
        state.grid.pop();
        state.grid.unshift(new Array(state.width).fill(" "));
      }
      break;
    }
    case "X": { // Erase characters (replace with spaces, don't move cursor)
      const count = Math.min(n, state.width - state.cursorCol);
      for (let c = 0; c < count; c++) {
        state.grid[state.cursorRow][state.cursorCol + c] = " ";
      }
      break;
    }
    case "m": // SGR (colors/styles) -- ignore for text-only rendering
    case "r": // Set scrolling region -- ignore
    case "l": // Reset mode
    case "h": // Set mode
    case "t": // Window manipulation
    case "n": // Device status report
    case "c": // Device attributes
      break;
    case "s": // Save cursor position
      state.savedCursorRow = state.cursorRow;
      state.savedCursorCol = state.cursorCol;
      break;
    case "u": // Restore cursor position
      state.cursorRow = state.savedCursorRow;
      state.cursorCol = state.savedCursorCol;
      break;
    default:
      break;
  }
}

function processEventData(data: string, state: TerminalState): void {
  let i = 0;
  while (i < data.length) {
    const ch = data[i];
    const code = data.charCodeAt(i);

    if (code === 0x1b) {
      // ESC
      if (i + 1 >= data.length) {
        i++;
        continue;
      }
      const next = data[i + 1];
      if (next === "[") {
        // CSI sequence: ESC [ params cmd
        i += 2;
        const paramStart = i;
        // Collect parameter bytes (0x20-0x3F range) and intermediate bytes
        while (i < data.length) {
          const c = data.charCodeAt(i);
          if (c >= 0x40 && c <= 0x7e) break; // Final byte
          i++;
        }
        if (i >= data.length) break;
        const paramStr = data.substring(paramStart, i);
        const cmd = data[i];
        i++;
        handleCSI(paramStr, cmd, state);
      } else if (next === "]") {
        // OSC sequence: ESC ] ... BEL or ESC \
        i += 2;
        while (i < data.length) {
          if (data.charCodeAt(i) === 0x07) {
            i++;
            break;
          }
          if (data.charCodeAt(i) === 0x1b && i + 1 < data.length && data[i + 1] === "\\") {
            i += 2;
            break;
          }
          i++;
        }
      } else if (next === "(" || next === ")" || next === "*" || next === "+") {
        // Charset designation -- skip 1 more byte
        i += 3;
      } else if (next === "7") {
        // Save cursor
        state.savedCursorRow = state.cursorRow;
        state.savedCursorCol = state.cursorCol;
        i += 2;
      } else if (next === "8") {
        // Restore cursor
        state.cursorRow = state.savedCursorRow;
        state.cursorCol = state.savedCursorCol;
        i += 2;
      } else {
        // Unknown ESC sequence -- skip
        i += 2;
      }
    } else if (ch === "\r") {
      state.cursorCol = 0;
      i++;
    } else if (ch === "\n") {
      state.cursorRow++;
      if (state.cursorRow >= state.height) {
        scrollUp(state);
        state.cursorRow = state.height - 1;
      }
      i++;
    } else if (code === 0x08) {
      // Backspace
      if (state.cursorCol > 0) state.cursorCol--;
      i++;
    } else if (code === 0x09) {
      // Tab -- move to next 8-column stop
      state.cursorCol = Math.min(state.width - 1, (Math.floor(state.cursorCol / 8) + 1) * 8);
      i++;
    } else if (code === 0x07) {
      // BEL -- ignore
      i++;
    } else if (code < 0x20 && code !== 0x1b) {
      // Other control characters -- ignore
      i++;
    } else {
      // Printable character -- write to grid
      if (state.cursorCol >= state.width) {
        // Line wrap
        state.cursorCol = 0;
        state.cursorRow++;
        if (state.cursorRow >= state.height) {
          scrollUp(state);
          state.cursorRow = state.height - 1;
        }
      }
      state.grid[state.cursorRow][state.cursorCol] = ch;
      state.cursorCol++;
      i++;
    }
  }
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
 * Replay terminal output events up to the given time using a grid-based
 * terminal emulator. Handles cursor movement, line/screen erase, and
 * scrolling -- required for TUI applications like Claude Code.
 */
export function getTerminalStateAtTime(
  events: CastEvent[],
  timeSeconds: number,
  speed: number = 1,
  width: number = 80,
  height: number = 25,
): string {
  const state = createTerminalState(width, height);

  for (const event of events) {
    if (event.timestamp > timeSeconds) break;
    if (event.type === "o") {
      processEventData(event.data, state);
    }
  }

  // Convert grid to string, trimming trailing empty lines
  const lines = state.grid.map((row) => row.join("").trimEnd());
  let lastNonEmpty = lines.length - 1;
  while (lastNonEmpty > 0 && lines[lastNonEmpty] === "") {
    lastNonEmpty--;
  }
  return lines.slice(0, lastNonEmpty + 1).join("\n");
}

/**
 * Get the total duration of a cast recording in seconds.
 */
export function getCastDuration(events: CastEvent[]): number {
  if (events.length === 0) return 0;
  return events[events.length - 1].timestamp;
}
