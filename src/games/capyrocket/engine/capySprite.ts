import type { CharacterConfig, Headgear, HeldWeapon } from "./characters";
import { COLORS, PLAYER_H, PLAYER_SCREEN_X } from "./constants";
import { getHeroImage } from "./heroSprites";
import { capsule, drawBurst, rrPath } from "./primitives";
import type { Player } from "./types";

/**
 * Capivara desenhada conforme o Character OS canônico (capy_base_360.json):
 * uma BASE compartilhada (cabeça grande, focinho largo, membros curtos) sobre a
 * qual se compõem acessórios e a arma de cada personagem do roster CAPI WARS.
 * Personagens são composições da mesma base — não meshes isolados.
 *
 * `special` (caixa de arma) sobrepõe o visual da arma-assinatura quando ativo.
 */
export function drawCapy(
  ctx: CanvasRenderingContext2D,
  p: Player,
  rec: CharacterConfig,
  special: "shotgun" | "bazooka" | null,
): void {
  if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) return;

  const cx = PLAYER_SCREEN_X + p.w / 2;
  const feetY = p.y + p.h;
  const t = p.animPhase;
  const fur = rec.palette;
  const accent = rec.accentColor;
  // Linhas internas suaves (sem contorno duro — referência tem shading 3D).
  const softLine = shade(fur.furDark, -0.15);
  const crouchT = p.crouchT;
  const airT = p.airT;
  // Squash & stretch baseado no agachamento.
  const squashY = 1 - 0.35 * crouchT;
  const stretchX = 1 + 0.18 * crouchT;

  // Sombra (encolhe quando está no ar, aumenta quando agacha).
  const shadowAlpha = 0.28 * (1 - 0.55 * airT);
  const shadowW = p.w * (0.5 + 0.15 * crouchT - 0.2 * airT);
  // Sombra projetada no chão (não sobe com o personagem no ar).
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(cx, feetY + 2 + (p.y < (feetY - p.h) ? 0 : 0), Math.max(8, shadowW), 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, feetY);
  // Bob da corrida — diminui agachado, some no ar.
  const bob = (1 - airT) * (1 - crouchT * 0.6) * -Math.abs(Math.sin(t * 16)) * 3;
  ctx.translate(0, bob);
  // Aplica squash & stretch global.
  // Espelha horizontalmente quando o herói está virado para a esquerda.
  ctx.scale(stretchX * (p.facingX < 0 ? -1 : 1), squashY);

  // ── Sprite REAL (arte da folha CAPI WARS) ──
  // Usa a imagem do herói; cai no desenho procedural só enquanto carrega.
  const heroImg = getHeroImage(rec.sprite);
  if (heroImg) {
    const targetH = PLAYER_H * 1.18;
    const sc = targetH / heroImg.naturalHeight;
    const w = heroImg.naturalWidth * sc;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(heroImg, -w / 2, -targetH, w, targetH);
    // Flash do disparo na frente (lado para onde olha — local +x).
    if (p.muzzle > 0) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = heldFlash(rec.held, special);
      drawBurst(ctx, w / 2 - 2, -targetH * 0.46, 10);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(w / 2 - 2, -targetH * 0.46, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  // Pernas: ciclo de corrida no chão; recolhidas no ar; quase paradas agachado.
  const runStep = Math.sin(t * 16) * (1 - airT) * (1 - crouchT);
  const airTuck = airT * 0.9; // recolhe as pernas no pulo

  // ── Pernas (curtas, paleta canônica) ──
  drawLeg(ctx, -5, runStep, fur.furDark, airTuck, crouchT);
  drawLeg(ctx, 7, -runStep, fur.fur, airTuck, crouchT);

  // ── Tronco "barril" com volume ──
  const g = ctx.createLinearGradient(-16, -54, 14, -20);
  g.addColorStop(0, fur.furLight);
  g.addColorStop(0.55, fur.fur);
  g.addColorStop(1, fur.furDark);
  rrPath(ctx, -16, -52, 32, 34, 13);
  ctx.fillStyle = g;
  ctx.fill();
  // Linha interna suave (sem outline duro — referência tem shading 3D).
  ctx.strokeStyle = softLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.globalAlpha = 1;
  // barriga clara
  rrPath(ctx, -9, -42, 19, 22, 9);
  ctx.fillStyle = fur.furLight;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;
  // sombra de contato sob o tronco (oclusão)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  rrPath(ctx, -14, -23, 28, 6, 3);
  ctx.fill();

  // ── Acessório: peitoral/roupa na cor de realce do personagem ──
  rrPath(ctx, -16, -52, 32, 15, 11);
  ctx.fillStyle = accent;
  ctx.fill();
  rrPath(ctx, -16, -52, 32, 5, 4);
  ctx.fillStyle = shade(accent, -0.25);
  ctx.fill();

  // ── Braço de trás (segura a arma) ──
  capsule(ctx, 2, -46, 16, -38, 7, fur.furDark);

  // ── Arma (especial sobrepõe a assinatura) ──
  if (special) drawGun(ctx, special);
  else drawHeld(ctx, rec.held, accent);

  // Bandoleira de munição (só nos que carregam explosivos — Bombardeiro).
  if (rec.held === "bomb" || special === "bazooka") drawBandolier(ctx);

  // ── Orelha (atrás da cabeça) ──
  rrPath(ctx, -14, -92, 12, 12, 5);
  ctx.fillStyle = fur.furDark;
  ctx.fill();
  ctx.fillStyle = shade(COLORS.muzzleWarm, -0.1);
  ctx.beginPath();
  ctx.ellipse(-8, -86, 3.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Cabeça (grande) com volume pintado ──
  const headGrad = ctx.createRadialGradient(-7, -82, 3, -1, -70, 36);
  headGrad.addColorStop(0, fur.furLight);
  headGrad.addColorStop(0.6, fur.fur);
  headGrad.addColorStop(1, fur.furDark);
  rrPath(ctx, -17, -88, 35, 38, 15);
  ctx.fillStyle = headGrad;
  ctx.fill();
  // luz de borda no topo
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.ellipse(-5, -83, 9, 4.5, -0.35, 0, Math.PI * 2);
  ctx.fill();
  // tufos de pelo na bochecha
  ctx.fillStyle = fur.furDark;
  for (const [tx, ty, tr] of [[-15, -57, 4], [-12, -52, 3.4], [16, -55, 3.2]] as const) {
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Focinho largo com volume ──
  const snoutGrad = ctx.createLinearGradient(0, -76, 0, -50);
  snoutGrad.addColorStop(0, shade(COLORS.muzzleWarm, 0.12));
  snoutGrad.addColorStop(1, shade(COLORS.muzzleWarm, -0.16));
  rrPath(ctx, 12, -74, 22, 22, 10);
  ctx.fillStyle = snoutGrad;
  ctx.fill();
  // nariz
  rrPath(ctx, 26, -69, 13, 11, 5);
  ctx.fillStyle = COLORS.nosePaws;
  ctx.fill();
  // narinas
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.ellipse(30, -64, 1.3, 2.1, 0.2, 0, Math.PI * 2);
  ctx.ellipse(35, -64, 1.3, 2.1, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // brilho úmido no nariz
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(29, -67, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Olho grande e expressivo ──
  const eyeGrad = ctx.createRadialGradient(9, -72, 0.5, 8, -69, 6.5);
  eyeGrad.addColorStop(0, "#4a3526");
  eyeGrad.addColorStop(1, "#140d08");
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.ellipse(8, -70, 5, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // catchlights
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(9.6, -72.4, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(6.4, -67.6, 1.1, 0, Math.PI * 2);
  ctx.fill();
  // Expressão neutra/amistosa (sem sobrancelha "brava" — fiel à base 360).

  // ── Acessório de cabeça por personagem ──
  drawHeadgear(ctx, rec.headgear, accent);

  // ── Braço da frente + patinha ──
  capsule(ctx, 8, -48, 20, -40, 7, fur.furLight);
  ctx.fillStyle = fur.furDark;
  ctx.beginPath();
  ctx.arc(21, -40, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Flash/brilho ao atacar ──
  if (p.muzzle > 0) {
    const tip = special ? gunTipX(special) : heldTipX(rec.held);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = heldFlash(rec.held, special);
    drawBurst(ctx, tip, -42, 11);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(tip, -42, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  step: number,
  color: string,
  airTuck = 0,
  crouchT = 0,
): void {
  // No ar, pernas recolhidas (footY sobe, footX volta para o centro do quadril).
  // Agachado, footY também sobe (pernas dobradas embaixo do corpo).
  const tuck = Math.max(airTuck, crouchT * 0.7);
  const footX = hipX + step * 11 * (1 - tuck);
  const lift = Math.max(0, step) * 7 * (1 - tuck);
  const footY = -3 - lift + tuck * 12;
  capsule(ctx, hipX, -22 + tuck * 6, footX, footY, 9, color);
  ctx.fillStyle = COLORS.nosePaws;
  ctx.beginPath();
  ctx.ellipse(footX, footY, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBandolier(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = COLORS.strap;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-13, -52);
  ctx.lineTo(13, -24);
  ctx.stroke();
  ctx.fillStyle = COLORS.ammo;
  for (let i = 0; i < 5; i++) {
    const f = i / 4;
    ctx.beginPath();
    ctx.arc(-13 + f * 26, -52 + f * 28, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── Acessórios de cabeça ── */

function drawHeadgear(ctx: CanvasRenderingContext2D, hg: Headgear, accent: string): void {
  switch (hg) {
    case "headband": {
      ctx.fillStyle = accent;
      rrPath(ctx, -18, -82, 34, 7, 3);
      ctx.fill();
      // pontas balançando atrás
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-17, -80);
      ctx.lineTo(-26, -74);
      ctx.moveTo(-17, -77);
      ctx.lineTo(-27, -69);
      ctx.stroke();
      break;
    }
    case "bandana": {
      ctx.fillStyle = accent;
      rrPath(ctx, -18, -84, 35, 9, 4);
      ctx.fill();
      break;
    }
    case "hood": {
      // capuz de arqueiro cobrindo a parte de trás/topo da cabeça
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-19, -52);
      ctx.quadraticCurveTo(-30, -86, -4, -94);
      ctx.quadraticCurveTo(12, -96, 14, -84);
      ctx.quadraticCurveTo(-6, -90, -8, -66);
      ctx.quadraticCurveTo(-9, -56, -19, -52);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade(accent, -0.2);
      ctx.beginPath();
      ctx.moveTo(-4, -94);
      ctx.quadraticCurveTo(16, -98, 15, -82);
      ctx.lineTo(8, -84);
      ctx.quadraticCurveTo(8, -92, -4, -94);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "knight": {
      // elmo metálico com pluma
      ctx.fillStyle = "#c7ccd6";
      rrPath(ctx, -19, -92, 37, 20, 9);
      ctx.fill();
      ctx.fillStyle = "#9aa1ad";
      rrPath(ctx, -19, -80, 37, 7, 3);
      ctx.fill();
      // viseira
      ctx.fillStyle = "#6f7682";
      rrPath(ctx, 2, -84, 16, 5, 2);
      ctx.fill();
      // pluma
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-2, -92);
      ctx.quadraticCurveTo(-2, -108, 8, -110);
      ctx.quadraticCurveTo(2, -100, 6, -92);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "goggles": {
      // óculos de aviador na testa
      ctx.fillStyle = "#5a4a32";
      rrPath(ctx, -18, -84, 34, 8, 3);
      ctx.fill();
      ctx.fillStyle = "#7fd0e0";
      ctx.beginPath();
      ctx.arc(-6, -80, 5, 0, Math.PI * 2);
      ctx.arc(8, -80, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3a2f20";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-6, -80, 5, 0, Math.PI * 2);
      ctx.arc(8, -80, 5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "leaves": {
      // coroa de folhas do druida/curandeiro
      ctx.fillStyle = accent;
      for (let i = 0; i < 6; i++) {
        const lx = -16 + i * 6;
        ctx.beginPath();
        ctx.ellipse(lx, -84, 3.5, 7, (i - 2.5) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "wizard": {
      // chapéu pontudo de mago
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-20, -84);
      ctx.lineTo(20, -84);
      ctx.lineTo(-2, -118);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade(accent, -0.25);
      rrPath(ctx, -22, -86, 44, 7, 3);
      ctx.fill();
      // estrela na ponta
      ctx.fillStyle = "#ffe06a";
      ctx.beginPath();
      ctx.arc(-2, -116, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

/* ── Armas-assinatura (não-armas de fogo) ── */

function drawHeld(ctx: CanvasRenderingContext2D, held: HeldWeapon, accent: string): void {
  switch (held) {
    case "spear":
    case "javelin": {
      const thin = held === "javelin";
      ctx.strokeStyle = "#8a5a2c";
      ctx.lineWidth = thin ? 3 : 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(2, -34);
      ctx.lineTo(46, -52);
      ctx.stroke();
      // ponta metálica
      ctx.fillStyle = "#d7dbe2";
      ctx.beginPath();
      ctx.moveTo(46, -52);
      ctx.lineTo(58, -55);
      ctx.lineTo(47, -45);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "bow": {
      // arco vertical + flecha apontada à direita
      ctx.strokeStyle = "#8a5a2c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(16, -44, 16, -Math.PI * 0.55, Math.PI * 0.55);
      ctx.stroke();
      ctx.strokeStyle = "#e8e2cf";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16 + 16 * Math.cos(-Math.PI * 0.55), -44 + 16 * Math.sin(-Math.PI * 0.55));
      ctx.lineTo(16 + 16 * Math.cos(Math.PI * 0.55), -44 + 16 * Math.sin(Math.PI * 0.55));
      ctx.stroke();
      ctx.strokeStyle = "#6a4a24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, -44);
      ctx.lineTo(40, -44);
      ctx.stroke();
      ctx.fillStyle = "#d7dbe2";
      ctx.beginPath();
      ctx.moveTo(40, -44);
      ctx.lineTo(48, -47);
      ctx.lineTo(40, -41);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "sword": {
      // espada apontada para cima/frente + guarda
      ctx.fillStyle = "#d7dbe2";
      rrPath(ctx, 18, -64, 5, 26, 2);
      ctx.fill();
      ctx.fillStyle = "#9aa1ad";
      ctx.beginPath();
      ctx.moveTo(18, -64);
      ctx.lineTo(23, -64);
      ctx.lineTo(20.5, -72);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      rrPath(ctx, 13, -42, 16, 5, 2);
      ctx.fill();
      ctx.fillStyle = "#6a4a24";
      rrPath(ctx, 19, -40, 4, 8, 2);
      ctx.fill();
      break;
    }
    case "bomb": {
      // bomba preta redonda na mão com pavio aceso
      ctx.fillStyle = "#2b2f36";
      ctx.beginPath();
      ctx.arc(24, -38, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(21, -41, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6a4a24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, -45);
      ctx.quadraticCurveTo(34, -50, 32, -54);
      ctx.stroke();
      ctx.fillStyle = "#ffb23a";
      ctx.beginPath();
      ctx.arc(32, -55, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "staff_heal":
    case "staff_magic": {
      const orb = held === "staff_heal" ? "#5fe07a" : "#b66bff";
      ctx.strokeStyle = "#7a5a32";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(14, -32);
      ctx.lineTo(26, -70);
      ctx.stroke();
      ctx.save();
      ctx.shadowColor = orb;
      ctx.shadowBlur = 10;
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(27, -72, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (held === "staff_heal") {
        ctx.fillStyle = "#fff";
        rrPath(ctx, 26, -75, 2, 7, 1);
        ctx.fill();
        rrPath(ctx, 23.5, -72.5, 7, 2, 1);
        ctx.fill();
      }
      break;
    }
  }
}

function heldTipX(held: HeldWeapon): number {
  switch (held) {
    case "spear":
    case "javelin":
      return 56;
    case "bow":
      return 48;
    case "sword":
      return 30;
    case "bomb":
      return 30;
    default:
      return 40;
  }
}

function heldFlash(held: HeldWeapon, special: "shotgun" | "bazooka" | null): string {
  if (special) return COLORS.muzzle;
  if (held === "staff_magic") return "#b66bff";
  if (held === "staff_heal") return "#5fe07a";
  return COLORS.muzzle;
}

/* ── Armas de fogo das caixas (Escopeta / Bazuca) ── */

function gunTipX(gun: "shotgun" | "bazooka"): number {
  return gun === "bazooka" ? 52 : 46;
}

function drawGun(ctx: CanvasRenderingContext2D, gun: "shotgun" | "bazooka"): void {
  if (gun === "shotgun") {
    ctx.fillStyle = COLORS.gunDark;
    rrPath(ctx, 4, -46, 18, 9, 3);
    ctx.fill();
    ctx.fillStyle = COLORS.gunMetal;
    rrPath(ctx, 20, -46, 26, 4, 2);
    ctx.fill();
    rrPath(ctx, 20, -41, 26, 4, 2);
    ctx.fill();
    return;
  }
  // bazuca
  ctx.fillStyle = COLORS.gunDark;
  rrPath(ctx, 0, -52, 44, 15, 7);
  ctx.fill();
  ctx.fillStyle = COLORS.gunMetal;
  rrPath(ctx, 6, -50, 8, 11, 3);
  ctx.fill();
  ctx.fillStyle = COLORS.rocketTip;
  ctx.beginPath();
  ctx.moveTo(44, -52);
  ctx.lineTo(54, -44.5);
  ctx.lineTo(44, -37);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.nosePaws;
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(-8, -56);
  ctx.lineTo(-8, -33);
  ctx.lineTo(0, -37);
  ctx.closePath();
  ctx.fill();
}

/** Clareia/escurece um hex (#rrggbb) por um fator -1..1. */
function shade(hex: string, f: number): string {
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
