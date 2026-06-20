import { CHARACTERS, type CharacterConfig } from "./characters";
import {
  CRATE_MIN_GAP,
  CRATE_RND_GAP,
  GROUND_Y,
  HAZARD_MIN_GAP,
  HAZARD_RND_GAP,
  PICKUP_MIN_GAP,
  PICKUP_RND_GAP,
  PLAYER_H,
  PLAYER_SCREEN_X,
  PLAYER_W,
  PRISONER_MIN_GAP,
  PRISONER_RND_GAP,
} from "./constants";
import { loadHighscore } from "./scoring";
import { createSpawner } from "./spawner";
import type { GameState, Player } from "./types";

function createPlayer(maxJumps: number): Player {
  return {
    x: PLAYER_SCREEN_X,
    y: GROUND_Y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    onGround: true,
    invuln: 0,
    animPhase: 0,
    muzzle: 0,
    jumpsUsed: 0,
    maxJumps,
    crouchT: 0,
    airT: 0,
    landImpact: 0,
    facingX: 1,
  };
}

export function createInitialState(character: CharacterConfig = CHARACTERS[0]): GameState {
  return {
    phase: "playing",
    time: 0,
    player: createPlayer(character.jumps),
    camX: 0,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    hazards: [],
    pickups: [],
    crates: [],
    prisoners: [],
    particles: [],
    boss: null,
    lastBossWave: 0,
    score: 0,
    combo: 0,
    lives: character.lives,
    shake: 0,
    fireCooldown: 0,
    pickupTimer: PICKUP_MIN_GAP + Math.random() * PICKUP_RND_GAP,
    hazardTimer: HAZARD_MIN_GAP + Math.random() * HAZARD_RND_GAP,
    crateTimer: CRATE_MIN_GAP + Math.random() * CRATE_RND_GAP,
    prisonerTimer: PRISONER_MIN_GAP + Math.random() * PRISONER_RND_GAP,
    rescued: 0,
    special: null,
    charId: character.id,
    charName: character.name,
    charWeapon: character.weapon,
    dodge: character.dodge,
    healEvery: character.healEvery,
    healTimer: character.healEvery,
    maxLives: character.lives,
    spawner: createSpawner(),
    highscore: loadHighscore(),
  };
}

/** Reseta tudo preservando o recorde e o personagem selecionado. */
export function resetState(state: GameState, character: CharacterConfig): void {
  const fresh = createInitialState(character);
  fresh.highscore = state.highscore;
  Object.assign(state, fresh);
}
