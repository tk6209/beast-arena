import { cameraX } from "./camera";
import { drawCapy } from "./capySprite";
import { getCharacter } from "./characters";
import { bossTagline } from "./story";
import { COLORS, GROUND_Y, VIRT_H, VIRT_W } from "./constants";
import { capsule, drawStarAt, rrPath } from "./primitives";
import type { Boss, Enemy, GameState } from "./types";

/**
 * Desenha um frame inteiro em coordenadas virtuais (VIRT_W x VIRT_H). O caller
 * (Game) já aplicou a escala de letterbox e o offset de screen-shake no ctx.
 */
export function draw(ctx: CanvasRenderingContext2D, state: GameState): void {
  const camX = cameraX(state);

  const inBoss = !!state.boss;
  drawBackdrop(ctx, camX, state.time, inBoss);
  drawGround(ctx, camX, inBoss);
  drawHazards(ctx, state, camX);
  drawPickups(ctx, state, camX);
  drawCrates(ctx, state, camX);
  drawLifeUps(ctx, state, camX);
  drawPrisoners(ctx, state, camX);
  drawEnemies(ctx, state, camX);
  if (state.boss) drawBoss(ctx, state.boss, camX);
  drawCapy(ctx, state.player, getCharacter(state.charId), state.special ? state.special.id : null, camX);
  drawBullets(ctx, state, camX);
  drawEnemyBullets(ctx, state, camX);
  drawParticles(ctx, state, camX);
}

/* ── Cenário CapyWars ── */

function drawBackdrop(ctx: CanvasRenderingContext2D, camX: number, time: number, boss: boolean): void {
  if (boss) drawChamber(ctx, camX, time);
  else drawCorridor(ctx, camX, time);
}

