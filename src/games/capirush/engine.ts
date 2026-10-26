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

import { BIOME_CITY_END, BIOME_CYCLE, BIOME_JUNGLE_END, BIOME_JUNGLE_START } from "./biome";

/* ───────── Constantes de jogo (fonte única de verdade) ───────── */
export type Lane = -1 | 0 | 1;
export const LANES: readonly Lane[] = [-1, 0, 1];

export const SPAWN_Z = 70;
export const LANE_SWITCH_SPEED = 10; // pistas por segundo
export const GRAVITY = 26;
export const JUMP_V = 7.6;
export const DOUBLE_JUMP_V = 7.0;
export const FAST_FALL_V = 14;
export const SLIDE_TIME = 0.7;

export const BASE_SPEED = 11;
export const MAX_SPEED = 25;
/**
 * Escala da curva de velocidade (metros). A velocidade se aproxima do teto de forma
 * contínua: ~63% do ganho em 800 m, ~92% em 2 km. Antes subia em linha reta e
 * travava no máximo aos ~980 m — dali em diante a corrida não ficava mais difícil.
 */
export const SPEED_SCALE = 800;
/** Metros por nível (o HUD anuncia cada nível novo). */
export const LEVEL_EVERY = 500;
/** Tropeço ao levar dano: perde até 30% da velocidade e recupera em ~2,5 s. */
export const STUMBLE_SLOW = 0.3;
export const STUMBLE_TIME = 2.5;

export const START_LIVES = 3;
export const HIT_INVULN = 1.5;
export const SHIELD_INVULN = 0.7;
export const COIN_VALUE = 10;

/** A checkpoint gate every N metres: losing all lives lets you continue from the last one passed. */
export const CHECKPOINT_EVERY = 500;
/** Grace period after continuing, so the first row never hits instantly. */
export const CONTINUE_INVULN = 2.5;

/* Poderes (segundos) */
export const MAGNET_TIME = 9;
export const JET_TIME = 5;
export const MULTI_TIME = 12;
/** Altura do voo do foguete (acima de trens de 2,5 m). */
export const JET_ALT = 3.4;
export const JET_SPEED_MULT = 1.4;
export const JET_END_INVULN = 1.6;
/** Alcance (em z) e força com que o ímã puxa as moedas. */
export const MAGNET_RANGE = 18;
export const MAGNET_PULL = 16;

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

export type PickupKind = "coin" | "shield" | "magnet" | "jet" | "multi" | "gift";
export type PowerKind = "shield" | "magnet" | "jet" | "multi";
/** O que a caixa-presente pode conter. */
export const GIFT_POOL: readonly PowerKind[] = ["shield", "magnet", "jet", "multi"];

export interface Pickup {
  id: number;
  kind: PickupKind;
  /** Pista; vira fracionária quando o ímã puxa a moeda. */
  lane: number;
  z: number;
  /** 0 = no chão, 1 = no ar (acima das barreiras: exige pulo). */
  h: 0 | 1;
  /** Puxada pelo ímã: ignora a altura. */
  pulled?: boolean;
}

export type RushEvent =
  | "switch"
  | "jump"
  | "double-jump"
  | "slide"
  | "coin"
  | "shield-pickup"
  | "magnet-pickup"
  | "jet-pickup"
  | "jet-end"
  | "multi-pickup"
  | "gift"
  | "shield-break"
  | "hit"
  | "level"
  | "checkpoint"
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
  /** Pulos extras disponíveis no ar (recarrega ao pousar). */
  jumpsLeft: number;

  speed: number;
  distance: number;
  time: number;
  coins: number;
  score: number;
  lives: number;
  shield: boolean;
  /** Segundos restantes de cada poder (0 = inativo). */
  magnet: number;
  jet: number;
  multi: number;
  /** Pontos extras acumulados pelo multiplicador. */
  bonus: number;
  invuln: number;
  /** 1 logo após um tombo, decai até 0: segura a velocidade para o jogador se recompor. */
  stumble: number;
  /** Nível atual (1, 2, 3…), derivado da distância. */
  level: number;
  /** Pista livre da última fileira (para o padrão zigue-zague). */
  lastFree: Lane | null;
  over: boolean;

  obstacles: Obstacle[];
  pickups: Pickup[];
  nextId: number;
  nextRow: number;
  /** Metros até o próximo spawn (negativo = deve spawnar agora). */
  nextRowIn: number;

  /** Distância do próximo portal de checkpoint. */
  nextCheckpoint: number;
  /** Último checkpoint atravessado (null = nenhum ainda). */
  checkpoint: Checkpoint | null;
}

