import { GRAVITY, GROUND_Y, PLAYER_H } from "./constants";
import type { Player } from "./types";

/** Aplica gravidade à velocidade vertical. */
export function applyGravity(p: Player, dt: number): void {
  p.vy += GRAVITY * dt;
}

/** Integra a posição vertical. */
export function integrateY(p: Player, dt: number): void {
  p.y += p.vy * dt;
}

/** Prende o jogador ao chão; ao aterrissar zera vy e marca onGround. */
export function groundClamp(p: Player): void {
  const feetMax = GROUND_Y - PLAYER_H;
  if (p.y >= feetMax) {
    p.y = feetMax;
    p.vy = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }
}
