/**
 * Terminal color themes for asciinema rendering.
 * Each theme provides background, foreground, and 16 ANSI colors
 * (8 normal + 8 bright).
 */

export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  colors: string[]; // 16 ANSI colors: 0-7 normal, 8-15 bright
}

export const terminalThemes: Record<string, TerminalTheme> = {
  dark: {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    cursor: "#f5e0dc",
    colors: [
      "#45475a", "#f38ba8", "#a6e3a1", "#f9e2af",
      "#89b4fa", "#f5c2e7", "#94e2d5", "#bac2de",
      "#585b70", "#f38ba8", "#a6e3a1", "#f9e2af",
      "#89b4fa", "#f5c2e7", "#94e2d5", "#a6adc8",
    ],
  },
  light: {
    background: "#eff1f5",
    foreground: "#4c4f69",
    cursor: "#dc8a78",
    colors: [
      "#5c5f77", "#d20f39", "#40a02b", "#df8e1d",
      "#1e66f5", "#ea76cb", "#179299", "#acb0be",
      "#6c6f85", "#d20f39", "#40a02b", "#df8e1d",
      "#1e66f5", "#ea76cb", "#179299", "#bcc0cc",
    ],
  },
  monokai: {
    background: "#272822",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    colors: [
      "#272822", "#f92672", "#a6e22e", "#f4bf75",
      "#66d9ef", "#ae81ff", "#a1efe4", "#f8f8f2",
      "#75715e", "#f92672", "#a6e22e", "#f4bf75",
      "#66d9ef", "#ae81ff", "#a1efe4", "#f9f8f5",
    ],
  },
  solarized: {
    background: "#002b36",
    foreground: "#839496",
    cursor: "#93a1a1",
    colors: [
      "#073642", "#dc322f", "#859900", "#b58900",
      "#268bd2", "#d33682", "#2aa198", "#eee8d5",
      "#002b36", "#cb4b16", "#586e75", "#657b83",
      "#839496", "#6c71c4", "#93a1a1", "#fdf6e3",
    ],
  },
};
