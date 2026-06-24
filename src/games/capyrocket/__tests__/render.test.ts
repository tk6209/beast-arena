import { describe, it, expect } from "vitest";
import { draw } from "../engine/render";
import { createInitialState } from "../engine/state";
import { updateBullets } from "../engine/bullets";
import { VIRT_H, GROUND_Y, COLORS } from "../engine/constants";
import { MUZZLE_FORWARD } from "../engine/geometry";

// ── Harness de RENDER ──────────────────────────────────────────────────────
// Um contexto-2D "gravador": não rasteriza, mas rastreia a matriz de
// transformação (save/restore/translate/scale) e registra cada ponto desenhado
// já convertido para COORDENADAS DE TELA, junto da cor de preenchimento ativa.
// Assim conseguimos afirmar ONDE cada coisa aparece de fato.
function makeRecorder() {
  let m = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  let fill = "#000";
  const pts: { x: number; y: number; fill: string }[] = [];
  const tx = (x: number, y: number) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]] as const;
  const push = (x: number, y: number) => { const [X, Y] = tx(x, y); pts.push({ x: X, y: Y, fill: String(fill) }); };
  // multiplicação 2x3 estilo canvas: novo = atual * t
  const mul = (A: number[], B: number[]) => [
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
  ];
  const fns: Record<string, (...a: number[]) => unknown> = {
    save: () => stack.push(m.slice()),
    restore: () => { if (stack.length) m = stack.pop()!; },
    translate: (x, y) => { m = mul(m, [1, 0, 0, 1, x, y]); },
    scale: (x, y) => { m = mul(m, [x, 0, 0, y, 0, 0]); },
    setTransform: (a, b, c, d, e, f) => { m = [a, b, c, d, e, f]; },
    resetTransform: () => { m = [1, 0, 0, 1, 0, 0]; },
    moveTo: push, lineTo: push,
    rect: (x, y, w, h) => push(x + w / 2, y + h / 2),
    fillRect: (x, y, w, h) => push(x + w / 2, y + h / 2),
    arc: (x, y) => push(x, y),
    ellipse: (x, y) => push(x, y),
    arcTo: (x1, y1, x2, y2) => push(x2, y2),
    quadraticCurveTo: (_cx, _cy, x, y) => push(x, y),
    fillText: (_s, x, y) => push(x, y),
    drawImage: (...a: number[]) => push((a[1] ?? 0) + (a[3] ?? 0) / 2, (a[2] ?? 0) + (a[4] ?? 0) / 2),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(_t, p: string) {
      if (p === "fillStyle" || p === "strokeStyle") return fill;
      if (p === "canvas") return { width: 0, height: 0 };
      if (p in fns) return fns[p];
      return () => {}; // no-op para o resto (beginPath, fill, stroke, shadow...)
    },
    set(_t, p: string, v) { if (p === "fillStyle" || p === "strokeStyle") fill = v as string; return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, pts };
}

function bbox(pts: { x: number; y: number }[]) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

describe("RENDER — origem visual do tiro", () => {
  it("RENDER-1: a bala é desenhada COLADA ao herói (à frente, na altura do corpo) — nunca no fundo/canto", () => {
    const s = createInitialState();
    // câmera e jogador em posição não-trivial (pega bug de camX em qualquer lado).
    s.camX = 777;
    s.player.x = s.camX + 200; // herói ~x=200 na tela
    // isola a cena para a sombra do herói ser a única preta translúcida.
    s.enemies = []; s.hazards = []; s.pickups = []; s.crates = []; s.prisoners = []; s.particles = []; s.boss = null;
    // dispara uma bala a partir da posição atual.
    s.fireCooldown = 0;
    updateBullets(s, 1 / 60);
    expect(s.bullets.length).toBeGreaterThan(0);

    const { ctx, pts } = makeRecorder();
    draw(ctx, s);

    const bulletPts = pts.filter((p) => p.fill === COLORS.bullet);
    const shadowPts = pts.filter((p) => p.fill.startsWith("rgba(0,0,0,0.2"));
    expect(bulletPts.length).toBeGreaterThan(0); // a bala foi desenhada
    expect(shadowPts.length).toBeGreaterThan(0); // o herói foi desenhado

    const bullet = bbox(bulletPts);
    const hero = bbox(shadowPts); // centro = pés do herói na tela

    // A bala sai À FRENTE do herói, perto do corpo (não no canto da tela).
    const dx = bullet.cx - hero.cx;
    expect(dx).toBeGreaterThan(10);
    expect(dx).toBeLessThan(90);
    // E na altura do CORPO (acima dos pés, longe do fundo da tela).
    expect(bullet.cy).toBeLessThan(GROUND_Y); // acima do chão
    expect(GROUND_Y - bullet.cy).toBeGreaterThan(30); // claramente no tronco, não nos pés
    expect(bullet.cy).toBeLessThan(VIRT_H - 80); // nunca "no fundo da tela"
    // Coerência fina: origem = cano (MUZZLE_FORWARD + meia-bala) + 1 frame de voo.
    const b0 = s.bullets[0];
    expect(dx).toBeCloseTo(MUZZLE_FORWARD + b0.w / 2 + (b0.vx as number) / 60, 0);
  });
});
