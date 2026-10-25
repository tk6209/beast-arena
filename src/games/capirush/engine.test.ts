import { describe, expect, it } from "vitest";
import {
  BASE_SPEED,
  CHECKPOINT_EVERY,
  COIN_VALUE,
  CONTINUE_INVULN,
  SPEED_RAMP,
  continueFromCheckpoint,
  HIT_INVULN,
  LANES,
  MAX_SPEED,
  NO_INPUT,
  START_LIVES,
  createState,
  rowGap,
  spawnRow,
  step,
  type Lane,
  type Obstacle,
  type RushInput,
  type RushState,
} from "./engine";

const DT = 1 / 60;
const input = (p: Partial<RushInput> = {}): RushInput => ({ ...NO_INPUT, ...p });

/** Estado limpo, sem spawn automático, para cenários controlados. */
function quiet(seed = 1): RushState {
  const s = createState(seed);
  s.nextRowIn = 1e9;
  return s;
}

function put(s: RushState, kind: Obstacle["kind"], lane: Lane, z: number, len = kind === "train" ? 8 : 0.8): Obstacle {
  const o: Obstacle = { id: s.nextId++, row: 99, kind, lane, z, len };
  s.obstacles.push(o);
  return o;
}

function run(s: RushState, seconds: number, first: Partial<RushInput> = {}) {
  const events: string[] = [];
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) events.push(...step(s, DT, i === 0 ? input(first) : NO_INPUT));
  return events;
}

describe("Capi Rush — controles", () => {
  it("troca de pista e trava nas bordas", () => {
    const s = quiet();
    run(s, 0.1, { left: true });
    expect(s.lane).toBe(-1);
    run(s, 0.1, { left: true });
    expect(s.lane).toBe(-1);
    run(s, 0.1, { right: true });
    run(s, 0.1, { right: true });
    run(s, 0.1, { right: true });
    expect(s.lane).toBe(1);
    run(s, 0.5);
    expect(s.laneX).toBe(1);
  });

  it("pula do chão e faz UM pulo duplo no ar", () => {
    const s = quiet();
    expect(run(s, DT, { jump: true })).toContain("jump");
    expect(s.y).toBeGreaterThan(0);
    run(s, 0.12);
    expect(run(s, DT, { jump: true })).toContain("double-jump");
    expect(run(s, DT, { jump: true })).not.toContain("double-jump");
    run(s, 1.5);
    expect(s.y).toBe(0);
  });

  it("o pulo duplo sobe mais alto que o pulo simples", () => {
    const apex = (double: boolean) => {
      const s = quiet();
      let top = 0;
      run(s, DT, { jump: true });
      for (let i = 0; i < 120; i++) {
        step(s, DT, double && i === 8 ? input({ jump: true }) : NO_INPUT);
        top = Math.max(top, s.y);
      }
      return top;
    };
    expect(apex(true)).toBeGreaterThan(apex(false) + 0.4);
  });

  it("recarrega o pulo duplo ao pousar", () => {
    const s = quiet();
    run(s, DT, { jump: true });
    run(s, 0.1);
    run(s, DT, { jump: true });
    run(s, 1.5);
    expect(s.y).toBe(0);
    run(s, DT, { jump: true });
    run(s, 0.1);
    expect(run(s, DT, { jump: true })).toContain("double-jump");
  });

  it("deslizar no ar derruba a capivara e desliza ao pousar", () => {
    const s = quiet();
    run(s, 0.2, { jump: true });
    run(s, DT, { slide: true });
    run(s, 0.2);
    expect(s.y).toBe(0);
    expect(s.slideTime).toBeGreaterThan(0);
  });
});

