/** Capynite game bridge v1: fail-closed runtime parsing for untrusted game frames. */
export const GAME_EVENT_TYPES = [
  "capynite.game.ready", "capynite.game.start", "capynite.game.pause",
  "capynite.game.resume", "capynite.game.exit", "capynite.game.error",
  "capynite.game.finished",
] as const;
export type GameEventType = (typeof GAME_EVENT_TYPES)[number];
export interface GameEnvelope {
  version: 1;
  type: GameEventType;
  requestId: string;
  payload: Record<string, unknown>;
}
const ID = /^[A-Za-z0-9_-]{1,128}$/;
const own = (v: object, k: string) => Object.prototype.hasOwnProperty.call(v, k);
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const allowedKeys = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).every((key) => keys.includes(key));

/** Strict validator; never treat game.finished as an authoritative reward. */
export function parseGameEnvelope(value: unknown): GameEnvelope | null {
  if (!record(value) || !allowedKeys(value, ["version", "type", "requestId", "payload"])) return null;
  if (value.version !== 1 || !GAME_EVENT_TYPES.includes(value.type as GameEventType)) return null;
  if (typeof value.requestId !== "string" || !ID.test(value.requestId)) return null;
  if (!record(value.payload) || Object.keys(value.payload).length > 24) return null;
  const payload = value.payload;
  if (value.type === "capynite.game.start") {
    if (!allowedKeys(payload, ["worldId", "mode", "deckId", "characterId"])) return null;
    if (payload.worldId !== "beast-arena" || !["campaign", "practice"].includes(String(payload.mode))) return null;
    if (typeof payload.deckId !== "string" || !ID.test(payload.deckId)) return null;
    if (typeof payload.characterId !== "string" || !ID.test(payload.characterId)) return null;
  }
  if (value.type === "capynite.game.finished") {
    if (!allowedKeys(payload, ["gameSessionId", "outcome"])) return null;
    if (typeof payload.gameSessionId !== "string" || !ID.test(payload.gameSessionId)) return null;
    if (!["win", "loss", "abandoned"].includes(String(payload.outcome))) return null;
  }
  return value as unknown as GameEnvelope;
}

/** Origin AND source must match the configured Unity frame. */
export function parseUnityMessage(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  expectedOrigin: string,
  expectedSource: MessageEventSource | null,
): GameEnvelope | null {
  if (!expectedSource || event.source !== expectedSource || event.origin !== expectedOrigin) return null;
  return parseGameEnvelope(event.data);
}
