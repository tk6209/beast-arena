import { HIGHSCORE_KEY } from "./constants";
import type { GameState } from "./types";

export const SCORE_KILL_BASE = 50;
export const SCORE_PICKUP = 120;
export const SCORE_BOSS = 2000;
export const DIST_RATE = 12; // pontos por segundo correndo
export const COMBO_CAP = 5;

/** Pontos de distância acumulados ao longo do tempo. */
export function addDistance(state: GameState, dt: number): void {
  state.score += DIST_RATE * dt;
}

/** Multiplicador de pontos de um abate dado o combo atual (capado). */
export function scoreForKill(combo: number): number {
  return SCORE_KILL_BASE * Math.min(COMBO_CAP, Math.max(1, combo));
}

/** Registra um abate: incrementa o combo e soma os pontos com multiplicador. */
export function registerKill(state: GameState): void {
  state.combo += 1;
  state.score += scoreForKill(state.combo);
}

/** Coleta de estrela. */
export function registerPickup(state: GameState): void {
  state.score += SCORE_PICKUP;
}

/** Bônus por derrotar o chefe. */
export function registerBossKill(state: GameState): void {
  state.score += SCORE_BOSS;
}

/** Combo zera ao levar dano. */
export function resetCombo(state: GameState): void {
  state.combo = 0;
}

/** Maior entre o recorde anterior e a pontuação atual. */
export function bestScore(prev: number, current: number): number {
  return Math.max(prev, current);
}

/* ── Persistência do recorde (storage injetável p/ testabilidade) ── */

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function safeStorage(): StorageLike | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadHighscore(storage: StorageLike | null = safeStorage()): number {
  if (!storage) return 0;
  const raw = storage.getItem(HIGHSCORE_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveHighscore(
  value: number,
  storage: StorageLike | null = safeStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(HIGHSCORE_KEY, String(Math.floor(value)));
  } catch {
    /* quota / modo privado — ignora */
  }
}