describe("Capi Rush — obstáculos", () => {
  it("em pé, bater na barreira tira uma vida", () => {
    const s = quiet();
    put(s, "barrier", 0, 3);
    const ev = run(s, 0.6);
    expect(ev).toContain("hit");
    expect(s.lives).toBe(START_LIVES - 1);
  });

  it("pulando na hora certa, passa por cima da barreira", () => {
    const s = quiet();
    put(s, "barrier", 0, 4.2);
    // Pula ~0,17 s antes de chegar (≈ 1,9 m a 11 m/s).
    const ev = run(s, 1, { jump: true });
    expect(ev).not.toContain("hit");
    expect(s.lives).toBe(START_LIVES);
  });

  it("barra alta: em pé bate, deslizando passa", () => {
    const hit = quiet();
    put(hit, "bar", 0, 3);
    expect(run(hit, 0.6)).toContain("hit");

    const ok = quiet();
    put(ok, "bar", 0, 3);
    const ev = run(ok, 0.6, { slide: true });
    expect(ev).not.toContain("hit");
    expect(ok.lives).toBe(START_LIVES);
  });

  it("pular não passa pela barra alta", () => {
    const s = quiet();
    put(s, "bar", 0, 4.2);
    expect(run(s, 1, { jump: true })).toContain("hit");
  });

  it("trem não se pula nem se desliza: só desviando de pista", () => {
    const jump = quiet();
    put(jump, "train", 0, 4.2);
    expect(run(jump, 1, { jump: true })).toContain("hit");

    const dodge = quiet();
    put(dodge, "train", 0, 6);
    const ev = run(dodge, 2, { right: true });
    expect(ev).not.toContain("hit");
    expect(dodge.lives).toBe(START_LIVES);
  });

  it("obstáculo em outra pista não atinge", () => {
    const s = quiet();
    put(s, "train", 1, 3);
    expect(run(s, 1.5)).not.toContain("hit");
  });

  it("depois de um tombo fica invulnerável por um tempo", () => {
    const s = quiet();
    put(s, "barrier", 0, 3);
    put(s, "barrier", 0, 7);
    run(s, 1);
    expect(s.lives).toBe(START_LIVES - 1);
    expect(s.invuln).toBeGreaterThan(0);
    expect(s.invuln).toBeLessThanOrEqual(HIT_INVULN);
  });

  it("escudo absorve um golpe sem perder vida", () => {
    const s = quiet();
    s.shield = true;
    put(s, "train", 0, 3);
    const ev = run(s, 0.6);
    expect(ev).toContain("shield-break");
    expect(ev).not.toContain("hit");
    expect(s.shield).toBe(false);
    expect(s.lives).toBe(START_LIVES);
  });

  it("sem vidas, o jogo acaba e o motor para", () => {
    const s = quiet();
    s.lives = 1;
    put(s, "train", 0, 3);
    const ev = run(s, 0.6);
    expect(ev).toContain("over");
    expect(s.over).toBe(true);
    const dist = s.distance;
    step(s, DT, NO_INPUT);
    expect(s.distance).toBe(dist);
  });
});

describe("Capi Rush — moedas e pontuação", () => {
  it("coleta moeda no chão e soma pontos", () => {
    const s = quiet();
    s.pickups.push({ id: 1, kind: "coin", lane: 0, z: 3, h: 0 });
    const ev = run(s, 0.6);
    expect(ev).toContain("coin");
    expect(s.coins).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(COIN_VALUE);
  });

  it("moeda no ar exige pulo", () => {
    const walk = quiet();
    walk.pickups.push({ id: 1, kind: "coin", lane: 0, z: 3, h: 1 });
    run(walk, 0.6);
    expect(walk.coins).toBe(0);

    const jump = quiet();
    jump.pickups.push({ id: 1, kind: "coin", lane: 0, z: 3, h: 1 });
    run(jump, 0.6, { jump: true });
    expect(jump.coins).toBe(1);
  });

  it("pega o escudo", () => {
    const s = quiet();
    s.pickups.push({ id: 1, kind: "shield", lane: 0, z: 3, h: 0 });
    expect(run(s, 0.6)).toContain("shield-pickup");
    expect(s.shield).toBe(true);
  });
});

