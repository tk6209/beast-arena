import { describe, expect, it } from "vitest";
import { escolherAcao } from "./ai";
import { CARDS, MONSTER_ORDER, MONSTERS } from "./data";
import { createBattle, custoEfetivo, efetividade, ENERGIA_TETO, HP_GLOBAL, jogaveis, step } from "./engine";
import { simular } from "./sim";
import type { BattleState, CardInstance, Side } from "./types";

/** Puts a specific card in hand of the side to move, with enough energy. */
function comCarta(s: BattleState, defId: string, energia = 10): [BattleState, CardInstance] {
  const st = structuredClone(s);
  const f = st.fighters[st.vez];
  const inst = { uid: 9000 + f.mao.length, defId };
  f.mao.push(inst);
  f.energia = energia;
  return [st, inst];
}

function limpo(s: BattleState): BattleState {
  const st = structuredClone(s);
  for (const side of ["player", "enemy"] as Side[]) {
    const f = st.fighters[side];
    Object.assign(f, { escudo: 0, espinhos: 0, esquiva: 0, queimar: 0, veneno: 0, congelado: 0, furia: 0, evolucao: 0 });
  }
  return st;
}

describe("dados", () => {
  it("todo monstro tem deck de 12 com cartas válidas e assinatura própria", () => {
    for (const id of MONSTER_ORDER) {
      const m = MONSTERS[id];
      expect(m.deck.length + 1).toBe(12);
      for (const c of [m.assinatura, ...m.deck]) expect(CARDS[c], `${id}:${c}`).toBeDefined();
      expect(CARDS[m.assinatura].arte).toBe(id);
    }
  });

  it("triângulos de elemento: cada elemento tem exatamente uma vantagem e uma fraqueza", () => {
    expect(efetividade("fogo", "natureza")).toBe("super");
    expect(efetividade("natureza", "fogo")).toBe("fraco");
    expect(efetividade("raio", "sombra")).toBe("super");
    expect(efetividade("cristal", "raio")).toBe("super");
    expect(efetividade("fogo", "raio")).toBe("normal");
  });
});

