// Procedural sound effects for Beast Arena V2 — synthesized with Web Audio, no files.
import type { Efetividade } from "./engine/types";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
const MUTE_KEY = "ba2.mute";
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
})();

export function isMuted() {
  return muted;
}
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Must be called from a user gesture once (iOS unlock). */
export function unlockAudio() {
  const c = ac();
  if (c && c.state === "suspended") void c.resume();
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch {
      return null;
    }
  }
  return ctx;
}

function out(): [AudioContext, GainNode] | null {
  if (muted) return null;
  const c = ac();
  if (!c || !master) return null;
  if (c.state === "suspended") void c.resume();
  return [c, master];
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3, to?: number, delay = 0) {
  const o = out();
  if (!o) return;
  const [c, m] = o;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(m);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol = 0.3, filter: BiquadFilterType = "lowpass", f1 = 2000, f2?: number, delay = 0) {
  const o = out();
  if (!o || !noiseBuf) return;
  const [c, m] = o;
  const t0 = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const bq = c.createBiquadFilter();
  bq.type = filter;
  bq.frequency.setValueAtTime(f1, t0);
  if (f2) bq.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bq);
  bq.connect(g);
  g.connect(m);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => tone(880, 0.06, "triangle", 0.15, 1200),
  hover: () => tone(1400, 0.03, "sine", 0.05),
  card: () => {
    noise(0.22, 0.25, "bandpass", 600, 4000);
    tone(300, 0.15, "triangle", 0.12, 700);
  },
  draw: () => noise(0.08, 0.12, "highpass", 3000),
  whoosh: () => noise(0.35, 0.3, "bandpass", 300, 3000),
  slam: () => {
    tone(90, 0.35, "sine", 0.6, 40);
    noise(0.25, 0.35, "lowpass", 800, 100);
  },
  hit: (power: number, crit: boolean, ef: Efetividade) => {
    const p = Math.min(1, power / 25);
    tone(160 - p * 60, 0.18 + p * 0.15, "sine", 0.45 + p * 0.3, 45);
    noise(0.12 + p * 0.12, 0.35 + p * 0.2, "lowpass", 2500, 300);
    if (ef === "super") tone(660, 0.18, "square", 0.08, 990, 0.03);
    if (crit) {
      tone(1200, 0.25, "sawtooth", 0.1, 400, 0.02);
      noise(0.3, 0.2, "highpass", 4000, 1500, 0.02);
    }
  },
  block: () => {
    tone(1500, 0.25, "triangle", 0.14, 1300);
    tone(2250, 0.2, "sine", 0.07);
  },
  shield: () => {
    tone(520, 0.3, "sine", 0.18, 1040);
    tone(780, 0.35, "sine", 0.1, 1560, 0.05);
  },
  heal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "sine", 0.13, undefined, i * 0.06)),
  powerUp: () => {
    tone(200, 0.4, "sawtooth", 0.1, 800);
    tone(400, 0.4, "square", 0.05, 1600);
  },
  freeze: () => {
    noise(0.4, 0.2, "highpass", 6000, 2000);
    tone(1800, 0.3, "sine", 0.06, 2600);
  },
  tick: (st: "queimar" | "veneno") => (st === "queimar" ? noise(0.3, 0.25, "bandpass", 900, 300) : tone(220, 0.25, "square", 0.08, 140)),
  dodge: () => noise(0.18, 0.25, "bandpass", 2500, 800),
  miss: () => tone(300, 0.3, "triangle", 0.15, 120),
  signature: () => {
    tone(110, 0.8, "sawtooth", 0.15, 440);
    tone(165, 0.8, "sawtooth", 0.1, 660);
    noise(0.6, 0.15, "bandpass", 400, 4000);
  },
  turn: () => {
    tone(392, 0.12, "triangle", 0.15);
    tone(587, 0.18, "triangle", 0.15, undefined, 0.09);
  },
  enemyTurn: () => {
    tone(330, 0.14, "triangle", 0.13);
    tone(247, 0.2, "triangle", 0.13, undefined, 0.1);
  },
  ko: () => {
    tone(140, 1.1, "sawtooth", 0.25, 30);
    noise(1.0, 0.4, "lowpass", 3000, 80);
  },
  victory: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.16, "square", 0.08, undefined, i * 0.12)),
  defeat: () => [392, 349, 311, 262].forEach((f, i) => tone(f, i === 3 ? 0.7 : 0.25, "triangle", 0.14, undefined, i * 0.22)),
  error: () => tone(160, 0.15, "square", 0.1, 120),
};
