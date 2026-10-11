/** Utilidades gráficas do Capi Rush: projeção, cor e brilho aditivo. */
export const CAM = 8; // distância da câmera atrás da capivara

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
export const sc = (z: number) => CAM / (Math.max(z, -CAM + 0.5) + CAM);
export const gy = (v: View, z: number) => v.horizon + (v.base - v.horizon) * sc(z);
export const gx = (v: View, laneX: number, z: number) => v.cx + (laneX - v.cam) * v.laneW * sc(z);

export function hash(n: number): number {
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
export function mix(a: string, b: string, t: number, alpha = 1): string {
  const A = rgb(a);
  const B = rgb(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  return alpha >= 1 ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${alpha})`;
}

export const PAL = {
  cyan: "#38e1ff",
  violet: "#b794ff",
  gold: "#ffcf4a",
  orange: "#ff7a45",
  pink: "#ff3d8b",
  mint: "#22e3a0",
};

/* ───────── Brilho aditivo (sprite radial em cache, bem mais barato que shadowBlur) ───────── */
const glowCache = new Map<string, HTMLCanvasElement>();
export function glowSprite(color: string): HTMLCanvasElement {
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
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  if (r < 0.5 || alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}


/** Brilho aditivo elíptico (nuvens, névoa, feixes de luz). */
export function glowE(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha = 1) {
  if (rx < 0.5 || ry < 0.5 || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(color), -rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}
