import type { CharacterConfig, Headgear, HeldWeapon } from "./characters";
import { COLORS, PLAYER_SCREEN_X } from "./constants";
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
  const onGround = p.onGround;
  const fur = rec.palette;
  const accent = rec.accentColor;

  // Sombra.
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, feetY + 2, p.w * 0.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, feetY);
  const bob = onGround ? -Math.abs(Math.sin(t * 16)) * 3 : 0;
  ctx.translate(0, bob);

  const step = onGround ? Math.sin(t * 16) : -0.7;

  // ── Pernas (curtas, paleta canônica) ──
  drawLeg(ctx, -5, step, fur.furDark);
  drawLeg(ctx, 7, -step, fur.fur);

  // ── Tronco "barril" ──
  const g = ctx.createLinearGradient(0, -52, 0, -20);
  g.addColorStop(0, fur.furLight);
  g.addColorStop(1, fur.fur);
  rrPath(ctx, -16, -52, 32, 34, 13);
  ctx.fillStyle = g;
  ctx.fill();
  // barriga clara
  rrPath(ctx, -9, -42, 19, 22, 9);
  ctx.fillStyle = fur.furLight;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;

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

  // ── Cabeça (grande, base canônica) ──
  rrPath(ctx, -17, -88, 35, 38, 15);
  ctx.fillStyle = fur.fur;
  ctx.fill();
  // orelha
  ctx.fillStyle = fur.furDark;
  ctx.beginPath();
  ctx.ellipse(-10, -86, 5.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // focinho largo
  rrPath(ctx, 12, -74, 22, 22, 10);
  ctx.fillStyle = COLORS.muzzleWarm;
  ctx.fill();
  // nariz
  rrPath(ctx, 27, -68, 11, 10, 4);
  ctx.fillStyle = COLORS.nosePaws;
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(30, -66, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // olho
  ctx.fillStyle = COLORS.nosePaws;
  ctx.beginPath();
  ctx.ellipse(8, -70, 4.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(9.5, -72, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // sobrancelha determinada
  ctx.strokeStyle = COLORS.nosePaws;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(2, -78);
  ctx.lineTo(13, -75);
  ctx.stroke();

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

function drawLeg(ctx: CanvasRenderingContext2D, hipX: number, step: number, color: string): void {
  const footX = hipX + step * 11;
  const lift = Math.max(0, step) * 7;
  capsule(ctx, hipX, -22, footX, -3 - lift, 9, color);
  ctx.fillStyle = COLORS.nosePaws;
  ctx.beginPath();
  ctx.ellipse(footX, -3 - lift, 6, 4, 0, 0, Math.PI * 2);
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
