import { describe, expect, it } from "vitest";
import { CAPYNITE_BRAND, CAPYNITE_WORLDS, getCapyniteWorld, getPlayableWorlds } from "./capynite";

describe("Capynite universe configuration", () => {
  it("keeps Joshua Edition as the canonical universe identity", () => {
    expect(CAPYNITE_BRAND.name).toBe("CAPYNITE");
    expect(CAPYNITE_BRAND.edition).toBe("JOSHUA EDITION");
  });

  it("uses unique world ids", () => {
    const ids = CAPYNITE_WORLDS.map((world) => world.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exposes only live worlds as playable", () => {
    const playable = getPlayableWorlds();
    expect(playable.length).toBeGreaterThanOrEqual(2);
    expect(playable.every((world) => world.status === "live" && world.runtime !== "locked")).toBe(true);
  });

  it("resolves a world by id", () => {
    expect(getCapyniteWorld("beast-arena")?.href).toBe("/beast-arena");
    expect(getCapyniteWorld("missing-world")).toBeUndefined();
  });
});
