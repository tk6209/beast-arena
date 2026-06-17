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
  const w = boss.w;
  const h = boss.h;
  const cx = x + w * 0.5;
  const feetY = y + h;

  // Sombra.
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.beginPath();
  ctx.ellipse(cx, feetY - 4, w * 0.44, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = Math.sin(boss.phase * 2) * 4;
  ctx.save();
  ctx.translate(0, bob);

  const fur = boss.body;
  const furDark = shadeHex(fur, -0.28);
  const furLight = shadeHex(fur, 0.22);

  // ── Corpo "barril" ──
  const bodyTop = y + 58;
  const g = ctx.createLinearGradient(0, bodyTop, 0, feetY);
  g.addColorStop(0, furLight);
  g.addColorStop(1, furDark);
  rrPath(ctx, x + 24, bodyTop, w - 48, feetY - bodyTop, 30);
  ctx.fillStyle = g;
  ctx.fill();
  // barriga clara
  rrPath(ctx, x + 62, bodyTop + 16, w - 124, h - 100, 24);
  ctx.fillStyle = furLight;
  ctx.globalAlpha = 0.4;
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Braço da frente (em direção ao jogador) ──
  ctx.fillStyle = furDark;
  rrPath(ctx, x + 8, bodyTop + 18, 36, 62, 16);
  ctx.fill();
  ctx.fillStyle = COLORS.nosePaws;
  ctx.beginPath();
  ctx.ellipse(x + 26, bodyTop + 80, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Cabeça grande (virada à esquerda) ──
  const hx = x + 90;
  const hy = y + 44;
  rrPath(ctx, hx - 50, hy - 46, 100, 92, 34);
  ctx.fillStyle = fur;
  ctx.fill();
  // orelha
  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.ellipse(hx + 28, hy - 38, 12, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // focinho à esquerda
  rrPath(ctx, hx - 60, hy + 2, 48, 42, 18);
  ctx.fillStyle = furLight;
  ctx.fill();
  // nariz
  rrPath(ctx, hx - 60, hy + 8, 17, 15, 5);
  ctx.fillStyle = COLORS.nosePaws;
  ctx.fill();

  // ── Olhos brilhantes (ameaçadores) ──
  const pulse = 0.6 + Math.abs(Math.sin(boss.phase * 3)) * 0.4;
  ctx.save();
  ctx.shadowColor = boss.accent;
  ctx.shadowBlur = 16 * pulse;
  ctx.fillStyle = boss.accent;
  for (const ex of [hx - 22, hx + 2]) {
    ctx.beginPath();
    ctx.ellipse(ex, hy - 4, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#fff";
  for (const ex of [hx - 22, hx + 2]) {
    ctx.beginPath();
    ctx.arc(ex + 2, hy - 7, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // sobrancelhas franzidas
  ctx.strokeStyle = furDark;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(hx - 30, hy - 16);
  ctx.lineTo(hx - 16, hy - 10);
  ctx.moveTo(hx - 6, hy - 10);
  ctx.lineTo(hx + 10, hy - 16);
  ctx.stroke();

  // ── Adereço único do chefe ──
  drawBossCrown(ctx, boss.kind, hx, hy, boss.accent, boss.phase);

  ctx.restore();

  // ── Nome + barra de vida (sem bob) ──
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(boss.name.toUpperCase(), cx, y - 22);
  ctx.textAlign = "left";

  drawHpBar(ctx, x + 10, y - 16, w - 20, boss.hp / boss.maxHp, true);
}

/** Adereço/silhueta característico de cada chefe, desenhado sobre a cabeça. */
function drawBossCrown(
  ctx: CanvasRenderingContext2D,
  kind: Boss["kind"],
  hx: number,
  hy: number,
  accent: string,
  phase: number,
): void {
  const top = hy - 46;
  switch (kind) {
    case "chief": {
      // cocar tribal de penas
      const colors = [accent, "#e8b04a", "#e8e2cf", "#e8b04a", accent];
      for (let i = 0; i < 5; i++) {
        const fx = hx - 40 + i * 20;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(fx, top + 6);
        ctx.quadraticCurveTo(fx - 6, top - 30, fx, top - 40);
        ctx.quadraticCurveTo(fx + 6, top - 30, fx, top + 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = shadeHex(accent, -0.2);
      rrPath(ctx, hx - 46, top - 2, 92, 12, 5);
      ctx.fill();
      break;
    }
    case "general": {
      // elmo de centurião com crista transversal
      ctx.fillStyle = "#c7ccd6";
      rrPath(ctx, hx - 48, top - 8, 96, 30, 14);
      ctx.fill();
      ctx.fillStyle = "#9aa1ad";
      rrPath(ctx, hx - 48, top + 12, 96, 8, 3);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(hx - 6, top - 8);
      ctx.quadraticCurveTo(hx, top - 38, hx + 6, top - 8);
      ctx.lineTo(hx + 6, top + 6);
      ctx.lineTo(hx - 6, top + 6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "maga": {
      // capuz sombrio + cristal flutuante
      ctx.fillStyle = shadeHex(accent, -0.55);
      ctx.beginPath();
      ctx.moveTo(hx - 52, hy + 8);
      ctx.quadraticCurveTo(hx - 56, top - 34, hx + 4, top - 30);
      ctx.quadraticCurveTo(hx + 40, top - 26, hx + 44, hy - 8);
      ctx.quadraticCurveTo(hx + 6, top - 6, hx - 8, hy + 2);
      ctx.quadraticCurveTo(hx - 30, top + 4, hx - 52, hy + 8);
      ctx.closePath();
      ctx.fill();
      const f = 0.7 + Math.abs(Math.sin(phase * 3)) * 0.3;
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18 * f;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(hx - 64, top - 16);
      ctx.lineTo(hx - 58, top - 30);
      ctx.lineTo(hx - 52, top - 16);
      ctx.lineTo(hx - 58, top - 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case "pirate": {
      // chapéu tricorne + caveira + tapa-olho
      ctx.fillStyle = "#1c1f26";
      ctx.beginPath();
      ctx.moveTo(hx - 58, top + 4);
      ctx.quadraticCurveTo(hx, top - 40, hx + 58, top + 4);
      ctx.quadraticCurveTo(hx, top - 8, hx - 58, top + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e8e2cf";
      ctx.beginPath();
      ctx.arc(hx, top - 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1f26";
      ctx.beginPath();
      ctx.arc(hx - 3, top - 15, 1.6, 0, Math.PI * 2);
      ctx.arc(hx + 3, top - 15, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // tapa-olho
      ctx.fillStyle = "#15171c";
      ctx.beginPath();
      ctx.ellipse(hx + 2, hy - 4, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "dragon": {
      // chifres + crista espinhosa + brilho de fogo no focinho
      ctx.fillStyle = "#d8d2c4";
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(hx + dir * 30, top + 6);
        ctx.quadraticCurveTo(hx + dir * 54, top - 18, hx + dir * 40, top - 34);
        ctx.quadraticCurveTo(hx + dir * 40, top - 12, hx + dir * 20, top + 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = shadeHex(accent, -0.1);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + i * 12 - 6, top + 4);
        ctx.lineTo(hx + i * 12, top - 14);
        ctx.lineTo(hx + i * 12 + 6, top + 4);
        ctx.closePath();
        ctx.fill();
      }
      const f = 0.6 + Math.abs(Math.sin(phase * 4)) * 0.4;
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 20 * f;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(hx - 52, hy + 18, 5 * f, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "emperor": {
      // coroa dourada com joias + gola de arminho
      ctx.fillStyle = "#f0f0f0";
      rrPath(ctx, hx - 52, hy + 30, 104, 16, 8);
      ctx.fill();
      ctx.fillStyle = "#cfd4dc";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(hx - 40 + i * 20, hy + 34, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffcf4a";
      ctx.beginPath();
      ctx.moveTo(hx - 44, top + 8);
      for (let i = 0; i <= 4; i++) {
        const px = hx - 44 + i * 22;
        ctx.lineTo(px - 11, top - 18);
        ctx.lineTo(px, top + 8);
      }
      ctx.lineTo(hx + 44, top + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e0563a";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(hx - 33 + i * 22, top + 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "hydro": {
      // crista de água/gelo + brilho frio
      const f = 0.6 + Math.abs(Math.sin(phase * 2.5)) * 0.4;
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 16 * f;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(hx - 30, top + 8);
      ctx.quadraticCurveTo(hx - 24, top - 30, hx - 6, top - 10);
      ctx.quadraticCurveTo(hx, top - 36, hx + 10, top - 12);
      ctx.quadraticCurveTo(hx + 26, top - 32, hx + 30, top + 8);
      ctx.quadraticCurveTo(hx, top - 6, hx - 30, top + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(hx + 4, top - 14, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

/** Clareia/escurece um hex (#rrggbb) por um fator -1..1. */
function shadeHex(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255;
  let gc = (n >> 8) & 255;
  let b = n & 255;
  const k = f < 0 ? 1 + f : 1;
  const add = f > 0 ? f * 255 : 0;
  r = Math.max(0, Math.min(255, Math.round(r * k + add)));
  gc = Math.max(0, Math.min(255, Math.round(gc * k + add)));
  b = Math.max(0, Math.min(255, Math.round(b * k + add)));
  return `#${((r << 16) | (gc << 8) | b).toString(16).padStart(6, "0")}`;
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
