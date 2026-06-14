import type { GameState } from "./types";

/**
 * Atualiza inimigos: avançam em direção ao jogador (vx negativo) e são
 * descartados quando morrem ou ficam muito para trás.
 */
export function updateEnemies(state: GameState, dt: number): void {
  for (const e of state.enemies) {
    e.x += e.vx * dt;
  }
  state.enemies = state.enemies.filter(
    (e) => !e.dead && e.x > state.player.x - 240,
  );
}
