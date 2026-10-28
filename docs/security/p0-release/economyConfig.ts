/** SERVER ONLY release candidate. Proposed, adjustable; not externally approved. */
export interface EconomyConfig {
  version: string;
  approval: 'initial-proposal';
  daily: readonly [number, number, number, number, number, number, number];
  battle: Record<'facil' | 'medio' | 'avancado', { win: { coins: number; xp: number }; loss: { coins: number; xp: number } }>;
  streak: { maximumRewardedWins: number; bonusBasisPointsPerWin: number };
  deck: { size: number; maxCopies: number };
}
export const ECONOMY_CONFIG: EconomyConfig = {
  version: 'p0-initial-proposal-v1', approval: 'initial-proposal',
  daily: [10, 15, 20, 30, 40, 50, 75],
  battle: {
    facil: { win: { coins: 10, xp: 20 }, loss: { coins: 3, xp: 8 } },
    medio: { win: { coins: 20, xp: 30 }, loss: { coins: 3, xp: 8 } },
    avancado: { win: { coins: 40, xp: 50 }, loss: { coins: 3, xp: 8 } },
  },
  // Proposed cap, inactive until authoritative settlement exists.
  streak: { maximumRewardedWins: 5, bonusBasisPointsPerWin: 2500 },
  deck: { size: 10, maxCopies: 2 },
};