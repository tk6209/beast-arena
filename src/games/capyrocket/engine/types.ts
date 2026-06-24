// Modelo de dados da engine — estrutura plana (sem hierarquia de classes) para
// manter a lógica pura e testável.

import type { BossKind } from "./characters";
import type { WeaponStats } from "./weapons";

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
  jumpsUsed: number;
  maxJumps: number; // 2 = pulo duplo (CapiNinja/Mágico etc.)
  /** 0 = em pé, 1 = totalmente agachado. Interpolado para transição suave. */
  crouchT: number;
  /** 0 = no chão, 1 = totalmente no ar. Interpolado para o tuck do pulo. */
  airT: number;
  /** Última velocidade vertical antes do contato com o chão (impacto). */
  landImpact: number;
  /** Direção para a qual o herói está virado (-1 esq, 1 dir). Persiste depois de soltar a tecla. */
  facingX: -1 | 1;
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
  pierce: number; // inimigos restantes que ainda pode atravessar
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
  name: string;
  body: string; // cor do corpo
  accent: string; // cor de realce
  kind: BossKind; // silhueta/adereços do chefe
}

export interface Pickup extends Rect {
  kind: "estrela";
  spin: number;
  taken: boolean;
}

// Refém — capivara amarrada à espera de resgate (corre até ele para libertar).
export interface Prisoner extends Rect {
  freed: boolean;
  bob: number; // acumulador de animação
}

// Vida extra (1-UP) — coletável raro que dá +1 vida.
export interface LifeUp extends Rect {
  taken: boolean;
  bob: number;
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

export type Phase = "playing" | "gameover" | "victory";

export interface GameState {
  phase: Phase;
  time: number;
  player: Player; // posição do herói no mundo (separada do scroll constante da câmera)
  /** Scroll da câmera no mundo (avança a ritmo constante — estilo Metal Slug). */
  camX: number;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyBullets: EnemyBullet[];
  hazards: Hazard[];
  pickups: Pickup[];
  crates: WeaponCrate[];
  prisoners: Prisoner[];
  lifeups: LifeUp[];
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
  prisonerTimer: number;
  lifeTimer: number;
  rescued: number;
  bossesDefeated: number;
  special: { id: "shotgun" | "bazooka"; ammo: number } | null;
  // Personagem selecionado.
  charId: string;
  charName: string;
  charWeapon: WeaponStats;
  dodge: number; // chance de ignorar dano
  healEvery: number; // seg p/ recuperar vida (0 = não)
  healTimer: number;
  maxLives: number;
  spawner: SpawnerState;
  highscore: number;
}

export interface InputState {
  jumpQueued: boolean;
  /** -1 = recuar, 0 = corrida automática, 1 = avançar mais rápido. */
  moveX: -1 | 0 | 1;
  /** Mantém o herói agachado (desvia de tiros altos, ocupa menos espaço). */
  crouch: boolean;
  /** Direção de mira horizontal (-1 esquerda, 0 nenhuma, 1 direita) baseada nas setas mantidas. */
  aimX: -1 | 0 | 1;
  /** Direção de mira vertical (-1 cima, 0 frente, 1 baixo) baseada nas setas mantidas. */
  aimY: -1 | 0 | 1;
}

export interface HudSnapshot {
  score: number;
  lives: number;
  wave: number;
  phase: Phase;
  highscore: number;
  bossHp: number; // 0..1 (0 = sem chefe)
  bossName: string; // nome do chefe ativo
  weapon: string; // nome da arma ativa
  ammo: number; // munição da arma especial (0 = arma base)
  charName: string; // personagem em jogo
  rescued: number; // reféns resgatados
  chapter: string; // título do capítulo atual
  chapterN: number; // número do capítulo (dispara o banner ao mudar)
}

export type SpawnCommand = { type: "enemy" };
