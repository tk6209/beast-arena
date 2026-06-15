import {
  BOSS_FIRE_INTERVAL,
  BOSS_HOLD_AHEAD,
  EBULLET_Y,
  GROUND_Y,
} from "./constants";
import { makeEnemyBullet } from "./entities";
import type { GameState } from "./types";

/**
 * Atualiza o chefe: entra pela direita, ancora numa distância fixa à frente do
 * jogador (acompanhando o scroll) e dispara rajadas que precisam ser puladas.
 * Dispara em pares (alto + baixo) — o jogador pula o baixo e o alto passa por cima.
 */
export function updateBoss(state: GameState, dt: number): void {
  const boss = state.boss;
  if (!boss) return;

  boss.phase += dt;

  // Posição-alvo: ancorada à frente do jogador (acompanha a câmera).
  const targetX = state.player.x + BOSS_HOLD_AHEAD;
  if (boss.entering) {
    boss.x += (targetX - boss.x) * Math.min(1, dt * 1.8);
    if (Math.abs(boss.x - targetX) < 6) boss.entering = false;
  } else {
    // Mantém a âncora e adiciona um leve flutuar vertical.
    boss.x = targetX;
  }
  boss.y = GROUND_Y - boss.h + Math.sin(boss.phase * 1.6) * 6;

  if (boss.entering) return;

  boss.fireCooldown -= dt;
  if (boss.fireCooldown <= 0) {
    boss.fireCooldown = BOSS_FIRE_INTERVAL;
    const muzzleX = boss.x - 6;
    // Projétil na altura do tronco (pular pra desviar).
    state.enemyBullets.push(makeEnemyBullet(muzzleX, EBULLET_Y));
    // E um segundo um pouco mais alto, criando uma janela mais apertada.
    state.enemyBullets.push(makeEnemyBullet(muzzleX, EBULLET_Y - 34));
  }
}
