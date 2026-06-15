import {
  BULLET_H,
  BULLET_SPEED,
  BULLET_W,
  ENEMY_H,
  ENEMY_HP,
  ENEMY_SPEED,
  ENEMY_W,
  GROUND_Y,
  PICKUP_H,
  PICKUP_W,
} from "./constants";
import type { Bullet, Enemy, Particle, Pickup } from "./types";

export function makeBullet(x: number, y: number): Bullet {
  return { x, y, w: BULLET_W, h: BULLET_H, vx: BULLET_SPEED, life: 2 };
}

export function makeWalker(x: number): Enemy {
  return {
    x,
    y: GROUND_Y - ENEMY_H,
    w: ENEMY_W,
    h: ENEMY_H,
    vx: ENEMY_SPEED,
    hp: ENEMY_HP,
    kind: "walker",
    dead: false,
  };
}

export function makeStar(x: number, y: number): Pickup {
  return { x, y, w: PICKUP_W, h: PICKUP_H, kind: "estrela", spin: 0, taken: false };
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
