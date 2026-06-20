import { makeParticle } from "./entities";
import type { GameState } from "./types";

// Paleta pastel child-safe — nada de vermelho-sangue.
const POOF_COLORS = ["#fff3c4", "#ffe27a", "#bfe9c0", "#cdeaff", "#ffffff"];

/** Explosão "poof" de um inimigo: burst de círculos pastel. */
export function spawnPoof(state: GameState, x: number, y: number): void {
  const n = 12;
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const sp = 120 + Math.random() * 160;
    state.particles.push(
      makeParticle(
        x,
        y,
        Math.cos(ang) * sp,
        Math.sin(ang) * sp - 60,
        0.4 + Math.random() * 0.35,
        POOF_COLORS[(Math.random() * POOF_COLORS.length) | 0],
        4 + Math.random() * 6,
      ),
    );
  }
}

/** Faíscas douradas ao coletar estrela. */
export function spawnSparkle(state: GameState, x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI * 2 * i) / 8;
    state.particles.push(
      makeParticle(x, y, Math.cos(ang) * 140, Math.sin(ang) * 140, 0.35, "#ffd166", 3 + Math.random() * 3),
    );
  }
}

/**
 * Aterrissagem do pulo: poeira lateral no chão + anel neon ciano horizontal.
 * Puramente visual — não interfere em colisões.
 */
export function spawnLandingBurst(state: GameState, x: number, y: number, force = 1): void {
  const f = Math.min(1.4, Math.max(0.3, force));
  // Poeira: 8 partículas saindo lateralmente do pé do herói.
  const dustColors = ["#f3e2c4", "#dcc59a", "#ffffff", "#cdeaff"];
  for (let i = 0; i < 8; i++) {
    const side = i < 4 ? -1 : 1;
    const vx = side * (120 + Math.random() * 140) * f;
    const vy = -(40 + Math.random() * 80) * f;
    state.particles.push(
      makeParticle(
        x + side * 4,
        y - 2,
        vx,
        vy,
        0.32 + Math.random() * 0.18,
        dustColors[(Math.random() * dustColors.length) | 0],
        3 + Math.random() * 3,
      ),
    );
  }
  // Anel neon ciano: 14 partículas radiais quase horizontais (vy ~ 0).
  const ringColors = ["#00e5ff", "#7fd0e0", "#bff4ff"];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n;
    const sp = (180 + Math.random() * 80) * f;
    state.particles.push(
      makeParticle(
        x,
        y - 4,
        Math.cos(ang) * sp,
        Math.sin(ang) * sp * 0.18 - 20,
        0.28 + Math.random() * 0.12,
        ringColors[(Math.random() * ringColors.length) | 0],
        2.5 + Math.random() * 2.5,
      ),
    );
  }
}

export function updateParticles(state: GameState, dt: number): void {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 520 * dt; // gravidadezinha
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}
