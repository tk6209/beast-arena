/**
 * SFX procedural via Web Audio API — vendorizado e enxuto para o CapiRocket Dash.
 * Sem arquivos externos e sem dependência do Beast Arena. Tudo sintetizado.
 */

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  volume = 0.2,
  ramp?: { freq: number; time: number },
) {
  if (muted) return;
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
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const size = Math.floor(c.sampleRate * duration);
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

export const capiSfx = {
  setMuted(v: boolean) {
    muted = v;
  },
  /** Pulo — "boing" curto subindo. */
  jump() {
    tone(420, "square", 0.14, 0.16, { freq: 760, time: 0.12 });
  },
  /** Tiro automático — laser seco. */
  shoot() {
    tone(900, "square", 0.07, 0.08, { freq: 320, time: 0.06 });
  },
  /** Inimigo estourado — poof child-safe (sem grave pesado). */
  poof() {
    noise(0.18, 0.16);
    tone(520, "triangle", 0.16, 0.14, { freq: 180, time: 0.14 });
  },
  /** Estrela coletada — brilho ascendente. */
  pickup() {
    tone(660, "sine", 0.1, 0.16);
    setTimeout(() => tone(990, "sine", 0.12, 0.13), 70);
  },
  /** Levou dano. */
  hit() {
    noise(0.2, 0.2);
    tone(200, "sawtooth", 0.2, 0.18, { freq: 70, time: 0.18 });
  },
  /** Fim de jogo — descida triste. */
  gameover() {
    const notes = [440, 350, 280, 180];
    notes.forEach((f, i) => setTimeout(() => tone(f, "triangle", 0.3, 0.16), i * 150));
  },
};
