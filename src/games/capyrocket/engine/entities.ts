import {
  BOSS_FIRE_INTERVAL,
  BOSS_H,
  BOSS_HP,
  BOSS_W,
  BULLET_H,
  BULLET_SPEED,
  BULLET_W,
  CRATE_H,
  CRATE_W,
  EBULLET_H,
  EBULLET_SPEED,
  EBULLET_W,
  ENEMY_H,
  ENEMY_HP,
  ENEMY_SPEED,
  ENEMY_W,
  GROUND_Y,
  HAZARD_H,
  HAZARD_W,
  PICKUP_H,
  PICKUP_W,
  PRISONER_H,
  PRISONER_W,
  SHOOTER_FIRE_INTERVAL,
  SHOOTER_H,
  SHOOTER_HP,
  SHOOTER_SPEED,
  SHOOTER_W,
  TANK_FIRE_INTERVAL,
  TANK_H,
  TANK_HP,
  TANK_SPEED,
  TANK_W,
} from "./constants";
import type { BossDef } from "./characters";
import type { Boss, Bullet, Enemy, EnemyBullet, Hazard, Particle, Pickup, Prisoner, WeaponCrate } from "./types";

export function makeBullet(
  x: number,
  y: number,
  opts?: {
    vx?: number;
    vy?: number;
    damage?: number;
    kind?: "normal" | "rocket";
    w?: number;
    h?: number;
    pierce?: number;
  },
): Bullet {
  return {
    x,
    y,
    w: opts?.w ?? BULLET_W,
    h: opts?.h ?? BULLET_H,
    vx: opts?.vx ?? BULLET_SPEED,
    vy: opts?.vy ?? 0,
    life: 2,
    damage: opts?.damage ?? 1,
    kind: opts?.kind ?? "normal",
    pierce: opts?.pierce ?? 0,
  };
}

export function makeWeaponCrate(x: number, weapon: "shotgun" | "bazooka", ammo: number): WeaponCrate {
  return { x, y: GROUND_Y - CRATE_H, w: CRATE_W, h: CRATE_H, weapon, ammo, taken: false };
}

export function makeWalker(x: number): Enemy {
  return {
    x,
    y: GROUND_Y - ENEMY_H,
    w: ENEMY_W,
    h: ENEMY_H,
    vx: ENEMY_SPEED,
    hp: ENEMY_HP,
    maxHp: ENEMY_HP,
    kind: "walker",
    dead: false,
    fireCooldown: 0,
    legPhase: 0,
  };
}

export function makeShooter(x: number): Enemy {
  return {
    x,
    y: GROUND_Y - SHOOTER_H,
    w: SHOOTER_W,
    h: SHOOTER_H,
    vx: SHOOTER_SPEED,
    hp: SHOOTER_HP,
    maxHp: SHOOTER_HP,
    kind: "shooter",
    dead: false,
    fireCooldown: SHOOTER_FIRE_INTERVAL * 0.6,
    legPhase: 0,
  };
}

export function makeTank(x: number): Enemy {
  return {
    x,
    y: GROUND_Y - TANK_H,
    w: TANK_W,
    h: TANK_H,
    vx: TANK_SPEED,
    hp: TANK_HP,
    maxHp: TANK_HP,
    kind: "tank",
    dead: false,
    fireCooldown: TANK_FIRE_INTERVAL * 0.5,
    legPhase: 0,
  };
}

export function makeEnemyBullet(x: number, y: number): EnemyBullet {
  return { x, y, w: EBULLET_W, h: EBULLET_H, vx: EBULLET_SPEED, life: 4 };
}

export function makeHazard(x: number): Hazard {
  return { x, y: GROUND_Y - HAZARD_H, w: HAZARD_W, h: HAZARD_H, kind: "mina" };
}

export function makeBoss(x: number, def: BossDef): Boss {
  return {
    x,
    y: GROUND_Y - BOSS_H,
    w: BOSS_W,
    h: BOSS_H,
    hp: BOSS_HP,
    maxHp: BOSS_HP,
    fireCooldown: BOSS_FIRE_INTERVAL,
    entering: true,
    phase: 0,
    name: def.name,
    body: def.body,
    accent: def.accent,
    kind: def.kind,
  };
}

export function makeStar(x: number, y: number): Pickup {
  return { x, y, w: PICKUP_W, h: PICKUP_H, kind: "estrela", spin: 0, taken: false };
}

export function makePrisoner(x: number): Prisoner {
  return { x, y: GROUND_Y - PRISONER_H, w: PRISONER_W, h: PRISONER_H, freed: false, bob: 0 };
}

export function makeParticle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  life: number,
  color: string,
  size: number,
): Particle {
  return { x, y, vx, vy, life, maxLife: life, color, size };
}
