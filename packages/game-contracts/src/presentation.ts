/**
 * One-way cosmetic playback contract. The server game-engine remains the sole
 * authority for turn order, inventory, damage, rewards and victory.
 */
export const VISUAL_ACTIONS = [
  "attack", "defend", "heal", "evolve", "hit", "victory", "defeat",
] as const;

export type VisualAction = (typeof VISUAL_ACTIONS)[number];

export interface PresentationCue {
  version: 1;
  sessionId: string;
  sequence: number;
  action: VisualAction;
  actorId: string;
  targetId?: string;
  amount?: number;
}

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parsePresentationCue(value: unknown): PresentationCue | null {
  if (!isRecord(value)) return null;
  const allowed = ["version", "sessionId", "sequence", "action", "actorId", "targetId", "amount"];
  if (Object.keys(value).some(k => !allowed.includes(k))) return null;
  if (value.version !== 1 || typeof value.sessionId !== "string" || !ID_PATTERN.test(value.sessionId)) return null;
  if (!Number.isSafeInteger(value.sequence) || (value.sequence as number) < 1) return null;
  if (!VISUAL_ACTIONS.includes(value.action as VisualAction)) return null;
  if (typeof value.actorId !== "string" || !ID_PATTERN.test(value.actorId)) return null;
  if (value.targetId !== undefined && (typeof value.targetId !== "string" || !ID_PATTERN.test(value.targetId))) return null;
  if (value.amount !== undefined && (!Number.isInteger(value.amount) || (value.amount as number) < 0 || (value.amount as number) > 100000)) return null;
  return value as unknown as PresentationCue;
}

/**
 * Consumes only strictly increasing cues for one explicitly bound match.
 * Duplicate, reordered and cross-session messages never reach animation code.
 * No database writes or reward submission can be triggered by this API.
 */
export function createPresentationGate(sessionId: string) {
  if (!ID_PATTERN.test(sessionId)) throw new Error("Invalid presentation session");
  let lastSequence = 0;
  return {
    accept(raw: unknown): PresentationCue | null {
      const cue = parsePresentationCue(raw);
      if (!cue || cue.sessionId !== sessionId || cue.sequence <= lastSequence) return null;
      lastSequence = cue.sequence;
      return cue;
    },
    lastAcceptedSequence(): number { return lastSequence; },
  };
}
