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

// Recording captures every played hit — whatever input made it — as
// (bar index, velocity, offset from recording start), so playback can
// reproduce exactly what was played without caring how it was played.
type RecordedHit = { barIndex: number; freq: number; velocity: number; t: number };

let recording = false;
let recordStart = 0;
let recordedHits: RecordedHit[] = [];
let playing = false;

const recordBtn = document.querySelector<HTMLButtonElement>("#record-btn");
const playBtn = document.querySelector<HTMLButtonElement>("#play-btn");
const statusEl = document.querySelector<HTMLElement>("#record-status");

function setStatus(text: string) {
  if (statusEl) statusEl.textContent = text;
}

// The buttons carry an icon span alongside their label, so swap the label
// text rather than the button's whole contents.
function setRecordLabel(text: string) {
  const label = recordBtn?.querySelector(".control-label");
  if (label) label.textContent = text;
}

function summary(): string {
  if (recordedHits.length === 0) return "Nothing recorded yet — play a bar first.";
  const seconds = (recordedHits[recordedHits.length - 1].t / 1000).toFixed(1);
  return `${recordedHits.length} notes · ${seconds}s`;
}

function play(bar: HTMLButtonElement, freq: number, velocity: number) {
  strike(freq, velocity);
  flash(bar);
  if (recording) {
    recordedHits.push({ barIndex: bars.indexOf(bar), freq, velocity, t: performance.now() - recordStart });
  }
}

// `along` is 0 at the bar's hard end and 1 at its soft end. A wide
// floor-to-ceiling range plus a curve makes soft vs. hard read as distinct
// strikes, not a barely-different volume tweak.
function strikeBar(bar: HTMLButtonElement, along: number) {
  const position = Math.min(1, Math.max(0, along));
  const velocity = Math.pow(Math.min(1, Math.max(0.08, 1 - position)), 0.6);
  play(bar, Number(bar.dataset.freq), velocity);
}

function hit(bar: HTMLButtonElement, clientX: number, clientY: number) {
  // On a phone the rack stands on end and the bars run horizontally, so read
  // whichever axis is actually the bar's length. Either way the far end —
  // top, or left — is the hard end.
  const rect = bar.getBoundingClientRect();
  const along =
    rect.width > rect.height
      ? (clientX - rect.left) / rect.width
      : (clientY - rect.top) / rect.height;
  strikeBar(bar, along);
}

// Inputs that carry no strike position of their own (keyboard, or
// Enter/Space on a focused bar) land a consistent firm hit.
function hitCentre(bar: HTMLButtonElement) {
  strikeBar(bar, 0.3);
}

recordBtn?.addEventListener("click", () => {
  if (playing) return;
  if (!recording) {
    audioContext();
    recording = true;
    recordedHits = [];
    recordStart = performance.now();
    setRecordLabel("Stop");
    recordBtn.classList.add("recording");
    if (playBtn) playBtn.disabled = true;
    setStatus("Recording…");
  } else {
    recording = false;
    setRecordLabel("Record");
    recordBtn.classList.remove("recording");
    if (playBtn) playBtn.disabled = recordedHits.length === 0;
    setStatus(summary());
  }
});

playBtn?.addEventListener("click", () => {
  if (playing || recordedHits.length === 0) return;
  playing = true;
  if (recordBtn) recordBtn.disabled = true;
  playBtn.disabled = true;
  setStatus("Playing back…");

  for (const recorded of recordedHits) {
    setTimeout(() => {
      const bar = bars[recorded.barIndex];
      if (bar) {
        strike(recorded.freq, recorded.velocity);
        flash(bar);
      }
    }, recorded.t);
  }

  const last = recordedHits[recordedHits.length - 1];
  setTimeout(
    () => {
      playing = false;
      if (recordBtn) recordBtn.disabled = false;
      playBtn.disabled = false;
      setStatus(summary());
    },
    last.t + 900,
  );
});

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
  hit(bar, event.clientX, event.clientY);
  lastHitByPointer.set(event.pointerId, bar);
});

xylophone?.addEventListener("pointermove", (event) => {
  if (event.buttons === 0) return;
  const bar = barAt(event.clientX, event.clientY);
  if (!bar || bar === lastHitByPointer.get(event.pointerId)) return;
  hit(bar, event.clientX, event.clientY);
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
  hitCentre(bar);
});

xylophone?.addEventListener("click", (event) => {
  // A keyboard-triggered click (Tab + Enter/Space) has detail 0; a
  // pointer-triggered one is already handled above and would double it up.
  if (event.detail !== 0) return;
  const bar = (event.target as HTMLElement).closest<HTMLButtonElement>(".bar");
  if (!bar) return;
  hitCentre(bar);
});