export interface Checkpoint {
  distance: number;
  coins: number;
  bonus: number;
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
    jumpsLeft: 1,
    speed: BASE_SPEED,
    distance: 0,
    time: 0,
    coins: 0,
    score: 0,
    lives: START_LIVES,
    shield: false,
    magnet: 0,
    jet: 0,
    multi: 0,
    bonus: 0,
    invuln: 0,
    stumble: 0,
    level: 1,
    lastFree: null,
    over: false,
    obstacles: [],
    pickups: [],
    nextId: 1,
    nextRow: 1,
    // Primeira fileira a 35 m: dá ~3 s para o jogador entender os controles.
    nextRowIn: -(SPAWN_Z - 35),
    nextCheckpoint: CHECKPOINT_EVERY,
    checkpoint: null,
  };
}

/**
 * Nova corrida a partir do último checkpoint: mesma distância, moedas e bônus
 * (logo o mesmo placar), vidas cheias, pista limpa e uns segundos de proteção.
 * Retorna null se nenhum checkpoint foi atravessado.
 */
export function continueFromCheckpoint(prev: RushState, seed: number): RushState | null {
  const cp = prev.checkpoint;
  if (!cp) return null;
  const s = createState(seed);
  s.distance = cp.distance;
  s.coins = cp.coins;
  s.bonus = cp.bonus;
  s.speed = speedAt(s.distance);
  s.level = levelAt(s.distance);
  s.score = Math.floor(s.distance) + s.coins * COIN_VALUE + s.bonus;
  s.checkpoint = { ...cp };
  s.nextCheckpoint = cp.distance + CHECKPOINT_EVERY;
  s.invuln = CONTINUE_INVULN;
  return s;
}

/* ───────── Consultas ───────── */
export const isGrounded = (s: RushState): boolean => s.y <= 0;
export const isSliding = (s: RushState): boolean => s.slideTime > 0;

/* ───────── Curva de dificuldade ───────── */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Velocidade-alvo para a distância percorrida (sem o tropeço). */
export function speedAt(distance: number): number {
  return Math.min(MAX_SPEED, BASE_SPEED + (MAX_SPEED - BASE_SPEED) * (1 - Math.exp(-distance / SPEED_SCALE)));
}

export function levelAt(distance: number): number {
  return 1 + Math.floor(Math.max(0, distance) / LEVEL_EVERY);
}

/**
 * Pressão dos desafios de 0 a 1. Começa a subir quando entram os trens (120 m) e
 * continua crescendo por ~1,5 km: mais fileiras com 2 pistas bloqueadas, mais
 * paredes, menos folga entre fileiras e mais zigue-zague.
 */
export function pressureAt(distance: number): number {
  return clamp01((distance - 120) / 1500);
}

/**
 * Trechos de respiro: durante a troca de bioma (cidade ↔ selva) só vêm fileiras
 * simples e com mais folga. A virada de cenário vira um momento de alívio e
 * recompensa, e a tensão volta logo depois.
 */
export function isBreather(distance: number): boolean {
  const c = ((distance % BIOME_CYCLE) + BIOME_CYCLE) % BIOME_CYCLE;
  return (c >= BIOME_CITY_END && c < BIOME_JUNGLE_START) || c >= BIOME_JUNGLE_END;
}

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
  // Voando ou puxada pelo ímã: a altura não importa.
  if (s.jet > 0 || p.pulled) return true;
  return p.h === 1 ? s.y > COIN_AIR_MIN_Y : s.y < COIN_GROUND_MAX_Y;
}

