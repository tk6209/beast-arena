import { cameraX } from "./camera";
import { COLORS, GROUND_Y, PLAYER_SCREEN_X, VIRT_H, VIRT_W } from "./constants";
import type { Boss, Enemy, GameState, Player } from "./types";

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
  drawEnemies(ctx, state, camX);
  if (state.boss) drawBoss(ctx, state.boss, camX);
  drawPlayer(ctx, state.player);
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

/* ── Capivara soldado (procedural, virada para a direita) ── */

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player): void {
  if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) return;

  const cx = PLAYER_SCREEN_X + p.w / 2;
  const feetY = p.y + p.h;
  const t = p.animPhase;
  const onGround = p.onGround;

  // Sombra.
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, p.y + p.h + 2, p.w * 0.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, feetY);
  const bob = onGround ? -Math.abs(Math.sin(t * 16)) * 3 : 0;
  ctx.translate(0, bob);

  // ── Pernas (ciclo de corrida) ──
  const step = onGround ? Math.sin(t * 16) : -0.7;
  drawLeg(ctx, -4, step, COLORS.furDark);
  drawLeg(ctx, 8, -step, COLORS.fur);

  // ── Tronco / colete militar ──
  ctx.save();
  ctx.rotate(0.05); // leve inclinação pra frente
  rrPath(ctx, -13, -64, 28, 36, 9);
  ctx.fillStyle = COLORS.vest;
  ctx.fill();
  rrPath(ctx, -13, -64, 28, 10, 6);
  ctx.fillStyle = COLORS.vestDark;
  ctx.fill();
  // Cartucheira diagonal.
  ctx.strokeStyle = COLORS.vestDark;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-12, -58);
  ctx.lineTo(14, -36);
  ctx.stroke();
  ctx.restore();

  // ── Braço de trás (segura a coronha) ──
  capsule(ctx, 2, -50, 16, -40, 7, COLORS.furDark);

  // ── Fuzil apontado para a direita ──
  // coronha
  rrPath(ctx, -6, -46, 16, 9, 3);
  ctx.fillStyle = COLORS.gunDark;
  ctx.fill();
  // corpo da arma
  rrPath(ctx, 8, -47, 26, 8, 2);
  ctx.fillStyle = COLORS.gunMetal;
  ctx.fill();
  // cano
  rrPath(ctx, 30, -45, 18, 4, 2);
  ctx.fillStyle = COLORS.gunDark;
  ctx.fill();
  // carregador
  rrPath(ctx, 12, -40, 7, 12, 2);
  ctx.fillStyle = COLORS.gunDark;
  ctx.fill();

  // ── Cabeça da capivara ──
  // base da cabeça
  rrPath(ctx, -10, -86, 26, 26, 11);
  ctx.fillStyle = COLORS.fur;
  ctx.fill();
  // orelha
  ctx.fillStyle = COLORS.furDark;
  ctx.beginPath();
  ctx.ellipse(-6, -84, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // focinho (protege para a direita)
  rrPath(ctx, 12, -76, 18, 16, 7);
  ctx.fillStyle = COLORS.furLight;
  ctx.fill();
  // narina
  ctx.fillStyle = COLORS.furDark;
  ctx.beginPath();
  ctx.ellipse(27, -70, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // olho + sobrancelha brava
  ctx.fillStyle = "#1c1410";
  ctx.beginPath();
  ctx.arc(8, -74, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1c1410";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(2, -80);
  ctx.lineTo(11, -78);
  ctx.stroke();

  // ── Capacete ──
  ctx.fillStyle = COLORS.helmet;
  ctx.beginPath();
  ctx.ellipse(3, -86, 18, 13, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = COLORS.helmetDark;
  ctx.fillRect(-15, -87, 36, 4);
  // estrelinha no capacete
  ctx.fillStyle = COLORS.star;
  drawStarAt(ctx, 3, -92, 5);

  // ── Braço da frente (no gatilho) ──
  capsule(ctx, 6, -52, 16, -42, 7, COLORS.furLight);
  // patinha
  ctx.fillStyle = COLORS.furDark;
  ctx.beginPath();
  ctx.arc(17, -42, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Flash do cano ──
  if (p.muzzle > 0) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = COLORS.muzzle;
    drawBurst(ctx, 50, -43, 11);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(50, -43, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawLeg(ctx: CanvasRenderingContext2D, hipX: number, step: number, color: string): void {
  const footX = hipX + step * 12;
  const lift = Math.max(0, step) * 7;
  capsule(ctx, hipX, -30, footX, -2 - lift, 8, color);
  // bota
  ctx.fillStyle = COLORS.gunDark;
  rrPath(ctx, footX - 5, -6 - lift, 12, 6, 3);
  ctx.fill();
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

// Soldado inimigo a pé (walker / shooter), virado para a esquerda.
function drawFootSoldier(ctx: CanvasRenderingContext2D, e: Enemy, x: number): void {
  const cx = x + e.w / 2;
  const feetY = e.y + e.h;
  const step = Math.sin(e.legPhase);

  ctx.save();
  ctx.translate(cx, feetY);

  // pernas
  capsule(ctx, 4, -26, 4 + step * 9, -2, 7, COLORS.enemyDark);
  capsule(ctx, -4, -26, -4 - step * 9, -2, 7, COLORS.enemy);

  // corpo
  const g = ctx.createLinearGradient(0, -56, 0, -26);
  g.addColorStop(0, COLORS.enemy);
  g.addColorStop(1, COLORS.enemyDark);
  rrPath(ctx, -12, -56, 24, 32, 9);
  ctx.fillStyle = g;
  ctx.fill();

  // arminha apontando para a esquerda (shooter)
  if (e.kind === "shooter") {
    ctx.fillStyle = COLORS.gunMetal;
    rrPath(ctx, -26, -44, 18, 5, 2);
    ctx.fill();
  }

  // cabeça
  rrPath(ctx, -11, -74, 22, 22, 9);
  ctx.fillStyle = COLORS.enemy;
  ctx.fill();
  // capacete
  ctx.fillStyle = COLORS.enemyDark;
  ctx.beginPath();
  ctx.ellipse(0, -74, 14, 9, 0, Math.PI, 0);
  ctx.fill();
  // olho bravo virado pra esquerda
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
  // esteira
  ctx.fillStyle = COLORS.tankDark;
  rrPath(ctx, x, y + e.h - 22, e.w, 22, 8);
  ctx.fill();
  ctx.fillStyle = "#2b2e26";
  for (let wx = x + 12; wx < x + e.w - 8; wx += 18) {
    ctx.beginPath();
    ctx.arc(wx, y + e.h - 11, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // casco
  const g = ctx.createLinearGradient(0, y, 0, y + e.h);
  g.addColorStop(0, COLORS.tank);
  g.addColorStop(1, COLORS.tankDark);
  rrPath(ctx, x + 6, y + 18, e.w - 12, e.h - 36, 8);
  ctx.fillStyle = g;
  ctx.fill();
  // torre
  rrPath(ctx, x + e.w * 0.32, y + 2, e.w * 0.4, 26, 8);
  ctx.fillStyle = COLORS.tank;
  ctx.fill();
  // canhão para a esquerda
  ctx.fillStyle = COLORS.gunDark;
  rrPath(ctx, x - 22, y + 10, 34, 8, 3);
  ctx.fill();
}

/* ── Chefe ── */

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, camX: number): void {
  const x = boss.x - camX;
  const y = boss.y;

  // esteiras
  ctx.fillStyle = COLORS.bossDark;
  rrPath(ctx, x, y + boss.h - 30, boss.w, 30, 10);
  ctx.fill();
  ctx.fillStyle = "#23262c";
  for (let wx = x + 16; wx < x + boss.w - 10; wx += 26) {
    ctx.beginPath();
    ctx.arc(wx, y + boss.h - 15, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // corpo blindado
  const g = ctx.createLinearGradient(0, y, 0, y + boss.h);
  g.addColorStop(0, COLORS.boss);
  g.addColorStop(1, COLORS.bossDark);
  rrPath(ctx, x + 10, y + 20, boss.w - 20, boss.h - 46, 16);
  ctx.fillStyle = g;
  ctx.fill();

  // placas
  ctx.fillStyle = COLORS.bossDark;
  rrPath(ctx, x + 24, y + 34, boss.w - 48, 18, 6);
  ctx.fill();

  // "olho" / núcleo brilhante
  const pulse = 0.6 + Math.abs(Math.sin(boss.phase * 3)) * 0.4;
  ctx.save();
  ctx.shadowColor = COLORS.bossAccent;
  ctx.shadowBlur = 22 * pulse;
  ctx.fillStyle = COLORS.bossAccent;
  ctx.beginPath();
  ctx.arc(x + boss.w * 0.42, y + boss.h * 0.42, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // canhão duplo para a esquerda
  ctx.fillStyle = COLORS.gunDark;
  rrPath(ctx, x - 30, y + boss.h * 0.4, 44, 12, 4);
  ctx.fill();
  rrPath(ctx, x - 30, y + boss.h * 0.4 + 22, 44, 12, 4);
  ctx.fill();

  // barra de vida flutuante
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
  ctx.save();
  ctx.shadowColor = COLORS.bulletGlow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = COLORS.bullet;
  for (const b of state.bullets) {
    const x = b.x - camX;
    if (x < -20 || x > VIRT_W + 20) continue;
    rrPath(ctx, x, b.y, b.w, b.h, b.h / 2);
    ctx.fill();
  }
  ctx.restore();
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
    // espinhos
    ctx.fillStyle = COLORS.hazardDark;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 9 - 4, baseY);
      ctx.lineTo(cx + i * 9, hz.y - 2);
      ctx.lineTo(cx + i * 9 + 4, baseY);
      ctx.closePath();
      ctx.fill();
    }
    // domo
    ctx.fillStyle = COLORS.hazard;
    ctx.beginPath();
    ctx.ellipse(cx, baseY, hz.w / 2, hz.h * 0.55, 0, Math.PI, 0);
    ctx.fill();
    // luz piscando
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

function rrPath(
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

function capsule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawStarAt(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  const spikes = 5;
  const inner = radius * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  const spikes = 8;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.4;
    const a = (Math.PI * i) / spikes;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}
