/* ─────────────────────────────────────────────
   EVOLUTION SYSTEM — Brawl Stars style
   Power Level 1 → 11 per monster
───────────────────────────────────────────── */

export const MAX_PL = 11;

/** Custos cumulativos por upgrade. Index = PL atual (1 → 10). PL 11 é o máximo. */
export const UPGRADE_COST: { shards: number; coins: number }[] = [
  { shards:  10, coins:   50 }, // 1→2
  { shards:  20, coins:  100 }, // 2→3
  { shards:  40, coins:  200 }, // 3→4
  { shards:  80, coins:  400 }, // 4→5
  { shards: 130, coins:  800 }, // 5→6
  { shards: 200, coins: 1500 }, // 6→7
  { shards: 300, coins: 2500 }, // 7→8
  { shards: 450, coins: 4000 }, // 8→9
  { shards: 650, coins: 6000 }, // 9→10
  { shards: 900, coins: 9000 }, // 10→11
];

export function getUpgradeCost(pl: number): { shards: number; coins: number } | null {
  if (pl < 1 || pl >= MAX_PL) return null;
  return UPGRADE_COST[pl - 1];
}

/** Multiplicadores aplicados em batalha. PL 1 = 1.0x, PL 11 ≈ +60% HP / +50% dano */
export function getStatMultipliers(pl: number): { hp: number; atk: number } {
  const p = Math.max(1, Math.min(MAX_PL, pl));
  return {
    hp:  1 + 0.06 * (p - 1),
    atk: 1 + 0.05 * (p - 1),
  };
}

export function scaleStats<T extends { hp: number; atk: number; maxHp?: number }>(base: T, pl: number): T {
  const m = getStatMultipliers(pl);
  return {
    ...base,
    hp:    Math.round(base.hp  * m.hp),
    atk:   Math.round(base.atk * m.atk),
    maxHp: Math.round((base.maxHp ?? base.hp) * m.hp),
  };
}

/* ── PERKS ──────────────────────────────────── */

export type PerkSlot = "gadget" | "star_power" | "hyper" | "gear";

export interface Perk {
  id: string;
  nome: string;
  desc: string;
  emoji: string;
}

export const PERK_UNLOCK_LEVELS: Record<PerkSlot, number> = {
  gadget:     5,
  star_power: 7,
  hyper:      9,
  gear:       11,
};

/** Perks genéricos disponíveis para todos os monstros (1ª iteração). */
export const PERKS: Record<PerkSlot, Perk[]> = {
  gadget: [
    { id: "g_recarga",  nome: "Recarga Rápida", desc: "+1 de energia inicial na batalha",        emoji: "⚡" },
    { id: "g_escudo",   nome: "Escudo Inicial", desc: "Começa com 10 de defesa ativa",            emoji: "🛡️" },
  ],
  star_power: [
    { id: "s_lifesteal", nome: "Vampirismo",    desc: "Cura 15% do dano causado",                 emoji: "🩸" },
    { id: "s_critico",   nome: "Dano Crítico",  desc: "+15% de dano em todos os ataques",          emoji: "💥" },
  ],
  hyper: [
    { id: "h_furia",     nome: "Fúria Bestial", desc: "Ao ficar com <30% HP, ataques causam +50% dano", emoji: "🔥" },
    { id: "h_imortal",   nome: "Imortal",       desc: "Sobrevive ao golpe fatal 1x por partida",  emoji: "✨" },
  ],
  gear: [
    { id: "ge_vigor",    nome: "Vigor",         desc: "+15 HP máximo",                            emoji: "❤️" },
    { id: "ge_garras",   nome: "Garras Afiadas",desc: "+5 de ataque base",                        emoji: "🗡️" },
    { id: "ge_velocidade", nome: "Velocidade", desc: "Compra +1 carta por turno",                 emoji: "💨" },
  ],
};

export function getPerk(slot: PerkSlot, id: string | null | undefined): Perk | null {
  if (!id) return null;
  return PERKS[slot].find(p => p.id === id) || null;
}

export interface UserMonster {
  monster_id: string;
  power_level: number;
  shards: number;
  selected_gadget: string | null;
  selected_star_power: string | null;
  selected_hyper: string | null;
  selected_gear: string | null;
}

export function canUpgrade(um: { power_level: number; shards: number }, coins: number): boolean {
  const cost = getUpgradeCost(um.power_level);
  if (!cost) return false;
  return um.shards >= cost.shards && coins >= cost.coins;
}

export function unlocksPerkAt(newPl: number): PerkSlot | null {
  for (const slot of Object.keys(PERK_UNLOCK_LEVELS) as PerkSlot[]) {
    if (PERK_UNLOCK_LEVELS[slot] === newPl) return slot;
  }
  return null;
}