export type CapyniteWorldStatus = "live" | "coming-soon";
export type CapyniteWorldRuntime = "spa" | "standalone" | "locked";

export interface CapyniteWorld {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  href: string;
  status: CapyniteWorldStatus;
  runtime: CapyniteWorldRuntime;
  accent: string;
  secondary: string;
  badge: string;
  feature: string;
}

export const CAPYNITE_BRAND = {
  name: "CAPYNITE",
  edition: "JOSHUA EDITION",
  creatorLine: "Um universo de jogos criado por Joshua",
  tagline: "Um universo. Muitos jogos. Aventuras sem fim.",
  city: "CapyCity",
} as const;

export const CAPYNITE_STORAGE = {
  lastWorld: "capynite_last_world",
  beastGuestWins: "beast_guest_wins",
  beastPlayerName: "beast_arena_nome",
  capyHighscore: "capy_highscore",
  rushHighscore: "capy_rush_highscore",
  rushHero: "capy_rush_hero",
} as const;

export const CAPYNITE_WORLDS: readonly CapyniteWorld[] = [
  {
    id: "beast-arena",
    name: "BEAST ARENA",
    eyebrow: "WORLD 01 · CARD BATTLE",
    description: "Monte seu deck, escolha sua fera e domine a arena em batalhas rápidas e estratégicas.",
    href: "/beast-arena",
    status: "live",
    runtime: "spa",
    accent: "#b794ff",
    secondary: "#38e1ff",
    badge: "LIVE",
    feature: "Decks · Evolução · Arena",
  },
  {
    id: "capi-wars",
    name: "CAPI WARS",
    eyebrow: "WORLD 02 · RUN & GUN",
    description: "Atravesse CapyCity com o esquadrão capivara, derrote os chefes e salve a cidade.",
    href: "/capyrocket.html",
    status: "live",
    runtime: "standalone",
    accent: "#ffcf4a",
    secondary: "#ff7a45",
    badge: "LIVE",
    feature: "5 fases · 4 heróis · Boss fights",
  },
  {
    id: "capi-rush",
    name: "CAPI RUSH",
    eyebrow: "WORLD 03 · ENDLESS RUN",
    description: "Corra sem parar por CapyCity: troque de pista, pule barreiras, deslize sob as barras e desvie dos trens.",
    href: "/capi-rush",
    status: "live",
    runtime: "spa",
    accent: "#38e1ff",
    secondary: "#b794ff",
    badge: "NEW",
    feature: "3 pistas · Moedas · Velocidade infinita",
  },
  {
    id: "capi-rush-3d",
    name: "CAPI RUSH 3D",
    eyebrow: "NOVO · EM 3D",
    description: "A corrida das capivaras agora em 3D de verdade: câmera atrás do herói, trens, mortal no pulo duplo e cambalhota.",
    href: "/capi-rush-3d",
    status: "live",
    runtime: "spa",
    accent: "#ffcf4a",
    secondary: "#38e1ff",
    badge: "3D",
    feature: "5 capivaras 3D · Trens · Poderes",
  },
  {
    id: "unknown-zone",
    name: "PRÓXIMO MUNDO",
    eyebrow: "WORLD 04 · EM DESCOBERTA",
    description: "Uma nova região do Capiverso está sendo construída. Pistas vão surgir dentro dos jogos.",
    href: "#",
    status: "coming-soon",
    runtime: "locked",
    accent: "#22e3a0",
    secondary: "#38e1ff",
    badge: "LOCKED",
    feature: "Segredos · Novos heróis · Nova aventura",
  },
] as const;

export function getCapyniteWorld(id: string): CapyniteWorld | undefined {
  return CAPYNITE_WORLDS.find((world) => world.id === id);
}

export function getPlayableWorlds(): CapyniteWorld[] {
  return CAPYNITE_WORLDS.filter((world) => world.status === "live");
}
