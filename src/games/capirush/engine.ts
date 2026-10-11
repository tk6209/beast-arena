/**
 * CAPI RUSH — motor puro (sem DOM, sem canvas) do Mundo 03 do Capynite.
 *
 * Corrida infinita de 3 pistas, vista por trás da capivara (estilo "surfista de
 * metrô"): troque de pista, pule barreiras baixas, deslize sob barras altas e
 * desvie dos trens. Tudo é determinístico a partir da seed, então o
 * comportamento fica travado por testes (ver engine.test.ts).
 *
 * Unidades: distâncias em metros, tempo em segundos. `z` é a distância À FRENTE
 * do jogador (z = 0 é onde a capivara está; o mundo vem na direção de z = 0).
 */

/* ───────── Constantes de jogo (fonte única de verdade) ───────── */
export type Lane = -1 | 0 | 1;
export const LANES: readonly Lane[] = [-1, 0, 1];

export const SPAWN_Z = 70;
export const LANE_SWITCH_SPEED = 10; // pistas por segundo
export const GRAVITY = 26;
export const JUMP_V = 7.6;
export const FAST_FALL_V = 14;
export const SLIDE_TIME = 0.7;

export const BASE_SPEED = 11;
export const MAX_SPEED = 25;
/** Metros percorridos para ganhar +1 m/s de velocidade. */
export const SPEED_RAMP = 70;

export const START_LIVES = 3;
export const HIT_INVULN = 1.5;
export const SHIELD_INVULN = 0.7;
export const COIN_VALUE = 10;

/** Faixa de profundidade (em z) ocupada pelo corpo do jogador. */
export const PLAYER_Z0 = 0.15;
export const PLAYER_Z1 = 0.85;
/** Quão perto (em pistas) o jogador precisa estar de uma pista para colidir nela. */
export const LANE_REACH = 0.55;

export const BARRIER_H = 0.7;
export const COIN_AIR_MIN_Y = 0.35;
export const COIN_GROUND_MAX_Y = 0.9;

export type ObstacleKind = "barrier" | "bar" | "train";

export interface Obstacle {
  id: number;
  row: number;
  kind: ObstacleKind;
  lane: Lane;
  /** Distância até a face da frente do obstáculo. */
  z: number;
  /** Profundidade (comprimento) do obstáculo. */
  len: number;
}

export interface Pickup {
  id: number;
  kind: "coin" | "shield";
  lane: Lane;
  z: number;
  /** 0 = no chão, 1 = no ar (acima das barreiras: exige pulo). */
  h: 0 | 1;
}

export type RushEvent =
  | "switch"
  | "jump"
  | "slide"
  | "coin"
  | "shield-pickup"
  | "shield-break"
  | "hit"
  | "over";

export interface RushInput {
  /** Bordas de subida: true só no quadro em que o gesto/tecla aconteceu. */
  left: boolean;
  right: boolean;
  jump: boolean;
  slide: boolean;
}

export const NO_INPUT: RushInput = { left: false, right: false, jump: false, slide: false };

export interface RushState {
  seed: number;
  rng: number;

  /** Pista alvo (lógica). */
  lane: Lane;
  /** Posição lateral suave, em pistas (para desenhar e colidir). */
  laneX: number;
  /** Altura dos pés acima do chão. */
  y: number;
  vy: number;
  slideTime: number;

  speed: number;
  distance: number;
  time: number;
  coins: number;
  score: number;
  lives: number;
  shield: boolean;
  invuln: number;
  over: boolean;

  obstacles: Obstacle[];
  pickups: Pickup[];
  nextId: number;
  nextRow: number;
  /** Metros até o próximo spawn (negativo = deve spawnar agora). */
  nextRowIn: number;
}

