import { parsePresentationCue, type PresentationCue, type VisualAction } from "./presentation";

const TYPES: Record<string, VisualAction> = {
  ataque: "attack",
  defesa: "defend",
  cura: "heal",
  evolucao: "evolve",
};

/**
 * Adapt one CONFIRMED server response to a read-only cosmetic cue.
 * Do not call before the game-engine successfully resolves the action.
 * Unsupported card types are intentionally not animated as attacks.
 */
export function confirmedCardCue(input: {
  confirmed: boolean;
  sessionId: string;
  sequence: number;
  actorId: string;
  targetId: string;
  cardType: string;
}): PresentationCue | null {
  if (!input.confirmed || !Object.prototype.hasOwnProperty.call(TYPES, input.cardType)) return null;
  return parsePresentationCue({
    version: 1,
    sessionId: input.sessionId,
    sequence: input.sequence,
    actorId: input.actorId,
    targetId: input.targetId,
    action: TYPES[input.cardType],
  });
}
