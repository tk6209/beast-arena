import type { WeaponStats } from "./weapons";
import capiviniSprite from "../assets/heroes/capivini.png";
import capininjaSprite from "../assets/heroes/capininja.png";
import capirocketSprite from "../assets/heroes/capirocket.png";
import capizozoSprite from "../assets/heroes/capizozo.png";

// Receita de acessórios usada APENAS no fallback procedural (quando o sprite
// real ainda não carregou). Os personagens em jogo usam a arte real (sprite).
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
  sprite: string; // arte real (PNG) — usada em jogo e na seleção
  // Visual de fallback (base canônica procedural).
  palette: { fur: string; furDark: string; furLight: string };
  headgear: Headgear;
  held: HeldWeapon;
  accentColor: string; // cor de roupa/realce (HUD/seleção)
  // Arma-assinatura (sempre ativa, salvo caixa especial por cima).
  weapon: WeaponStats;
  // Passivas.
  lives: number;
  jumps: number; // 2 = pulo duplo
  dodge: number; // 0..1 chance de ignorar um dano
  healEvery: number; // seg p/ recuperar 1 vida (0 = não cura)
}

// Paleta canônica padrão (capivara laranja) — fallback procedural.
const FUR = { fur: "#C97A3A", furDark: "#8E4F23", furLight: "#E3A267" };

/**
 * Roster CAPI WARS — os quatro heróis canônicos da folha "Capy-Heróis 360".
 * A arte real (sprite) é usada em jogo; cada herói tem arma-assinatura e
 * habilidade passiva próprias.
 */
export const CHARACTERS: CharacterConfig[] = [
  {
    id: "capivini",
    name: "Capivini",
    role: "Líder Estratégico",
    ability: "Líder durão: +1 vida e tiros perfurantes.",
    emoji: "🛡️",
    sprite: capiviniSprite,
    palette: FUR,
    headgear: "headband",
    held: "spear",
    accentColor: "#3f7bd6",
    weapon: { id: "rifle", name: "Rifle Tático", fireInterval: 0.26, damage: 2, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 980, pierce: 1 },
    lives: 4,
    jumps: 1,
    dodge: 0,
    healEvery: 0,
  },
  {
    id: "capininja",
    name: "Capininja",
    role: "Guerreiro Silencioso",
    ability: "Ágil: cadência altíssima, pulo duplo e esquiva.",
    emoji: "🥷",
    sprite: capininjaSprite,
    palette: FUR,
    headgear: "bandana",
    held: "sword",
    accentColor: "#3a4d8c",
    weapon: { id: "mg", name: "Shuriken", fireInterval: 0.14, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 1040, pierce: 0 },
    lives: 3,
    jumps: 2,
    dodge: 0.25,
    healEvery: 0,
  },
  {
    id: "capirocket",
    name: "Capirocket",
    role: "Especialista em Explosivos",
    ability: "Explosivos: cada tiro detona em área.",
    emoji: "🚀",
    sprite: capirocketSprite,
    palette: FUR,
    headgear: "goggles",
    held: "bomb",
    accentColor: "#c0622e",
    weapon: { id: "bazooka", name: "Bazuca", fireInterval: 0.62, damage: 4, pellets: 1, spread: 0, kind: "rocket", bulletSpeed: 620, pierce: 0 },
    lives: 3,
    jumps: 1,
    dodge: 0,
    healEvery: 0,
  },
  {
    id: "capizozo",
    name: "Capizozo",
    role: "Alívio Cômico",
    ability: "Caótico: dispara um leque de projéteis e regenera devagar.",
    emoji: "😜",
    sprite: capizozoSprite,
    palette: FUR,
    headgear: "headband",
    held: "staff_heal",
    accentColor: "#e0a02e",
    weapon: { id: "shotgun", name: "Estrelas", fireInterval: 0.4, damage: 1, pellets: 3, spread: 150, kind: "normal", bulletSpeed: 840, pierce: 0 },
    lives: 3,
    jumps: 1,
    dodge: 0,
    healEvery: 16,
  },
];

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

// Roster de chefes (CAPI WARS) — alternam por marco de onda.
export type BossKind = "chief" | "general" | "maga" | "pirate" | "dragon" | "emperor" | "hydro";

export interface BossDef {
  name: string;
  title: string;
  body: string;
  accent: string;
  kind: BossKind;
}

export const BOSSES: BossDef[] = [
  { name: "Chief Capivara", title: "Líder Tribal", body: "#8E5A2E", accent: "#d64a3a", kind: "chief" },
  { name: "General Capigrão", title: "Comandante de Guerra", body: "#9a7b3e", accent: "#caa24a", kind: "general" },
  { name: "Maga Capira", title: "Mestra das Sombras", body: "#4a3a6b", accent: "#a25cff", kind: "maga" },
  { name: "Capitão Corpivara", title: "Pirata dos Rios", body: "#7a3a3a", accent: "#e0563a", kind: "pirate" },
  { name: "Capi Dragão", title: "Fúria Incandescente", body: "#8a2f2f", accent: "#ff7a2a", kind: "dragon" },
  { name: "Imperador Capibaron", title: "Soberano do Reino", body: "#8a6a3a", accent: "#ffcf4a", kind: "emperor" },
  { name: "Hydro Capi", title: "Senhor das Águas", body: "#2f6a8a", accent: "#4ad6ff", kind: "hydro" },
];

export function bossForWave(wave: number): BossDef {
  const idx = Math.max(0, Math.floor(wave / 5) - 1) % BOSSES.length;
  return BOSSES[idx];
}
