/**
 * Carregador de sprites dos heróis (arte real da folha CAPI WARS).
 * Carrega sob demanda e devolve a imagem só quando pronta — o desenho cai no
 * fallback procedural nos poucos frames até a imagem estar disponível.
 */
const cache = new Map<string, HTMLImageElement>();

export function getHeroImage(src: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null; // ambiente sem DOM (testes headless)
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = src;
    cache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Pré-carrega os sprites informados (ex.: ao montar o jogo). */
export function preloadHeroes(srcs: string[]): void {
  for (const s of srcs) getHeroImage(s);
}
