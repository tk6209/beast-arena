import { describe, it, expect } from "vitest";
import { aabbOverlap } from "../engine/collision";

describe("aabbOverlap", () => {
  it("detecta sobreposição de dois retângulos que se cruzam", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    expect(aabbOverlap(a, b)).toBe(true);
  });

  it("retorna false quando separados no eixo x", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 20, y: 0, w: 10, h: 10 };
    expect(aabbOverlap(a, b)).toBe(false);
  });

  it("retorna false quando separados no eixo y", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 0, y: 20, w: 10, h: 10 };
    expect(aabbOverlap(a, b)).toBe(false);
  });

  it("bordas apenas encostadas NÃO contam como sobreposição", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 10, y: 0, w: 10, h: 10 }; // encosta exatamente em x=10
    expect(aabbOverlap(a, b)).toBe(false);
  });

  it("é simétrico", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 4, y: 4, w: 3, h: 3 }; // b dentro de a
    expect(aabbOverlap(a, b)).toBe(aabbOverlap(b, a));
    expect(aabbOverlap(a, b)).toBe(true);
  });
});
