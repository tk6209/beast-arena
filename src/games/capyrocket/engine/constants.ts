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

// Tiro automático.
export const BULLET_SPEED = 760;
export const BULLET_W = 18;
export const BULLET_H = 6;
export const FIRE_INTERVAL = 0.42;

// Inimigos.
export const ENEMY_W = 54;
export const ENEMY_H = 64;
export const ENEMY_HP = 2;
export const ENEMY_SPEED = -90; // avança em direção ao jogador

// Pickups.
export const PICKUP_W = 34;
export const PICKUP_H = 34;
export const PICKUP_MIN_GAP = 4;
export const PICKUP_RND_GAP = 3.5;

// Regras.
export const MAX_LIVES = 3;
export const INVULN_TIME = 1.3;
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
  enemy: "#7bdc8b",
  enemyDark: "#4fae62",
  enemyEye: "#13321a",
  bullet: "#ffe27a",
  bulletGlow: "#ffb347",
  star: "#ffd166",
  starGlow: "#fff3c4",
};
