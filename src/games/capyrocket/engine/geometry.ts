// ─────────────────────────────────────────────────────────────────────────
// Geometria canônica do herói — FONTE ÚNICA DE VERDADE.
//
// Sprite, hitbox de dano e ponta da arma derivam todos daqui, garantindo que
// o que se VÊ (sprite), o que MACHUCA (hitbox) e de onde os tiros SAEM (cano)
// fiquem sempre coerentes. As invariantes estão especificadas em SPEC.md e
// travadas por testes em __tests__/specs.test.ts.
// ─────────────────────────────────────────────────────────────────────────
import { PLAYER_H, PLAYER_W } from "./constants";
import type { Player } from "./types";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Escala do sprite visual em relação à hitbox lógica (o desenho é maior). */
export const SPRITE_SCALE = 1.18;

// Hitbox de DANO: bem menor que o corpo visível, para que "quase-acertos"
// (passar raspando por uma mina) não contem como dano. [SPEC: COL-1]
export const HIT_INSET_X = 13; // recuo por lado (esquerda/direita)
export const HIT_INSET_TOP = 14; // recuo no topo (cabeça/orelhas não contam)

// Arma: cano à frente do centro, na altura do peito do sprite. [SPEC: GEO-1]
export const MUZZLE_FORWARD = PLAYER_W / 2 + 6;
export const MUZZLE_HEIGHT_FRAC = 0.42; // fração da ALTURA do sprite, a partir do topo

// Mina: o NÚCLEO que machuca é menor que o desenho — recuo lateral + só a parte
// de baixo conta, para que um pulinho já limpe e raspar de lado não doa.
// [SPEC: COL-5]
export const HAZARD_INSET_X = 8;
export const HAZARD_CORE_TOP_FRAC = 0.45;

/** Direção horizontal para a qual o herói aponta (1 = direita, -1 = esquerda). */
export function facingDir(p: Player): 1 | -1 {
  return p.facingX === -1 ? -1 : 1;
}

/** Caixa de colisão de DANO (mundo) — inset do corpo; base nos pés. */
export function playerHitbox(p: Player): Box {
  return {
    x: p.x + HIT_INSET_X,
    y: p.y + HIT_INSET_TOP,
    w: p.w - HIT_INSET_X * 2,
    h: p.h - HIT_INSET_TOP,
  };
}

/** Caixa generosa para COLETA (estrelas, caixas, reféns) — corpo cheio. */
export function playerPickupBox(p: Player): Box {
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

/** Topo do sprite no mundo (pés no chão; sprite mais alto que a hitbox). */
export function spriteTopY(p: Player): number {
  const feetY = p.y + p.h;
  return feetY - PLAYER_H * SPRITE_SCALE;
}

/** Núcleo de DANO de uma mina (inset do desenho; só a parte de baixo machuca). */
export function hazardHitbox(h: Box): Box {
  const cut = h.h * HAZARD_CORE_TOP_FRAC;
  return { x: h.x + HAZARD_INSET_X, y: h.y + cut, w: h.w - HAZARD_INSET_X * 2, h: h.h - cut };
}

/** Ponta do cano (origem das balas e do flash) em coordenadas de MUNDO. */
export function muzzlePoint(p: Player): { x: number; y: number } {
  const cx = p.x + p.w / 2;
  return {
    x: cx + facingDir(p) * MUZZLE_FORWARD,
    y: spriteTopY(p) + PLAYER_H * SPRITE_SCALE * MUZZLE_HEIGHT_FRAC,
  };
}
