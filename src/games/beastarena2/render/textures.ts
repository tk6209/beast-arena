import { Texture } from "pixi.js";
import type { Elemento } from "../engine/types";

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!];
}

function make(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Texture {
  const [c, g] = canvas(w, h);
  draw(g);
  return Texture.from(c);
}

export interface FxTextures {
  soft: Texture;
  spark: Texture;
  star: Texture;
  ring: Texture;
  leaf: Texture;
  shard: Texture;
  drop: Texture;
  smoke: Texture;
  ember: Texture;
  snow: Texture;
  bubble: Texture;
  hex: Texture;
}

let cache: FxTextures | null = null;

export function fxTextures(): FxTextures {
  if (cache) return cache;
  cache = {
    soft: make(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, "rgba(255,255,255,1)");
      r.addColorStop(0.25, "rgba(255,255,255,0.55)");
      r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 128, 128);
    }),
    spark: make(64, 16, (g) => {
      const r = g.createLinearGradient(0, 0, 64, 0);
      r.addColorStop(0, "rgba(255,255,255,0)");
      r.addColorStop(0.7, "rgba(255,255,255,1)");
      r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r;
      g.beginPath();
      g.ellipse(32, 8, 32, 4, 0, 0, Math.PI * 2);
      g.fill();
    }),
    star: make(128, 128, (g) => {
      g.translate(64, 64);
      const glow = g.createRadialGradient(0, 0, 0, 0, 0, 40);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = glow;
      g.fillRect(-64, -64, 128, 128);
      g.fillStyle = "white";
      for (const rot of [0, Math.PI / 2]) {
        g.save();
        g.rotate(rot);
        g.beginPath();
        g.moveTo(-64, 0);
        g.quadraticCurveTo(0, -5, 64, 0);
        g.quadraticCurveTo(0, 5, -64, 0);
        g.fill();
        g.restore();
      }
    }),
    ring: make(128, 128, (g) => {
      g.strokeStyle = "white";
      g.lineWidth = 7;
      g.shadowColor = "white";
      g.shadowBlur = 10;
      g.beginPath();
      g.arc(64, 64, 54, 0, Math.PI * 2);
      g.stroke();
    }),
    leaf: make(32, 48, (g) => {
      const r = g.createLinearGradient(0, 0, 32, 48);
      r.addColorStop(0, "#d7ff8a");
      r.addColorStop(1, "#2f9e3a");
      g.fillStyle = r;
      g.beginPath();
      g.moveTo(16, 0);
      g.quadraticCurveTo(34, 24, 16, 48);
      g.quadraticCurveTo(-2, 24, 16, 0);
      g.fill();
      g.strokeStyle = "rgba(20,80,20,0.6)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(16, 4);
      g.lineTo(16, 44);
      g.stroke();
    }),
    shard: make(32, 64, (g) => {
      const r = g.createLinearGradient(0, 0, 32, 64);
      r.addColorStop(0, "#ffffff");
      r.addColorStop(0.5, "#ffd1f4");
      r.addColorStop(1, "#8fe9ff");
      g.fillStyle = r;
      g.beginPath();
      g.moveTo(16, 0);
      g.lineTo(30, 30);
      g.lineTo(16, 64);
      g.lineTo(2, 30);
      g.closePath();
      g.fill();
    }),
    drop: make(32, 48, (g) => {
      const r = g.createRadialGradient(13, 30, 2, 16, 30, 16);
      r.addColorStop(0, "#ffffff");
      r.addColorStop(0.4, "#9be7ff");
      r.addColorStop(1, "rgba(30,140,255,0.9)");
      g.fillStyle = r;
      g.beginPath();
      g.moveTo(16, 0);
      g.quadraticCurveTo(32, 30, 16, 47);
      g.quadraticCurveTo(0, 30, 16, 0);
      g.fill();
    }),
    smoke: make(128, 128, (g) => {
      for (let i = 0; i < 7; i++) {
        const x = 40 + Math.random() * 48;
        const y = 40 + Math.random() * 48;
        const r = g.createRadialGradient(x, y, 0, x, y, 36);
        r.addColorStop(0, "rgba(255,255,255,0.5)");
        r.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = r;
        g.fillRect(0, 0, 128, 128);
      }
    }),
    ember: make(32, 32, (g) => {
      const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      r.addColorStop(0, "#fffbe0");
      r.addColorStop(0.3, "#ffc04a");
      r.addColorStop(0.7, "rgba(255,90,20,0.6)");
      r.addColorStop(1, "rgba(255,40,0,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 32, 32);
    }),
    snow: make(32, 32, (g) => {
      g.strokeStyle = "white";
      g.lineWidth = 3;
      g.lineCap = "round";
      g.translate(16, 16);
      for (let i = 0; i < 3; i++) {
        g.rotate(Math.PI / 3);
        g.beginPath();
        g.moveTo(-13, 0);
        g.lineTo(13, 0);
        g.stroke();
      }
    }),
    bubble: make(32, 32, (g) => {
      g.strokeStyle = "rgba(220,255,200,0.95)";
      g.lineWidth = 2.5;
      g.fillStyle = "rgba(120,255,90,0.35)";
      g.beginPath();
      g.arc(16, 16, 13, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = "rgba(255,255,255,0.9)";
      g.beginPath();
      g.arc(11, 11, 3.5, 0, Math.PI * 2);
      g.fill();
    }),
    hex: make(256, 256, (g) => {
      // Shield bubble: hex lattice inside a soft sphere.
      const cx = 128;
      const r = g.createRadialGradient(cx, cx, 70, cx, cx, 126);
      r.addColorStop(0, "rgba(120,200,255,0.05)");
      r.addColorStop(0.85, "rgba(140,220,255,0.35)");
      r.addColorStop(1, "rgba(200,240,255,0.0)");
      g.fillStyle = r;
      g.beginPath();
      g.arc(cx, cx, 126, 0, Math.PI * 2);
      g.fill();
      g.save();
      g.beginPath();
      g.arc(cx, cx, 120, 0, Math.PI * 2);
      g.clip();
      g.strokeStyle = "rgba(190,235,255,0.35)";
      g.lineWidth = 1.5;
      const s = 18;
      for (let y = -s; y < 256 + s; y += s * 1.5) {
        for (let x = -s; x < 256 + s; x += s * Math.sqrt(3)) {
          const ox = (Math.round(y / (s * 1.5)) % 2) * ((s * Math.sqrt(3)) / 2);
          g.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + Math.PI / 6;
            const px = x + ox + Math.cos(a) * s * 0.9;
            const py = y + Math.sin(a) * s * 0.9;
            if (k === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
          }
          g.closePath();
          g.stroke();
        }
      }
      g.restore();
      g.strokeStyle = "rgba(220,245,255,0.9)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(cx, cx, 121, 0, Math.PI * 2);
      g.stroke();
    }),
  };
  return cache;
}

