import { describe, it, expect } from "vitest";
import { createSpawner, tickSpawner } from "../engine/spawner";

describe("tickSpawner", () => {
  it("emite exatamente enemiesPerWave inimigos antes de avançar a onda", () => {
    const s = createSpawner();
    const startWave = s.wave;
    const budget = s.enemiesPerWave;

    let spawned = 0;
    // Avança o tempo em passos de 1/60s até a onda virar.
    for (let i = 0; i < 100000 && s.wave === startWave; i++) {
      spawned += tickSpawner(s, 1 / 60).length;
    }

    expect(spawned).toBe(budget);
    expect(s.wave).toBe(startWave + 1);
  });

  it("encurta o intervalo e aumenta o tamanho da próxima onda", () => {
    const s = createSpawner();
    const firstInterval = s.interval;
    const firstSize = s.enemiesPerWave;

    // Roda até a onda avançar uma vez.
    for (let i = 0; i < 100000 && s.wave === 1; i++) {
      tickSpawner(s, 1 / 60);
    }

    expect(s.interval).toBeLessThan(firstInterval);
    expect(s.enemiesPerWave).toBe(firstSize + 1);
    expect(s.leftInWave).toBe(s.enemiesPerWave);
  });

  it("não emite spawns antes do primeiro intervalo", () => {
    const s = createSpawner();
    const cmds = tickSpawner(s, s.interval / 2);
    expect(cmds.length).toBe(0);
  });

  it("não emite mais de um inimigo por tick", () => {
    const s = createSpawner();
    const cmds = tickSpawner(s, s.interval * 5);
    expect(cmds.length).toBeLessThanOrEqual(1);
  });
});
