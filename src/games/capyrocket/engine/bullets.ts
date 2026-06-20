import { MUZZLE_TIME, PLAYER_H, PLAYER_W, VIRT_W } from "./constants";
import { makeBullet } from "./entities";
import { activeWeapon } from "./weapons";
import { capiSfx } from "../vendor/sfx";
import type { GameState, InputState } from "./types";

/**
 * Tiro automático: a capivara dispara pra frente conforme a arma ATIVA (tier da
 * jornada ou arma especial da caixa). Suporta tiro espalhado (escopeta) e
 * foguete (bazuca). Consome munição da arma especial.
 */
export function updateBullets(state: GameState, dt: number, input?: InputState): void {
  const p = state.player;
  state.fireCooldown -= dt;

  if (state.fireCooldown <= 0) {
    const w = activeWeapon(state);
    state.fireCooldown += w.fireInterval;

    // Direção da mira: setas mantidas; senão usa a direção em que o herói está virado.
    const aimX = input?.aimX ?? 0;
    const aimY = input?.aimY ?? 0;
    let dx = aimX;
    let dy = aimY;
    if (dx === 0 && dy === 0) {
      dx = p.facingX;
      dy = 0;
    }
    const mag = Math.hypot(dx, dy) || 1;
    const ndx = dx / mag;
    const ndy = dy / mag;
    const muzzleX = p.x + PLAYER_W / 2 + ndx * (PLAYER_W / 2 + 6);
    const muzzleY = p.y + PLAYER_H * 0.5 + ndy * (PLAYER_H * 0.4);
    const n = w.pellets;
    for (let i = 0; i < n; i++) {
      // Espalhamento perpendicular à direção da mira.
      const spread = n > 1 ? (i / (n - 1) - 0.5) * 2 * w.spread : 0;
      const vx = ndx * w.bulletSpeed + -ndy * spread;
      const vy = ndy * w.bulletSpeed + ndx * spread;
      state.bullets.push(
        makeBullet(muzzleX, muzzleY, {
          vx,
          vy,
          damage: w.damage,
          kind: w.kind,
          pierce: w.pierce,
          w: w.kind === "rocket" ? 26 : undefined,
          h: w.kind === "rocket" ? 12 : undefined,
        }),
      );
    }
    p.muzzle = MUZZLE_TIME;
    capiSfx.shoot();

    // Consome munição da arma especial.
    if (state.special) {
      state.special.ammo -= 1;
      if (state.special.ammo <= 0) state.special = null;
    }
  }

  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }

  state.bullets = state.bullets.filter(
    (b) =>
      b.life > 0 &&
      b.x < state.camX + VIRT_W + 200 &&
      b.x > state.camX - 200 &&
      b.y > -200 &&
      b.y < 900,
  );
}