/* ---------------- Arena backdrops ---------------- */

export interface Palette {
  sky: [string, string, string];
  floor: [string, string];
  glow: string;
  accent: string;
  grid: string;
  mote: number;
}

export const PALETTES: Record<Elemento, Palette> = {
  fogo: { sky: ["#1a0306", "#5e1208", "#ff6a2b"], floor: ["#2a0a06", "#0d0303"], glow: "#ff7b2e", accent: "#ffd27a", grid: "rgba(255,120,40,0.35)", mote: 0xffa040 },
  agua: { sky: ["#020a1f", "#08386e", "#2fb8ff"], floor: ["#04213f", "#020915"], glow: "#39c6ff", accent: "#b9f0ff", grid: "rgba(80,200,255,0.35)", mote: 0x9be7ff },
  natureza: { sky: ["#03110a", "#0f4a25", "#7be36b"], floor: ["#0b2a14", "#030a05"], glow: "#6af06a", accent: "#e6ff9e", grid: "rgba(110,240,110,0.3)", mote: 0xd2ff8a },
  raio: { sky: ["#07061c", "#27216b", "#ffd93b"], floor: ["#14123a", "#05040f"], glow: "#ffe14a", accent: "#fff6b5", grid: "rgba(255,225,80,0.32)", mote: 0xfff1a0 },
  sombra: { sky: ["#07020f", "#2a0e52", "#a46bff"], floor: ["#170830", "#05020b"], glow: "#b07cff", accent: "#ead6ff", grid: "rgba(176,124,255,0.35)", mote: 0xd8b8ff },
  cristal: { sky: ["#0b0418", "#4a1660", "#ff7ad9"], floor: ["#2a0d3c", "#0a0412"], glow: "#ff8ae0", accent: "#bff6ff", grid: "rgba(255,138,224,0.33)", mote: 0xffc7f0 },
};

