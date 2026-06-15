import { WEAPON_TIER_SCORE } from "./constants";
import type { GameState } from "./types";

export type WeaponId = "pistol" | "mg" | "rifle" | "shotgun" | "bazooka";

export interface WeaponStats {
  id: WeaponId;
  name: string;
  fireInterval: number; // segundos entre disparos
  damage: number;
  pellets: number; // > 1 = tiro espalhado
  spread: number; // dispersão vertical (px/s) dos projéteis
  kind: "normal" | "rocket";
  bulletSpeed: number;
}

export const WEAPONS: Record<WeaponId, WeaponStats> = {
  pistol: { id: "pistol", name: "Pistola", fireInterval: 0.34, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 820 },
  mg: { id: "mg", name: "Metralhadora", fireInterval: 0.16, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 920 },
  rifle: { id: "rifle", name: "Rifle Pesado", fireInterval: 0.15, damage: 2, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 1000 },
  shotgun: { id: "shotgun", name: "Escopeta", fireInterval: 0.44, damage: 1, pellets: 3, spread: 150, kind: "normal", bulletSpeed: 760 },
  bazooka: { id: "bazooka", name: "Bazuca", fireInterval: 0.72, damage: 6, pellets: 1, spread: 0, kind: "rocket", bulletSpeed: 560 },
};

// Tier permanente da jornada (sobe com a pontuação, nunca cai durante a run).
const BASE_TIERS: WeaponId[] = ["pistol", "mg", "rifle"];

// Armas especiais que vêm em caixas (temporárias, com munição).
export const CRATE_WEAPONS: { id: WeaponId; ammo: number }[] = [
  { id: "shotgun", ammo: 26 },
  { id: "bazooka", ammo: 9 },
];

export function tierForScore(score: number): number {
  let tier = 0;
  for (let i = 0; i < WEAPON_TIER_SCORE.length; i++) {
    if (score >= WEAPON_TIER_SCORE[i]) tier = i;
  }
  return tier;
}

export function baseWeaponForScore(score: number): WeaponId {
  return BASE_TIERS[tierForScore(score)];
}

/** Arma ativa = especial (se tiver munição) sobrepõe o tier base da jornada. */
export function activeWeapon(state: GameState): WeaponStats {
  if (state.special && state.special.ammo > 0) return WEAPONS[state.special.id];
  return WEAPONS[baseWeaponForScore(state.score)];
}
