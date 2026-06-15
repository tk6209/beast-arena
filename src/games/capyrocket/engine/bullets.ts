import { FIRE_INTERVAL, PLAYER_H, PLAYER_W, VIRT_W } from "./constants";
import { makeBullet } from "./entities";
import { capiSfx } from "../vendor/sfx";
import type { GameState } from "./types";

/**
 * Tiro automático: a capivara dispara pra frente num cooldown fixo (sabor
 * run-and-gun do Metal Slug, sem input do jogador). Atualiza e descarta balas.
 */
export function updateBullets(state: GameState, dt: number): void {
  state.fireCooldown -= dt;
  if (state.fireCooldown <= 0) {
    state.fireCooldown += FIRE_INTERVAL;
    const p = state.player;
    state.bullets.push(makeBullet(p.x + PLAYER_W, p.y + PLAYER_H * 0.42));
    capiSfx.shoot();
  }

  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.life -= dt;
  }

  // Remove balas mortas ou que já saíram da tela à frente.
  state.bullets = state.bullets.filter(
    (b) => b.life > 0 && b.x < state.player.x + VIRT_W,
  );
}
