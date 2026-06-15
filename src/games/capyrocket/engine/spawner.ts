import type { SpawnCommand, SpawnerState } from "./types";

const FIRST_INTERVAL = 1.5;
const FIRST_WAVE_SIZE = 4;
const MIN_INTERVAL = 0.55;
const INTERVAL_DECAY = 0.9;

export function createSpawner(): SpawnerState {
  return {
    timer: 0,
    interval: FIRST_INTERVAL,
    wave: 1,
    enemiesPerWave: FIRST_WAVE_SIZE,
    leftInWave: FIRST_WAVE_SIZE,
  };
}

/**
 * Diretor de ondas — função pura sobre o SpawnerState (muta o estado passado e
 * devolve os comandos de spawn do tick). Determinística: dada a mesma sequência
 * de `dt`, produz sempre os mesmos comandos.
 *
 * Regras:
 *  - Emite 1 inimigo sempre que o timer cruza o intervalo atual e ainda há
 *    inimigos no orçamento da onda.
 *  - Quando o orçamento zera, avança a onda: +1 inimigo por onda e intervalo
 *    encurtado (até um piso), aumentando a dificuldade.
 */
export function tickSpawner(s: SpawnerState, dt: number): SpawnCommand[] {
  const cmds: SpawnCommand[] = [];

  s.timer += dt;
  if (s.leftInWave > 0 && s.timer >= s.interval) {
    s.timer -= s.interval;
    s.leftInWave -= 1;
    cmds.push({ type: "enemy" });
  }

  if (s.leftInWave <= 0) {
    s.wave += 1;
    s.enemiesPerWave += 1;
    s.leftInWave = s.enemiesPerWave;
    s.interval = Math.max(MIN_INTERVAL, s.interval * INTERVAL_DECAY);
    s.timer = 0;
  }

  return cmds;
}
