import { requireVerifiedEconomy } from './economyAvailability';
import type { BattleStats } from '@/components/game/screens/TelaBatalha';

/** Legacy callers fail closed; progression belongs to a single trusted settlement. */
export async function postBattleProgression(
  _userId: string, _won: boolean, _stats: BattleStats, _monsterId: string,
  _historyEntry?: unknown
): Promise<void> {
  requireVerifiedEconomy();
}
