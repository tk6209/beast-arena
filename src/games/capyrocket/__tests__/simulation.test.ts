import { describe, it, expect } from "vitest";
import { Game } from "../engine/Game";

// Dirige a simulação real (Game.update) sem canvas/rAF, validando o loop
// de ponta a ponta: desafio (ficar parado perde) e ciclo do chefe.
describe("simulação headless", () => {
  it("roda o loop sem exceção e ficar parado leva a game over (há desafio)", () => {
    const game = new Game() as unknown as {
      update: (dt: number) => void;
      state: { phase: string; spawner: { wave: number }; lives: number };
    };

    let maxWave = 1;
    // ~90s de jogo, sem nunca pular.
    for (let i = 0; i < 90 * 60; i++) {
      game.update(1 / 60);
      maxWave = Math.max(maxWave, game.state.spawner.wave);
      if (game.state.phase === "gameover") break;
    }

    expect(game.state.phase).toBe("gameover");
    expect(game.state.lives).toBe(0);
    expect(maxWave).toBeGreaterThanOrEqual(2);
  });

  it("chefe aparece na onda 5 e morre sob o fogo automático", () => {
    const game = new Game() as unknown as {
      update: (dt: number) => void;
      state: {
        phase: string;
        spawner: { wave: number };
        player: { invuln: number };
        boss: unknown;
        score: number;
      };
    };

    // Pula direto para o marco da onda 5.
    game.state.spawner.wave = 5;
    game.update(1 / 60);
    expect(game.state.boss).not.toBeNull();

    const scoreBefore = game.state.score;
    let bossDied = false;
    for (let i = 0; i < 40 * 60; i++) {
      game.state.player.invuln = 1; // jogador "imortal" só pra testar o dano no chefe
      game.update(1 / 60);
      if (game.state.boss === null) {
        bossDied = true;
        break;
      }
    }
    expect(bossDied).toBe(true);
    expect(game.state.score).toBeGreaterThan(scoreBefore);
  });

  it("resgatar um refém concede bônus e arma especial (estilo Metal Slug)", () => {
    const game = new Game() as unknown as {
      update: (dt: number) => void;
      state: {
        player: { x: number; y: number; w: number; h: number };
        prisoners: Array<{ x: number; y: number; w: number; h: number; freed: boolean; bob: number }>;
        rescued: number;
        score: number;
        special: unknown;
      };
    };

    const p = game.state.player;
    game.state.prisoners.push({ x: p.x, y: p.y, w: 30, h: 48, freed: false, bob: 0 });
    const scoreBefore = game.state.score;
    game.update(1 / 60);

    expect(game.state.rescued).toBe(1);
    expect(game.state.score).toBeGreaterThanOrEqual(scoreBefore + 500);
    expect(game.state.special).not.toBeNull();
  });
});
