import { PLAYER_SCREEN_X } from "./constants";
import type { GameState } from "./types";

/**
 * Offset da câmera no mundo. O jogador é mantido próximo de PLAYER_SCREEN_X
 * na tela, com um leve look-ahead quando está acelerando (sensação de runner
 * ganhando velocidade). Nunca recua — o cenário só progride para a frente.
 */
export function cameraX(state: GameState): number {
  return state.player.x - PLAYER_SCREEN_X;
}

/** Converte uma coordenada-x do mundo para a tela, dado o offset da câmera. */
export function toScreenX(worldX: number, camX: number): number {
  return worldX - camX;
}
