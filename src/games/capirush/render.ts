/**
 * CAPI RUSH — renderer 2D com falsa perspectiva (sem dependências).
 * Só desenha: toda a lógica mora em engine.ts.
 */
import { SPAWN_Z, isSliding, type Obstacle, type Pickup, type RushState } from "./engine";

const CAM = 8; // distância da câmera atrás da capivara
const PAL = {
  skyTop: "#050611",
  skyMid: "#1a0f3d",
  skyLow: "#4a1d7a",
  road: "#0d0b22",
  roadEdge: "#38e1ff",
  line: "rgba(183,148,255,.55)",
  violet: "#b794ff",
  cyan: "#38e1ff",
  gold: "#ffcf4a",
  orange: "#ff7a45",
  mint: "#22e3a0",
};

export interface View {
  W: number;
  H: number;
  horizon: number;
  base: number;
  laneW: number;
  unit: number;
  cx: number;
}

export function makeView(W: number, H: number): View {
  const laneW = Math.min(W * 0.3, H * 0.32);
  return { W, H, horizon: H * 0.33, base: H * 0.86, laneW, unit: laneW * 0.55, cx: W / 2 };
}

/** Escala de perspectiva: 1 em z = 0, encolhe com a distância. */
const sc = (z: number) => CAM / (Math.max(z, -CAM + 0.5) + CAM);
const gy = (v: View, z: number) => v.horizon + (v.base - v.horizon) * sc(z);
const gx = (v: View, laneX: number, z: number) => v.cx + laneX * v.laneW * sc(z);

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function drawSky(ctx: CanvasRenderingContext2D, v: View, dist: number) {
  const g = ctx.createLinearGradient(0, 0, 0, v.horizon + 8);
  g.addColorStop(0, PAL.skyTop);
  g.addColorStop(0.6, PAL.skyMid);
  g.addColorStop(1, PAL.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, v.W, v.horizon + 8);

  // Lua
  ctx.fillStyle = "rgba(255,230,160,.9)";
  ctx.beginPath();
  ctx.arc(v.W * 0.78, v.horizon * 0.42, v.horizon * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Skyline distante (parallax lento)
  const off = (dist * 0.4) % 60;
  ctx.fillStyle = "#120a2c";
  for (let i = -1; i < v.W / 60 + 2; i++) {
    const h = 20 + hash(i + Math.floor(dist * 0.4 / 60)) * v.horizon * 0.35;
    ctx.fillRect(i * 60 - off, v.horizon - h, 46, h + 2);
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, v: View, dist: number) {
  // Chão
  ctx.fillStyle = "#07061a";
  ctx.fillRect(0, v.horizon, v.W, v.H - v.horizon);

  // Pista (trapézio)
  const half = 1.5;
  ctx.fillStyle = PAL.road;
  ctx.beginPath();
  ctx.moveTo(gx(v, -half, SPAWN_Z), gy(v, SPAWN_Z));
  ctx.lineTo(gx(v, half, SPAWN_Z), gy(v, SPAWN_Z));
  ctx.lineTo(gx(v, half, -CAM + 0.5), gy(v, -CAM + 0.5));
  ctx.lineTo(gx(v, -half, -CAM + 0.5), gy(v, -CAM + 0.5));
  ctx.closePath();
  ctx.fill();

  // Faixas de dormentes rolando (dá sensação de velocidade)
  const spacing = 4;
  const phase = (dist % spacing) / spacing;
  for (let i = 0; i < SPAWN_Z / spacing + 1; i++) {
    const z = (i - phase) * spacing;
    if (z < -CAM + 1) continue;
    const y0 = gy(v, z);
    const y1 = gy(v, z + spacing * 0.35);
    ctx.fillStyle = i % 2 ? "rgba(56,225,255,.05)" : "rgba(183,148,255,.07)";
    ctx.fillRect(gx(v, -half, z), y1, gx(v, half, z) - gx(v, -half, z), Math.max(1, y0 - y1));
  }

  // Linhas de pista
  ctx.strokeStyle = PAL.line;
  ctx.lineWidth = 2;
  for (const lx of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(gx(v, lx, SPAWN_Z), gy(v, SPAWN_Z));
    ctx.lineTo(gx(v, lx, -CAM + 0.5), gy(v, -CAM + 0.5));
    ctx.stroke();
  }
  // Bordas neon
  ctx.strokeStyle = PAL.roadEdge;
  ctx.shadowColor = PAL.roadEdge;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3;
  for (const lx of [-half, half]) {
    ctx.beginPath();
    ctx.moveTo(gx(v, lx, SPAWN_Z), gy(v, SPAWN_Z));
    ctx.lineTo(gx(v, lx, -CAM + 0.5), gy(v, -CAM + 0.5));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawBuildings(ctx: CanvasRenderingContext2D, v: View, dist: number) {
  const spacing = 10;
  const base = Math.floor(dist / spacing);
  const phase = (dist % spacing) / spacing;
  for (let i = Math.ceil(SPAWN_Z / spacing); i >= 0; i--) {
    const z = (i - phase) * spacing;
    if (z < -CAM + 1) continue;
    const k = sc(z);
    for (const side of [-1, 1]) {
      const id = base + i;
      const hh = (2 + hash(id * 2 + (side > 0 ? 1 : 0)) * 6) * v.unit * k;
      const w = 2.2 * v.laneW * k;
      const x = gx(v, side * 2.15, z) - (side < 0 ? w : 0);
      const y = gy(v, z);
      ctx.fillStyle = side < 0 ? "#150d33" : "#101035";
      ctx.fillRect(x, y - hh, w, hh);
      // janelas neon
      const cols = ["#38e1ff", "#ffcf4a", "#b794ff", "#22e3a0"];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 2; c++) {
          if (hash(id * 31 + r * 7 + c + side) < 0.45) continue;
          ctx.fillStyle = cols[Math.floor(hash(id + r + c * 3) * cols.length)];
          ctx.globalAlpha = 0.75;
          ctx.fillRect(x + w * (0.2 + c * 0.42), y - hh + hh * (0.1 + r * 0.17), w * 0.2, hh * 0.08);
        }
      }
      ctx.globalAlpha = 1;
    }
  }
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  v: View,
  lane: number,
  z: number,
  len: number,
  w: number,
  hBottom: number,
  hTop: number,
  front: string,
  top: string,
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

  // topo
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
  // frente
  ctx.fillStyle = front;
  ctx.fillRect(xn - wn / 2, topN, wn, botN - topN);
}

function drawObstacle(ctx: CanvasRenderingContext2D, v: View, o: Obstacle) {
  const k = sc(o.z);
  if (o.kind === "train") {
    drawBox(ctx, v, o.lane, o.z, o.len, 0.86, 0, 2.5, "#3a2a7a", "#5b43b8");
    // faixa neon + faróis
    const xn = gx(v, o.lane, Math.max(o.z, -CAM + 0.6));
    const zn = Math.max(o.z, -CAM + 0.6);
    const kn = sc(zn);
    const yn = gy(v, zn);
    const wn = 0.86 * v.laneW * kn;
    ctx.fillStyle = PAL.cyan;
    ctx.fillRect(xn - wn / 2, yn - 1.5 * v.unit * kn, wn, 0.12 * v.unit * kn + 1);
    ctx.fillStyle = PAL.gold;
    ctx.shadowColor = PAL.gold;
    ctx.shadowBlur = 12 * kn;
    for (const sx of [-0.28, 0.28]) {
      ctx.beginPath();
      ctx.arc(xn + sx * wn * 1.1, yn - 0.55 * v.unit * kn, Math.max(1.5, 0.16 * v.unit * kn), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  } else if (o.kind === "barrier") {
    drawBox(ctx, v, o.lane, o.z, o.len, 0.8, 0, 0.7, PAL.orange, "#ffb08a");
    // listras de alerta
    const zn = Math.max(o.z, -CAM + 0.6);
    const kn = sc(zn);
    const xn = gx(v, o.lane, zn);
    const yn = gy(v, zn);
    const wn = 0.8 * v.laneW * kn;
    ctx.fillStyle = "#1b1030";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(xn - wn / 2 + wn * (0.1 + i * 0.25), yn - 0.5 * v.unit * kn, wn * 0.12, 0.3 * v.unit * kn);
    }
  } else {
    // barra alta: duas colunas + travessa que obriga a deslizar
    const w = 0.86;
    drawBox(ctx, v, o.lane - w / 2 + 0.05, o.z, o.len, 0.1, 0, 1.7, PAL.violet, PAL.violet);
    drawBox(ctx, v, o.lane + w / 2 - 0.05, o.z, o.len, 0.1, 0, 1.7, PAL.violet, PAL.violet);
    drawBox(ctx, v, o.lane, o.z, o.len, w, 0.85, 1.35, "#e23d7a", "#ff7aa8");
  }
  void k;
}

function drawPickup(ctx: CanvasRenderingContext2D, v: View, p: Pickup, time: number) {
  const k = sc(p.z);
  const x = gx(v, p.lane, p.z);
  const lift = p.h === 1 ? 1.35 : 0.45;
  const y = gy(v, p.z) - lift * v.unit * k;
  if (p.kind === "coin") {
    const r = 0.22 * v.unit * k;
    const squash = Math.abs(Math.cos(time * 5 + p.id));
    ctx.fillStyle = PAL.gold;
    ctx.shadowColor = PAL.gold;
    ctx.shadowBlur = 8 * k;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.5, r * (0.35 + 0.65 * squash)), r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    const r = 0.36 * v.unit * k;
    ctx.strokeStyle = PAL.cyan;
    ctx.fillStyle = "rgba(56,225,255,.25)";
    ctx.lineWidth = Math.max(1.5, 3 * k);
    ctx.shadowColor = PAL.cyan;
    ctx.shadowBlur = 14 * k;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

/** Capivara original vista de trás, com cachecol neon. */
function drawPlayer(ctx: CanvasRenderingContext2D, v: View, s: RushState) {
  const z = 0.5;
  const k = sc(z);
  const x = gx(v, s.laneX, z);
  const ground = gy(v, z);
  const u = v.unit * k;
  const sliding = isSliding(s) && s.y <= 0.01;
  const run = Math.sin(s.time * 16);

  // sombra
  ctx.fillStyle = "rgba(0,0,0,.4)";
  ctx.beginPath();
  ctx.ellipse(x, ground, u * 0.55 * (1 - Math.min(s.y, 1.4) * 0.2), u * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  if (s.invuln > 0 && Math.floor(s.time * 14) % 2 === 0) ctx.globalAlpha = 0.35;

  const lift = s.y * v.unit * k;
  const bodyH = sliding ? u * 0.55 : u * 0.95;
  const bodyW = u * 0.78;
  const by = ground - lift;

  ctx.save();
  ctx.translate(x, by);
  if (sliding) ctx.rotate(0.05);

  // patinhas correndo
  if (!sliding && s.y <= 0.01) {
    ctx.fillStyle = "#6b4426";
    ctx.fillRect(-bodyW * 0.35 + run * u * 0.06, -u * 0.12, u * 0.2, u * 0.14);
    ctx.fillRect(bodyW * 0.15 - run * u * 0.06, -u * 0.12, u * 0.2, u * 0.14);
  }

  // corpo
  const body = ctx.createLinearGradient(0, -bodyH, 0, 0);
  body.addColorStop(0, "#b97b45");
  body.addColorStop(1, "#8a5630");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, -bodyH * 0.5 - u * 0.05, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // cabeça (parte de trás) + orelhinhas
  const headY = -bodyH * 0.95;
  ctx.fillStyle = "#a96d3b";
  ctx.beginPath();
  ctx.ellipse(0, headY, u * 0.3, u * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b4426";
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * u * 0.24, headY - u * 0.2, u * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // mochila-foguete (referência ao universo) + chama
  ctx.fillStyle = "#3a2a7a";
  ctx.fillRect(-u * 0.2, -bodyH * 0.75, u * 0.4, bodyH * 0.45);
  ctx.fillStyle = PAL.cyan;
  ctx.fillRect(-u * 0.2, -bodyH * 0.75, u * 0.4, u * 0.06);
  if (s.y > 0.01) {
    ctx.fillStyle = PAL.orange;
    ctx.beginPath();
    ctx.moveTo(-u * 0.12, -bodyH * 0.3);
    ctx.lineTo(u * 0.12, -bodyH * 0.3);
    ctx.lineTo(0, -bodyH * 0.3 + u * (0.25 + Math.abs(run) * 0.15));
    ctx.closePath();
    ctx.fill();
  }

  // cachecol que balança
  ctx.fillStyle = PAL.violet;
  ctx.fillRect(-u * 0.3, headY + u * 0.16, u * 0.6, u * 0.1);
  ctx.beginPath();
  ctx.moveTo(u * 0.2, headY + u * 0.2);
  ctx.lineTo(u * 0.55 + run * u * 0.05, headY + u * 0.34);
  ctx.lineTo(u * 0.5 + run * u * 0.05, headY + u * 0.44);
  ctx.lineTo(u * 0.18, headY + u * 0.26);
  ctx.fill();

  // escudo
  if (s.shield) {
    ctx.strokeStyle = PAL.cyan;
    ctx.fillStyle = "rgba(56,225,255,.16)";
    ctx.lineWidth = 3;
    ctx.shadowColor = PAL.cyan;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, -bodyH * 0.5, bodyW * 0.8, bodyH * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawScene(ctx: CanvasRenderingContext2D, v: View, s: RushState, shake = 0) {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.clearRect(-20, -20, v.W + 40, v.H + 40);
  drawSky(ctx, v, s.distance);
  drawRoad(ctx, v, s.distance);
  drawBuildings(ctx, v, s.distance);

  // Objetos do mais longe para o mais perto.
  type Item = { z: number; draw: () => void };
  const items: Item[] = [];
  for (const o of s.obstacles) items.push({ z: o.z, draw: () => drawObstacle(ctx, v, o) });
  for (const p of s.pickups) items.push({ z: p.z, draw: () => drawPickup(ctx, v, p, s.time) });
  items.push({ z: 0.5, draw: () => drawPlayer(ctx, v, s) });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) if (it.z < SPAWN_Z + 5) it.draw();

  // neblina no fundo para esconder o spawn
  const fog = ctx.createLinearGradient(0, v.horizon, 0, v.horizon + (v.base - v.horizon) * 0.3);
  fog.addColorStop(0, "rgba(74,29,122,.85)");
  fog.addColorStop(1, "rgba(74,29,122,0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, v.horizon, v.W, (v.base - v.horizon) * 0.3);
  ctx.restore();
}