function givePower(s: RushState, kind: PowerKind, events: RushEvent[]): void {
  switch (kind) {
    case "shield":
      s.shield = true;
      events.push("shield-pickup");
      break;
    case "magnet":
      s.magnet = MAGNET_TIME;
      events.push("magnet-pickup");
      break;
    case "jet":
      s.jet = JET_TIME;
      s.vy = 0;
      s.slideTime = 0;
      events.push("jet-pickup");
      break;
    case "multi":
      s.multi = MULTI_TIME;
      events.push("multi-pickup");
      break;
  }
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
  // A fileira nasce ~70 m à frente: o respiro vale para onde ela será ENCONTRADA,
  // senão as fileiras difíceis geradas antes da troca de bioma chegam durante ela.
  const breather = isBreather(s.distance + z);
  const p = breather ? 0 : pressureAt(s.distance);
  const kinds = breather ? allowedKinds(s.distance).filter((k) => k !== "train") : allowedKinds(s.distance);
  const order = shuffledLanes(s);
  const pickKind = () => kinds[Math.floor(rand(s) * kinds.length)];

  const roll = rand(s);
  // Chance de bloquear só 1 pista cai de 75% (logo após os trens) para 30%.
  const pSingle = lerp(0.75, 0.3, p);
  // Paredes (3 pistas, todas transponíveis) a partir de 450 m: 8% → 22%.
  const pWall = s.distance >= 450 ? lerp(0.08, 0.22, clamp01((s.distance - 450) / 1500)) : 0;
  let blocked: Lane[];
  let wallKind: ObstacleKind | null = null;
  if (s.distance < 120 || breather || roll < pSingle) {
    blocked = [order[0]];
  } else if (!breather && roll > 1 - pWall) {
    // Parede: as 3 pistas ocupadas, mas só por barreiras/barras transponíveis.
    blocked = [...order];
    wallKind = rand(s) < 0.5 ? "barrier" : "bar";
  } else {
    blocked = [order[0], order[1]];
  }
  // Zigue-zague: com mais pressão, a pista livre tende a mudar de uma fileira para a
  // outra, obrigando o jogador a se mexer (em vez de ficar parado numa pista segura).
  if (blocked.length < 3 && s.lastFree !== null && rand(s) < lerp(0, 0.65, p)) {
    const free = LANES.filter((l) => !blocked.includes(l));
    // Fecha a pista que estava livre e libera a última bloqueada no lugar dela.
    if (free.length === 1 && free[0] === s.lastFree) blocked = [...blocked.slice(0, -1), free[0]];
  }

  const obstacles = blocked.map((lane) => makeObstacle(s, row, wallKind ?? pickKind(), lane, z));
  s.obstacles.push(...obstacles);

  const span = Math.max(...obstacles.map((o) => o.len));
  const freeLane = LANES.find((l) => !blocked.includes(l));
  s.lastFree = freeLane ?? null;

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
  if (freeLane !== undefined) {
    // Poderes e presentes: raros, sempre na pista livre e logo depois da fileira.
    const r = rand(s);
    let kind: PickupKind | null = null;
    if (r < 0.035) kind = "shield";
    else if (r < 0.065) kind = "magnet";
    else if (r < 0.085 && s.distance >= 150) kind = "jet";
    else if (r < 0.115) kind = "multi";
    else if (r < 0.15) kind = "gift";
    if (kind) s.pickups.push({ id: s.nextId++, kind, lane: freeLane, z: z + span + 2, h: 0 });
  }
  // Voando de foguete: trilha de moedas no ar para recompensar o voo.
  if (s.jet > 0) {
    const lane = LANES[Math.floor(rand(s) * LANES.length)];
    for (let i = 0; i < 6; i++) s.pickups.push({ id: s.nextId++, kind: "coin", lane, z: z + i * 2.2, h: 1 });
  }

  // Folga extra aleatória diminui com a pressão (10 m → 3 m); no respiro fica larga.
  const slack = breather ? 14 : lerp(10, 3, p);
  s.nextRowIn = span + rowGap(s.speed) + rand(s) * slack;
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

  /* Foguete: voa em altitude fixa e ignora pulo/deslize */
  const flying = s.jet > 0;
  if (flying) {
    s.jet = Math.max(0, s.jet - dt);
    s.y += (JET_ALT - s.y) * Math.min(1, 6 * dt);
    s.vy = 0;
    s.slideTime = 0;
    s.jumpsLeft = 1;
    if (s.jet === 0) {
      s.invuln = Math.max(s.invuln, JET_END_INVULN);
      events.push("jet-end");
    }
  } else {
    /* Pulo (e pulo duplo no ar) e deslize */
    if (input.jump) {
      if (isGrounded(s)) {
        s.vy = JUMP_V;
        s.y = 1e-6;
        s.slideTime = 0;
        s.jumpsLeft = 1;
        events.push("jump");
      } else if (s.jumpsLeft > 0) {
        s.jumpsLeft -= 1;
        s.vy = DOUBLE_JUMP_V;
        s.slideTime = 0;
        events.push("double-jump");
      }
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
        s.jumpsLeft = 1;
      }
    }
    if (s.slideTime > 0 && s.y <= 0) s.slideTime = Math.max(0, s.slideTime - dt);
    // Deslizar no ar não "guarda" o deslize: só começa a contar ao pousar.
  }
  s.magnet = Math.max(0, s.magnet - dt);
  s.multi = Math.max(0, s.multi - dt);

  /* O mundo vem na direção do jogador */
  const dz = s.speed * dt * (s.jet > 0 ? JET_SPEED_MULT : 1);
  for (const o of s.obstacles) o.z -= dz;
  for (const p of s.pickups) p.z -= dz;
  s.obstacles = s.obstacles.filter((o) => o.z + o.len > -3);
  s.pickups = s.pickups.filter((p) => p.z > -3);

  /* Ímã: moedas próximas voam até o jogador, em qualquer pista */
  if (s.magnet > 0) {
    for (const p of s.pickups) {
      if (p.kind !== "coin" || p.z <= 0.2 || p.z > MAGNET_RANGE) continue;
      p.pulled = true;
      const d = s.laneX - p.lane;
      p.lane += Math.sign(d) * Math.min(Math.abs(d), MAGNET_PULL * dt);
      p.z -= 7 * dt;
    }
  }

  s.nextRowIn -= dz;
  if (s.nextRowIn <= 0) spawnRow(s, SPAWN_Z + s.nextRowIn);

  /* Colisão */
  if (s.invuln > 0) s.invuln = Math.max(0, s.invuln - dt);
  if (s.invuln <= 0 && s.jet <= 0) {
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
        s.stumble = 1;
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
    switch (p.kind) {
      case "coin":
        s.coins += 1;
        if (s.multi > 0) s.bonus += COIN_VALUE;
        events.push("coin");
        break;
      case "gift":
        events.push("gift");
        givePower(s, GIFT_POOL[Math.floor(rand(s) * GIFT_POOL.length)], events);
        break;
      default:
        givePower(s, p.kind, events);
    }
    return false;
  });

  /* Progressão */
  s.distance += dz;
  s.stumble = Math.max(0, s.stumble - dt / STUMBLE_TIME);
  s.speed = speedAt(s.distance) * (1 - STUMBLE_SLOW * s.stumble);
  const level = levelAt(s.distance);
  if (level > s.level) {
    s.level = level;
    events.push("level");
  }
  s.score = Math.floor(s.distance) + s.coins * COIN_VALUE + s.bonus;

  /* Checkpoint: só conta se o herói ainda está de pé ao cruzar o portal. */
  if (!s.over && s.distance >= s.nextCheckpoint) {
    s.checkpoint = { distance: s.nextCheckpoint, coins: s.coins, bonus: s.bonus };
    s.nextCheckpoint += CHECKPOINT_EVERY;
    events.push("checkpoint");
  }

  return events;
}
