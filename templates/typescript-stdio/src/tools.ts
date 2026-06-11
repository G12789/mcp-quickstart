/**
 * Pure, side-effect-free logic for your tools lives here so it stays easy to
 * unit-test. The MCP wiring in `index.ts` just calls these functions.
 */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
}

export function textStats(text: string): TextStats {
  const words = text.trim().length === 0 ? [] : text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: words.length,
    lines: text.split(/\r\n|\r|\n/).length,
    sentences: sentences.length,
  };
}

export function ping(): { message: string; timestamp: string } {
  return { message: "pong", timestamp: new Date().toISOString() };
}

export function greeting(name: string): string {
  const clean = name.trim() || "world";
  return `Hello, ${clean}! This greeting was served by an MCP resource.`;
}
