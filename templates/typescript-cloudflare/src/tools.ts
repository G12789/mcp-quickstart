// Pure tool logic — no MCP or Workers imports — so it stays trivially testable.

export function ping(): { message: string } {
  return { message: "pong" };
}

export function textStats(text: string): {
  characters: number;
  words: number;
  lines: number;
  sentences: number;
} {
  const characters = text.length;
  const words = (text.match(/\S+/g) ?? []).length;
  const lines = text.split(/\r?\n/).length;
  const sentences = (text.match(/[.!?]+/g) ?? []).length;
  return { characters, words, lines, sentences };
}
