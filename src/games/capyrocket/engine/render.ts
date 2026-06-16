import { cameraX } from "./camera";
import { drawCapy } from "./capySprite";
import { getCharacter } from "./characters";
import { COLORS, GROUND_Y, VIRT_H, VIRT_W } from "./constants";
import { capsule, drawStarAt, rrPath } from "./primitives";
import type { Boss, Enemy, GameState } from "./types";

/**
 * Desenha um frame inteiro em coordenadas virtuais (VIRT_W x VIRT_H). O caller
 * (Game) já aplicou a escala de letterbox e o offset de screen-shake no ctx.
 */
export function draw(ctx: CanvasRenderingContext2D, state: GameState): void {
  const camX = cameraX(state);

  drawSky(ctx);
  drawHills(ctx, camX);
  drawSkyline(ctx, camX);
  drawGround(ctx, camX);
  drawHazards(ctx, state, camX);
  drawPickups(ctx, state, camX);
  drawCrates(ctx, state, camX);
  drawEnemies(ctx, state, camX);
  if (state.boss) drawBoss(ctx, state.boss, camX);
  drawCapy(ctx, state.player, getCharacter(state.charId), state.special ? state.special.id : null);
  drawBullets(ctx, state, camX);
  drawEnemyBullets(ctx, state, camX);
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

  ctx.fillStyle = "rgba(255, 224, 170, 0.55)";
  ctx.beginPath();
  ctx.arc(VIRT_W * 0.72, GROUND_Y - 120, 70, 0, Math.PI * 2);
  ctx.fill();
}

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

function drawSkyline(ctx: CanvasRenderingContext2D, camX: number): void {
  const factor = 0.5;
  const span = 1100;
  const off = -(camX * factor) % span;
  for (let base = off - span; base < VIRT_W + 100; base += span) {
    drawBuildingCluster(ctx, base);
  }
}

function drawBuildingCluster(ctx: CanvasRenderingContext2D, baseX: number): void {
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
    ctx.fillStyle = COLORS.buildingLit;
    ctx.fillRect(x, y, w, 8);
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

/* ── Inimigos ── */

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const e of state.enemies) {
    const x = e.x - camX;
    if (x < -e.w - 40 || x > VIRT_W + 40) continue;
    if (e.kind === "tank") drawTank(ctx, e, x);
    else drawFootSoldier(ctx, e, x);
    if (e.hp < e.maxHp) drawHpBar(ctx, x, e.y - 10, e.w, e.hp / e.maxHp);
  }
}

