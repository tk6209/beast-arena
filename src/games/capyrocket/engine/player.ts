import { GROUND_Y, JUMP_V, PLAYER_H, PLAYER_W, RUN_SPEED, VIRT_W } from "./constants";
import { applyGravity, groundClamp, integrateY } from "./physics";
import { hapticLight } from "../vendor/haptic";
import { capiSfx } from "../vendor/sfx";
import type { GameState, InputState } from "./types";

/**
 * Atualiza o jogador: corrida automática (avanço no mundo), pulo de toque único
 * (só quando no chão) e gravidade. O input só carrega `jumpQueued`.
 */
export function updatePlayer(state: GameState, dt: number, input: InputState): void {
  const p = state.player;

  // Agachar reduz a altura (desvia de tiros altos). Só no chão. Interpolado
  // suavemente em `crouchT` para a animação não "estalar".
  const wantsCrouch = input.crouch && p.onGround;
  const crouchSpeed = 12; // 1/0.08s para subir/descer
  p.crouchT = approach(p.crouchT, wantsCrouch ? 1 : 0, crouchSpeed * dt);
  const targetH = Math.round(PLAYER_H * (1 - 0.45 * p.crouchT));
  if (p.h !== targetH) {
    const wasOnGround = p.onGround;
    p.h = targetH;
    p.w = PLAYER_W; // largura constante (estabilidade da hitbox horizontal)
    if (wasOnGround) p.y = GROUND_Y - p.h;
  }

  // Pulo cancela o agachado.
  if (input.jumpQueued && !wantsCrouch && p.jumpsUsed < p.maxJumps) {
    p.vy = JUMP_V;
    p.onGround = false;
    p.jumpsUsed += 1;
    capiSfx.jump();
    hapticLight();
  }
  input.jumpQueued = false;

  const wasOnGround = p.onGround;
  const preLandVy = p.vy;

  applyGravity(p, dt);
  integrateY(p, dt);
  groundClamp(p);
  if (p.onGround) p.jumpsUsed = 0;

  // Aterrissagem: registra o impacto (Game.ts converte em shake/haptic).
  if (!wasOnGround && p.onGround) {
    p.landImpact = Math.min(1, preLandVy / 1200);
  } else {
    p.landImpact *= 0.8;
  }

  // Suaviza o estado de "no ar" para a pose do pulo.
  p.airT = approach(p.airT, p.onGround ? 0 : 1, 16 * dt);

  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
  if (p.muzzle > 0) p.muzzle = Math.max(0, p.muzzle - dt);

  // Latch da direção para qual o herói está virado — usado para tiro e sprite.
  if (input.aimX === 1 || input.moveX === 1) p.facingX = 1;
  else if (input.aimX === -1 || input.moveX === -1) p.facingX = -1;

  // Cadência da corrida acompanha a velocidade real (parece mais natural).
  p.animPhase += dt * (1 + 0.4 * (input.moveX === 1 ? 1 : 0) - 0.4 * p.crouchT);

  // Estilo Metal Slug: a CÂMERA rola a ritmo constante (em Game.ts). As setas
  // só deslocam o herói DENTRO da tela — nunca alteram o scroll do mundo.
  // Base = velocidade da câmera (RUN_SPEED) → herói parado na tela.
  // Avançar → desliza para a direita; recuar → desliza para a esquerda.
  const drift = 180;
  let speed = RUN_SPEED;
  if (input.moveX === 1) speed = RUN_SPEED + drift;
  else if (input.moveX === -1) speed = RUN_SPEED - drift;
  if (p.crouchT > 0.1) speed -= drift * 0.35 * p.crouchT;
  p.x += speed * dt;

  // Clamp na "tela visível": o herói não sai do quadro nem cai atrás da borda.
  const minX = state.camX + 40;
  const maxX = state.camX + VIRT_W - p.w - 60;
  if (p.x < minX) p.x = minX;
  else if (p.x > maxX) p.x = maxX;
}

function approach(current: number, target: number, step: number): number {
  if (current < target) return Math.min(target, current + step);
  if (current > target) return Math.max(target, current - step);
  return current;
}
