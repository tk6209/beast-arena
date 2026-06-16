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
  pierce: number; // nº de inimigos que a bala atravessa (0 = para no 1º)
}

export const WEAPONS: Record<WeaponId, WeaponStats> = {
  pistol: { id: "pistol", name: "Pistola", fireInterval: 0.34, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 820, pierce: 0 },
  mg: { id: "mg", name: "Metralhadora", fireInterval: 0.16, damage: 1, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 920, pierce: 0 },
  rifle: { id: "rifle", name: "Rifle Pesado", fireInterval: 0.15, damage: 2, pellets: 1, spread: 0, kind: "normal", bulletSpeed: 1000, pierce: 0 },
  shotgun: { id: "shotgun", name: "Escopeta", fireInterval: 0.44, damage: 1, pellets: 3, spread: 150, kind: "normal", bulletSpeed: 760, pierce: 0 },
  bazooka: { id: "bazooka", name: "Bazuca", fireInterval: 0.72, damage: 6, pellets: 1, spread: 0, kind: "rocket", bulletSpeed: 560, pierce: 0 },
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

/**
 * Arma ativa: arma especial da caixa (se com munição) sobrepõe a arma-assinatura
 * do personagem. Por cima, a "jornada" escala a arma com a pontuação — cadência
 * um pouco melhor e +1 de dano no tier máximo (progressão para qualquer herói).
 */
export function activeWeapon(state: GameState): WeaponStats {
  const base = state.special && state.special.ammo > 0 ? WEAPONS[state.special.id] : state.charWeapon;
  const t = tierForScore(state.score);
  return {
    ...base,
    fireInterval: base.fireInterval * (1 - 0.06 * t),
    damage: base.damage + (t >= 2 ? 1 : 0),
  };
}
