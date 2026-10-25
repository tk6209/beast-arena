/**
 * CAPI RUSH — camadas de atmosfera do cenário (nuvens, drones, chuva, pórticos,
 * postes, névoa, folhagem de primeiro plano, bloom e lens flare).
 * Tudo é decorativo e determinístico a partir do tempo/distância.
 */
import { CAM, PAL, glow, glowE, gx, gy, hash, mix, sc, type View } from "./gfx";
import { SPAWN_Z } from "./engine";
import { isJungleAt } from "./biome";

/* ───────── Céu vivo ───────── */
export function drawClouds(ctx: CanvasRenderingContext2D, v: View, time: number, distance: number, j: number) {
  const hz = v.horizon;
  const drift = time * 6 + distance * 0.03;
  for (let i = 0; i < 9; i++) {
    const w = v.W * (0.5 + hash(i * 3.3) * 0.6);
    const x = ((hash(i * 7.1) * (v.W + w) + drift * (0.4 + hash(i) * 0.8)) % (v.W + w * 1.5)) - w * 0.75 - v.cam * 12 * (0.3 + hash(i) * 0.4);
    const y = hz * (0.12 + hash(i * 5.7) * 0.6);
    const ry = w * (0.05 + hash(i + 2) * 0.05);
    glowE(ctx, x, y, w * 0.55, ry * 2.4, mix("#5b2d9e", "#3a6a52", j), 0.28);
    glowE(ctx, x + w * 0.1, y - ry * 0.4, w * 0.35, ry * 1.4, mix("#ff6fb5", "#ffe2a0", j), 0.16 + 0.05 * Math.sin(time * 0.3 + i));
  }
}

