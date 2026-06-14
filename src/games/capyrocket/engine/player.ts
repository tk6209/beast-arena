import { JUMP_V, RUN_SPEED } from "./constants";
import { applyGravity, groundClamp, integrateY } from "./physics";
import { hapticLight } from "../vendor/haptic";
import { capiSfx } from "../vendor/sfx";
import type { GameState, InputState } from "./types";

/**
 * Atualiza o jogador: corrida automática (avanço no mundo), pulo de toque único
 * (só quando no chão) e gravidade. O input só carrega `jumpQueued`.
 */
export function updatePlayer(state: GameState, dt: number, input: InputState): void {
  const p = state.player;

  if (input.jumpQueued && p.onGround) {
    p.vy = JUMP_V;
    p.onGround = false;
    capiSfx.jump();
    hapticLight();
  }
  input.jumpQueued = false;

  applyGravity(p, dt);
  integrateY(p, dt);
  groundClamp(p);

  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
  p.animPhase += dt;

  // Corrida automática: avança o "mundo".
  p.x += RUN_SPEED * dt;
}
