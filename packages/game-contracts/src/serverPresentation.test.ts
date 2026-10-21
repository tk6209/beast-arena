import { describe, expect, it } from "vitest";
import { confirmedCardCue } from "./serverPresentation";

const input = { confirmed: true, sessionId: "battle-2", sequence: 1, actorId: "drako", targetId: "panther" };
describe("confirmed game engine to visual-only adapter", () => {
  it("maps only known canonical card types", () => {
    expect(confirmedCardCue({ ...input, cardType: "ataque" })?.action).toBe("attack");
    expect(confirmedCardCue({ ...input, cardType: "defesa" })?.action).toBe("defend");
    expect(confirmedCardCue({ ...input, cardType: "cura" })?.action).toBe("heal");
    expect(confirmedCardCue({ ...input, cardType: "evolucao" })?.action).toBe("evolve");
  });
  it("never creates cues before server acknowledgement", () =>
    expect(confirmedCardCue({ ...input, confirmed: false, cardType: "ataque" })).toBeNull());
  it("refuses unsupported effect cards instead of guessing damage semantics", () => {
    expect(confirmedCardCue({ ...input, cardType: "swarm" })).toBeNull();
    expect(confirmedCardCue({ ...input, cardType: "desafio" })).toBeNull();
  });
  it("rejects invalid session and actor IDs", () => {
    expect(confirmedCardCue({ ...input, sessionId: "battle!", cardType: "ataque" })).toBeNull();
    expect(confirmedCardCue({ ...input, actorId: "a b", cardType: "ataque" })).toBeNull();
  });
});
