import heroUrl from "@/assets/monsters/capirocket.png";

export interface GameAssets {
  hero: HTMLImageElement;
}

/**
 * Pré-carrega os sprites do jogo. Resolve mesmo em erro de carregamento
 * (o render tem fallback de retângulo), pra nunca travar o boot.
 */
export function loadAssets(): Promise<GameAssets> {
  return new Promise((resolve) => {
    const hero = new Image();
    hero.src = heroUrl;
    if (hero.complete) {
      resolve({ hero });
      return;
    }
    hero.onload = () => resolve({ hero });
    hero.onerror = () => resolve({ hero });
  });
}
