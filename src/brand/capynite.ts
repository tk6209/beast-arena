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
    id: "unknown-zone",
    name: "PRÓXIMO MUNDO",
    eyebrow: "WORLD 03 · EM DESCOBERTA",
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