describe("Capi Rush — poderes", () => {
  const pick = (s: RushState, kind: "magnet" | "jet" | "multi" | "gift" | "shield", z = 3) =>
    s.pickups.push({ id: s.nextId++, kind, lane: 0, z, h: 0 });

  it("ímã puxa moedas de outras pistas e de longe", () => {
    const s = quiet();
    pick(s, "magnet");
    run(s, 0.4);
    expect(s.magnet).toBeGreaterThan(0);
    s.pickups.push({ id: 90, kind: "coin", lane: 1, z: 12, h: 0 });
    s.pickups.push({ id: 91, kind: "coin", lane: -1, z: 10, h: 1 });
    run(s, 1.2);
    expect(s.coins).toBe(2);
  });

  it("sem ímã, moeda de outra pista passa batido", () => {
    const s = quiet();
    s.pickups.push({ id: 90, kind: "coin", lane: 1, z: 6, h: 0 });
    run(s, 1.2);
    expect(s.coins).toBe(0);
  });

  it("o ímã acaba depois do tempo", () => {
    const s = quiet();
    pick(s, "magnet");
    run(s, 0.4);
    run(s, 10);
    expect(s.magnet).toBe(0);
  });

  it("foguete: voa alto, atravessa trem sem dano e recolhe moedas no ar", () => {
    const s = quiet();
    pick(s, "jet");
    run(s, 0.4);
    expect(s.jet).toBeGreaterThan(0);
    run(s, 0.6);
    expect(s.y).toBeGreaterThan(2.5);
    put(s, "train", 0, 8, 10);
    s.pickups.push({ id: 92, kind: "coin", lane: 0, z: 14, h: 1 });
    const ev = run(s, 2);
    expect(ev).not.toContain("hit");
    expect(s.lives).toBe(START_LIVES);
    expect(s.coins).toBeGreaterThanOrEqual(1);
  });

  it("foguete ignora pulo/deslize e, ao acabar, desce com invulnerabilidade", () => {
    const s = quiet();
    pick(s, "jet");
    run(s, 0.4);
    const y0 = s.y;
    run(s, DT, { slide: true });
    expect(s.y).toBeGreaterThanOrEqual(y0 - 0.2);
    const ev = run(s, 6);
    expect(ev).toContain("jet-end");
    expect(s.y).toBe(0);
    expect(s.jet).toBe(0);
  });

  it("depois do foguete dá tempo de pousar sem bater num trem embaixo", () => {
    const s = quiet();
    pick(s, "jet");
    run(s, 0.4);
    s.jet = 0.05;
    put(s, "train", 0, 4, 12);
    const ev = run(s, 2.2);
    expect(ev).not.toContain("hit");
  });

  it("multiplicador x2 dobra os pontos das moedas", () => {
    const base = quiet();
    base.pickups.push({ id: 90, kind: "coin", lane: 0, z: 3, h: 0 });
    run(base, 0.6);
    const x2 = quiet();
    pick(x2, "multi", 1.5);
    run(x2, 0.3);
    x2.pickups.push({ id: 90, kind: "coin", lane: 0, z: 3, h: 0 });
    run(x2, 0.6);
    expect(x2.multi).toBeGreaterThan(0);
    expect(x2.bonus).toBe(COIN_VALUE);
    expect(x2.score - Math.floor(x2.distance)).toBe(COIN_VALUE * 2);
    expect(base.score - Math.floor(base.distance)).toBe(COIN_VALUE);
  });

  it("caixa-presente entrega um poder e avisa", () => {
    const got = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = quiet(seed);
      pick(s, "gift");
      const ev = run(s, 0.6);
      expect(ev).toContain("gift");
      const power = ev.find((e) => /-pickup$/.test(e));
      expect(power).toBeTruthy();
      got.add(power as string);
    }
    expect(got.size).toBeGreaterThanOrEqual(3);
  });

  it("poderes só nascem na pista livre e foguete não aparece no começo", () => {
    let seen = 0;
    for (let seed = 1; seed <= 400; seed++) {
      for (const distance of [0, 400]) {
        const s = createState(seed);
        s.distance = distance;
        const row = spawnRow(s, 50);
        const blocked = new Set(row.map((o) => o.lane));
        for (const p of s.pickups) {
          if (p.kind === "coin") continue;
          seen++;
          expect(blocked.has(p.lane as Lane)).toBe(false);
          if (distance < 150) expect(p.kind).not.toBe("jet");
        }
      }
    }
    expect(seen).toBeGreaterThan(20);
  });

  it("voando, as fileiras novas vêm com trilha de moedas no ar", () => {
    const s = createState(3);
    s.distance = 300;
    s.jet = 3;
    spawnRow(s, 50);
    expect(s.pickups.filter((p) => p.kind === "coin" && p.h === 1).length).toBeGreaterThanOrEqual(6);
  });
});

