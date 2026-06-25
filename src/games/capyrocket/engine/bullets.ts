import { MUZZLE_TIME, VIRT_W } from "./constants";
import { muzzlePoint, facingDir } from "./geometry";
import { makeBullet } from "./entities";
import { activeWeapon } from "./weapons";
import { capiSfx } from "../vendor/sfx";
import type { GameState, InputState } from "./types";

/**
 * Tiro automático: a capivara dispara pra frente conforme a arma ATIVA (tier da
 * jornada ou arma especial da caixa). Suporta tiro espalhado (escopeta) e
 * foguete (bazuca). Consome munição da arma especial.
 */
export function updateBullets(state: GameState, dt: number, input?: InputState): void {
  const p = state.player;
  state.fireCooldown -= dt;

  if (state.fireCooldown <= 0) {
    const w = activeWeapon(state);
    state.fireCooldown += w.fireInterval;

    // Mira sempre horizontal, na MESMA direção em que o sprite está virado:
    // atira sempre pra FRENTE do personagem. Como `facingX` só vira pra -1
    // enquanto o jogador segura ←, o tiro sai pra trás somente quando o herói
    // realmente está olhando pra trás.
    // Direção do tiro: joystick de mira (aimX/aimY). Sem mira → para a FRENTE.
    const ax = input?.aimX ?? 0;
    const ay = input?.aimY ?? 0;
    let dx: number;
    let dy: number;
    if (ax !== 0 || ay !== 0) {
      const len = Math.hypot(ax, ay) || 1;
      dx = ax / len;
      dy = ay / len;
    } else {
      dx = facingDir(p);
      dy = 0;
    }
    // Origem do tiro = ponta do cano do sprite (fonte única: geometry.ts).
    const m = muzzlePoint(p);
    const muzzleX = m.x;
    const muzzleY = m.y;
    const n = w.pellets;
    // Vetor perpendicular para distribuir o espalhamento da escopeta.
    const perpX = -dy;
    const perpY = dx;
    for (let i = 0; i < n; i++) {
      const spread = n > 1 ? (i / (n - 1) - 0.5) * 2 * w.spread : 0;
      const vx = dx * w.bulletSpeed + perpX * spread;
      const vy = dy * w.bulletSpeed + perpY * spread;
      state.bullets.push(
        makeBullet(muzzleX, muzzleY, {
          vx,
          vy,
          damage: w.damage,
          kind: w.kind,
          pierce: w.pierce,
          w: w.kind === "rocket" ? 26 : undefined,
          h: w.kind === "rocket" ? 12 : undefined,
        }),
      );
    }
    p.muzzle = MUZZLE_TIME;
    capiSfx.shoot();

    // Consome munição da arma especial.
    if (state.special) {
      state.special.ammo -= 1;
      if (state.special.ammo <= 0) state.special = null;
    }
  }

  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }

  state.bullets = state.bullets.filter(
    (b) =>
      b.life > 0 &&
      b.x < state.camX + VIRT_W + 200 &&
      b.x > state.camX - 200 &&
      b.y > -200 &&
      b.y < 900,
  );
}