/* ───────── RNG determinístico (mulberry32) ───────── */
function rand(s: RushState): number {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createState(seed = 1): RushState {
  return {
    seed,
    rng: seed | 0,
    lane: 0,
    laneX: 0,
    y: 0,
    vy: 0,
    slideTime: 0,
    speed: BASE_SPEED,
    distance: 0,
    time: 0,
    coins: 0,
    score: 0,
    lives: START_LIVES,
    shield: false,
    invuln: 0,
    over: false,
    obstacles: [],
    pickups: [],
    nextId: 1,
    nextRow: 1,
    // Primeira fileira a 35 m: dá ~3 s para o jogador entender os controles.
    nextRowIn: -(SPAWN_Z - 35),
  };
}

/* ───────── Consultas ───────── */
export const isGrounded = (s: RushState): boolean => s.y <= 0;
export const isSliding = (s: RushState): boolean => s.slideTime > 0;

/** Distância mínima entre fileiras: sempre dá tempo de reagir e trocar de pista. */
export function rowGap(speed: number): number {
  return speed * 0.85 + 8;
}

/** O obstáculo acerta o jogador (ignorando invulnerabilidade)? */
export function obstacleHits(s: RushState, o: Obstacle): boolean {
  if (o.z >= PLAYER_Z1 || o.z + o.len <= PLAYER_Z0) return false;
  if (Math.abs(s.laneX - o.lane) >= LANE_REACH) return false;
  switch (o.kind) {
    case "train":
      return true;
    case "barrier":
      return s.y < BARRIER_H;
    case "bar":
      return !(isSliding(s) && s.y < 0.25);
  }
}

function pickupReached(s: RushState, p: Pickup): boolean {
  if (p.z >= PLAYER_Z1 + 0.4 || p.z <= PLAYER_Z0 - 0.4) return false;
  if (Math.abs(s.laneX - p.lane) >= LANE_REACH + 0.1) return false;
  return p.h === 1 ? s.y > COIN_AIR_MIN_Y : s.y < COIN_GROUND_MAX_Y;
}

/* ───────── Spawner ───────── */
const OBSTACLE_LEN: Record<Exclude<ObstacleKind, "train">, number> = { barrier: 0.8, bar: 0.8 };

function makeObstacle(s: RushState, row: number, kind: ObstacleKind, lane: Lane, z: number): Obstacle {
  const len = kind === "train" ? 7 + rand(s) * 7 : OBSTACLE_LEN[kind];
  return { id: s.nextId++, row, kind, lane, z, len };
}

function allowedKinds(distance: number): ObstacleKind[] {
  const kinds: ObstacleKind[] = ["barrier"];
  if (distance >= 60) kinds.push("bar");
  if (distance >= 120) kinds.push("train");
  return kinds;
}

function shuffledLanes(s: RushState): Lane[] {
  const l = [...LANES];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

/**
 * Cria uma fileira em `z`. Garantia de justiça: ou sobra uma pista totalmente
 * livre, ou todas as pistas ocupadas são transponíveis (pulo/deslize) — nunca
 * existe uma fileira sem saída.
 */
export function spawnRow(s: RushState, z: number): Obstacle[] {
  const row = s.nextRow++;
  const kinds = allowedKinds(s.distance);
  const order = shuffledLanes(s);
  const pickKind = () => kinds[Math.floor(rand(s) * kinds.length)];

  const roll = rand(s);
  let blocked: Lane[];
  let wallKind: ObstacleKind | null = null;
  if (s.distance < 120 || roll < 0.35) {
    blocked = [order[0]];
  } else if (s.distance >= 500 && roll > 0.85) {
    // Parede: as 3 pistas ocupadas, mas só por barreiras/barras transponíveis.
    blocked = [...order];
    wallKind = rand(s) < 0.5 ? "barrier" : "bar";
  } else {
    blocked = [order[0], order[1]];
  }

  const obstacles = blocked.map((lane) => makeObstacle(s, row, wallKind ?? pickKind(), lane, z));
  s.obstacles.push(...obstacles);

  const span = Math.max(...obstacles.map((o) => o.len));
  const freeLane = LANES.find((l) => !blocked.includes(l));

  // Recompensas.
  if (freeLane !== undefined && rand(s) < 0.8) {
    const n = Math.max(4, Math.min(8, Math.floor(span / 2.2)));
    for (let i = 0; i < n; i++) {
      s.pickups.push({ id: s.nextId++, kind: "coin", lane: freeLane, z: z + i * 2.2, h: 0 });
    }
  }
  for (const o of obstacles) {
    if (o.kind === "barrier" && rand(s) < 0.6) {
      for (const dz of [-1.6, 0.4, 2.4]) {
        s.pickups.push({ id: s.nextId++, kind: "coin", lane: o.lane, z: o.z + dz, h: 1 });
      }
    }
  }
  if (freeLane !== undefined && rand(s) < 0.07) {
    s.pickups.push({ id: s.nextId++, kind: "shield", lane: freeLane, z: z + span / 2, h: 0 });
  }

  s.nextRowIn = span + rowGap(s.speed) + rand(s) * 8;
  return obstacles;
}

/* ───────── Passo da simulação ───────── */
export function step(s: RushState, dt: number, input: RushInput): RushEvent[] {
  const events: RushEvent[] = [];
  if (s.over) return events;

  s.time += dt;

  /* Troca de pista (trava nas bordas) */
  if (input.left && s.lane > -1) {
    s.lane = (s.lane - 1) as Lane;
    events.push("switch");
  }
  if (input.right && s.lane < 1) {
    s.lane = (s.lane + 1) as Lane;
    events.push("switch");
  }
  const dx = s.lane - s.laneX;
  const maxMove = LANE_SWITCH_SPEED * dt;
  s.laneX = Math.abs(dx) <= maxMove ? s.lane : s.laneX + Math.sign(dx) * maxMove;

  /* Pulo e deslize */
  if (input.jump && isGrounded(s)) {
    s.vy = JUMP_V;
    s.y = 1e-6;
    s.slideTime = 0;
    events.push("jump");
  }
  if (input.slide) {
    if (!isGrounded(s)) s.vy = -FAST_FALL_V; // desce rápido para deslizar logo
    s.slideTime = SLIDE_TIME;
    events.push("slide");
  }
  if (s.y > 0) {
    s.vy -= GRAVITY * dt;
    s.y += s.vy * dt;
    if (s.y <= 0) {
      s.y = 0;
      s.vy = 0;
    }
  }
  if (s.slideTime > 0 && s.y <= 0) s.slideTime = Math.max(0, s.slideTime - dt);
  // Deslizar no ar não "guarda" o deslize: só começa a contar ao pousar.

  /* O mundo vem na direção do jogador */
  const dz = s.speed * dt;
  for (const o of s.obstacles) o.z -= dz;
  for (const p of s.pickups) p.z -= dz;
  s.obstacles = s.obstacles.filter((o) => o.z + o.len > -3);
  s.pickups = s.pickups.filter((p) => p.z > -3);

  s.nextRowIn -= dz;
  if (s.nextRowIn <= 0) spawnRow(s, SPAWN_Z + s.nextRowIn);

  /* Colisão */
  if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);
  if (s.invuln <= 0) {
    const hit = s.obstacles.find((o) => obstacleHits(s, o));
    if (hit) {
      s.obstacles = s.obstacles.filter((o) => o !== hit);
      if (s.shield) {
        s.shield = false;
        s.invuln = SHIELD_INVULN;
        events.push("shield-break");
      } else {
        s.lives -= 1;
        s.invuln = HIT_INVULN;
        events.push("hit");
        if (s.lives <= 0) {
          s.over = true;
          events.push("over");
        }
      }
    }
  }

  /* Coleta */
  s.pickups = s.pickups.filter((p) => {
    if (!pickupReached(s, p)) return true;
    if (p.kind === "coin") {
      s.coins += 1;
      events.push("coin");
    } else {
      s.shield = true;
      events.push("shield-pickup");
    }
    return false;
  });

  /* Progressão */
  s.distance += dz;
  s.speed = Math.min(MAX_SPEED, BASE_SPEED + s.distance / SPEED_RAMP);
  s.score = Math.floor(s.distance) + s.coins * COIN_VALUE;

  return events;
}
