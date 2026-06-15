import { MUZZLE_TIME, PLAYER_H, PLAYER_W, VIRT_W } from "./constants";
import { makeBullet } from "./entities";
import { activeWeapon } from "./weapons";
import { capiSfx } from "../vendor/sfx";
import type { GameState } from "./types";

/**
 * Tiro automático: a capivara dispara pra frente conforme a arma ATIVA (tier da
 * jornada ou arma especial da caixa). Suporta tiro espalhado (escopeta) e
 * foguete (bazuca). Consome munição da arma especial.
 */
export function updateBullets(state: GameState, dt: number): void {
  const p = state.player;
  state.fireCooldown -= dt;

  if (state.fireCooldown <= 0) {
    const w = activeWeapon(state);
    state.fireCooldown += w.fireInterval;

    const muzzleX = p.x + PLAYER_W + 6;
    const muzzleY = p.y + PLAYER_H * 0.5;
    const n = w.pellets;
    for (let i = 0; i < n; i++) {
      const vy = n > 1 ? (i / (n - 1) - 0.5) * 2 * w.spread : 0;
      state.bullets.push(
        makeBullet(muzzleX, muzzleY, {
          vx: w.bulletSpeed,
          vy,
          damage: w.damage,
          kind: w.kind,
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
    (b) => b.life > 0 && b.x < state.player.x + VIRT_W,
  );
}
