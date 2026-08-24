const xylophone = document.querySelector<HTMLElement>(".xylophone");
const bars = Array.from(document.querySelectorAll<HTMLButtonElement>(".bar"));

let ctx: AudioContext | undefined;

function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// A short, decaying pair of sines reads as a mallet strike rather than a
// held tone: quick attack, exponential decay, a soft overtone for timbre.
function strike(freq: number, velocity: number) {
  const audio = audioContext();
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(velocity, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

  const fundamental = audio.createOscillator();
  fundamental.type = "sine";
  fundamental.frequency.value = freq;
  fundamental.connect(gain);
  fundamental.start(now);
  fundamental.stop(now + 0.9);

  const overtone = audio.createOscillator();
  overtone.type = "sine";
  overtone.frequency.value = freq * 4;
  const overtoneGain = audio.createGain();
  overtoneGain.gain.value = 0.15;
  overtone.connect(overtoneGain).connect(gain);
  overtone.start(now);
  overtone.stop(now + 0.9);
}

function flash(bar: HTMLButtonElement) {
  bar.classList.add("struck");
  setTimeout(() => bar.classList.remove("struck"), 150);
}

function hit(bar: HTMLButtonElement, clientY: number) {
  const freq = Number(bar.dataset.freq);
  const rect = bar.getBoundingClientRect();
  // Higher up the bar = a harder strike = louder.
  const position = (clientY - rect.top) / rect.height;
  const velocity = Math.min(1, Math.max(0.35, 1 - position));
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
