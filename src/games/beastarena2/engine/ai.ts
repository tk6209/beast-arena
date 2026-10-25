import { CARDS } from "./data";
import { hashSeed, nextRandom } from "./rng";
import { jogaveis, other, step } from "./engine";
import type { Action, BattleState, Side } from "./types";

/** Heuristic value of a position from `side`'s point of view. */
export function avaliar(s: BattleState, side: Side): number {
  const me = s.fighters[side];
  const op = s.fighters[other(side)];
  if (s.vencedor === side) return 10_000;
  if (s.vencedor === other(side)) return -10_000;
  const venenoFuturo = (op.veneno * (op.veneno + 1)) / 2;
  return (
    -op.hp * 1.25 +
    me.hp * 1.0 +
    Math.min(me.escudo, 20) * 0.65 +
    me.espinhos * 0.5 +
    Math.min(me.esquiva, 2) * 5 +
    venenoFuturo * 0.6 +
    op.queimar * 2.4 +
    op.congelado * 3.5 +
    Math.min(me.furia, 12) * 0.7 +
    me.evolucao * 3 +
    me.mao.length * 1.5 -
    op.mao.length * 0.8
  );
}

/**
 * Pick the next action for whoever's turn it is. Greedy one-ply search: each
 * playable card is simulated on a copy whose RNG is re-seeded, so the AI
 * estimates chance cards instead of peeking at the real outcome.
 */
export function escolherAcao(s: BattleState, aiSeed: number): Action {
  const side = s.vez;
  const opcoes = jogaveis(s, side);
  if (opcoes.length === 0) return { type: "passar" };

  const [roll] = nextRandom(hashSeed(aiSeed));
  const dif = s.dificuldade;
  if (dif === "facil" && roll < 0.35) {
    const pick = opcoes[Math.floor(roll * 1000) % opcoes.length];
    return { type: "jogar", uid: pick.uid };
  }

  const base = avaliar(s, side);
  let best: { uid: number; score: number } | null = null;
  const amostras = dif === "dificil" ? 4 : 2;
  for (const c of opcoes) {
    let total = 0;
    for (let k = 0; k < amostras; k++) {
      const probe: BattleState = { ...s, rng: hashSeed(aiSeed * 31 + c.uid * 7 + k) };
      total += avaliar(step(probe, { type: "jogar", uid: c.uid }).state, side);
    }
    let score = total / amostras;
    // Mild preference for spending energy efficiently on normal/hard.
    score += CARDS[c.defId].custo * 0.15;
    if (dif === "normal") score += (nextRandom(hashSeed(aiSeed + c.uid))[0] - 0.5) * 3;
    if (!best || score > best.score) best = { uid: c.uid, score };
  }
  if (!best || best.score <= base + 0.2) return { type: "passar" };
  return { type: "jogar", uid: best.uid };
}
