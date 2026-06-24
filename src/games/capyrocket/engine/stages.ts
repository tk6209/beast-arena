import { BOSSES, type BossDef, type BossKind } from "./characters";

// ─────────────────────────────────────────────────────────────────────────
// Campanha CapyWars — 5 fases distintas (bioma + chefe + abertura próprios).
// O jogador avança uma fase a cada chefe derrotado; vence ao cair o último.
// ─────────────────────────────────────────────────────────────────────────
export type Biome = "corridor" | "chamber" | "docks" | "lava" | "palace";

export interface Stage {
  n: number;
  name: string;
  subtitle: string;
  biome: Biome;
  bossKind: BossKind;
}

export const STAGES: Stage[] = [
  { n: 1, name: "Corredor Subterrâneo", subtitle: "A invasão começou", biome: "corridor", bossKind: "chief" },
  { n: 2, name: "Câmara Alienígena", subtitle: "Energia proibida", biome: "chamber", bossKind: "maga" },
  { n: 3, name: "Rios de CapyCity", subtitle: "Piratas à vista", biome: "docks", bossKind: "pirate" },
  { n: 4, name: "Cavernas de Lava", subtitle: "Fúria incandescente", biome: "lava", bossKind: "dragon" },
  { n: 5, name: "Palácio Real", subtitle: "O confronto final", biome: "palace", bossKind: "emperor" },
];

export function stageIndex(bossesDefeated: number): number {
  return Math.max(0, Math.min(STAGES.length - 1, bossesDefeated));
}

export function currentStage(bossesDefeated: number): Stage {
  return STAGES[stageIndex(bossesDefeated)];
}

export function bossForStage(bossesDefeated: number): BossDef {
  const kind = STAGES[stageIndex(bossesDefeated)].bossKind;
  return BOSSES.find((b) => b.kind === kind) ?? BOSSES[0];
}
