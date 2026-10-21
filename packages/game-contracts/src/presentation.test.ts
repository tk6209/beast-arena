import { describe, expect, it } from "vitest";
import { createPresentationGate, parsePresentationCue } from "./presentation";

const cue = (sequence: number, action = "attack") => ({
  version: 1, sessionId: "battle_01", sequence, actorId: "drako", targetId: "panther", action,
});

describe("Unity visual-only playback contract", () => {
  it("accepts a valid deterministic attack cue", () =>
    expect(parsePresentationCue(cue(1))?.action).toBe("attack"));
  it("rejects client-side reward fields", () =>
    expect(parsePresentationCue({ ...cue(1), reward: 1000 })).toBeNull());
  it("rejects unsupported actions and unsafe IDs", () => {
    expect(parsePresentationCue(cue(1, "award_coins"))).toBeNull();
    expect(parsePresentationCue({ ...cue(1), actorId: "drako<script>" })).toBeNull();
  });
  it("rejects bad amount and sequence", () => {
    expect(parsePresentationCue({ ...cue(1), amount: -1 })).toBeNull();
    expect(parsePresentationCue({ ...cue(0) })).toBeNull();
    expect(parsePresentationCue({ ...cue(1), sequence: 1.2 })).toBeNull();
  });
  it("rejects duplicate, stale, out-of-order and cross-battle playback", () => {
    const gate = createPresentationGate("battle_01");
    expect(gate.accept(cue(1))).not.toBeNull();
    expect(gate.accept(cue(1))).toBeNull();
    expect(gate.accept(cue(0))).toBeNull();
    expect(gate.accept({ ...cue(3), sessionId: "another_battle" })).toBeNull();
    expect(gate.accept(cue(2))).not.toBeNull();
    expect(gate.lastAcceptedSequence()).toBe(2);
  });
  it("rejects invalid session construction", () =>
    expect(() => createPresentationGate("bad session!")).toThrow());
});
