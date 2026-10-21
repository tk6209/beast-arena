import { describe, expect, it } from "vitest";
import { parseGameEnvelope, parseUnityMessage } from "./envelope";

const start = () => ({
  version: 1, type: "capynite.game.start", requestId: "req_1",
  payload: { worldId: "beast-arena", mode: "campaign", deckId: "deck_1", characterId: "drako" },
});
describe("Capynite bridge v1 fail-closed contracts", () => {
  it("accepts a valid battle start", () => expect(parseGameEnvelope(start())).not.toBeNull());
  it("rejects incompatible versions", () => expect(parseGameEnvelope({ ...start(), version: 2 })).toBeNull());
  it("rejects extra root fields", () => expect(parseGameEnvelope({ ...start(), reward: 999 })).toBeNull());
  it("rejects unknown worlds", () => expect(parseGameEnvelope({ ...start(), payload: { ...start().payload, worldId: "admin" } })).toBeNull());
  it("rejects unbounded ids", () => expect(parseGameEnvelope({ ...start(), requestId: "a".repeat(129) })).toBeNull());
  it("rejects forged result rewards", () => expect(parseGameEnvelope({
    version: 1, type: "capynite.game.finished", requestId: "req_2",
    payload: { gameSessionId: "session_1", outcome: "win", coins: 999999 },
  })).toBeNull());
  it("accepts result as untrusted signal only", () => expect(parseGameEnvelope({
    version: 1, type: "capynite.game.finished", requestId: "req_2",
    payload: { gameSessionId: "session_1", outcome: "win" },
  })).not.toBeNull());
  it("rejects wrong frame and origin", () => {
    const source = {} as MessageEventSource;
    const other = {} as MessageEventSource;
    const event = { data: start(), source, origin: "https://games.example" };
    expect(parseUnityMessage(event, "https://games.example", source)).not.toBeNull();
    expect(parseUnityMessage(event, "https://evil.example", source)).toBeNull();
    expect(parseUnityMessage(event, "https://games.example", other)).toBeNull();
  });
});
