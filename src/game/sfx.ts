/**
 * SFX Engine — procedural sounds via Web Audio API
 * No external files needed; all sounds are synthesized.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/* ── helpers ── */

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  volume = 0.25,
  ramp?: { freq: number; time: number },
) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (ramp) osc.frequency.linearRampToValueAtTime(ramp.freq, c.currentTime + ramp.time);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function noise(duration: number, volume = 0.15) {
  const c = getCtx();
  if (!c) return;
  const size = c.sampleRate * duration;
  const buf = c.createBuffer(1, size, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(gain).connect(c.destination);
  src.start();
  src.stop(c.currentTime + duration);
}

/* ── public SFX ── */

/** Slash / claw attack */
export function sfxAtaque() {
  noise(0.15, 0.2);
  playTone(800, "sawtooth", 0.12, 0.2, { freq: 200, time: 0.1 });
  setTimeout(() => playTone(400, "square", 0.08, 0.15), 60);
}

/** Heavy hit / explosion */
export function sfxExplode() {
  noise(0.4, 0.3);
  playTone(150, "sawtooth", 0.3, 0.3, { freq: 40, time: 0.25 });
  setTimeout(() => playTone(80, "square", 0.2, 0.2), 100);
}

/** Shield / defense activate */
export function sfxDefesa() {
  playTone(600, "sine", 0.15, 0.2);
  setTimeout(() => playTone(900, "sine", 0.2, 0.18), 80);
  setTimeout(() => playTone(1200, "sine", 0.15, 0.12), 160);
}

/** Evolution sparkle */
export function sfxEvolucao() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, "sine", 0.25, 0.2), i * 100);
  });
  setTimeout(() => playTone(1047, "triangle", 0.4, 0.15), 400);
}

/** Swarm capture */
export function sfxSwarm() {
  playTone(440, "triangle", 0.1, 0.15);
  setTimeout(() => playTone(660, "triangle", 0.1, 0.15), 80);
  setTimeout(() => playTone(880, "triangle", 0.15, 0.12), 160);
}

/** Heal / cure */
export function sfxCura() {
  playTone(440, "sine", 0.2, 0.15);
  setTimeout(() => playTone(554, "sine", 0.2, 0.12), 120);
  setTimeout(() => playTone(659, "sine", 0.3, 0.1), 240);
}

/** Card select tap */
export function sfxTap() {
  playTone(1200, "sine", 0.06, 0.1);
}

/** Pass turn */
export function sfxPassar() {
  playTone(400, "triangle", 0.1, 0.12);
  setTimeout(() => playTone(300, "triangle", 0.15, 0.1), 80);
}

/** Victory fanfare */
export function sfxVitoria() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, "sine", 0.3, 0.2), i * 120);
  });
}

/** Defeat */
export function sfxDerrota() {
  const notes = [400, 350, 300, 200];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, "sawtooth", 0.3, 0.15), i * 150);
  });
}

/** Power chosen */
export function sfxPoder() {
  playTone(300, "sine", 0.15, 0.15);
  setTimeout(() => playTone(600, "sine", 0.15, 0.18), 100);
  setTimeout(() => playTone(900, "triangle", 0.25, 0.15), 200);
}
