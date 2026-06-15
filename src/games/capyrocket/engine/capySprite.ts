import { COLORS, PLAYER_SCREEN_X } from "./constants";
import { capsule, drawBurst, rrPath } from "./primitives";
import type { Player } from "./types";
import type { WeaponId } from "./weapons";

/**
 * CapiRocket desenhado conforme o Character OS canônico (capy_base_360.json):
 * base capivara (cabeça grande, focinho largo, membros curtos, paleta oficial)
 * + acessórios do CapiRocket (colete tático + bandoleira de munição) + a arma
 * ATIVA. Virado para a direita (sentido da corrida e dos tiros).
 *
 * Estrutura modular (base → acessórios → arma) honra a regra do Character OS:
 * personagens são composições de uma base compartilhada, não meshes isolados.
 */
export function drawCapiRocket(ctx: CanvasRenderingContext2D, p: Player, weapon: WeaponId): void {
  if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) return;

  const cx = PLAYER_SCREEN_X + p.w / 2;
  const feetY = p.y + p.h;
  const t = p.animPhase;
  const onGround = p.onGround;

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
  drawLeg(ctx, -5, step, COLORS.furDark);
  drawLeg(ctx, 7, -step, COLORS.fur);

  // ── Tronco "barril" ──
  const g = ctx.createLinearGradient(0, -52, 0, -20);
  g.addColorStop(0, COLORS.furLight);
  g.addColorStop(1, COLORS.fur);
  rrPath(ctx, -16, -52, 32, 34, 13);
  ctx.fillStyle = g;
  ctx.fill();
  // barriga clara
  rrPath(ctx, -9, -42, 19, 22, 9);
  ctx.fillStyle = COLORS.furLight;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Acessório: colete tático ──
  rrPath(ctx, -16, -52, 32, 16, 11);
  ctx.fillStyle = COLORS.vest;
  ctx.fill();
  rrPath(ctx, -16, -52, 32, 5, 4);
  ctx.fillStyle = COLORS.vestDark;
  ctx.fill();

  // ── Braço de trás (segura a arma) ──
  capsule(ctx, 2, -46, 16, -38, 7, COLORS.furDark);

  // ── Arma ativa ──
  drawWeapon(ctx, weapon);

  // ── Acessório: bandoleira de munição (por cima da arma/tronco) ──
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

  // ── Cabeça (grande, base canônica) ──
  rrPath(ctx, -17, -88, 35, 38, 15);
  ctx.fillStyle = COLORS.fur;
  ctx.fill();
  // orelha (disco pequeno, alto)
  ctx.fillStyle = COLORS.furDark;
  ctx.beginPath();
  ctx.ellipse(-10, -86, 5.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // focinho largo e rombudo
  rrPath(ctx, 12, -74, 22, 22, 10);
  ctx.fillStyle = COLORS.muzzleWarm;
  ctx.fill();
  // nariz (trapézio arredondado, molhado)
  rrPath(ctx, 27, -68, 11, 10, 4);
  ctx.fillStyle = COLORS.nosePaws;
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(30, -66, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // olho (oval preto glossy + brilho)
  ctx.fillStyle = COLORS.nosePaws;
  ctx.beginPath();
  ctx.ellipse(8, -70, 4.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(9.5, -72, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // sobrancelha "determinada"
  ctx.strokeStyle = COLORS.nosePaws;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(2, -78);
  ctx.lineTo(13, -75);
  ctx.stroke();

  // ── Braço da frente + patinha no gatilho ──
  capsule(ctx, 8, -48, 20, -40, 7, COLORS.furLight);
  ctx.fillStyle = COLORS.furDark;
  ctx.beginPath();
  ctx.arc(21, -40, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Flash do cano ──
  if (p.muzzle > 0) {
    const tip = weaponTipX(weapon);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = COLORS.muzzle;
    drawBurst(ctx, tip, -42, 12);
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
  // patinha arredondada
  ctx.fillStyle = COLORS.nosePaws;
  ctx.beginPath();
  ctx.ellipse(footX, -3 - lift, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function weaponTipX(weapon: WeaponId): number {
  switch (weapon) {
    case "bazooka":
      return 52;
    case "rifle":
      return 50;
    case "shotgun":
      return 46;
    case "mg":
      return 44;
    default:
      return 38;
  }
}

function drawWeapon(ctx: CanvasRenderingContext2D, weapon: WeaponId): void {
  switch (weapon) {
    case "pistol":
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, 16, -45, 16, 7, 2);
      ctx.fill();
      rrPath(ctx, 18, -40, 6, 8, 2);
      ctx.fill();
      break;
    case "mg":
      ctx.fillStyle = COLORS.gunMetal;
      rrPath(ctx, 4, -47, 30, 8, 2);
      ctx.fill();
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, 30, -45, 14, 4, 2);
      ctx.fill();
      rrPath(ctx, 14, -40, 7, 11, 2);
      ctx.fill();
      break;
    case "rifle":
      ctx.fillStyle = COLORS.gunMetal;
      rrPath(ctx, 2, -47, 34, 8, 2);
      ctx.fill();
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, 34, -45, 16, 4, 2);
      ctx.fill();
      // mira
      rrPath(ctx, 16, -51, 8, 4, 1);
      ctx.fill();
      break;
    case "shotgun":
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, 4, -46, 18, 9, 3);
      ctx.fill();
      ctx.fillStyle = COLORS.gunMetal;
      rrPath(ctx, 20, -46, 26, 4, 2);
      ctx.fill();
      rrPath(ctx, 20, -41, 26, 4, 2);
      ctx.fill();
      break;
    case "bazooka": {
      // tubo grosso apontado pra direita, na altura do ombro
      ctx.fillStyle = COLORS.gunDark;
      rrPath(ctx, 0, -52, 44, 15, 7);
      ctx.fill();
      ctx.fillStyle = COLORS.gunMetal;
      rrPath(ctx, 6, -50, 8, 11, 3);
      ctx.fill();
      // ponta vermelha do foguete
      ctx.fillStyle = COLORS.rocketTip;
      ctx.beginPath();
      ctx.moveTo(44, -52);
      ctx.lineTo(54, -44.5);
      ctx.lineTo(44, -37);
      ctx.closePath();
      ctx.fill();
      // bocal traseiro
      ctx.fillStyle = COLORS.nosePaws;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(-8, -56);
      ctx.lineTo(-8, -33);
      ctx.lineTo(0, -37);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}
