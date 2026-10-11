import { describe, expect, it } from "vitest";
import { BIOME_CYCLE, biomeAt } from "./biome";
import { HEROES, getHero } from "./heroes";

describe("Capi Rush — biomas", () => {
  it("começa na cidade e entra na selva depois da transição", () => {
    expect(biomeAt(0)).toBe(0);
    expect(biomeAt(699)).toBe(0);
    expect(biomeAt(750)).toBeGreaterThan(0);
    expect(biomeAt(750)).toBeLessThan(1);
    expect(biomeAt(1000)).toBe(1);
  });

  it("volta à cidade e repete o ciclo", () => {
    expect(biomeAt(1550)).toBeGreaterThan(0);
    expect(biomeAt(1550)).toBeLessThan(1);
    expect(biomeAt(BIOME_CYCLE)).toBe(0);
    expect(biomeAt(BIOME_CYCLE + 1000)).toBe(1);
  });

  it("nunca sai do intervalo [0, 1]", () => {
    for (let d = 0; d < 5000; d += 7) {
      const v = biomeAt(d);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("Capi Rush — heróis", () => {
  it("têm ids únicos e o fallback é o primeiro", () => {
    expect(new Set(HEROES.map((h) => h.id)).size).toBe(HEROES.length);
    expect(getHero("nao-existe").id).toBe(HEROES[0].id);
    expect(getHero(null).id).toBe(HEROES[0].id);
  });

  it("todo herói tem sprite de costas, retrato e nome", () => {
    for (const h of HEROES) {
      expect(h.back).toBeTruthy();
      expect(h.portrait).toBeTruthy();
      expect(h.name.length).toBeGreaterThan(2);
      expect(h.height).toBeGreaterThan(1);
    }
  });
});
