const xylophone = document.querySelector<HTMLElement>(".xylophone");
const bars = Array.from(document.querySelectorAll<HTMLButtonElement>(".bar"));

let ctx: AudioContext | undefined;

function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// A short, decaying pair of sines reads as a mallet strike rather than a
// held tone: quick attack, exponential decay. A hard hit isn't just louder —
// it's brighter (more overtone, shorter attack), the way a real mallet
// strike changes timbre with force, not only volume.
function strike(freq: number, velocity: number) {
  const audio = audioContext();
  const now = audio.currentTime;
  const attack = 0.012 - velocity * 0.008;
  const decay = 0.7 + velocity * 0.4;

  const gain = audio.createGain();
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2 + velocity * 0.8, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  const fundamental = audio.createOscillator();
  fundamental.type = "sine";
  fundamental.frequency.value = freq;
  fundamental.connect(gain);
  fundamental.start(now);
  fundamental.stop(now + decay);

  const overtone = audio.createOscillator();
  overtone.type = "sine";
  overtone.frequency.value = freq * 4;
  const overtoneGain = audio.createGain();
  // Soft hits stay near-pure sine; hard hits get a lot more overtone bite.
  overtoneGain.gain.value = 0.05 + velocity * 0.55;
  overtone.connect(overtoneGain).connect(gain);
  overtone.start(now);
  overtone.stop(now + decay);
}

function flash(bar: HTMLButtonElement) {
  bar.classList.add("struck");
  setTimeout(() => bar.classList.remove("struck"), 150);
}

function hit(bar: HTMLButtonElement, clientY: number) {
  const freq = Number(bar.dataset.freq);
  const rect = bar.getBoundingClientRect();
  // Higher up the bar = a harder strike. A wide floor-to-ceiling range plus
  // a curve (rather than linear) makes soft vs. hard read as distinct hits,
  // not a barely-different volume tweak.
  const position = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  const velocity = Math.pow(Math.min(1, Math.max(0.08, 1 - position)), 0.6);
  strike(freq, velocity);
  flash(bar);
}

// Pointer + drag: covers mouse, touch and pen, and lets a drag across
// several bars play a glissando run.
const lastHitByPointer = new Map<number, HTMLButtonElement>();

function barAt(x: number, y: number): HTMLButtonElement | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLButtonElement>(".bar") ?? null;
}

xylophone?.addEventListener("pointerdown", (event) => {
  const bar = barAt(event.clientX, event.clientY);
  if (!bar) return;
  (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  hit(bar, event.clientY);
  lastHitByPointer.set(event.pointerId, bar);
});

xylophone?.addEventListener("pointermove", (event) => {
  if (event.buttons === 0) return;
  const bar = barAt(event.clientX, event.clientY);
  if (!bar || bar === lastHitByPointer.get(event.pointerId)) return;
  hit(bar, event.clientY);
  lastHitByPointer.set(event.pointerId, bar);
});

for (const end of ["pointerup", "pointercancel", "pointerleave"]) {
  xylophone?.addEventListener(end, (event) => {
    lastHitByPointer.delete((event as PointerEvent).pointerId);
  });
}

// Keyboard: the letter row printed on each bar, plus Enter/Space on a
// tab-focused bar for screen-reader / keyboard-only navigation.
const barsByKey = new Map(bars.map((bar) => [bar.querySelector(".bar-key")?.textContent?.toLowerCase(), bar]));

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const bar = barsByKey.get(event.key.toLowerCase());
  if (!bar) return;
  const rect = bar.getBoundingClientRect();
  hit(bar, rect.top + rect.height * 0.2);
});

xylophone?.addEventListener("click", (event) => {
  // A keyboard-triggered click (Tab + Enter/Space) has detail 0; a
  // pointer-triggered one is already handled above and would double it up.
  if (event.detail !== 0) return;
  const bar = (event.target as HTMLElement).closest<HTMLButtonElement>(".bar");
  if (!bar) return;
  const rect = bar.getBoundingClientRect();
  hit(bar, rect.top + rect.height * 0.2);
});