function drawFootSoldier(ctx: CanvasRenderingContext2D, e: Enemy, x: number): void {
  const cx = x + e.w / 2;
  const feetY = e.y + e.h;
  const step = Math.sin(e.legPhase);

  ctx.save();
  ctx.translate(cx, feetY);

  capsule(ctx, 4, -26, 4 + step * 9, -2, 7, COLORS.enemyDark);
  capsule(ctx, -4, -26, -4 - step * 9, -2, 7, COLORS.enemy);

  const g = ctx.createLinearGradient(0, -56, 0, -26);
  g.addColorStop(0, COLORS.enemy);
  g.addColorStop(1, COLORS.enemyDark);
  rrPath(ctx, -12, -56, 24, 32, 9);
  ctx.fillStyle = g;
  ctx.fill();

  if (e.kind === "shooter") {
    ctx.fillStyle = COLORS.gunMetal;
    rrPath(ctx, -26, -44, 18, 5, 2);
    ctx.fill();
  }

  rrPath(ctx, -11, -74, 22, 22, 9);
  ctx.fillStyle = COLORS.enemy;
  ctx.fill();
  ctx.fillStyle = COLORS.enemyDark;
  ctx.beginPath();
  ctx.ellipse(0, -74, 14, 9, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-4, -64, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.enemyEye;
  ctx.beginPath();
  ctx.arc(-6, -64, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTank(ctx: CanvasRenderingContext2D, e: Enemy, x: number): void {
  const y = e.y;
  ctx.fillStyle = COLORS.tankDark;
  rrPath(ctx, x, y + e.h - 22, e.w, 22, 8);
  ctx.fill();
  ctx.fillStyle = "#2b2e26";
  for (let wx = x + 12; wx < x + e.w - 8; wx += 18) {
    ctx.beginPath();
    ctx.arc(wx, y + e.h - 11, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, y, 0, y + e.h);
  g.addColorStop(0, COLORS.tank);
  g.addColorStop(1, COLORS.tankDark);
  rrPath(ctx, x + 6, y + 18, e.w - 12, e.h - 36, 8);
  ctx.fillStyle = g;
  ctx.fill();
  rrPath(ctx, x + e.w * 0.32, y + 2, e.w * 0.4, 26, 8);
  ctx.fillStyle = COLORS.tank;
  ctx.fill();
  ctx.fillStyle = COLORS.gunDark;
  rrPath(ctx, x - 22, y + 10, 34, 8, 3);
  ctx.fill();
}

/* ── Chefe ── */

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, camX: number): void {
  const x = boss.x - camX;
  const y = boss.y;

  ctx.fillStyle = COLORS.bossDark;
  rrPath(ctx, x, y + boss.h - 30, boss.w, 30, 10);
  ctx.fill();
  ctx.fillStyle = "#23262c";
  for (let wx = x + 16; wx < x + boss.w - 10; wx += 26) {
    ctx.beginPath();
    ctx.arc(wx, y + boss.h - 15, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  const g = ctx.createLinearGradient(0, y, 0, y + boss.h);
  g.addColorStop(0, boss.body);
  g.addColorStop(1, COLORS.bossDark);
  rrPath(ctx, x + 10, y + 20, boss.w - 20, boss.h - 46, 16);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.fillStyle = COLORS.bossDark;
  rrPath(ctx, x + 24, y + 34, boss.w - 48, 18, 6);
  ctx.fill();

  const pulse = 0.6 + Math.abs(Math.sin(boss.phase * 3)) * 0.4;
  ctx.save();
  ctx.shadowColor = boss.accent;
  ctx.shadowBlur = 22 * pulse;
  ctx.fillStyle = boss.accent;
  ctx.beginPath();
  ctx.arc(x + boss.w * 0.42, y + boss.h * 0.42, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLORS.gunDark;
  rrPath(ctx, x - 30, y + boss.h * 0.4, 44, 12, 4);
  ctx.fill();
  rrPath(ctx, x - 30, y + boss.h * 0.4 + 22, 44, 12, 4);
  ctx.fill();

  // Nome do chefe acima da barra de vida.
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(boss.name.toUpperCase(), x + boss.w / 2, y - 22);
  ctx.textAlign = "left";

  drawHpBar(ctx, x + 10, y - 16, boss.w - 20, boss.hp / boss.maxHp, true);
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  frac: number,
  big = false,
): void {
  const h = big ? 9 : 5;
  ctx.fillStyle = COLORS.hpBack;
  rrPath(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.hpFill;
  rrPath(ctx, x, y, Math.max(0, w * frac), h, h / 2);
  ctx.fill();
}

/* ── Projéteis e itens ── */

function drawBullets(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const b of state.bullets) {
    const x = b.x - camX;
    if (x < -30 || x > VIRT_W + 20) continue;
    if (b.kind === "rocket") {
      // foguete da bazuca: corpo escuro + ponta vermelha + rastro.
      ctx.save();
      ctx.fillStyle = "rgba(255,160,90,0.5)";
      rrPath(ctx, x - 14, b.y + 1, 14, b.h - 2, 2);
      ctx.fill();
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, x, b.y, b.w - 8, b.h, 3);
      ctx.fill();
      ctx.fillStyle = COLORS.rocketTip;
      ctx.beginPath();
      ctx.moveTo(x + b.w - 8, b.y);
      ctx.lineTo(x + b.w, b.y + b.h / 2);
      ctx.lineTo(x + b.w - 8, b.y + b.h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.shadowColor = COLORS.bulletGlow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = COLORS.bullet;
      rrPath(ctx, x, b.y, b.w, b.h, b.h / 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawEnemyBullets(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  ctx.save();
  ctx.shadowColor = COLORS.ebulletGlow;
  ctx.shadowBlur = 14;
  for (const b of state.enemyBullets) {
    const x = b.x - camX;
    if (x < -20 || x > VIRT_W + 20) continue;
    ctx.fillStyle = COLORS.ebullet;
    ctx.beginPath();
    ctx.ellipse(x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHazards(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const hz of state.hazards) {
    const x = hz.x - camX;
    if (x < -hz.w || x > VIRT_W) continue;
    const cx = x + hz.w / 2;
    const baseY = hz.y + hz.h;
    ctx.fillStyle = COLORS.hazardDark;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 9 - 4, baseY);
      ctx.lineTo(cx + i * 9, hz.y - 2);
      ctx.lineTo(cx + i * 9 + 4, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = COLORS.hazard;
    ctx.beginPath();
    ctx.ellipse(cx, baseY, hz.w / 2, hz.h * 0.55, 0, Math.PI, 0);
    ctx.fill();
    const blink = Math.floor(state.time * 6) % 2 === 0;
    ctx.fillStyle = blink ? "#ff5a4a" : "#7a2a22";
    ctx.beginPath();
    ctx.arc(cx, baseY - 6, 3, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = COLORS.star;
    drawStarAt(ctx, 0, 0, pk.w / 2);
    ctx.restore();
  }
}

function drawCrates(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const c of state.crates) {
    if (c.taken) continue;
    const x = c.x - camX;
    if (x < -c.w || x > VIRT_W) continue;
    // caixa de madeira
    rrPath(ctx, x, c.y, c.w, c.h, 5);
    ctx.fillStyle = COLORS.crate;
    ctx.fill();
    rrPath(ctx, x, c.y, c.w, 9, 4);
    ctx.fillStyle = COLORS.crateLid;
    ctx.fill();
    // ícone da arma
    const cx = x + c.w / 2;
    const cy = c.y + c.h * 0.62;
    if (c.weapon === "bazooka") {
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, cx - 12, cy - 3, 18, 6, 2);
      ctx.fill();
      ctx.fillStyle = COLORS.rocketTip;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy - 3);
      ctx.lineTo(cx + 12, cy);
      ctx.lineTo(cx + 6, cy + 3);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, cx - 11, cy - 3, 22, 5, 2);
      ctx.fill();
      rrPath(ctx, cx - 11, cy + 2, 22, 5, 2);
      ctx.fill();
    }
    // brilho piscando
    const blink = Math.floor(state.time * 5) % 2 === 0;
    if (blink) {
      ctx.fillStyle = "#fff7cf";
      ctx.beginPath();
      ctx.arc(x + 6, c.y + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
