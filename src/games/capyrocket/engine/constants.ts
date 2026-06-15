// Resolução virtual fixa (16:9). Tudo no jogo é desenhado nessas coordenadas e
// escalado pra caber no canvas com letterbox — física determinística em qualquer tela.
export const VIRT_W = 960;
export const VIRT_H = 540;

// Linha do chão (y dos "pés" das entidades).
export const GROUND_Y = 472;

// Posição horizontal fixa do herói na tela (o mundo rola, ele não anda lateral).
export const PLAYER_SCREEN_X = 220;
export const PLAYER_W = 62;
export const PLAYER_H = 84;

// Física (px / s).
export const GRAVITY = 2600;
export const JUMP_V = -940;
export const RUN_SPEED = 320; // avanço do mundo
export const FIXED_DT = 1 / 60;

// Tiro automático do jogador.
export const BULLET_SPEED = 820;
export const BULLET_W = 20;
export const BULLET_H = 6;
export const FIRE_INTERVAL = 0.34;
export const MUZZLE_TIME = 0.07;

// Inimigos a pé (walker).
export const ENEMY_W = 50;
export const ENEMY_H = 66;
export const ENEMY_HP = 2;
export const ENEMY_SPEED = -120; // avança em direção ao jogador

// Atirador — para a uma distância e dispara projéteis (pular pra desviar).
export const SHOOTER_W = 50;
export const SHOOTER_H = 70;
export const SHOOTER_HP = 3;
export const SHOOTER_SPEED = -95;
export const SHOOTER_FIRE_INTERVAL = 1.5;

// Tanque — blindado, muita vida, avança lento e dispara obuses.
export const TANK_W = 104;
export const TANK_H = 76;
export const TANK_HP = 12;
export const TANK_SPEED = -60;
export const TANK_FIRE_INTERVAL = 2.2;

// Projétil inimigo (na altura do tronco em pé — desvia-se pulando).
export const EBULLET_SPEED = -480;
export const EBULLET_W = 16;
export const EBULLET_H = 12;
export const EBULLET_Y = GROUND_Y - 52;

// Obstáculo de chão (mina) — imune a tiros; desvia-se pulando.
export const HAZARD_W = 42;
export const HAZARD_H = 32;
export const HAZARD_MIN_GAP = 2.4;
export const HAZARD_RND_GAP = 2.6;

// Chefe — a cada BOSS_WAVE ondas.
export const BOSS_WAVE = 5;
export const BOSS_W = 196;
export const BOSS_H = 150;
export const BOSS_HP = 46;
export const BOSS_FIRE_INTERVAL = 1.15;
// Distância à frente (no mundo) onde o chefe se posiciona.
export const BOSS_HOLD_AHEAD = VIRT_W - PLAYER_SCREEN_X - BOSS_W - 70;

// Pickups.
export const PICKUP_W = 34;
export const PICKUP_H = 34;
export const PICKUP_MIN_GAP = 5;
export const PICKUP_RND_GAP = 4;

// Regras.
export const MAX_LIVES = 3;
export const INVULN_TIME = 1.4;
export const HIGHSCORE_KEY = "capy_highscore";

// Paleta (campo de batalha cartoon ao entardecer, estilo Metal Slug).
export const COLORS = {
  skyTop: "#2b3a5e",
  skyMid: "#6b5a86",
  skyBot: "#d98c5f",
  hillFar: "#3a4a63",
  hillNear: "#2a3548",
  building: "#1f2738",
  buildingLit: "#2c374f",
  groundTop: "#6b5536",
  groundBot: "#3d3020",
  groundLine: "#8a6e44",
  // Capivara soldado.
  fur: "#b9763f",
  furDark: "#9a5e2e",
  furLight: "#cf8c54",
  helmet: "#5a6b3f",
  helmetDark: "#46532f",
  vest: "#4a5a36",
  vestDark: "#36421f",
  gunMetal: "#3a3f47",
  gunDark: "#23262c",
  muzzle: "#ffe9a3",
  // Inimigos.
  enemy: "#7bdc8b",
  enemyDark: "#4fae62",
  enemyEye: "#13321a",
  tank: "#8a8f7a",
  tankDark: "#5e6350",
  ebullet: "#ff7b5a",
  ebulletGlow: "#ffb37a",
  hazard: "#cfa14a",
  hazardDark: "#7a5e22",
  boss: "#6b7280",
  bossDark: "#3f444e",
  bossAccent: "#ff8a4a",
  bullet: "#ffe27a",
  bulletGlow: "#ffb347",
  star: "#ffd166",
  starGlow: "#fff3c4",
  hpBack: "#2a2f1c",
  hpFill: "#ff6b4a",
};