// Corredor subterrâneo enferrujado (fases normais).
function drawCorridor(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, COLORS.tunnelTop);
  g.addColorStop(0.55, COLORS.tunnelMid);
  g.addColorStop(1, COLORS.tunnelTop);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIRT_W, GROUND_Y);

  // Brilho quente no "ponto de fuga".
  const rg = ctx.createRadialGradient(VIRT_W * 0.5, GROUND_Y - 150, 20, VIRT_W * 0.5, GROUND_Y - 150, 340);
  rg.addColorStop(0, "rgba(180,100,45,0.45)");
  rg.addColorStop(1, "rgba(180,100,45,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, VIRT_W, GROUND_Y);

  // Painéis rebitados da parede do fundo (parallax lento).
  const segW = 156;
  const offA = -((camX * 0.18) % segW);
  for (let i = -1; i < VIRT_W / segW + 1; i++) {
    const x = offA + i * segW;
    ctx.fillStyle = i % 2 === 0 ? COLORS.wallPlate : COLORS.wallPlateDark;
    ctx.fillRect(x, 64, segW, GROUND_Y - 64);
    ctx.strokeStyle = COLORS.rivet;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x, GROUND_Y);
    ctx.stroke();
    ctx.fillStyle = COLORS.rivet;
    for (let ry = 92; ry < GROUND_Y - 10; ry += 56) {
      ctx.beginPath();
      ctx.arc(x + 4, ry, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Faixa horizontal escura (meio da parede).
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fillRect(0, GROUND_Y - 120, VIRT_W, 14);

  // Teto curvo (arco do túnel).
  ctx.fillStyle = COLORS.wallPlateDark;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(VIRT_W, 0);
  ctx.lineTo(VIRT_W, 58);
  ctx.quadraticCurveTo(VIRT_W / 2, 122, 0, 58);
  ctx.closePath();
  ctx.fill();

  // Tubo alto (parallax médio).
  drawPipe(ctx, -((camX * 0.3) % 2000), 80, VIRT_W + 200, 14);

  // Lâmpadas âmbar engaioladas (parallax médio).
  const lampGap = 280;
  const offL = -((camX * 0.35) % lampGap);
  const flick = 0.85 + Math.sin(time * 7) * 0.15;
  for (let i = -1; i < VIRT_W / lampGap + 1; i++) {
    drawCageLamp(ctx, offL + i * lampGap + 120, 150, flick);
  }

  // Tubo grosso em primeiro plano (parallax rápido).
  drawPipe(ctx, -((camX * 0.62) % 2400), GROUND_Y - 40, VIRT_W + 260, 22);

  // Vapor subindo de junções (animado).
  ctx.fillStyle = COLORS.steam;
  for (let i = 0; i < 4; i++) {
    const sx = ((i * 311 - camX * 0.4) % (VIRT_W + 200) + VIRT_W + 200) % (VIRT_W + 200) - 100;
    const sy = GROUND_Y - 60 - ((time * 28 + i * 60) % 150);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 22 - (i % 2) * 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = COLORS.pipeDark;
  rrPath(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.pipeBody;
  rrPath(ctx, x, y, w, h * 0.55, h / 3);
  ctx.fill();
  // flanges
  ctx.fillStyle = COLORS.pipeDark;
  for (let fx = x; fx < x + w; fx += 220) {
    ctx.fillRect(fx, y - 3, 10, h + 6);
  }
}

function drawCageLamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, flick: number): void {
  const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70);
  rg.addColorStop(0, `rgba(255,178,74,${0.55 * flick})`);
  rg.addColorStop(1, "rgba(255,178,74,0)");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.fill();
  // suporte
  ctx.fillStyle = COLORS.pipeDark;
  ctx.fillRect(cx - 3, cy - 24, 6, 14);
  // bulbo
  ctx.fillStyle = COLORS.lampGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.lampCore;
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // gaiola
  ctx.strokeStyle = COLORS.rivet;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.moveTo(cx - 11, cy);
  ctx.lineTo(cx + 11, cy);
  ctx.moveTo(cx, cy - 11);
  ctx.lineTo(cx, cy + 11);
  ctx.stroke();
}

// Câmara alienígena (lutas de chefe) — energia verde.
function drawChamber(ctx: CanvasRenderingContext2D, camX: number, time: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, COLORS.chamberTop);
  g.addColorStop(1, COLORS.chamberBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIRT_W, GROUND_Y);

  // Painéis escuros de tech.
  ctx.fillStyle = COLORS.chamberWall;
  ctx.fillRect(0, 50, VIRT_W, GROUND_Y - 50);

  // Pilares de energia verde (parallax + flicker).
  const gap = 230;
  const off = -((camX * 0.3) % gap);
  for (let i = -1; i < VIRT_W / gap + 1; i++) {
    const x = off + i * gap + 90;
    const flick = 0.7 + Math.sin(time * 5 + i) * 0.3;
    const rg = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
    rg.addColorStop(0, "rgba(57,255,136,0)");
    rg.addColorStop(0.5, `rgba(57,255,136,${0.4 * flick})`);
    rg.addColorStop(1, "rgba(57,255,136,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - 26, 60, 52, GROUND_Y - 90);
    // núcleo brilhante
    ctx.fillStyle = COLORS.energyCore;
    ctx.fillRect(x - 4, 70, 8, GROUND_Y - 110);
    ctx.fillStyle = COLORS.energyGlow;
    ctx.fillRect(x - 7, 70, 3, GROUND_Y - 110);
    ctx.fillRect(x + 4, 70, 3, GROUND_Y - 110);
  }

  // Costuras de circuito verdes na parede.
  ctx.strokeStyle = COLORS.energyDim;
  ctx.lineWidth = 2;
  const sOff = -((camX * 0.3) % 320);
  for (let i = -1; i < VIRT_W / 320 + 1; i++) {
    const x = sOff + i * 320 + 40;
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, 130);
    ctx.lineTo(x + 40, 130);
    ctx.stroke();
  }
}

function drawGround(ctx: CanvasRenderingContext2D, camX: number, boss: boolean): void {
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, VIRT_H);
  g.addColorStop(0, boss ? "#10241a" : COLORS.grateTop);
  g.addColorStop(1, boss ? "#06120c" : COLORS.grateBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y, VIRT_W, VIRT_H - GROUND_Y);

  // Borda superior brilhante.
  ctx.strokeStyle = boss ? COLORS.energyGlow : COLORS.grateBar;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(VIRT_W, GROUND_Y);
  ctx.stroke();

  if (boss) {
    // Piso de placas com costuras verdes.
    ctx.strokeStyle = "rgba(57,255,136,0.25)";
    ctx.lineWidth = 2;
    const gap = 84;
    const off = -(camX % gap);
    for (let x = off; x < VIRT_W; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x - 14, VIRT_H);
      ctx.stroke();
    }
    return;
  }

  // Piso gradeado de metal: barras + rebites.
  const gap = 26;
  const off = -(camX % gap);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  for (let x = off; x < VIRT_W; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 4);
    ctx.lineTo(x, VIRT_H);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.grateBar;
  ctx.fillRect(0, GROUND_Y + 14, VIRT_W, 3);
  const rgap = 120;
  const roff = -(camX % rgap);
  ctx.fillStyle = COLORS.rivet;
  for (let x = roff; x < VIRT_W; x += rgap) {
    ctx.beginPath();
    ctx.arc(x, GROUND_Y + 8, 2.4, 0, Math.PI * 2);
    ctx.fill();
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

/* ── Vida extra (1-UP) ── */

function drawLifeUps(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const lu of state.lifeups) {
    if (lu.taken) continue;
    const x = lu.x - camX + lu.w / 2;
    if (x < -lu.w || x > VIRT_W + lu.w) continue;
    const r = lu.w * 0.42;
    const y = lu.y + lu.h / 2 + Math.sin(lu.bob * 4) * 4;
    const pulse = 0.7 + Math.abs(Math.sin(lu.bob * 3)) * 0.3;

    ctx.save();
    ctx.shadowColor = "#ff5a7a";
    ctx.shadowBlur = 16 * pulse;
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.85);
    ctx.bezierCurveTo(x - r * 1.3, y - r * 0.4, x - r * 0.5, y - r * 1.1, x, y - r * 0.3);
    ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 1.3, y - r * 0.4, x, y + r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.32, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("1UP", x, y + r * 1.9);
    ctx.textAlign = "left";
  }
}