describe("Capi Rush — progressão", () => {
  it("acelera com a distância e respeita o teto", () => {
    const s = quiet();
    expect(s.speed).toBe(BASE_SPEED);
    s.distance = 700;
    run(s, DT);
    expect(s.speed).toBeGreaterThan(BASE_SPEED);
    s.distance = 1e6;
    run(s, DT);
    expect(s.speed).toBe(MAX_SPEED);
  });
});

describe("Capi Rush — geração de fileiras", () => {
  it("é determinística por seed", () => {
    const a = createState(1234);
    const b = createState(1234);
    for (let i = 0; i < 4000; i++) {
      step(a, DT, NO_INPUT);
      step(b, DT, NO_INPUT);
    }
    expect(a.obstacles).toEqual(b.obstacles);
    expect(a.pickups).toEqual(b.pickups);
    expect(a.lives).toBe(b.lives);
  });

  it("seeds diferentes geram percursos diferentes", () => {
    const a = createState(1);
    const b = createState(2);
    for (let i = 0; i < 1500; i++) {
      step(a, DT, NO_INPUT);
      step(b, DT, NO_INPUT);
    }
    expect(JSON.stringify(a.obstacles)).not.toBe(JSON.stringify(b.obstacles));
  });

  it("toda fileira tem saída: pista livre ou só obstáculos transponíveis", () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const distance of [0, 80, 200, 600, 3000]) {
        const s = createState(seed);
        s.distance = distance;
        const row = spawnRow(s, 50);
        const lanesUsed = new Set(row.map((o) => o.lane));
        expect(lanesUsed.size).toBe(row.length); // no máximo 1 obstáculo por pista
        const hasFreeLane = LANES.some((l) => !lanesUsed.has(l));
        const allPassable = row.every((o) => o.kind !== "train");
        expect(hasFreeLane || allPassable).toBe(true);
      }
    }
  });

  it("o começo ensina um truque de cada vez (sem trens nos primeiros 120 m)", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = createState(seed);
      s.distance = 0;
      expect(spawnRow(s, 50).every((o) => o.kind === "barrier")).toBe(true);
      s.distance = 100;
      expect(spawnRow(s, 50).every((o) => o.kind !== "train")).toBe(true);
    }
  });

  it("o espaço entre fileiras cresce com a velocidade", () => {
    expect(rowGap(MAX_SPEED)).toBeGreaterThan(rowGap(BASE_SPEED));
  });
});

/**
 * Prova prática de justiça: um robô simples (olha a fileira mais próxima e
 * reage) chega longe sem perder nenhuma vida em várias seeds. Se o gerador
 * criasse armadilhas impossíveis, o robô tombaria.
 */
