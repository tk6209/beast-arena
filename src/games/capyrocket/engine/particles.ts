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

export function updateParticles(state: GameState, dt: number): void {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 520 * dt; // gravidadezinha
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}
