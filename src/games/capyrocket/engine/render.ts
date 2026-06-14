import { cameraX } from "./camera";
import { COLORS, GROUND_Y, PLAYER_SCREEN_X, VIRT_H, VIRT_W } from "./constants";
import type { GameAssets } from "../assets";
import type { GameState } from "./types";

/**
 * Desenha um frame inteiro em coordenadas virtuais (VIRT_W x VIRT_H). O caller
 * (Game) já aplicou a escala de letterbox e o offset de screen-shake no ctx.
 */
export function draw(ctx: CanvasRenderingContext2D, state: GameState, assets: GameAssets | null): void {
  const camX = cameraX(state);

  drawSky(ctx);
  drawHills(ctx, camX);
  drawSkyline(ctx, camX);
  drawGround(ctx, camX);
  drawPickups(ctx, state, camX);
  drawEnemies(ctx, state, camX);
  drawPlayer(ctx, state, assets);
  drawBullets(ctx, state, camX);
  drawParticles(ctx, state, camX);
}

/* ── Fundo ── */

function drawSky(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, VIRT_H);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(0.55, COLORS.skyMid);
  g.addColorStop(1, COLORS.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIRT_W, VIRT_H);

  // Sol baixo no horizonte.
  ctx.fillStyle = "rgba(255, 224, 170, 0.55)";
  ctx.beginPath();
  ctx.arc(VIRT_W * 0.72, GROUND_Y - 120, 70, 0, Math.PI * 2);
  ctx.fill();
}

// Colinas distantes — parallax lento, padrão senoidal repetido.
function drawHills(ctx: CanvasRenderingContext2D, camX: number): void {
  const factor = 0.25;
  const off = -(camX * factor) % VIRT_W;
  ctx.fillStyle = COLORS.hillFar;
  for (let base = off - VIRT_W; base < VIRT_W + 100; base += VIRT_W) {
    ctx.beginPath();
    ctx.moveTo(base, GROUND_Y);
    for (let x = 0; x <= VIRT_W; x += 40) {
      const y = GROUND_Y - 70 - Math.sin((x / VIRT_W) * Math.PI * 2) * 40 - 30;
      ctx.lineTo(base + x, y);
    }
    ctx.lineTo(base + VIRT_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
}

// Skyline militar (bunkers/prédios) — parallax médio.
function drawSkyline(ctx: CanvasRenderingContext2D, camX: number): void {
  const factor = 0.5;
  const span = 1100;
  const off = -(camX * factor) % span;
  for (let base = off - span; base < VIRT_W + 100; base += span) {
    drawBuildingCluster(ctx, base);
  }
}

function drawBuildingCluster(ctx: CanvasRenderingContext2D, baseX: number): void {
  // Posições/larguras fixas (determinístico) — um "cluster" de construções.
  const defs = [
    [40, 120, 150],
    [180, 80, 90],
    [300, 160, 200],
    [500, 100, 120],
    [650, 140, 170],
    [840, 90, 110],
    [960, 130, 160],
  ];
  for (const [dx, w, h] of defs) {
    const x = baseX + dx;
    const y = GROUND_Y - h;
    ctx.fillStyle = COLORS.building;
    ctx.fillRect(x, y, w, h);
    // Topo iluminado pelo entardecer.
    ctx.fillStyle = COLORS.buildingLit;
    ctx.fillRect(x, y, w, 8);
    // Janelinhas.
    ctx.fillStyle = "rgba(255, 220, 150, 0.35)";
    for (let wy = y + 18; wy < GROUND_Y - 14; wy += 26) {
      for (let wx = x + 12; wx < x + w - 12; wx += 24) {
        ctx.fillRect(wx, wy, 9, 12);
      }
    }
  }
}

function drawGround(ctx: CanvasRenderingContext2D, camX: number): void {
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, VIRT_H);
  g.addColorStop(0, COLORS.groundTop);
  g.addColorStop(1, COLORS.groundBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y, VIRT_W, VIRT_H - GROUND_Y);

  // Linha de chão + tufos/marcas que rolam com a câmera (parallax 1:1).
  ctx.strokeStyle = COLORS.groundLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(VIRT_W, GROUND_Y);
  ctx.stroke();

  const gap = 90;
  const off = -(camX % gap);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (let x = off; x < VIRT_W; x += gap) {
    ctx.fillRect(x, GROUND_Y + 16, 46, 6);
  }
}

/* ── Entidades ── */

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, assets: GameAssets | null): void {
  const p = state.player;
  const cx = PLAYER_SCREEN_X + p.w / 2;
  const cy = p.y + p.h / 2;

  // Pisca durante a invulnerabilidade.
  if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) return;

  // Squash ao aterrissar / stretch ao subir + bob de corrida.
  let sx = 1;
  let sy = 1;
  if (!p.onGround) {
    const rising = p.vy < 0;
    sy = rising ? 1.08 : 0.94;
    sx = rising ? 0.94 : 1.06;
  }
  const bob = p.onGround ? Math.sin(p.animPhase * 14) * 3 : 0;
  const tilt = p.onGround ? Math.sin(p.animPhase * 14) * 0.04 : 0.08;

  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.rotate(tilt);
  ctx.scale(sx, sy);

  // Sombrinha no chão.
  if (p.onGround) {
    ctx.save();
    ctx.scale(1 / sx, 1 / sy);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, p.h / 2 - 2, p.w * 0.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const img = assets?.hero;
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
  } else {
    // Fallback enquanto o sprite carrega.
    ctx.fillStyle = "#c98b5a";
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  }
  ctx.restore();
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const e of state.enemies) {
    const x = e.x - camX;
    if (x < -e.w || x > VIRT_W) continue;
    // Corpo arredondado cartoon.
    roundRect(ctx, x, e.y, e.w, e.h, 12);
    const g = ctx.createLinearGradient(0, e.y, 0, e.y + e.h);
    g.addColorStop(0, COLORS.enemy);
    g.addColorStop(1, COLORS.enemyDark);
    ctx.fillStyle = g;
    ctx.fill();
    // Olho raivoso virado pra esquerda (em direção ao jogador).
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + e.w * 0.32, e.y + e.h * 0.36, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.enemyEye;
    ctx.beginPath();
    ctx.arc(x + e.w * 0.28, e.y + e.h * 0.36, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Capacete militar.
    ctx.fillStyle = COLORS.enemyDark;
    roundRect(ctx, x - 2, e.y - 6, e.w + 4, 14, 6);
    ctx.fill();
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const b of state.bullets) {
    const x = b.x - camX;
    if (x < -20 || x > VIRT_W + 20) continue;
    ctx.save();
    ctx.shadowColor = COLORS.bulletGlow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.bullet;
    roundRect(ctx, x, b.y, b.w, b.h, b.h / 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPickups(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const pk of state.pickups) {
    if (pk.taken) continue;
    const x = pk.x - camX;
    if (x < -pk.w || x > VIRT_W) continue;
    ctx.save();
    ctx.translate(x + pk.w / 2, pk.y + pk.h / 2);
    ctx.rotate(pk.spin);
    ctx.shadowColor = COLORS.starGlow;
    ctx.shadowBlur = 16;
    drawStar(ctx, pk.w / 2);
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - camX, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ── Primitivas ── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, radius: number): void {
  const spikes = 5;
  const inner = radius * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.star;
  ctx.fill();
}
