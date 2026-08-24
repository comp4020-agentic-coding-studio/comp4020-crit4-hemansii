import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// This week's spec (crits/04-instrument): mechanically checkable lines only.
// "expressive", "a stranger can play it uninstructed", "no way to play it
// wrong" are judged by ear at the crit, not here — see spec/README.md.
const distPath = resolve("dist/index.html");
const html = existsSync(distPath) ? readFileSync(distPath, "utf8") : "";
const doc = new JSDOM(html).window.document;

// Bundled scripts land as separate files in dist/ (not inlined), so search
// across everything the build shipped for the strings that prove the sound is
// synthesised live rather than played back from a file.
function shippedScripts(): string {
  const distDir = resolve("dist");
  if (!existsSync(distDir)) return "";
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    });
  return walk(distDir)
    .filter((path) => path.endsWith(".js") || path.endsWith(".html"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

const shipped = shippedScripts();

describe("instrument: sound is synthesised, not played back", () => {
  it("constructs a Web Audio context", () => {
    expect(
      /AudioContext/.test(shipped),
      "the brief asks for sound made live in the page — an AudioContext (or webkitAudioContext) is the tell",
    ).toBeTruthy();
  });

  it("ships no pre-recorded <audio>/<video> playback element", () => {
    expect(
      doc.querySelector("audio, video"),
      "playing back a file isn't the instrument the brief asks for — synthesise with Web Audio nodes instead",
    ).toBeNull();
  });
});

describe("instrument: playable with whatever is at hand", () => {
  it("responds to more than one input method", () => {
    const pointerLike = /pointerdown|mousedown|touchstart|click/.test(shipped);
    const keyboardLike = /keydown|keyup|keypress/.test(shipped);
    expect(
      pointerLike && keyboardLike,
      "mouse/touch and keyboard should both be able to play it — found pointer: " +
        pointerLike +
        ", keyboard: " +
        keyboardLike,
    ).toBe(true);
  });
});
