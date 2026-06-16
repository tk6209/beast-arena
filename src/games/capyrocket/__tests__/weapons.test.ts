import { describe, it, expect } from "vitest";
import { WEAPON_TIER_SCORE } from "../engine/constants";
import { WEAPONS, activeWeapon, baseWeaponForScore, tierForScore } from "../engine/weapons";
import type { GameState } from "../engine/types";

function fakeState(score: number, special: GameState["special"] = null): GameState {
  return { score, special, charWeapon: WEAPONS.pistol } as unknown as GameState;
}

describe("armas", () => {
  it("o tier base sobe com a pontuação (jornada)", () => {
    expect(baseWeaponForScore(0)).toBe("pistol");
    expect(baseWeaponForScore(WEAPON_TIER_SCORE[1])).toBe("mg");
    expect(baseWeaponForScore(WEAPON_TIER_SCORE[2])).toBe("rifle");
    expect(baseWeaponForScore(999999)).toBe("rifle");
  });

  it("tierForScore é monotônico e nunca regride", () => {
    let last = -1;
    for (let s = 0; s <= 20000; s += 500) {
      const t = tierForScore(s);
      expect(t).toBeGreaterThanOrEqual(last);
      last = t;
    }
  });

  it("arma especial com munição sobrepõe a arma-assinatura", () => {
    const s = fakeState(0, { id: "bazooka", ammo: 3 });
    expect(activeWeapon(s).id).toBe("bazooka");
  });

  it("sem munição, usa a arma-assinatura do personagem", () => {
    const s = fakeState(0, { id: "shotgun", ammo: 0 });
    expect(activeWeapon(s).id).toBe("pistol");
  });

  it("a jornada melhora a cadência da arma ativa", () => {
    const early = activeWeapon(fakeState(0));
    const late = activeWeapon(fakeState(999999));
    expect(late.fireInterval).toBeLessThan(early.fireInterval);
  });
});
