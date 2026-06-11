import { test } from "node:test";
import assert from "node:assert/strict";
import { textStats, ping, greeting } from "./tools.js";

test("textStats counts words and characters", () => {
  const stats = textStats("hello world");
  assert.equal(stats.words, 2);
  assert.equal(stats.characters, 11);
  assert.equal(stats.charactersNoSpaces, 10);
});

test("textStats counts sentences and lines", () => {
  const stats = textStats("One. Two!\nThree?");
  assert.equal(stats.sentences, 3);
  assert.equal(stats.lines, 2);
});

test("textStats handles empty input", () => {
  const stats = textStats("   ");
  assert.equal(stats.words, 0);
});

test("ping returns pong", () => {
  const result = ping();
  assert.equal(result.message, "pong");
  assert.ok(!Number.isNaN(Date.parse(result.timestamp)));
});

test("greeting falls back to 'world'", () => {
  assert.match(greeting(""), /Hello, world!/);
  assert.match(greeting("Ada"), /Hello, Ada!/);
});
