import { describe, expect, it } from "vitest";
import { isPhysicallyLandscape } from "./landscape";

describe("isPhysicallyLandscape", () => {
  it("deitado para qualquer lado conta como paisagem", () => {
    expect(isPhysicallyLandscape(4, 88)).toBe(true);
    expect(isPhysicallyLandscape(-10, -80)).toBe(true);
  });
  it("em pé, inclinado de leve ou sem sensor não conta", () => {
    expect(isPhysicallyLandscape(80, 5)).toBe(false);
    expect(isPhysicallyLandscape(10, 40)).toBe(false);
    expect(isPhysicallyLandscape(null, null)).toBe(false);
  });
});
