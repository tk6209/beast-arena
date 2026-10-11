/**
 * Heróis jogáveis do Capi Rush. Os sprites (costas para a corrida, retrato para
 * menus) vêm das folhas 360° do universo Capynite: nada aqui afeta a simulação.
 */
import capiviniBack from "@/assets/capirush/capivini_back.webp";
import capiviniPortrait from "@/assets/capirush/capivini_portrait.webp";
import capininjaBack from "@/assets/capirush/capininja_back.webp";
import capininjaPortrait from "@/assets/capirush/capininja_portrait.webp";
import capirocketBack from "@/assets/capirush/capirocket_back.webp";
import capirocketPortrait from "@/assets/capirush/capirocket_portrait.webp";
import capizozoBack from "@/assets/capirush/capizozo_back.webp";
import capizozoPortrait from "@/assets/capirush/capizozo_portrait.webp";
import voxcapyBack from "@/assets/capirush/voxcapy_back.webp";
import voxcapyFront from "@/assets/capirush/voxcapy_front.webp";

export type HeroId = "capininja" | "capivini" | "capirocket" | "capizozo" | "voxcapy";

export interface Hero {
  id: HeroId;
  name: string;
  tagline: string;
  back: string;
  portrait: string;
  /** Cor de brilho (rim light, aura, partículas). */
  accent: string;
  /** Altura do herói em "unidades" do renderer (1 unidade ≈ 1 m). */
  height: number;
  /** Solta chama de foguete no pulo. */
  jet?: boolean;
}

export const HEROES: readonly Hero[] = [
  { id: "capininja", name: "CAPININJA", tagline: "O guerreiro silencioso", back: capininjaBack, portrait: capininjaPortrait, accent: "#7aa8ff", height: 2.05 },
  { id: "capivini", name: "CAPIVINI", tagline: "O líder estratégico", back: capiviniBack, portrait: capiviniPortrait, accent: "#38e1ff", height: 2.05 },
  { id: "capirocket", name: "CAPIROCKET", tagline: "O especialista em explosivos", back: capirocketBack, portrait: capirocketPortrait, accent: "#ff7a45", height: 2.05, jet: true },
  { id: "capizozo", name: "CAPIZOZO", tagline: "O alívio cômico", back: capizozoBack, portrait: capizozoPortrait, accent: "#ffcf4a", height: 1.85 },
  { id: "voxcapy", name: "CAPI CACHECOL", tagline: "O explorador de blocos", back: voxcapyBack, portrait: voxcapyFront, accent: "#ff5a3c", height: 2.3 },
] as const;

export const DEFAULT_HERO: HeroId = "capininja";

export function getHero(id: string | null | undefined): Hero {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}

const cache = new Map<string, HTMLImageElement>();

/** Imagem já carregada (ou null enquanto carrega); dispara o carregamento na 1ª chamada. */
export function heroImage(src: string): HTMLImageElement | null {
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = src;
    cache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export function preloadHeroes(): void {
  for (const h of HEROES) heroImage(h.back);
}