export function drawSkyLife(ctx: CanvasRenderingContext2D, v: View, time: number, j: number) {
  const hz = v.horizon;
  if (j < 0.95) {
    // Drones/ aerocarros cruzando o céu da cidade, com rastro.
    for (let i = 0; i < 6; i++) {
      const dir = i % 2 ? 1 : -1;
      const speed = 18 + hash(i * 2.1) * 26;
      const span = v.W + 160;
      const t = (time * speed * dir + hash(i * 9.7) * span) % span;
      const x = (t < 0 ? t + span : t) - 80;
      const y = hz * (0.22 + hash(i * 4.4) * 0.5);
      const a = (1 - j) * 0.9;
      glow(ctx, x, y, 7, i % 3 === 0 ? PAL.pink : PAL.cyan, a);
      glowE(ctx, x - dir * 16, y, 22, 3, i % 3 === 0 ? PAL.pink : PAL.cyan, a * 0.45);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "#0b0720";
      ctx.fillRect(x - 3, y - 1, 6, 2);
      ctx.restore();
    }
    // Holofotes varrendo as nuvens.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 2; i++) {
      const bx = v.W * (i ? 0.82 : 0.14);
      const a = -Math.PI / 2 + Math.sin(time * 0.5 + i * 2.2) * 0.45;
      const len = hz * 1.1;
      const g = ctx.createLinearGradient(bx, hz, bx + Math.cos(a) * len, hz + Math.sin(a) * len);
      g.addColorStop(0, `rgba(180,230,255,${0.2 * (1 - j)})`);
      g.addColorStop(1, "rgba(180,230,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(bx - 6, hz);
      ctx.lineTo(bx + Math.cos(a - 0.07) * len, hz + Math.sin(a - 0.07) * len);
      ctx.lineTo(bx + Math.cos(a + 0.07) * len, hz + Math.sin(a + 0.07) * len);
      ctx.lineTo(bx + 6, hz);
      ctx.fill();
    }
    ctx.restore();
  }
  if (j > 0.05) {
    // Revoada de pássaros na selva.
    ctx.save();
    ctx.strokeStyle = `rgba(10,30,20,${0.75 * j})`;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      const span = v.W + 120;
      const x = ((time * (22 + i * 2) + i * 70) % span) - 60;
      const y = hz * (0.28 + 0.07 * Math.sin(i * 1.7) + 0.02 * Math.sin(time * 2 + i));
      const flap = Math.sin(time * 9 + i * 1.3) * 4;
      ctx.beginPath();
      ctx.moveTo(x - 7, y - flap);
      ctx.quadraticCurveTo(x - 3, y - 4 + flap * 0.4, x, y);
      ctx.quadraticCurveTo(x + 3, y - 4 + flap * 0.4, x + 7, y - flap);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* ───────── Estruturas sobre a pista ───────── */
/** Pórtico neon (cidade) ou arco de pedra (selva), cruzando a pista de cima a baixo. */
export function drawOverhead(ctx: CanvasRenderingContext2D, v: View, z: number, id: number, time: number, j: number) {
  const k = sc(z);
  const y = gy(v, z);
  const u = v.unit * k;
  const xl = gx(v, -1.95, z);
  const xr = gx(v, 1.95, z);
  // acima da altura do olho da câmera (~6,4 m): o pórtico passa POR CIMA da tela, não na frente
  const topY = y - 8.6 * u;
  const alpha = Math.min(1, Math.max(0, (SPAWN_Z - z) / 14)) * Math.min(1, Math.max(0, (z + 4) / 3));
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (j < 0.5) {
    const neon = [PAL.cyan, PAL.pink, PAL.violet][((id % 3) + 3) % 3];
    for (const x of [xl, xr]) {
      const g = ctx.createLinearGradient(x - 5 * k, 0, x + 5 * k, 0);
      g.addColorStop(0, "#241a5c");
      g.addColorStop(0.5, "#4a3a9a");
      g.addColorStop(1, "#150f3a");
      ctx.fillStyle = g;
      ctx.fillRect(x - 0.26 * u, topY, 0.52 * u, y - topY);
      ctx.fillStyle = neon;
      ctx.fillRect(x - 0.03 * u, topY, 0.06 * u + 1, y - topY);
    }
    // viga + painel holográfico
    const bg = ctx.createLinearGradient(0, topY - 0.4 * u, 0, topY + 0.5 * u);
    bg.addColorStop(0, "#4a3a9a");
    bg.addColorStop(1, "#1a1245");
    ctx.fillStyle = bg;
    ctx.fillRect(xl - 0.3 * u, topY - 0.4 * u, xr - xl + 0.6 * u, 0.9 * u);
    ctx.fillStyle = neon;
    ctx.fillRect(xl, topY + 0.38 * u, xr - xl, 0.07 * u + 1);
    glowE(ctx, (xl + xr) / 2, topY + 0.4 * u, (xr - xl) * 0.6, 1.2 * u, neon, 0.55);
    // faixas de LED correndo
    const n = 14;
    for (let i = 0; i < n; i++) {
      const on = (i + Math.floor(time * 10 + id)) % 4 === 0;
      ctx.fillStyle = on ? "#ffffff" : mix(neon, "#000000", 0.55);
      ctx.fillRect(xl + ((xr - xl) * i) / n + 2 * k, topY + 0.02 * u, ((xr - xl) / n) * 0.6, 0.16 * u + 1);
    }
    for (const lx of [0.3, 0.7]) glow(ctx, xl + (xr - xl) * lx, topY + 0.65 * u, 1.1 * u, "#fff3c0", 0.55);
  } else {
    // arco de pedra com musgo, cipós e runa brilhante
    for (const x of [xl, xr]) {
      const g = ctx.createLinearGradient(x - 0.5 * u, 0, x + 0.5 * u, 0);
      g.addColorStop(0, "#4a4638");
      g.addColorStop(0.5, "#7a7762");
      g.addColorStop(1, "#2c2a21");
      ctx.fillStyle = g;
      ctx.fillRect(x - 0.5 * u, topY + 0.6 * u, 1 * u, y - topY - 0.6 * u);
      ctx.fillStyle = "rgba(0,0,0,.25)";
      for (let b = 1; b < 7; b++) ctx.fillRect(x - 0.5 * u, y - ((y - topY) * b) / 7, 1 * u, Math.max(1, 1.4 * k));
      ctx.fillStyle = "#3f7a3c";
      ctx.fillRect(x - 0.55 * u, topY + 0.55 * u, 1.1 * u, 0.18 * u);
    }
    ctx.fillStyle = "#6b6853";
    ctx.beginPath();
    ctx.moveTo(xl - 0.6 * u, topY + 0.7 * u);
    ctx.quadraticCurveTo((xl + xr) / 2, topY - 1.5 * u, xr + 0.6 * u, topY + 0.7 * u);
    ctx.lineTo(xr + 0.6 * u, topY + 0.1 * u);
    ctx.quadraticCurveTo((xl + xr) / 2, topY - 2.2 * u, xl - 0.6 * u, topY + 0.1 * u);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(60,150,60,.9)";
    ctx.lineWidth = Math.max(1, 2.2 * k);
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      const vx = xl + (xr - xl) * t;
      const vy = topY + 0.3 * u - Math.sin(Math.PI * t) * 1.15 * u;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.quadraticCurveTo(vx + Math.sin(time * 1.5 + i + id) * 5 * k, vy + 1.2 * u, vx, vy + (1 + hash(id + i) * 1.4) * u);
      ctx.stroke();
    }
    const pulse = 0.65 + 0.35 * Math.sin(time * 3 + id);
    glow(ctx, (xl + xr) / 2, topY - 0.4 * u, 1.7 * u, PAL.gold, 0.55 * pulse);
    ctx.strokeStyle = `rgba(255,215,120,${0.9 * pulse})`;
    ctx.lineWidth = Math.max(1.5, 2.4 * k);
    ctx.beginPath();
    ctx.arc((xl + xr) / 2, topY - 0.4 * u, 0.5 * u, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* ───────── Postes de luz / tochas ───────── */
export function drawLamps(ctx: CanvasRenderingContext2D, v: View, distance: number, time: number) {
  const spacing = 12;
  const base = Math.floor(distance / spacing);
  const phase = (distance % spacing) / spacing;
  for (let i = Math.ceil(SPAWN_Z / spacing); i >= 0; i--) {
    const z = (i - phase) * spacing + 3;
    if (z < -1 || z > SPAWN_Z) continue;
    const id = base + i;
    const k = sc(z);
    const u = v.unit * k;
    const y = gy(v, z);
    const fade = Math.min(1, (SPAWN_Z - z) / 16);
    // poste de neon ou tocha, conforme o bioma daquele ponto do mundo (troca opaca)
    const j = isJungleAt(distance + z) ? 1 : 0;
    for (const side of [-1, 1]) {
      const x = gx(v, side * 1.78, z);
      if (j < 0.999) {
        const a = (1 - j) * fade;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#1a1245";
        ctx.fillRect(x - 0.05 * u, y - 3.2 * u, 0.1 * u + 1, 3.2 * u);
        const hx = x - side * 0.35 * u;
        ctx.fillRect(Math.min(x, hx), y - 3.25 * u, Math.abs(x - hx), 0.07 * u + 1);
        ctx.globalAlpha = 1;
        const flick = hash(id * 3 + side) > 0.93 ? 0.5 + 0.5 * Math.sin(time * 40) : 1;
        const col = (id + side) % 5 === 0 ? PAL.pink : "#ffe9b0";
        glow(ctx, hx, y - 3.22 * u, 1.4 * u, col, 0.9 * a * flick);
        // cone de luz e poça no asfalto
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const cone = ctx.createLinearGradient(0, y - 3.2 * u, 0, y);
        cone.addColorStop(0, `rgba(255,233,176,${0.2 * a * flick})`);
        cone.addColorStop(1, "rgba(255,233,176,0)");
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(hx - 0.1 * u, y - 3.2 * u);
        ctx.lineTo(hx + 0.1 * u, y - 3.2 * u);
        ctx.lineTo(hx + 1.0 * u + side * -0.4 * u, y);
        ctx.lineTo(hx - 1.0 * u + side * -0.4 * u, y);
        ctx.fill();
        ctx.restore();
        glowE(ctx, hx - side * 0.5 * u, y, 1.8 * u, 0.5 * u, col, 0.45 * a * flick);
      }
      if (j > 0.001) {
        const a = j * fade;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#3b2a1a";
        ctx.fillRect(x - 0.07 * u, y - 1.7 * u, 0.14 * u + 1, 1.7 * u);
        ctx.fillStyle = "#6b4a28";
        ctx.fillRect(x - 0.16 * u, y - 1.85 * u, 0.32 * u, 0.2 * u);
        ctx.globalAlpha = 1;
        const fl = 0.78 + 0.22 * Math.sin(time * 14 + id * 2 + side);
        glow(ctx, x, y - 2.0 * u, 1.5 * u * fl, PAL.orange, 0.85 * a);
        glow(ctx, x, y - 1.95 * u, 0.6 * u * fl, "#fff0a0", a);
        glowE(ctx, x - side * 0.4 * u, y, 1.6 * u, 0.45 * u, PAL.orange, 0.35 * a * fl);
      }
    }
  }
}

/* ───────── Chuva (cidade) e poeira de luz (selva) ───────── */
export function drawWeather(ctx: CanvasRenderingContext2D, v: View, time: number, j: number, reduced: boolean) {
  if (reduced) return;
  if (j < 0.9) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(170,210,255,1)";
    const n = 70;
    for (let i = 0; i < n; i++) {
      const sp = 520 + hash(i * 1.7) * 380;
      const x0 = hash(i * 3.9) * (v.W + 80);
      const y = (hash(i * 8.1) * v.H + time * sp) % (v.H + 40) - 20;
      const x = x0 - y * 0.18;
      const len = 12 + hash(i + 3) * 18;
      ctx.globalAlpha = (1 - j) * (0.1 + hash(i * 2.2) * 0.14);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * 0.18, y + len);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (j > 0.1) {
    // grãos de pólen/poeira dourada flutuando
    for (let i = 0; i < 26; i++) {
      const x = (hash(i * 5.3) * v.W + Math.sin(time * 0.6 + i) * 18 + time * 8) % v.W;
      const y = v.H * (0.15 + hash(i * 2.9) * 0.7) + Math.sin(time * 0.9 + i * 2) * 10;
      glow(ctx, x, y, 3 + hash(i) * 5, "#ffe9a0", j * (0.25 + 0.25 * Math.sin(time * 2 + i)));
    }
  }
}

/* ───────── Névoa baixa ───────── */
export function drawMist(ctx: CanvasRenderingContext2D, v: View, time: number, j: number) {
  const hz = v.horizon;
  // Brilho aditivo amarelo sobre um chão já claro (selva) vira véu: de dia a névoa é bem mais leve.
  const k = 1 - 0.6 * j;
  for (let i = 0; i < 4; i++) {
    const y = hz + (v.base - hz) * (0.02 + i * 0.07);
    const x = ((time * (8 + i * 4) + i * 120) % (v.W * 1.6)) - v.W * 0.3;
    glowE(ctx, x, y, v.W * 0.7, 26 + i * 10, mix("#b23d8f", "#ffe2a0", j), (0.14 + 0.05 * i) * k);
    glowE(ctx, v.W - x * 0.8, y + 8, v.W * 0.6, 22 + i * 8, mix("#5a3fd0", "#cfe8a0", j), (0.1 + 0.04 * i) * k);
  }
  // luz de contorno rasteira no horizonte
  glowE(ctx, v.cx, hz + 4, v.W * 0.7, 40, mix("#ff4fa0", "#ffd27a", j), 0.35 * k);
}

/* ───────── Folhagem de primeiro plano (selva) ───────── */
export function drawForeground(ctx: CanvasRenderingContext2D, v: View, time: number, j: number) {
  if (j < 0.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, j * 1.2);
  const sway = Math.sin(time * 0.9) * 0.04;
  const leaf = (ox: number, oy: number, len: number, ang: number, w: number, tone: number) => {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(ang + sway);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, tone ? "#0a2a18" : "#061a0f");
    g.addColorStop(1, tone ? "#2a7a3a" : "#12502a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.25, -w, len * 0.7, -w * 0.9, len, 0);
    ctx.bezierCurveTo(len * 0.7, w * 0.5, len * 0.25, w * 0.6, 0, 0);
    ctx.fill();
    ctx.strokeStyle = "rgba(190,255,150,.22)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.95, 0);
    ctx.stroke();
    ctx.restore();
  };
  const W = v.W;
  const H = v.H;
  // cantos de baixo
  for (let i = 0; i < 5; i++) leaf(-W * 0.04, H * 1.02, W * (0.32 + i * 0.05), -0.2 - i * 0.28, W * 0.09, i % 2);
  for (let i = 0; i < 5; i++) leaf(W * 1.04, H * 1.02, W * (0.32 + i * 0.05), Math.PI + 0.2 + i * 0.28, W * 0.09, i % 2);
  // cantos de cima (copa)
  for (let i = 0; i < 4; i++) leaf(-W * 0.03, -H * 0.02, W * (0.3 + i * 0.05), 0.35 + i * 0.3, W * 0.08, (i + 1) % 2);
  for (let i = 0; i < 4; i++) leaf(W * 1.03, -H * 0.02, W * (0.3 + i * 0.05), Math.PI - 0.35 - i * 0.3, W * 0.08, (i + 1) % 2);
  ctx.restore();
}

/* ───────── Lens flare (sol da selva) ───────── */
export function drawLensFlare(ctx: CanvasRenderingContext2D, v: View, j: number) {
  if (j < 0.2) return;
  const sx = v.W * 0.5 - v.cam * v.laneW * 0.1;
  const sy = v.horizon * 0.8;
  const cx = v.W / 2;
  const cy = v.H / 2;
  const items: [number, number, string, number][] = [
    [0.35, 22, "#ffd27a", 0.18],
    [0.6, 12, "#7affd1", 0.14],
    [0.85, 30, "#ff9a5a", 0.1],
    [1.15, 16, "#b794ff", 0.12],
  ];
  for (const [t, r, c, a] of items) glow(ctx, sx + (cx - sx) * t * 1.6, sy + (cy - sy) * t * 1.6, r, c, a * j);
}

/* ───────── Bloom por downsample (funciona em qualquer navegador, inclusive Safari) ───────── */
let bloomA: HTMLCanvasElement | null = null;
let bloomB: HTMLCanvasElement | null = null;
export function drawBloom(ctx: CanvasRenderingContext2D, v: View, strength = 0.32) {
  const bw = Math.max(48, Math.round(v.W / 5));
  const bh = Math.max(48, Math.round(v.H / 5));
  if (!bloomA || bloomA.width !== bw || bloomA.height !== bh) {
    bloomA = document.createElement("canvas");
    bloomA.width = bw;
    bloomA.height = bh;
    bloomB = document.createElement("canvas");
    bloomB.width = Math.round(bw / 2);
    bloomB.height = Math.round(bh / 2);
  }
  const a = bloomA.getContext("2d");
  const b = bloomB?.getContext("2d");
  if (!a || !b || !bloomB) return;
  a.imageSmoothingQuality = "high";
  b.imageSmoothingQuality = "high";
  a.clearRect(0, 0, bw, bh);
  a.globalCompositeOperation = "source-over";
  a.drawImage(ctx.canvas, 0, 0, bw, bh);
  // "Limiar" barato: multiplicar a imagem por ela mesma (x²) e de novo (x⁴) apaga
  // os tons médios e deixa só neon, sol e faróis. Sem isso o bloom somava a cena
  // inteira sobre si mesma e, de dia, virava um véu leitoso por cima de tudo.
  a.globalCompositeOperation = "multiply";
  a.drawImage(bloomA, 0, 0);
  a.drawImage(bloomA, 0, 0);
  a.globalCompositeOperation = "source-over";
  b.clearRect(0, 0, bloomB.width, bloomB.height);
  b.drawImage(bloomA, 0, 0, bloomB.width, bloomB.height);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = strength;
  ctx.drawImage(bloomB, 0, 0, v.W, v.H);
  ctx.restore();
  void CAM;
}
