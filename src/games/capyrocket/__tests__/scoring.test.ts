import { describe, it, expect } from "vitest";
import {
  COMBO_CAP,
  DIST_RATE,
  SCORE_KILL_BASE,
  SCORE_PICKUP,
  addDistance,
  bestScore,
  loadHighscore,
  registerKill,
  registerPickup,
  resetCombo,
  saveHighscore,
  scoreForKill,
} from "../engine/scoring";
import type { GameState } from "../engine/types";

function fakeState(): GameState {
  // Só os campos que o scoring toca importam aqui.
  return { score: 0, combo: 0 } as unknown as GameState;
}

describe("scoring", () => {
  it("acumula pontos de distância proporcionais ao tempo", () => {
    const s = fakeState();
    addDistance(s, 1);
    addDistance(s, 0.5);
    expect(s.score).toBeCloseTo(DIST_RATE * 1.5);
  });

  it("multiplica os pontos de abate pelo combo, com teto", () => {
    expect(scoreForKill(1)).toBe(SCORE_KILL_BASE);
    expect(scoreForKill(3)).toBe(SCORE_KILL_BASE * 3);
    expect(scoreForKill(99)).toBe(SCORE_KILL_BASE * COMBO_CAP);
  });

  it("registerKill incrementa o combo e soma com multiplicador", () => {
    const s = fakeState();
    registerKill(s); // combo 1 → 50
    registerKill(s); // combo 2 → 100
    expect(s.combo).toBe(2);
    expect(s.score).toBe(SCORE_KILL_BASE * 1 + SCORE_KILL_BASE * 2);
  });

  it("resetCombo zera o combo (dano)", () => {
    const s = fakeState();
    registerKill(s);
    resetCombo(s);
    expect(s.combo).toBe(0);
  });

  it("registerPickup soma o valor da estrela", () => {
    const s = fakeState();
    registerPickup(s);
    expect(s.score).toBe(SCORE_PICKUP);
  });

  it("bestScore devolve o maior valor", () => {
    expect(bestScore(100, 250)).toBe(250);
    expect(bestScore(300, 250)).toBe(300);
  });

  it("persiste e carrega o recorde via storage injetável", () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
    };
    expect(loadHighscore(storage)).toBe(0);
    saveHighscore(1234.7, storage);
    expect(loadHighscore(storage)).toBe(1234);
  });
});
