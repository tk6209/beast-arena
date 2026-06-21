import type { GameState } from "./types";

/**
 * Offset da câmera no mundo. Avança em ritmo CONSTANTE (estilo Metal Slug):
 * o cenário sempre rola para a frente no mesmo passo, independentemente do
 * que o jogador faça. As setas só deslocam o herói DENTRO da tela.
 */
export function cameraX(state: GameState): number {
  return state.camX;
}

/** Converte uma coordenada-x do mundo para a tela, dado o offset da câmera. */
export function toScreenX(worldX: number, camX: number): number {
  return worldX - camX;
}