/** Paints the static backdrop: sky, horizon glow, silhouettes, perspective floor. */
export function paintBackdrop(w: number, h: number, horizon: number, pal: Palette, dpr: number): Texture {
  const W = Math.max(2, Math.round(w * dpr));
  const H = Math.max(2, Math.round(h * dpr));
  const [c, g] = canvas(W, H);
  g.scale(dpr, dpr);

  // Sky
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, pal.sky[0]);
  sky.addColorStop(0.65, pal.sky[1]);
  sky.addColorStop(1, pal.sky[2]);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, horizon + 2);

  // Stars / sparkles
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w;
    const y = rnd() * horizon * 0.8;
    const r = rnd() * 1.4 + 0.2;
    g.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // Nebula blobs
  for (let i = 0; i < 5; i++) {
    const x = rnd() * w;
    const y = rnd() * horizon * 0.7;
    const r = (0.25 + rnd() * 0.35) * Math.max(w, h) * 0.5;
    const n = g.createRadialGradient(x, y, 0, x, y, r);
    n.addColorStop(0, hexA(pal.glow, 0.18));
    n.addColorStop(1, hexA(pal.glow, 0));
    g.fillStyle = n;
    g.fillRect(0, 0, w, horizon);
  }

  // Distant mountains, two layers
  const ridge = (base: number, amp: number, color: string, freq: number) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, horizon);
    for (let x = 0; x <= w; x += 8) {
      const y = base - Math.abs(Math.sin(x * freq + amp) * amp * 0.6) - Math.sin(x * freq * 2.7) * amp * 0.25 - Math.sin(x * freq * 0.37 + 1) * amp * 0.5;
      g.lineTo(x, y);
    }
    g.lineTo(w, horizon);
    g.closePath();
    g.fill();
  };
  ridge(horizon - 4, Math.min(70, h * 0.08), hexA(pal.sky[0], 0.55), 0.011);
  ridge(horizon, Math.min(44, h * 0.05), hexA(pal.sky[0], 0.9), 0.019);

  // Arena pillars silhouettes
  g.fillStyle = hexA(pal.sky[0], 0.95);
  const pillars = Math.max(4, Math.round(w / 110));
  for (let i = 0; i <= pillars; i++) {
    const x = (i / pillars) * w;
    const ph = horizon * (0.18 + ((i * 37) % 10) / 60);
    g.fillRect(x - 6, horizon - ph, 12, ph);
    g.fillStyle = hexA(pal.glow, 0.8);
    g.fillRect(x - 6, horizon - ph, 12, 3);
    g.fillStyle = hexA(pal.sky[0], 0.95);
  }

  // Horizon glow
  const hg = g.createLinearGradient(0, horizon - 60, 0, horizon + 40);
  hg.addColorStop(0, hexA(pal.glow, 0));
  hg.addColorStop(0.6, hexA(pal.glow, 0.45));
  hg.addColorStop(1, hexA(pal.glow, 0));
  g.fillStyle = hg;
  g.fillRect(0, horizon - 60, w, 100);

  // Floor
  const fl = g.createLinearGradient(0, horizon, 0, h);
  fl.addColorStop(0, pal.floor[0]);
  fl.addColorStop(1, pal.floor[1]);
  g.fillStyle = fl;
  g.fillRect(0, horizon, w, h - horizon);

  // Perspective grid
  g.strokeStyle = pal.grid;
  g.lineWidth = 1;
  const vx = w / 2;
  for (let i = -14; i <= 14; i++) {
    g.beginPath();
    g.moveTo(vx + i * 6, horizon);
    g.lineTo(vx + i * w * 0.22, h);
    g.stroke();
  }
  for (let i = 1; i < 18; i++) {
    const t = Math.pow(i / 18, 2.1);
    const y = horizon + t * (h - horizon);
    g.globalAlpha = 0.25 + t * 0.75;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.globalAlpha = 1;

  // Vignette
  const v = g.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.3, w / 2, h * 0.55, Math.max(w, h) * 0.85);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.65)");
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);

  return Texture.from(c);
}

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const hexNum = (hex: string) => parseInt(hex.slice(1), 16);
