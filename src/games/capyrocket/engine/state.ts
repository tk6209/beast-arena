import {
  GROUND_Y,
  HAZARD_MIN_GAP,
  HAZARD_RND_GAP,
  MAX_LIVES,
  PICKUP_MIN_GAP,
  PICKUP_RND_GAP,
  PLAYER_H,
  PLAYER_W,
} from "./constants";
import { loadHighscore } from "./scoring";
import { createSpawner } from "./spawner";
import type { GameState, Player } from "./types";

function createPlayer(): Player {
  return {
    x: 0,
    y: GROUND_Y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    onGround: true,
    invuln: 0,
    animPhase: 0,
    muzzle: 0,
  };
}

export function createInitialState(): GameState {
  return {
    phase: "playing",
    time: 0,
    player: createPlayer(),
    enemies: [],
    bullets: [],
    enemyBullets: [],
    hazards: [],
    pickups: [],
    particles: [],
    boss: null,
    lastBossWave: 0,
    score: 0,
    combo: 0,
    lives: MAX_LIVES,
    shake: 0,
    fireCooldown: 0,
    pickupTimer: PICKUP_MIN_GAP + Math.random() * PICKUP_RND_GAP,
    hazardTimer: HAZARD_MIN_GAP + Math.random() * HAZARD_RND_GAP,
    spawner: createSpawner(),
    highscore: loadHighscore(),
  };
}

/** Reseta tudo preservando o recorde já carregado. */
export function resetState(state: GameState): void {
  const fresh = createInitialState();
  fresh.highscore = state.highscore;
  Object.assign(state, fresh);
}
