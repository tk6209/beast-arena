/**
 * CAPI RUSH — renderer 2D "AAA": falsa perspectiva, biomas em camadas, luz
 * aditiva, partículas, câmera que acompanha a pista e pós-processamento leve.
 * Só desenha: toda a lógica mora em engine.ts.
 */
import { biomeAt } from "./biome";
import { getHero, heroImage, type Hero } from "./heroes";
import {
  BASE_SPEED,
  MAX_SPEED,
  SPAWN_Z,
  isSliding,
  type Obstacle,
  type Pickup,
  type RushEvent,
  type RushState,
} from "./engine";

const CAM = 8; // distância da câmera atrás da capivara

/* ───────── Vista e projeção ───────── */
export interface View {
  W: number;
  H: number;
  horizon: number;
  base: number;
  laneW: number;
  unit: number;
  cx: number;
  /** Posição lateral da câmera, em pistas (segue o jogador com atraso). */
  cam: number;
}

export function makeView(W: number, H: number): View {
  const laneW = Math.min(W * 0.3, H * 0.32);
  return { W, H, horizon: H * 0.33, base: H * 0.86, laneW, unit: laneW * 0.55, cx: W / 2, cam: 0 };
}

/** Escala de perspectiva: 1 em z = 0, encolhe com a distância. */
const sc = (z: number) => CAM / (Math.max(z, -CAM + 0.5) + CAM);
const gy = (v: View, z: number) => v.horizon + (v.base - v.horizon) * sc(z);
const gx = (v: View, laneX: number, z: number) => v.cx + (laneX - v.cam) * v.laneW * sc(z);

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ───────── Cor ───────── */
type RGB = [number, number, number];
const rgbCache = new Map<string, RGB>();
function rgb(hex: string): RGB {
  let c = rgbCache.get(hex);
  if (!c) {
    if (hex.startsWith("rgb")) {
      const m = hex.match(/\d+/g) ?? ["0", "0", "0"];
      c = [Number(m[0]), Number(m[1]), Number(m[2])];
    } else {
      const n = Number.parseInt(hex.slice(1), 16);
      c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    rgbCache.set(hex, c);
  }
  return c;
}
function mix(a: string, b: string, t: number, alpha = 1): string {
  const A = rgb(a);
  const B = rgb(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  return alpha >= 1 ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${alpha})`;
}

const PAL = {
  cyan: "#38e1ff",
  violet: "#b794ff",
  gold: "#ffcf4a",
  orange: "#ff7a45",
  pink: "#ff3d8b",
  mint: "#22e3a0",
};

/* ───────── Brilho aditivo (sprite radial em cache, bem mais barato que shadowBlur) ───────── */
const glowCache = new Map<string, HTMLCanvasElement>();
function glowSprite(color: string): HTMLCanvasElement {
  let c = glowCache.get(color);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) {
      const [r, gr, b] = rgb(color);
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `rgba(${r},${gr},${b},1)`);
      grad.addColorStop(0.35, `rgba(${r},${gr},${b},.35)`);
      grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }
    glowCache.set(color, c);
  }
  return c;
}
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  if (r < 0.5 || alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

/* ───────── Partículas e efeitos de tela ───────── */
interface Particle {
  lane: number;
  y: number; // altura em metros
  z: number;
  vl: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "spark" | "dust" | "ring" | "ember";
}

export class Fx {
  parts: Particle[] = [];
  flash = 0;
  flashColor = "#ff3d3d";
  shake = 0;
  private seed = 1;
  private emberClock = 0;

  private rnd(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  private burst(kind: Particle["kind"], lane: number, y: number, z: number, n: number, color: string, speed: number, size: number, life: number) {
    for (let i = 0; i < n && this.parts.length < 420; i++) {
      const a = this.rnd() * Math.PI * 2;
      const s = speed * (0.35 + this.rnd());
      this.parts.push({
        lane,
        y,
        z,
        vl: Math.cos(a) * s * 0.35,
        vy: Math.abs(Math.sin(a)) * s + speed * 0.3,
        vz: (this.rnd() - 0.5) * s,
        life: life * (0.6 + this.rnd() * 0.6),
        max: life,
        size,
        color,
        kind,
      });
    }
  }

  /** Converte eventos do motor em efeitos. */
  onEvents(events: readonly RushEvent[], s: RushState, hero: Hero, reduced: boolean) {
    for (const e of events) {
      const lane = s.laneX;
      switch (e) {
        case "jump":
          this.burst("dust", lane, 0.05, 0.5, 8, "#e9d8ff", 2.2, 0.16, 0.5);
          this.parts.push({ lane, y: 0.05, z: 0.5, vl: 0, vy: 0, vz: 0, life: 0.35, max: 0.35, size: 1.2, color: hero.accent, kind: "ring" });
          break;
        case "slide":
          this.burst("spark", lane, 0.1, 0.4, 10, PAL.gold, 3, 0.1, 0.4);
          break;
        case "switch":
          this.burst("dust", lane, 0.05, 0.5, 4, "#cbb8ff", 1.4, 0.12, 0.35);
          break;
        case "coin":
          this.burst("spark", lane, 0.9 + s.y, 0.6, 7, PAL.gold, 3.2, 0.09, 0.45);
          break;
        case "shield-pickup":
          this.burst("spark", lane, 1, 0.6, 16, PAL.cyan, 4, 0.12, 0.6);
          this.flash = Math.max(this.flash, reduced ? 0 : 0.18);
          this.flashColor = PAL.cyan;
          break;
        case "shield-break":
          this.burst("spark", lane, 1, 0.6, 26, PAL.cyan, 6, 0.12, 0.7);
          this.parts.push({ lane, y: 1, z: 0.5, vl: 0, vy: 0, vz: 0, life: 0.5, max: 0.5, size: 2.4, color: PAL.cyan, kind: "ring" });
          this.shake = reduced ? 0 : 10;
          this.flash = reduced ? 0 : 0.25;
          this.flashColor = PAL.cyan;
          break;
        case "hit":
          this.burst("spark", lane, 1, 0.6, 30, PAL.orange, 7, 0.14, 0.7);
          this.burst("dust", lane, 0.6, 0.6, 12, "#7a5a3a", 3, 0.2, 0.7);
          this.shake = reduced ? 0 : 16;
          this.flash = reduced ? 0 : 0.5;
          this.flashColor = "#ff3d3d";
          break;
        case "over":
          this.shake = reduced ? 0 : 22;
          break;
      }
    }
  }

  update(dt: number, s: RushState, biome: number, running: boolean) {
    if (running) {
      // Poeira de corrida e brasas da selva.
      if (s.y <= 0 && !s.over && this.rnd() < dt * 22) {
        this.parts.push({
          lane: s.laneX + (this.rnd() - 0.5) * 0.4,
          y: 0.03,
          z: 0.2,
          vl: (this.rnd() - 0.5) * 0.6,
          vy: 0.5 + this.rnd() * 0.6,
          vz: 0,
          life: 0.45,
          max: 0.45,
          size: 0.12,
          color: biome > 0.5 ? "#d9c28a" : "#b9a6ff",
          kind: "dust",
        });
      }
    }
    this.emberClock += dt;
    if (biome > 0.35 && this.rnd() < dt * 18 * biome) {
      this.parts.push({
        lane: (this.rnd() - 0.5) * 6,
        y: 0.2,
        z: 6 + this.rnd() * 40,
        vl: (this.rnd() - 0.5) * 0.4,
        vy: 0.8 + this.rnd() * 1.2,
        vz: 0,
        life: 2.2,
        max: 2.2,
        size: 0.07,
        color: PAL.orange,
        kind: "ember",
      });
    }
    const scroll = running ? s.speed : 6;
    for (const p of this.parts) {
      p.life -= dt;
      p.lane += p.vl * dt;
      p.y += p.vy * dt;
      if (p.kind === "spark") p.vy -= 9 * dt;
      if (p.kind === "dust") p.vy *= 0.94;
      p.z += (p.vz - scroll) * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0 && p.z > -1.2);
    this.flash = Math.max(0, this.flash - dt * 1.6);
    this.shake = Math.max(0, this.shake - dt * 45);
  }
}

/* ───────── Céu e fundo ───────── */
function drawSky(ctx: CanvasRenderingContext2D, v: View, s: RushState, j: number) {
  const hz = v.horizon;
  // Cidade (noite)
  const city = ctx.createLinearGradient(0, 0, 0, hz + 8);
  city.addColorStop(0, "#04050f");
  city.addColorStop(0.55, "#1a0f3d");
  city.addColorStop(0.88, "#5a2288");
  city.addColorStop(1, "#c4408f");
  ctx.fillStyle = city;
  ctx.fillRect(0, 0, v.W, hz + 8);

  // Selva (fim de tarde dourado), por cima, com alpha do bioma
  if (j > 0) {
    const jg = ctx.createLinearGradient(0, 0, 0, hz + 8);
    jg.addColorStop(0, "#0b2a2a");
    jg.addColorStop(0.5, "#2f6a52");
    jg.addColorStop(0.85, "#d9b45a");
    jg.addColorStop(1, "#ffd98a");
    ctx.globalAlpha = j;
    ctx.fillStyle = jg;
    ctx.fillRect(0, 0, v.W, hz + 8);
    ctx.globalAlpha = 1;
  }

  // Estrelas (somem na selva)
  if (j < 1) {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 46; i++) {
      const x = hash(i * 3.1) * v.W;
      const y = hash(i * 7.7) * hz * 0.7;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(s.time * (0.8 + hash(i) * 1.6) + i));
      ctx.globalAlpha = (1 - j) * tw * 0.8;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }

  // Lua / sol
  const moonX = v.W * 0.78;
  const moonY = hz * 0.4;
  if (j < 1) {
    glow(ctx, moonX, moonY, hz * 0.55, "#ffe6a8", 0.35 * (1 - j));
    ctx.globalAlpha = 1 - j;
    ctx.fillStyle = "#fff0c8";
    ctx.beginPath();
    ctx.arc(moonX, moonY, hz * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(200,170,120,.35)";
    ctx.beginPath();
    ctx.arc(moonX - hz * 0.03, moonY - hz * 0.02, hz * 0.025, 0, Math.PI * 2);
    ctx.arc(moonX + hz * 0.035, moonY + hz * 0.03, hz * 0.018, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (j > 0) {
    const sunX = v.W * 0.5 - v.cam * v.laneW * 0.1;
    const sunY = hz * 0.8;
    glow(ctx, sunX, sunY, hz * 1.1, "#ffd27a", 0.75 * j);
    glow(ctx, sunX, sunY, hz * 0.45, "#fff3c4", 0.9 * j);
    // raios de luz que atravessam a copa das árvores
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.2 + Math.sin(s.time * 0.25 + i) * 0.025;
      const len = hz * 1.6;
      const w = 0.07 + hash(i) * 0.05;
      const grad = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(a) * len, sunY + Math.sin(a) * len);
      grad.addColorStop(0, `rgba(255,224,150,${0.22 * j})`);
      grad.addColorStop(1, "rgba(255,224,150,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(a - w) * len, sunY + Math.sin(a - w) * len);
      ctx.lineTo(sunX + Math.cos(a + w) * len, sunY + Math.sin(a + w) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFarLayers(ctx: CanvasRenderingContext2D, v: View, s: RushState, j: number) {
  const hz = v.horizon;
  const layers = [
    { speed: 0.18, step: 70, hMax: 0.5, city: "#0e0826", jungle: "#0c2a23", seed: 1 },
    { speed: 0.4, step: 54, hMax: 0.36, city: "#170c38", jungle: "#12402e", seed: 9 },
  ];
  for (const L of layers) {
    const off = (s.distance * L.speed) % L.step;
    const base = Math.floor((s.distance * L.speed) / L.step);
    const parx = -v.cam * v.laneW * 0.12 * (L.speed + 0.4);
    for (let i = -1; i < v.W / L.step + 2; i++) {
      const id = base + i + L.seed * 100;
      const x = i * L.step - off + parx;
      const h = 14 + hash(id) * hz * L.hMax;
      if (j < 1) {
        ctx.globalAlpha = 1 - j;
        ctx.fillStyle = L.city;
        ctx.fillRect(x, hz - h, L.step * 0.72, h + 2);
        // janelas acesas
        if (L.speed > 0.3) {
          for (let r = 0; r < Math.floor(h / 9); r++) {
            for (let c = 0; c < 3; c++) {
              if (hash(id * 13 + r * 5 + c) < 0.62) continue;
              ctx.fillStyle = hash(id + r) > 0.5 ? "rgba(56,225,255,.7)" : "rgba(255,207,74,.7)";
              ctx.fillRect(x + 6 + c * 14, hz - h + 6 + r * 9, 5, 3);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      if (j > 0) {
        ctx.globalAlpha = j;
        ctx.fillStyle = L.jungle;
        // copa de árvore: três círculos sobre um tronco
        const tw = L.step * 0.12;
        ctx.fillRect(x + L.step * 0.3, hz - h * 0.55, tw, h * 0.6);
        const r = L.step * (0.34 + hash(id + 3) * 0.12);
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(x + L.step * (0.18 + k * 0.28), hz - h * (0.6 + hash(id + k) * 0.25), r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }
}

/* ───────── Pista ───────── */
function drawRoad(ctx: CanvasRenderingContext2D, v: View, s: RushState, j: number) {
  const roadCol = mix("#0d0b22", "#7a6b46", j);
  const edgeCol = mix(PAL.cyan, PAL.gold, j);
  ctx.fillStyle = mix("#07061a", "#0e1f14", j);
  ctx.fillRect(0, v.horizon, v.W, v.H - v.horizon);

  const half = 1.5;
  const zf = SPAWN_Z;
  const zn = -CAM + 0.5;
  const roadGrad = ctx.createLinearGradient(0, v.horizon, 0, v.H);
  roadGrad.addColorStop(0, mix(roadCol, "#000000", 0.2 * (1 - j)));
  roadGrad.addColorStop(1, mix(roadCol, "#1a1640", 0.35 * (1 - j)));
  ctx.fillStyle = roadGrad;
  ctx.beginPath();
  ctx.moveTo(gx(v, -half, zf), gy(v, zf));
  ctx.lineTo(gx(v, half, zf), gy(v, zf));
  ctx.lineTo(gx(v, half, zn), gy(v, zn));
  ctx.lineTo(gx(v, -half, zn), gy(v, zn));
  ctx.closePath();
  ctx.fill();

  // Faixas que rolam: dormentes na cidade, lajes de pedra na selva
  const spacing = 4;
  const phase = (s.distance % spacing) / spacing;
  for (let i = 0; i < SPAWN_Z / spacing + 1; i++) {
    const z = (i - phase) * spacing;
    if (z < -CAM + 1) continue;
    const y0 = gy(v, z);
    const y1 = gy(v, z + spacing * (j > 0.5 ? 0.92 : 0.35));
    const xl = gx(v, -half, z);
    const wd = gx(v, half, z) - xl;
    ctx.fillStyle = j > 0.5 ? (i % 2 ? "rgba(255,230,160,.05)" : "rgba(0,0,0,.18)") : i % 2 ? "rgba(56,225,255,.06)" : "rgba(183,148,255,.08)";
    ctx.fillRect(xl, y1, wd, Math.max(1, y0 - y1));
    if (j > 0.5) {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(xl, y0 - 1, wd, 1.5);
    }
  }

  // Reflexo molhado dos neons (cidade)
  if (j < 1) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.5 * (1 - j);
    for (const [lx, col] of [[-1.5, PAL.cyan], [1.5, PAL.pink]] as const) {
      const g = ctx.createLinearGradient(0, v.horizon, 0, v.H);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, mix(col, "#000000", 0.55));
      ctx.fillStyle = g;
      const w0 = 0.12;
      ctx.beginPath();
      ctx.moveTo(gx(v, lx - w0, zf), gy(v, zf));
      ctx.lineTo(gx(v, lx + w0, zf), gy(v, zf));
      ctx.lineTo(gx(v, lx + w0 * 6, zn), gy(v, zn));
      ctx.lineTo(gx(v, lx - w0 * 6, zn), gy(v, zn));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Divisórias de pista
  ctx.strokeStyle = j > 0.5 ? "rgba(255,230,160,.28)" : "rgba(183,148,255,.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  for (const lx of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(gx(v, lx, zf), gy(v, zf));
    ctx.lineTo(gx(v, lx, zn), gy(v, zn));
    ctx.stroke();
  }

  // Bordas com brilho
  for (const lx of [-half, half]) {
    const x0 = gx(v, lx, zf);
    const y0 = gy(v, zf);
    const x1 = gx(v, lx, zn);
    const y1 = gy(v, zn);
    ctx.strokeStyle = mix(edgeCol, "#ffffff", 0.2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = mix(edgeCol, "#000000", 0.55);
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }
}

/* ───────── Cenário lateral ───────── */
function drawCityBuilding(ctx: CanvasRenderingContext2D, v: View, id: number, side: number, z: number, alpha: number) {
  const k = sc(z);
  const hh = (2.5 + hash(id * 2 + (side > 0 ? 1 : 0)) * 6.5) * v.unit * k;
  const w = 2.3 * v.laneW * k;
  const x = gx(v, side * 2.1, z) - (side < 0 ? w : 0);
  const y = gy(v, z);
  ctx.globalAlpha = alpha;
  const body = ctx.createLinearGradient(x, y - hh, x + w, y);
  body.addColorStop(0, side < 0 ? "#1d1244" : "#14144a");
  body.addColorStop(1, "#08051c");
  ctx.fillStyle = body;
  ctx.fillRect(x, y - hh, w, hh);
  // aresta iluminada voltada para a pista
  const edgeX = side < 0 ? x + w - 2 : x;
  const neon = [PAL.cyan, PAL.pink, PAL.violet, PAL.gold][Math.floor(hash(id + 4) * 4)];
  ctx.fillStyle = neon;
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillRect(edgeX, y - hh, 2, hh);
  glow(ctx, edgeX, y - hh * 0.5, hh * 0.55, neon, 0.18 * alpha);
  ctx.globalAlpha = alpha;
  // janelas
  const rows = 6;
  const cols = 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (hash(id * 31 + r * 7 + c + side) < 0.4) continue;
      ctx.fillStyle = [PAL.cyan, PAL.gold, PAL.violet, PAL.mint][Math.floor(hash(id + r + c * 3) * 4)];
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillRect(x + w * (0.12 + c * 0.3), y - hh + hh * (0.08 + r * 0.14), w * 0.18, hh * 0.07);
    }
  }
  // placa de neon vertical em alguns prédios
  if (hash(id + 11) > 0.55) {
    ctx.globalAlpha = alpha;
    const sx = side < 0 ? x + w * 0.82 : x + w * 0.1;
    ctx.fillStyle = neon;
    ctx.fillRect(sx, y - hh * 0.75, w * 0.08, hh * 0.35);
    glow(ctx, sx + w * 0.04, y - hh * 0.58, w * 0.6, neon, 0.3 * alpha);
  }
  ctx.globalAlpha = 1;
}

function drawJungleSlot(ctx: CanvasRenderingContext2D, v: View, id: number, side: number, z: number, alpha: number, time: number) {
  const k = sc(z);
  const y = gy(v, z);
  const xBase = gx(v, side * 2.25, z);
  const u = v.unit * k;
  ctx.globalAlpha = alpha;
  const kind = hash(id * 5 + (side > 0 ? 2 : 0));
  if (kind < 0.38) {
    // pilar de ruína com musgo e runas
    const w = 1.1 * v.laneW * k;
    const hh = (3 + hash(id) * 3) * u;
    const x = xBase - w / 2 + side * w * 0.3;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "#4a4638");
    g.addColorStop(0.5, "#6d6a58");
    g.addColorStop(1, "#2f2c22");
    ctx.fillStyle = g;
    ctx.fillRect(x, y - hh, w, hh);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    for (let b = 1; b < 6; b++) ctx.fillRect(x, y - (hh * b) / 6, w, Math.max(1, 1.5 * k));
    ctx.fillStyle = "#3f7a3c";
    ctx.fillRect(x - w * 0.05, y - hh, w * 1.1, hh * 0.08);
    // runa dourada
    ctx.fillStyle = "rgba(255,207,74,.75)";
    ctx.fillRect(x + w * 0.4, y - hh * 0.62, w * 0.2, hh * 0.05);
    ctx.fillRect(x + w * 0.46, y - hh * 0.62, w * 0.08, hh * 0.16);
    glow(ctx, x + w / 2, y - hh * 0.58, w * 0.9, PAL.gold, 0.25 * alpha);
  } else if (kind < 0.85) {
    // árvore: tronco, copa volumosa, cipós
    const tw = 0.5 * v.laneW * k;
    const th = (6 + hash(id + 2) * 3) * u;
    const x = xBase - tw / 2 + side * tw * 1.2;
    ctx.fillStyle = "#3b2a1a";
    ctx.fillRect(x, y - th, tw, th);
    const cr = 1.05 * v.laneW * k * (0.9 + hash(id + 5) * 0.4);
    const cy = y - th;
    for (let n = 0; n < 11; n++) {
      const a = hash(id * 7 + n) * Math.PI * 2;
      const rr = cr * (0.2 + hash(id + n * 3) * 0.75);
      const cxx = x + tw / 2 + Math.cos(a) * rr - side * cr * 0.35;
      const cyy = cy + Math.sin(a) * rr * 0.55 - cr * 0.1;
      const lr = cr * (0.28 + hash(id + n) * 0.22);
      const g = ctx.createRadialGradient(cxx - lr * 0.3, cyy - lr * 0.35, lr * 0.1, cxx, cyy, lr);
      g.addColorStop(0, n % 3 === 0 ? "#7cc356" : "#4f9d4a");
      g.addColorStop(1, "#123f26");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cxx, cyy, lr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(60,140,60,.85)";
    ctx.lineWidth = Math.max(1, 2 * k);
    for (let n = 0; n < 4; n++) {
      const vx = x + tw / 2 + (n - 1.5) * cr * 0.5;
      ctx.beginPath();
      ctx.moveTo(vx, cy + cr * 0.3);
      ctx.quadraticCurveTo(vx + Math.sin(time + n + id) * 4 * k, cy + cr * 0.9, vx, cy + cr * (1.0 + hash(id + n) * 0.8));
      ctx.stroke();
    }
  } else {
    // vila em chamas: cabana + fogueira com brilho tremulante
    const w = 1.7 * v.laneW * k;
    const hh = 1.7 * u;
    const x = xBase - w / 2 + side * w * 0.2;
    ctx.fillStyle = "#4a3320";
    ctx.fillRect(x, y - hh, w, hh);
    ctx.fillStyle = "#2a1a10";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.1, y - hh);
    ctx.lineTo(x + w / 2, y - hh * 1.7);
    ctx.lineTo(x + w * 1.1, y - hh);
    ctx.closePath();
    ctx.fill();
    const fl = 0.75 + 0.25 * Math.sin(time * 13 + id);
    glow(ctx, x + w / 2, y - hh * 0.6, w * 1.8 * fl, PAL.orange, 0.7 * alpha);
    glow(ctx, x + w / 2, y - hh * 0.8, w * 0.9 * fl, "#ffe08a", 0.8 * alpha);
    ctx.fillStyle = "#ff9a3c";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y - hh * 0.9);
    ctx.quadraticCurveTo(x + w * 0.5, y - hh * (1.6 + 0.2 * fl), x + w * 0.7, y - hh * 0.9);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawScenery(ctx: CanvasRenderingContext2D, v: View, s: RushState, j: number) {
  const spacing = 10;
  const base = Math.floor(s.distance / spacing);
  const phase = (s.distance % spacing) / spacing;
  for (let i = Math.ceil(SPAWN_Z / spacing); i >= 0; i--) {
    const z = (i - phase) * spacing;
    if (z < -1.5) continue;
    const id = base + i;
    for (const side of [-1, 1]) {
      if (j < 0.999) drawCityBuilding(ctx, v, id, side, z, 1 - j);
      // árvores e pilares crescem rápido perto da câmera: somem antes de atravessar a tela
      if (j > 0.001 && z > -0.2) drawJungleSlot(ctx, v, id, side, z, j * Math.min(1, (z + 0.2) / 1.2), s.time);
    }
  }
}

/* ───────── Objetos ───────── */
function drawBox(
  ctx: CanvasRenderingContext2D,
  v: View,
  lane: number,
  z: number,
  len: number,
  w: number,
  hBottom: number,
  hTop: number,
  front: [string, string],
  top: string,
  side?: string,
) {
  const zn = Math.max(z, -CAM + 0.6);
  const zf = Math.max(z + len, zn + 0.01);
  const kn = sc(zn);
  const kf = sc(zf);
  const xn = gx(v, lane, zn);
  const xf = gx(v, lane, zf);
  const wn = w * v.laneW * kn;
  const wf = w * v.laneW * kf;
  const yn = gy(v, zn);
  const yf = gy(v, zf);
  const topN = yn - hTop * v.unit * kn;
  const topF = yf - hTop * v.unit * kf;
  const botN = yn - hBottom * v.unit * kn;

  // lateral visível (perspectiva puxa o objeto para o centro da tela)
  if (side) {
    const dirRight = xn < v.cx;
    ctx.fillStyle = side;
    ctx.beginPath();
    if (dirRight) {
      ctx.moveTo(xn + wn / 2, topN);
      ctx.lineTo(xf + wf / 2, topF);
      ctx.lineTo(xf + wf / 2, yf - hBottom * v.unit * kf);
      ctx.lineTo(xn + wn / 2, botN);
    } else {
      ctx.moveTo(xn - wn / 2, topN);
      ctx.lineTo(xf - wf / 2, topF);
      ctx.lineTo(xf - wf / 2, yf - hBottom * v.unit * kf);
      ctx.lineTo(xn - wn / 2, botN);
    }
    ctx.closePath();
    ctx.fill();
  }
  if (hTop > 0) {
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(xf - wf / 2, topF);
    ctx.lineTo(xf + wf / 2, topF);
    ctx.lineTo(xn + wn / 2, topN);
    ctx.lineTo(xn - wn / 2, topN);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, topN, 0, botN);
  g.addColorStop(0, front[0]);
  g.addColorStop(1, front[1]);
  ctx.fillStyle = g;
  ctx.fillRect(xn - wn / 2, topN, wn, botN - topN);
  return { xn, wn, yn, kn, topN, botN };
}

function drawObstacle(ctx: CanvasRenderingContext2D, v: View, o: Obstacle, time: number, j: number) {
  if (o.kind === "train") {
    const b = drawBox(ctx, v, o.lane, o.z, o.len, 0.86, 0, 2.5, ["#5a43c0", "#241a5c"], "#7d67e8", "#1c1448");
    const { xn, wn, yn, kn } = b;
    const u = v.unit * kn;
    // para-brisa
    ctx.fillStyle = "#0a0a22";
    ctx.fillRect(xn - wn * 0.42, yn - 2.2 * u, wn * 0.84, 0.95 * u);
    const wg = ctx.createLinearGradient(0, yn - 2.2 * u, 0, yn - 1.25 * u);
    wg.addColorStop(0, "rgba(56,225,255,.85)");
    wg.addColorStop(1, "rgba(183,148,255,.35)");
    ctx.fillStyle = wg;
    ctx.fillRect(xn - wn * 0.4, yn - 2.16 * u, wn * 0.8, 0.87 * u);
    // faixa neon
    ctx.fillStyle = PAL.cyan;
    ctx.fillRect(xn - wn / 2, yn - 1.05 * u, wn, 0.1 * u + 1);
    // para-choque com listras de alerta
    ctx.fillStyle = "#12102a";
    ctx.fillRect(xn - wn / 2, yn - 0.38 * u, wn, 0.38 * u);
    ctx.fillStyle = PAL.gold;
    for (let i = 0; i < 6; i++) ctx.fillRect(xn - wn / 2 + wn * (i / 6) + wn * 0.02, yn - 0.34 * u, wn * 0.07, 0.3 * u);
    // faróis + cone de luz no chão
    for (const sx of [-0.3, 0.3]) {
      glow(ctx, xn + sx * wn, yn - 0.7 * u, 1.1 * u, "#fff0b0", 0.95);
      ctx.fillStyle = "#fffbe0";
      ctx.beginPath();
      ctx.arc(xn + sx * wn, yn - 0.7 * u, Math.max(1.5, 0.12 * u), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pool = ctx.createRadialGradient(xn, yn + 0.25 * u, 0, xn, yn + 0.25 * u, wn * 0.9);
    pool.addColorStop(0, "rgba(255,240,170,.28)");
    pool.addColorStop(1, "rgba(255,240,170,0)");
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(xn, yn + 0.25 * u, wn * 0.9, wn * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (o.kind === "barrier") {
    const b = drawBox(ctx, v, o.lane, o.z, o.len, 0.8, 0, 0.7, [PAL.orange, "#b8431c"], "#ffb08a", "#8a2f10");
    const { xn, wn, yn, kn } = b;
    const u = v.unit * kn;
    ctx.save();
    ctx.beginPath();
    ctx.rect(xn - wn / 2, yn - 0.7 * u, wn, 0.7 * u);
    ctx.clip();
    ctx.fillStyle = "#170c26";
    for (let i = -2; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(xn - wn / 2 + i * wn * 0.2, yn);
      ctx.lineTo(xn - wn / 2 + i * wn * 0.2 + wn * 0.1, yn);
      ctx.lineTo(xn - wn / 2 + i * wn * 0.2 + wn * 0.1 + 0.7 * u * 0.6, yn - 0.7 * u);
      ctx.lineTo(xn - wn / 2 + i * wn * 0.2 + 0.7 * u * 0.6, yn - 0.7 * u);
      ctx.fill();
    }
    ctx.restore();
    const blink = 0.5 + 0.5 * Math.sin(time * 8 + o.id);
    for (const sx of [-0.34, 0.34]) glow(ctx, xn + sx * wn, yn - 0.78 * u, 0.5 * u, PAL.gold, 0.35 + 0.65 * blink);
  } else {
    // barra alta: dois postes e um feixe holográfico
    const w = 0.86;
    for (const sx of [-1, 1]) {
      const px = o.lane + sx * (w / 2 - 0.05);
      const bx = drawBox(ctx, v, px, o.z, o.len, 0.12, 0, 1.7, ["#8f78ee", "#3b2a8c"], "#c3b0ff");
      glow(ctx, bx.xn, bx.yn - 1.7 * v.unit * bx.kn, 0.55 * v.unit * bx.kn, PAL.pink, 0.9);
    }
    const kn = sc(Math.max(o.z, -CAM + 0.6));
    const xn = gx(v, o.lane, Math.max(o.z, -CAM + 0.6));
    const yn = gy(v, Math.max(o.z, -CAM + 0.6));
    const wn = w * v.laneW * kn;
    const u = v.unit * kn;
    const beamTop = yn - 1.35 * u;
    const beamBot = yn - 0.85 * u;
    const bg = ctx.createLinearGradient(0, beamTop, 0, beamBot);
    bg.addColorStop(0, "rgba(255,61,139,.85)");
    bg.addColorStop(0.5, "rgba(255,160,200,.95)");
    bg.addColorStop(1, "rgba(255,61,139,.7)");
    ctx.fillStyle = bg;
    ctx.fillRect(xn - wn / 2, beamTop, wn, beamBot - beamTop);
    glow(ctx, xn, (beamTop + beamBot) / 2, wn * 0.75, PAL.pink, 0.5);
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(time * 14 + o.id);
    ctx.fillRect(xn - wn / 2, (beamTop + beamBot) / 2 - 1, wn, 2);
    ctx.globalAlpha = 1;
  }
  void j;
}

function drawPickup(ctx: CanvasRenderingContext2D, v: View, p: Pickup, time: number) {
  const k = sc(p.z);
  const x = gx(v, p.lane, p.z);
  const lift = p.h === 1 ? 1.35 : 0.45;
  const bob = Math.sin(time * 4 + p.id) * 0.04;
  const y = gy(v, p.z) - (lift + bob) * v.unit * k;
  if (p.kind === "coin") {
    const r = 0.25 * v.unit * k;
    const squash = Math.abs(Math.cos(time * 5 + p.id));
    const rx = Math.max(0.6, r * (0.3 + 0.7 * squash));
    glow(ctx, x, y, r * 3, PAL.gold, 0.55);
    const g = ctx.createRadialGradient(x - rx * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, "#fff4b8");
    g.addColorStop(0.6, "#ffcf4a");
    g.addColorStop(1, "#c98a10");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9a6208";
    ctx.lineWidth = Math.max(0.6, 1.2 * k);
    ctx.stroke();
    if (rx > r * 0.55) {
      ctx.fillStyle = "rgba(160,100,10,.55)";
      ctx.fillRect(x - rx * 0.12, y - r * 0.45, rx * 0.24, r * 0.9);
    }
  } else {
    const r = 0.4 * v.unit * k;
    glow(ctx, x, y, r * 3.2, PAL.cyan, 0.7);
    ctx.fillStyle = "rgba(56,225,255,.22)";
    ctx.strokeStyle = "#8ff1ff";
    ctx.lineWidth = Math.max(1.2, 2.5 * k);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3 + time * 0.8;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8fdff";
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.5);
    ctx.lineTo(x + r * 0.38, y - r * 0.25);
    ctx.lineTo(x + r * 0.3, y + r * 0.25);
    ctx.lineTo(x, y + r * 0.5);
    ctx.lineTo(x - r * 0.3, y + r * 0.25);
    ctx.lineTo(x - r * 0.38, y - r * 0.25);
    ctx.closePath();
    ctx.fill();
  }
}

/* ───────── Jogador (sprite do herói) ───────── */
function drawPlayer(ctx: CanvasRenderingContext2D, v: View, s: RushState, hero: Hero) {
  const z = 0.5;
  const k = sc(z);
  const x = gx(v, s.laneX, z);
  const ground = gy(v, z);
  const u = v.unit * k;
  const sliding = isSliding(s) && s.y <= 0.01;
  const airborne = s.y > 0.01;
  const run = Math.sin(s.time * 15);

  // sombra de contato que encolhe com a altura
  const sh = Math.max(0.35, 1 - s.y * 0.35);
  ctx.fillStyle = `rgba(0,0,0,${0.45 * sh})`;
  ctx.beginPath();
  ctx.ellipse(x, ground, u * 0.62 * sh, u * 0.15 * sh, 0, 0, Math.PI * 2);
  ctx.fill();

  const img = heroImage(hero.back);
  const lift = s.y * u;
  const targetH = hero.height * u;
  const lean = Math.max(-0.28, Math.min(0.28, (s.lane - s.laneX) * 0.28));

  ctx.save();
  if (s.invuln > 0 && Math.floor(s.time * 14) % 2 === 0) ctx.globalAlpha = 0.4;
  ctx.translate(x, ground - lift);

  // aura de velocidade atrás do herói
  const speedF = Math.min(1, (s.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED));
  glow(ctx, 0, -targetH * 0.5, targetH * (0.8 + speedF * 0.4), hero.accent, 0.22 + speedF * 0.2);

  // jato do foguete
  if (hero.jet && airborne) {
    const fl = 0.7 + 0.3 * Math.abs(run);
    glow(ctx, 0, -targetH * 0.18, u * 1.1 * fl, PAL.orange, 0.9);
    glow(ctx, 0, -targetH * 0.12, u * 0.6 * fl, "#fff2a0", 0.95);
  }

  // squash & stretch + balanço da corrida
  let sx = 1;
  let sy = 1;
  let bob = 0;
  if (sliding) {
    sy = 0.58;
    sx = 1.12;
  } else if (airborne) {
    const stretch = Math.min(0.12, Math.abs(s.vy) * 0.012);
    sy = 1 + stretch;
    sx = 1 - stretch * 0.6;
  } else {
    bob = Math.abs(run) * u * 0.07;
    sx = 1 + Math.abs(run) * 0.02;
    sy = 1 - Math.abs(run) * 0.025;
  }
  ctx.rotate(lean + (sliding ? -0.12 : 0) + (airborne ? 0 : run * 0.018));
  ctx.scale(sx, sy);

  if (img) {
    const w = (img.naturalWidth / img.naturalHeight) * targetH;
    // contorno de luz (rim) desenhando o sprite levemente deslocado em aditivo
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha *= 0.25;
    ctx.drawImage(img, -w / 2 - 1.5, -targetH - bob, w, targetH);
    ctx.drawImage(img, -w / 2 + 1.5, -targetH - bob, w, targetH);
    ctx.restore();
    ctx.drawImage(img, -w / 2, -targetH - bob, w, targetH);
  } else {
    // sprite ainda carregando: silhueta simples
    ctx.fillStyle = "#8a5630";
    ctx.beginPath();
    ctx.ellipse(0, -targetH * 0.45, targetH * 0.3, targetH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // escudo
  if (s.shield) {
    const r = targetH * 0.62;
    const pulse = 0.85 + 0.15 * Math.sin(s.time * 8);
    const g = ctx.createRadialGradient(0, -targetH * 0.5, r * 0.3, 0, -targetH * 0.5, r);
    g.addColorStop(0, "rgba(56,225,255,0)");
    g.addColorStop(0.8, `rgba(56,225,255,${0.18 * pulse})`);
    g.addColorStop(1, `rgba(143,241,255,${0.65 * pulse})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -targetH * 0.5, r * 0.8, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ───────── Partículas ───────── */
function drawParticle(ctx: CanvasRenderingContext2D, v: View, p: Particle) {
  const k = sc(p.z);
  const x = gx(v, p.lane, p.z);
  const y = gy(v, p.z) - p.y * v.unit * k;
  const t = Math.max(0, p.life / p.max);
  if (p.kind === "ring") {
    const r = p.size * v.unit * k * (1 - t) * 1.2 + 2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = t * 0.9;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1.5, 3 * k);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const r = p.size * v.unit * k * (p.kind === "dust" ? 1 + (1 - t) * 1.6 : 1);
  if (p.kind === "dust") {
    ctx.globalAlpha = t * 0.35;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.8, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    glow(ctx, x, y, Math.max(2, r * 4), p.color, t);
  }
}

/* ───────── Pós-processamento ───────── */
let vignette: { w: number; h: number; c: HTMLCanvasElement } | null = null;
function drawVignette(ctx: CanvasRenderingContext2D, v: View) {
  if (!vignette || vignette.w !== v.W || vignette.h !== v.H) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(v.W);
    c.height = Math.ceil(v.H);
    const g = c.getContext("2d");
    if (g) {
      const grad = g.createRadialGradient(v.W / 2, v.H * 0.52, Math.min(v.W, v.H) * 0.28, v.W / 2, v.H * 0.52, Math.max(v.W, v.H) * 0.78);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(2,2,12,.7)");
      g.fillStyle = grad;
      g.fillRect(0, 0, v.W, v.H);
    }
    vignette = { w: v.W, h: v.H, c };
  }
  ctx.drawImage(vignette.c, 0, 0, v.W, v.H);
}

function drawSpeedLines(ctx: CanvasRenderingContext2D, v: View, s: RushState, j: number) {
  const f = Math.max(0, (s.speed - BASE_SPEED - 2) / (MAX_SPEED - BASE_SPEED));
  if (f <= 0) return;
  const n = Math.round(6 + f * 16);
  const vx = v.cx - v.cam * v.laneW * 0.3;
  const vy = v.horizon + 20;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = j > 0.5 ? "#ffe9b0" : "#bfe9ff";
  const tick = Math.floor(s.time * 24);
  for (let i = 0; i < n; i++) {
    const a = hash(i * 9.1 + tick * 0.37) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    if (Math.abs(dx) < 0.25 && dy < 0) continue; // evita o céu logo acima do horizonte
    const r0 = Math.max(v.W, v.H) * (0.35 + hash(i + tick) * 0.25);
    const r1 = r0 + Math.max(v.W, v.H) * (0.12 + f * 0.25);
    ctx.globalAlpha = 0.05 + f * 0.14;
    ctx.lineWidth = 1 + hash(i * 3.3) * 1.6;
    ctx.beginPath();
    ctx.moveTo(vx + dx * r0, vy + dy * r0);
    ctx.lineTo(vx + dx * r1, vy + dy * r1);
    ctx.stroke();
  }
  ctx.restore();
}

/* ───────── Cena ───────── */
export interface SceneOptions {
  heroId?: string;
  fx?: Fx;
  reduced?: boolean;
}

export function drawScene(ctx: CanvasRenderingContext2D, v: View, s: RushState, opts: SceneOptions = {}) {
  const hero = getHero(opts.heroId);
  const fx = opts.fx;
  const j = biomeAt(s.distance);

  // câmera acompanha a pista com suavidade
  v.cam += (s.laneX * 0.5 - v.cam) * 0.12;

  ctx.save();
  const shake = fx?.shake ?? 0;
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.clearRect(-30, -30, v.W + 60, v.H + 60);

  drawSky(ctx, v, s, j);
  drawFarLayers(ctx, v, s, j);
  drawRoad(ctx, v, s, j);
  drawScenery(ctx, v, s, j);

  // Objetos do mais longe para o mais perto.
  type Item = { z: number; draw: () => void };
  const items: Item[] = [];
  for (const o of s.obstacles) items.push({ z: o.z, draw: () => drawObstacle(ctx, v, o, s.time, j) });
  for (const p of s.pickups) items.push({ z: p.z, draw: () => drawPickup(ctx, v, p, s.time) });
  if (fx) for (const p of fx.parts) items.push({ z: p.z - 0.01, draw: () => drawParticle(ctx, v, p) });
  items.push({ z: 0.5, draw: () => drawPlayer(ctx, v, s, hero) });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) if (it.z < SPAWN_Z + 5) it.draw();

  // Neblina do horizonte (esconde o spawn)
  const fogH = (v.base - v.horizon) * 0.32;
  const fog = ctx.createLinearGradient(0, v.horizon - 6, 0, v.horizon + fogH);
  fog.addColorStop(0, mix("#5a2288", "#d9b45a", j, 0.9));
  fog.addColorStop(1, mix("#5a2288", "#d9b45a", j, 0));
  ctx.fillStyle = fog;
  ctx.fillRect(0, v.horizon - 6, v.W, fogH + 6);
  ctx.restore();

  if (!opts.reduced) drawSpeedLines(ctx, v, s, j);

  // Gradação de cor por bioma (teal/magenta de noite, âmbar de tarde)
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = mix("#7a3cff", "#ffb347", j);
  ctx.fillRect(0, 0, v.W, v.H);
  ctx.restore();

  drawVignette(ctx, v);

  if (fx && fx.flash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.55, fx.flash);
    ctx.fillStyle = fx.flashColor;
    ctx.fillRect(0, 0, v.W, v.H);
    ctx.restore();
  }
}