/* ── Reféns (Capi prisioneiro) ── */

function drawPrisoners(ctx: CanvasRenderingContext2D, state: GameState, camX: number): void {
  for (const pr of state.prisoners) {
    if (pr.freed) continue;
    const x = pr.x - camX;
    const y = pr.y;
    const cx = x + pr.w / 2;
    const bob = Math.sin(pr.bob * 6) * 1.5;

    // sombra
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(cx, y + pr.h, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // estaca atrás
    ctx.fillStyle = "#5a4326";
    rrPath(ctx, cx - 3, y - 12, 6, pr.h + 12, 2);
    ctx.fill();

    ctx.save();
    ctx.translate(0, bob);

    // corpo
    rrPath(ctx, x + 4, y + 17, pr.w - 8, pr.h - 17, 9);
    ctx.fillStyle = COLORS.fur;
    ctx.fill();
    // cabeça
    rrPath(ctx, x + 3, y, pr.w - 6, 22, 9);
    ctx.fillStyle = COLORS.fur;
    ctx.fill();
    // focinho
    rrPath(ctx, x + 8, y + 9, pr.w - 16, 11, 5);
    ctx.fillStyle = COLORS.muzzleWarm;
    ctx.fill();
    // olhos preocupados
    ctx.fillStyle = COLORS.nosePaws;
    ctx.beginPath();
    ctx.arc(cx - 5, y + 7, 2, 0, Math.PI * 2);
    ctx.arc(cx + 5, y + 7, 2, 0, Math.PI * 2);
    ctx.fill();

    // braços levantados (amarrados na estaca)
    ctx.strokeStyle = COLORS.furDark;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 22);
    ctx.lineTo(cx - 2, y - 8);
    ctx.moveTo(x + pr.w - 7, y + 22);
    ctx.lineTo(cx + 2, y - 8);
    ctx.stroke();

    // corda
    ctx.strokeStyle = "#d8c089";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 30);
    ctx.lineTo(x + pr.w - 4, y + 34);
    ctx.moveTo(x + 4, y + 38);
    ctx.lineTo(x + pr.w - 4, y + 34);
    ctx.stroke();

    ctx.restore();

    // balão "SOS" pulsante
    const a = 0.5 + 0.5 * Math.sin(pr.bob * 6);
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * a;
    ctx.fillStyle = "#ffe08a";
    rrPath(ctx, cx - 16, y - 34, 32, 16, 5);
    ctx.fill();
    ctx.fillStyle = "#11151f";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SOS", cx, y - 25);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }
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

  // ── Legenda de história + nome + barra de vida (sem bob) ──
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = boss.accent;
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillText(bossTagline(boss.kind), cx, y - 38);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px system-ui, sans-serif";
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
