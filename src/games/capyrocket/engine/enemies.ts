import {
  EBULLET_Y,
  SHOOTER_FIRE_INTERVAL,
  TANK_FIRE_INTERVAL,
  VIRT_W,
} from "./constants";
import { makeEnemyBullet } from "./entities";
import type { GameState } from "./types";

/**
 * Atualiza inimigos: avançam em direção ao jogador (vx negativo). Atiradores e
 * tanques disparam projéteis na altura do tronco quando estão na tela à frente
 * do jogador — o jogador precisa PULAR pra desviar. Descarta os mortos / muito
 * atrasados.
 */
export function updateEnemies(state: GameState, dt: number): void {
  const onScreenLimit = state.camX + VIRT_W * 0.95;
  for (const e of state.enemies) {
    e.x += e.vx * dt;
    e.legPhase += dt * 10;

    if (e.kind === "shooter" || e.kind === "tank") {
      e.fireCooldown -= dt;
      const ahead = e.x > state.player.x + 80 && e.x < onScreenLimit;
      if (e.fireCooldown <= 0 && ahead) {
        e.fireCooldown = e.kind === "tank" ? TANK_FIRE_INTERVAL : SHOOTER_FIRE_INTERVAL;
        const muzzleX = e.x - 6;
        state.enemyBullets.push(makeEnemyBullet(muzzleX, EBULLET_Y));
      }
    }
  }
  state.enemies = state.enemies.filter(
    (e) => !e.dead && e.x > state.camX - 260,
  );
}

/** Move e descarta projéteis inimigos. */
export function updateEnemyBullets(state: GameState, dt: number): void {
  for (const b of state.enemyBullets) {
    b.x += b.vx * dt;
    b.life -= dt;
  }
  state.enemyBullets = state.enemyBullets.filter(
    (b) => b.life > 0 && b.x > state.camX - 200 && b.x < state.camX + VIRT_W + 80,
  );
}

/** Descarta obstáculos de chão que já ficaram para trás. */
export function updateHazards(state: GameState): void {
  state.hazards = state.hazards.filter((h) => h.x > state.camX - 200);
}
