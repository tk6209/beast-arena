import { PLAYER_SCREEN_X } from "./constants";
import type { GameState } from "./types";

/** Offset da câmera no mundo (o jogador fica fixo em PLAYER_SCREEN_X na tela). */
export function cameraX(state: GameState): number {
  return state.player.x - PLAYER_SCREEN_X;
}

/** Converte uma coordenada-x do mundo para a tela, dado o offset da câmera. */
export function toScreenX(worldX: number, camX: number): number {
  return worldX - camX;
}
