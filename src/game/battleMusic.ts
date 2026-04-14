/**
 * Procedural ambient battle music using Web Audio API.
 * Generates a dark, pulsing loop with bass, pads, and arpeggios.
 */
import { isMuted } from "./audioState";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let intervalIds: number[] = [];

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playNote(
  c: AudioContext, dest: AudioNode,
  freq: number, type: OscillatorType,
  start: number, dur: number, vol: number,
  endFreq?: number
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, start + dur * 0.8);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.02);
  gain.gain.setValueAtTime(vol, start + dur * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(dest);
  osc.start(start);
  osc.stop(start + dur);
}

function playBeat(c: AudioContext, dest: AudioNode) {
  const now = c.currentTime;

  // Sub bass pulse
  playNote(c, dest, 55, "sine", now, 0.8, 0.08);
  playNote(c, dest, 55, "sine", now + 1, 0.8, 0.08);
  playNote(c, dest, 41, "sine", now + 2, 0.8, 0.07);
  playNote(c, dest, 55, "sine", now + 3, 0.8, 0.08);

  // Dark pad chord (Am: A2-C3-E3)
  const padVol = 0.025;
  playNote(c, dest, 110, "triangle", now, 3.8, padVol);
  playNote(c, dest, 131, "triangle", now, 3.8, padVol);
  playNote(c, dest, 165, "triangle", now, 3.8, padVol);

  // Arpeggio pattern
  const arpNotes = [220, 262, 330, 262, 220, 330, 392, 330];
  arpNotes.forEach((f, i) => {
    playNote(c, dest, f, "sine", now + i * 0.5, 0.4, 0.02);
  });

  // Hi-hat like noise on beats
  [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].forEach((t) => {
    const bufSize = c.sampleRate * 0.03;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.015, now + t);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.05);
    src.connect(g).connect(dest);
    src.start(now + t);
    src.stop(now + t + 0.05);
  });
}

export function startBattleMusic() {
  if (isPlaying || isMuted()) return;
  const c = getCtx();
  if (!c) return;

  masterGain = c.createGain();
  masterGain.gain.setValueAtTime(0, c.currentTime);
  masterGain.gain.linearRampToValueAtTime(1, c.currentTime + 2);
  masterGain.connect(c.destination);

  isPlaying = true;

  // Play first beat immediately
  playBeat(c, masterGain);

  // Loop every 4 seconds
  const id = window.setInterval(() => {
    if (!isPlaying || !ctx || !masterGain) return;
    playBeat(ctx, masterGain);
  }, 4000);
  intervalIds.push(id);
}

export function stopBattleMusic() {
  if (!isPlaying) return;
  isPlaying = false;
  intervalIds.forEach(clearInterval);
  intervalIds = [];
  if (masterGain && ctx) {
    masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1);
    setTimeout(() => {
      masterGain?.disconnect();
      masterGain = null;
    }, 1200);
  }
}
