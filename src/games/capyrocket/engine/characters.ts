import type { WeaponStats } from "./weapons";

// Receita de acessórios do sprite (composição modular sobre a base canônica).
export type Headgear =
  | "headband"
  | "hood"
  | "knight"
  | "goggles"
  | "leaves"
  | "wizard"
  | "bandana";

export type HeldWeapon = "spear" | "bow" | "javelin" | "sword" | "bomb" | "staff_heal" | "staff_magic";

export interface CharacterConfig {
  id: string;
  name: string;
  role: string; // descrição curta (papel)
  ability: string; // texto da habilidade para a tela de seleção
  emoji: string;
  // Visual (sobre a base canônica capivara).
  palette: { fur: string; furDark: string; furLight: string };
  headgear: Headgear;
  held: HeldWeapon;
  accentColor: string; // cor de roupa/realce
  // Arma-assinatura (sempre ativa, salvo caixa especial por cima).
  weapon: WeaponStats;
  // Passivas.
  lives: number;
  jumps: number; // 2 = pulo duplo
  dodge: number; // 0..1 chance de ignorar um dano
  healEvery: number; // seg p/ recuperar 1 vida (0 = não cura)
}

// Paleta canônica padrão (capivara laranja).
const FUR = { fur: "#C97A3A", furDark: "#8E4F23", furLight: "#E3A267" };

export const CHARACTERS: CharacterConfig[] = [
  {
    id: "peao",
    name: "Capi Peão",
    role: "Infantaria Básica",
    ability: "Equilibrado: lança rápida e confiável.",
    emoji: "🗡️",
    palette: FUR,
    headgear: "headband",
    held: "spear",
    accentColor: "#3f7bd6",
    weapon: { id: "rifle", name: "Lança", fireInterval: 0.3, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 900, pierce: 0 },
    lives: 3,
    jumps: 1,
    dodge: 0,
    healEvery: 0,
  },
  {
    id: "arqueiro",
    name: "Capi Arqueiro",
    role: "Ataque à Distância",
    ability: "Cadência altíssima: chuva de flechas.",
    emoji: "🏹",
    palette: FUR,
    headgear: "hood",
    held: "bow",
    accentColor: "#2f7bd6",
    weapon: { id: "mg", name: "Arco", fireInterval: 0.16, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 1000, pierce: 0 },
    lives: 3,
    jumps: 1,
    dodge: 0,
    healEvery: 0,
  },
  {
    id: "lancador",
    name: "Capi Lançador",
    role: "Dano à Distância",
    ability: "Lanças perfurantes: atravessam vários inimigos.",
    emoji: "🔱",
    palette: FUR,
    headgear: "headband",
    held: "javelin",
    accentColor: "#5a93e0",
    weapon: { id: "rifle", name: "Lança Perfurante", fireInterval: 0.4, damage: 2, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 1020, pierce: 3 },
    lives: 3,
    jumps: 1,
    dodge: 0,
    healEvery: 0,
  },
  {
    id: "cavaleiro",
    name: "Capi Cavaleiro",
    role: "Tanque / Corpo a Corpo",
    ability: "Blindado: 4 vidas e golpes fortes de curto alcance.",
    emoji: "🛡️",
    palette: FUR,
    headgear: "knight",
    held: "sword",
    accentColor: "#c9ccd6",
    weapon: { id: "rifle", name: "Espada", fireInterval: 0.28, damage: 3, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 760, pierce: 1 },
    lives: 4,
    jumps: 1,
    dodge: 0,
    healEvery: 0,
  },
  {
    id: "bombardeiro",
    name: "Capi Bombardeiro",
    role: "Dano em Área",
    ability: "Explosivos: cada tiro detona em área.",
    emoji: "💣",
    palette: FUR,
    headgear: "goggles",
    held: "bomb",
    accentColor: "#7a5a2e",
    weapon: { id: "bazooka", name: "Bombas", fireInterval: 0.6, damage: 4, pellets: 1, spread: 0, kind: "rocket", bulletSpeed: 620, pierce: 0 },
    lives: 3,
    jumps: 1,
    dodge: 0,
    healEvery: 0,
  },
  {
    id: "curandeiro",
    name: "Capi Curandeiro",
    role: "Suporte / Cura",
    ability: "Regeneração: recupera 1 vida a cada 12s.",
    emoji: "✚",
    palette: FUR,
    headgear: "leaves",
    held: "staff_heal",
    accentColor: "#4faf5a",
    weapon: { id: "mg", name: "Cajado", fireInterval: 0.24, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 880, pierce: 0 },
    lives: 3,
    jumps: 1,
    dodge: 0,
    healEvery: 12,
  },
  {
    id: "magico",
    name: "Capi Mágico",
    role: "Dano Mágico",
    ability: "Magia perfurante de alto dano + esquiva 20%.",
    emoji: "✦",
    palette: FUR,
    headgear: "wizard",
    held: "staff_magic",
    accentColor: "#7c5cd0",
    weapon: { id: "rifle", name: "Magia", fireInterval: 0.42, damage: 3, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 980, pierce: 2 },
    lives: 3,
    jumps: 1,
    dodge: 0.2,
    healEvery: 0,
  },
];

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

// Roster de chefes (CAPI WARS) — alternam por marco de onda.
export interface BossDef {
  name: string;
  title: string;
  body: string;
  accent: string;
}

export const BOSSES: BossDef[] = [
  { name: "Chief Capivara", title: "Líder Tribal", body: "#8E5A2E", accent: "#d64a3a" },
  { name: "General Capigrão", title: "Comandante de Guerra", body: "#9a7b3e", accent: "#caa24a" },
  { name: "Maga Capira", title: "Mestra das Sombras", body: "#4a3a6b", accent: "#a25cff" },
  { name: "Capitão Corpivara", title: "Pirata dos Rios", body: "#7a3a3a", accent: "#e0563a" },
  { name: "Capi Dragão", title: "Fúria Incandescente", body: "#8a2f2f", accent: "#ff7a2a" },
  { name: "Imperador Capibaron", title: "Soberano do Reino", body: "#8a6a3a", accent: "#ffcf4a" },
  { name: "Hydro Capi", title: "Senhor das Águas", body: "#2f6a8a", accent: "#4ad6ff" },
];

export function bossForWave(wave: number): BossDef {
  const idx = Math.max(0, Math.floor(wave / 5) - 1) % BOSSES.length;
  return BOSSES[idx];
}
