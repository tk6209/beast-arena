import { GROUND_Y, JUMP_V, PLAYER_H, RUN_SPEED } from "./constants";
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

  // Agachar reduz a altura (desvia de tiros altos). Só no chão.
  const crouching = input.crouch && p.onGround;
  const targetH = crouching ? Math.round(PLAYER_H * 0.55) : PLAYER_H;
  if (p.h !== targetH) {
    const wasOnGround = p.onGround;
    p.h = targetH;
    if (wasOnGround) p.y = GROUND_Y - p.h;
  }

  // Pulo cancela o agachado.
  if (input.jumpQueued && !crouching && p.jumpsUsed < p.maxJumps) {
    p.vy = JUMP_V;
    p.onGround = false;
    p.jumpsUsed += 1;
    capiSfx.jump();
    hapticLight();
  }
  input.jumpQueued = false;

  applyGravity(p, dt);
  integrateY(p, dt);
  groundClamp(p);
  if (p.onGround) p.jumpsUsed = 0;

  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
  if (p.muzzle > 0) p.muzzle = Math.max(0, p.muzzle - dt);
  p.animPhase += dt;

  // Runner: o mundo só anda PARA FRENTE. Setas mudam o ritmo (segurar para
  // trás freia; segurar para frente acelera), mas nunca revertem o progresso.
  let speed = RUN_SPEED;
  if (input.moveX === 1) speed = RUN_SPEED * 1.6;
  else if (input.moveX === -1) speed = RUN_SPEED * 0.25; // freia, não recua
  if (crouching) speed *= 0.5;
  p.x += speed * dt;
}