describe("motor", () => {
  it("é determinístico pela seed", () => {
    const a = simular({ seed: 42, player: "drako", enemy: "crystal" });
    const b = simular({ seed: 42, player: "drako", enemy: "crystal" });
    expect(a.state).toEqual(b.state);
    expect(a.acoes).toBe(b.acoes);
  });

  it("começa no turno do jogador com 3 de energia e 5 cartas", () => {
    const { state } = createBattle({ seed: 1, player: "volt", enemy: "banana" });
    expect(state.vez).toBe("player");
    expect(state.fighters.player.energia).toBe(3);
    expect(state.fighters.player.mao.length).toBe(5);
    expect(state.fighters.player.hp).toBe(Math.round(MONSTERS.volt.hp * HP_GLOBAL));
  });

  it("energia cresce 1 por turno até o teto", () => {
    let { state } = createBattle({ seed: 3, player: "crystal", enemy: "crystal" });
    const visto: number[] = [];
    for (let i = 0; i < 14 && !state.vencedor; i++) {
      if (state.vez === "player") visto.push(state.fighters.player.energiaMax);
      state = step(state, { type: "passar" }).state;
    }
    expect(visto.slice(0, 5)).toEqual([3, 4, 5, 6, 6]);
    expect(Math.max(...visto)).toBe(ENERGIA_TETO);
  });

  it("não deixa jogar carta sem energia, fora da vez, ou que não está na mão", () => {
    const { state } = createBattle({ seed: 5, player: "drako", enemy: "panther" });
    const [s1, inst] = comCarta(state, "explosao", 1);
    expect(() => step(s1, { type: "jogar", uid: inst.uid })).toThrow(/Energia/);
    expect(() => step(state, { type: "jogar", uid: 123456 })).toThrow(/mão/);
    expect(jogaveis(state, "enemy")).toEqual([]);
  });

  it("escudo absorve dano, Garra de Aço perfura", () => {
    const { state } = createBattle({ seed: 7, player: "drako", enemy: "panther" });
    const s = limpo(state);
    s.fighters.enemy.escudo = 50;
    const [s1, pancada] = comCarta(s, "pancada");
    const r1 = step(s1, { type: "jogar", uid: pancada.uid });
    expect(r1.state.fighters.enemy.hp).toBe(s.fighters.enemy.hp);
    expect(r1.state.fighters.enemy.escudo).toBeLessThan(50);
    const [s2, garra] = comCarta(s, "garra");
    const r2 = step(s2, { type: "jogar", uid: garra.uid });
    expect(r2.state.fighters.enemy.hp).toBeLessThan(s.fighters.enemy.hp);
    expect(r2.state.fighters.enemy.escudo).toBe(50);
  });

  it("vantagem de elemento aumenta o dano e é sinalizada", () => {
    const { state } = createBattle({ seed: 9, player: "drako", enemy: "sprouts" });
    const [s1, c] = comCarta(limpo(state), "pancada");
    const ev = step(s1, { type: "jogar", uid: c.uid }).events.find((e) => e.e === "dano");
    expect(ev && ev.e === "dano" && ev.efetividade).toBe("super");
  });

  it("esquiva anula o próximo golpe inteiro", () => {
    const { state } = createBattle({ seed: 11, player: "macaco", enemy: "volt" });
    const s = limpo(state);
    s.fighters.enemy.esquiva = 1;
    const [s1, c] = comCarta(s, "garra");
    const r = step(s1, { type: "jogar", uid: c.uid });
    expect(r.events.some((e) => e.e === "esquivou")).toBe(true);
    expect(r.state.fighters.enemy.hp).toBe(s.fighters.enemy.hp);
  });

  it("multigolpe gera um evento de dano por golpe", () => {
    const { state } = createBattle({ seed: 13, player: "volt", enemy: "macaco" });
    const [s1, c] = comCarta(limpo(state), "sig_volt");
    const danos = step(s1, { type: "jogar", uid: c.uid }).events.filter((e) => e.e === "dano" || e.e === "esquivou");
    expect(danos.length).toBe(4);
  });

  it("veneno e queimadura causam dano no início do turno do alvo e diminuem", () => {
    const { state } = createBattle({ seed: 15, player: "sprouts", enemy: "drako" });
    const s = limpo(state);
    s.fighters.enemy.veneno = 4;
    s.fighters.enemy.queimar = 2;
    const hp = s.fighters.enemy.hp;
    const r = step(s, { type: "passar" });
    expect(r.state.fighters.enemy.hp).toBe(hp - 4 - 3);
    expect(r.state.fighters.enemy.veneno).toBe(3);
    expect(r.state.fighters.enemy.queimar).toBe(1);
  });

  it("congelar reduz a energia do próximo turno do inimigo", () => {
    const { state } = createBattle({ seed: 17, player: "tsunami", enemy: "drako" });
    const [s1, c] = comCarta(limpo(state), "sopro");
    const r = step(s1, { type: "jogar", uid: c.uid });
    const next = step(r.state, { type: "passar" }).state;
    expect(next.fighters.enemy.energia).toBe(next.fighters.enemy.energiaMax - 1);
  });

  it("Sobrecarga do Volt: primeira carta do turno custa 1 a menos", () => {
    const { state } = createBattle({ seed: 19, player: "volt", enemy: "drako" });
    expect(custoEfetivo(state.fighters.player, CARDS.garra)).toBe(1);
    const [s1, c] = comCarta(state, "pancada");
    const after = step(s1, { type: "jogar", uid: c.uid }).state;
    expect(custoEfetivo(after.fighters.player, CARDS.garra)).toBe(2);
  });

  it("vitória encerra a partida e bloqueia novas ações", () => {
    const { state } = createBattle({ seed: 21, player: "macaco", enemy: "volt" });
    const s = limpo(state);
    s.fighters.enemy.hp = 1;
    const [s1, c] = comCarta(s, "garra");
    const r = step(s1, { type: "jogar", uid: c.uid });
    expect(r.state.vencedor).toBe("player");
    expect(r.events.at(-1)).toEqual({ e: "ko", side: "enemy" });
    expect(step(r.state, { type: "passar" }).events).toEqual([]);
  });

  it("IA sempre devolve uma ação legal", () => {
    let { state } = createBattle({ seed: 23, player: "phantom", enemy: "morcego", dificuldade: "dificil" });
    for (let i = 0; i < 300 && !state.vencedor; i++) {
      const a = escolherAcao(state, i);
      if (a.type === "jogar") expect(jogaveis(state, state.vez).some((c) => c.uid === a.uid)).toBe(true);
      state = step(state, a).state;
    }
    expect(state.vencedor).not.toBeNull();
  });
});

describe("balanceamento (IA x IA)", () => {
  it("todo monstro vence entre 35% e 65% e partidas duram 5–10 turnos em média", () => {
    const wins: Record<string, number> = {};
    const games: Record<string, number> = {};
    let n = 0;
    let turnos = 0;
    for (const a of MONSTER_ORDER)
      for (const b of MONSTER_ORDER)
        for (let k = 0; k < 8; k++) {
          const r = simular({ seed: ++n, player: a, enemy: b });
          turnos += r.turnosPlayer;
          const w = r.state.vencedor === "player" ? a : b;
          wins[w] = (wins[w] ?? 0) + 1;
          games[a] = (games[a] ?? 0) + 1;
          games[b] = (games[b] ?? 0) + 1;
        }
    for (const id of MONSTER_ORDER) {
      const rate = (wins[id] ?? 0) / games[id];
      expect(rate, id).toBeGreaterThan(0.35);
      expect(rate, id).toBeLessThan(0.65);
    }
    const media = turnos / n;
    expect(media).toBeGreaterThan(5);
    expect(media).toBeLessThan(10);
  }, 60_000);
});
