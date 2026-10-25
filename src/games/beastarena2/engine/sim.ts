import { escolherAcao } from "./ai";
import { createBattle, step } from "./engine";
import type { BattleConfig } from "./engine";
import type { BattleState } from "./types";

export interface SimResult {
  state: BattleState;
  acoes: number;
  turnosPlayer: number;
}

/** Plays a full AI-vs-AI battle. Used by balance tests and the attract-mode demo. */
export function simular(cfg: BattleConfig, maxAcoes = 2000): SimResult {
  let { state } = createBattle(cfg);
  let acoes = 0;
  while (!state.vencedor && acoes < maxAcoes) {
    const acao = escolherAcao(state, cfg.seed * 977 + acoes);
    state = step(state, acao).state;
    acoes++;
  }
  return { state, acoes, turnosPlayer: state.fighters.player.turnosJogados };
}
