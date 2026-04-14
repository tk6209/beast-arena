/**
 * Easy Mode Balance Constants — centralized for easy calibration.
 */

/** HP multiplier for both players in easy mode */
export const EASY_HP_MULTIPLIER = 1.4;

/** Damage multiplier by round range */
export function easyDamageMultiplier(round: number): number {
  if (round <= 2) return 0.85;
  if (round <= 4) return 0.95;
  return 1.0;
}

/** AI pass chance for easy mode by round */
export function easyAiPassChance(round: number): number {
  if (round <= 3) return 0.4;
  return 0.3;
}

/** HP regen per round (both players) in easy mode */
export const EASY_ROUND_HEAL = 5;

/** Max damage per card in early rounds (easy mode) */
export function easyDamageCap(_round: number): number {
  return Infinity;
}

/** AI difficulty multipliers for stats */
export const DIFFICULTY_MULTIPLIERS: Record<string, { hp: number; atk: number; def: number }> = {
  facil: { hp: 1.0, atk: 0.7, def: 0.7 },
  medio: { hp: 1.0, atk: 1.0, def: 1.0 },
  avancado: { hp: 1.4, atk: 1.3, def: 1.3 },
};
