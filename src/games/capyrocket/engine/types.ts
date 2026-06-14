// Modelo de dados da engine — estrutura plana (sem hierarquia de classes) para
// manter a lógica pura e testável.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player extends Rect {
  vy: number;
  onGround: boolean;
  invuln: number; // segundos restantes de invulnerabilidade
  animPhase: number; // acumulador pra bob/tilt da corrida
}

export type EnemyKind = "walker";

export interface Enemy extends Rect {
  vx: number; // velocidade no mundo (negativa = avança da direita p/ esquerda)
  hp: number;
  kind: EnemyKind;
  dead: boolean;
}

export interface Bullet extends Rect {
  vx: number;
  life: number; // segundos restantes
}

export interface Pickup extends Rect {
  kind: "estrela";
  spin: number;
  taken: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SpawnerState {
  timer: number;
  interval: number;
  wave: number;
  enemiesPerWave: number;
  leftInWave: number;
}

export type Phase = "playing" | "gameover";

export interface GameState {
  phase: Phase;
  time: number;
  player: Player; // player.x é o progresso no mundo (a câmera deriva dele)
  enemies: Enemy[];
  bullets: Bullet[];
  pickups: Pickup[];
  particles: Particle[];
  score: number;
  combo: number;
  lives: number;
  shake: number;
  fireCooldown: number;
  pickupTimer: number;
  spawner: SpawnerState;
  highscore: number;
}

export interface InputState {
  jumpQueued: boolean;
}

export interface HudSnapshot {
  score: number;
  lives: number;
  wave: number;
  phase: Phase;
  highscore: number;
}

export type SpawnCommand = { type: "enemy" };