function botInput(s: RushState): RushInput {
  const ahead = s.obstacles.filter((o) => o.z + o.len > 0);
  if (ahead.length === 0) return NO_INPUT;
  const nearestRow = ahead.reduce((a, b) => (b.z < a.z ? b : a)).row;
  const row = ahead.filter((o) => o.row === nearestRow);
  const reaction = s.speed * 0.45;
  const here = row.find((o) => o.lane === s.lane);
  const first = Math.min(...row.map((o) => o.z));

  if (!here) return NO_INPUT;
  if (first > 28) return NO_INPUT;

  if (here.kind === "train") {
    // Escolhe a pista livre mais próxima e anda uma pista por vez.
    const free = LANES.filter((l) => !row.some((o) => o.lane === l));
    const target = free.sort((a, b) => Math.abs(a - s.lane) - Math.abs(b - s.lane))[0];
    if (target === undefined) return NO_INPUT;
    return target < s.lane ? input({ left: true }) : input({ right: true });
  }
  if (here.z > reaction) return NO_INPUT;
  if (here.kind === "barrier") return here.z <= reaction * 0.55 ? input({ jump: true }) : NO_INPUT;
  if (here.kind === "bar") return input({ slide: true });
  return NO_INPUT;
}

describe("Capi Rush — percurso é jogável", () => {
  it.each([1, 2, 3, 7, 42, 99, 1234, 2026])("robô completa 90 s sem tombar (seed %i)", (seed) => {
    const s = createState(seed);
    const hits: string[] = [];
    for (let i = 0; i < 90 * 60 && !s.over; i++) {
      const ev = step(s, DT, botInput(s));
      if (ev.includes("hit")) hits.push(`t=${s.time.toFixed(1)} d=${s.distance.toFixed(0)}`);
    }
    expect(hits).toEqual([]);
    expect(s.distance).toBeGreaterThan(900);
  });
});

describe("Capi Rush — checkpoints", () => {
  it("marca checkpoint ao cruzar cada portal, guardando moedas e bônus", () => {
    const s = quiet();
    s.distance = CHECKPOINT_EVERY - 1;
    s.coins = 7;
    s.bonus = 30;
    const ev = run(s, 0.5);
    expect(ev.filter((e) => e === "checkpoint")).toHaveLength(1);
    expect(s.checkpoint).toEqual({ distance: CHECKPOINT_EVERY, coins: 7, bonus: 30 });
    expect(s.nextCheckpoint).toBe(CHECKPOINT_EVERY * 2);
  });

  it("sem checkpoint não há como continuar", () => {
    const s = quiet();
    s.over = true;
    expect(continueFromCheckpoint(s, 2)).toBeNull();
  });

  it("continuar volta ao checkpoint com vidas cheias, mesmo placar e proteção", () => {
    const s = quiet();
    s.checkpoint = { distance: 1000, coins: 12, bonus: 40 };
    s.distance = 1234;
    s.lives = 0;
    s.over = true;
    const c = continueFromCheckpoint(s, 5)!;
    expect(c.over).toBe(false);
    expect(c.lives).toBe(START_LIVES);
    expect(c.distance).toBe(1000);
    expect(c.score).toBe(1000 + 12 * COIN_VALUE + 40);
    expect(c.speed).toBeCloseTo(Math.min(MAX_SPEED, BASE_SPEED + 1000 / SPEED_RAMP));
    expect(c.invuln).toBe(CONTINUE_INVULN);
    expect(c.obstacles).toEqual([]);
    expect(c.nextCheckpoint).toBe(1000 + CHECKPOINT_EVERY);
  });

  it("a corrida continuada não é atingida durante a proteção, mesmo com obstáculo na cara", () => {
    const s = quiet();
    s.checkpoint = { distance: 500, coins: 0, bonus: 0 };
    s.over = true;
    const c = continueFromCheckpoint(s, 9)!;
    c.nextRowIn = 1e9;
    put(c, "train", 0, 0.5, 40);
    expect(run(c, 1)).not.toContain("hit");
    expect(c.lives).toBe(START_LIVES);
  });
});
