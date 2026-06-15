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
  animPhase: number; // acumulador pra ciclo de corrida
  muzzle: number; // timer do flash do cano
}

export type EnemyKind = "walker" | "shooter" | "tank";

export interface Enemy extends Rect {
  vx: number; // velocidade no mundo (negativa = avança da direita p/ esquerda)
  hp: number;
  maxHp: number;
  kind: EnemyKind;
  dead: boolean;
  fireCooldown: number; // só shooter/tank
  legPhase: number;
}

export interface Bullet extends Rect {
  vx: number;
  vy: number;
  life: number; // segundos restantes
  damage: number;
  kind: "normal" | "rocket";
}

// Caixa de arma — coletada correndo; concede uma arma especial temporária.
export interface WeaponCrate extends Rect {
  weapon: "shotgun" | "bazooka";
  ammo: number;
  taken: boolean;
}

// Projétil inimigo — viaja para a esquerda na altura do tronco; desvia-se pulando.
export interface EnemyBullet extends Rect {
  vx: number;
  life: number;
}

// Obstáculo de chão — imune a tiros; desvia-se pulando.
export interface Hazard extends Rect {
  kind: "mina";
}

export interface Boss extends Rect {
  hp: number;
  maxHp: number;
  fireCooldown: number;
  entering: boolean;
  phase: number; // acumulador de animação
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
  enemyBullets: EnemyBullet[];
  hazards: Hazard[];
  pickups: Pickup[];
  crates: WeaponCrate[];
  particles: Particle[];
  boss: Boss | null;
  lastBossWave: number;
  score: number;
  combo: number;
  lives: number;
  shake: number;
  fireCooldown: number;
  pickupTimer: number;
  hazardTimer: number;
  crateTimer: number;
  special: { id: "shotgun" | "bazooka"; ammo: number } | null;
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
  bossHp: number; // 0..1 (0 = sem chefe)
  weapon: string; // nome da arma ativa
  ammo: number; // munição da arma especial (0 = arma base)
}

export type SpawnCommand = { type: "enemy" };
