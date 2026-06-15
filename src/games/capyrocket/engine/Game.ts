import { hapticHeavy } from "../vendor/haptic";
import { capiSfx } from "../vendor/sfx";
import { updateBoss } from "./boss";
import { updateBullets } from "./bullets";
import { aabbOverlap } from "./collision";
import {
  BOSS_WAVE,
  FIXED_DT,
  GROUND_Y,
  HAZARD_MIN_GAP,
  HAZARD_RND_GAP,
  INVULN_TIME,
  PICKUP_H,
  PICKUP_MIN_GAP,
  PICKUP_RND_GAP,
  PLAYER_SCREEN_X,
  VIRT_H,
  VIRT_W,
} from "./constants";
import { updateEnemies, updateEnemyBullets, updateHazards } from "./enemies";
import { makeBoss, makeHazard, makeShooter, makeStar, makeTank, makeWalker } from "./entities";
import { InputManager } from "./input";
import { spawnPoof, spawnSparkle, updateParticles } from "./particles";
import { updatePlayer } from "./player";
import { draw } from "./render";
import {
  addDistance,
  bestScore,
  registerBossKill,
  registerKill,
  registerPickup,
  resetCombo,
  saveHighscore,
} from "./scoring";
import { createInitialState, resetState } from "./state";
import { tickSpawner } from "./spawner";
import type { Enemy, GameState, HudSnapshot } from "./types";

type HudListener = (snap: HudSnapshot) => void;

/**
 * Orquestrador do jogo: dono do canvas, loop de timestep fixo, input e estado.
 * Vive fora do React — o React só monta o canvas e lê o snapshot do HUD.
 */
export class Game {
  private state: GameState = createInitialState();
  private input = new InputManager();

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private animId = 0;
  private lastTs = 0;
  private acc = 0;

  private listeners = new Set<HudListener>();
  private lastSnap: HudSnapshot | null = null;

  /* ── ciclo de vida ── */

  mount(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", this.resize);
    this.input.attach({
      onJump: () => this.queueJump(),
      onRestart: () => this.restart(),
    });
    this.notify(true);
    this.lastTs = performance.now();
    this.animId = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.animId);
    window.removeEventListener("resize", this.resize);
    this.input.detach();
    this.listeners.clear();
    this.canvas = null;
    this.ctx = null;
  }

  /* ── input vindo do React/teclado ── */

  queueJump(): void {
    if (this.state.phase === "gameover") {
      this.restart();
      return;
    }
    this.input.state.jumpQueued = true;
  }

  restart(): void {
    resetState(this.state);
    this.notify(true);
  }

  /* ── HUD ── */

  subscribe(cb: HudListener): () => void {
    this.listeners.add(cb);
    cb(this.snapshot());
    return () => this.listeners.delete(cb);
  }

  private snapshot(): HudSnapshot {
    const s = this.state;
    return {
      score: Math.floor(s.score),
      lives: s.lives,
      wave: s.spawner.wave,
      phase: s.phase,
      highscore: s.highscore,
      bossHp: s.boss ? s.boss.hp / s.boss.maxHp : 0,
    };
  }

  private notify(force = false): void {
    const snap = this.snapshot();
    const prev = this.lastSnap;
    const changed =
      force ||
      !prev ||
      prev.score !== snap.score ||
      prev.lives !== snap.lives ||
      prev.wave !== snap.wave ||
      prev.phase !== snap.phase ||
      prev.highscore !== snap.highscore ||
      Math.abs(prev.bossHp - snap.bossHp) > 0.01;
    if (changed) {
      this.lastSnap = snap;
      this.listeners.forEach((cb) => cb(snap));
    }
  }

  /* ── loop ── */

  private loop = (now: number): void => {
    let dt = (now - this.lastTs) / 1000;
    this.lastTs = now;
    if (dt > 0.1) dt = 0.1; // guarda de troca de aba
    this.acc += dt;
    while (this.acc >= FIXED_DT) {
      this.update(FIXED_DT);
      this.acc -= FIXED_DT;
    }
    this.render();
    this.notify();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const s = this.state;
    if (s.phase !== "playing") return;

    s.time += dt;
    updatePlayer(s, dt, this.input.state);
    addDistance(s, dt);

    const bossActive = !!s.boss;

    // Chefe a cada BOSS_WAVE ondas (uma vez por marco). Pausa spawns normais.
    if (!bossActive && s.spawner.wave % BOSS_WAVE === 0 && s.spawner.wave !== s.lastBossWave) {
      s.lastBossWave = s.spawner.wave;
      s.boss = makeBoss(s.player.x + VIRT_W + 80);
      s.enemies = [];
      s.hazards = [];
    }

    if (bossActive) {
      updateBoss(s, dt);
    } else {
      // Diretor de ondas → spawn de inimigos com variedade por onda.
      const cmds = tickSpawner(s.spawner, dt);
      for (let i = 0; i < cmds.length; i++) this.spawnEnemy();

      // Obstáculos de chão num timer próprio (a partir da onda 2).
      s.hazardTimer -= dt;
      if (s.hazardTimer <= 0) {
        s.hazardTimer = HAZARD_MIN_GAP + Math.random() * HAZARD_RND_GAP;
        if (s.spawner.wave >= 2) this.spawnHazard();
      }
    }

    // Estrelas num timer próprio.
    s.pickupTimer -= dt;
    if (s.pickupTimer <= 0) {
      s.pickupTimer = PICKUP_MIN_GAP + Math.random() * PICKUP_RND_GAP;
      this.spawnPickup();
    }

    updateBullets(s, dt);
    updateEnemies(s, dt);
    updateEnemyBullets(s, dt);
    updateHazards(s);
    updateParticles(s, dt);
    for (const pk of s.pickups) pk.spin += dt * 3;
    s.pickups = s.pickups.filter((pk) => !pk.taken && pk.x > s.player.x - 200);

    this.handleCollisions();

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 60);
  }

  /** Escolhe o tipo de inimigo conforme a onda (dificuldade crescente). */
  private spawnEnemy(): void {
    const wave = this.state.spawner.wave;
    const aheadX = this.state.player.x + (VIRT_W - PLAYER_SCREEN_X) + 40;
    const roll = Math.random();
    let enemy: Enemy;
    if (wave >= 3 && roll < 0.22) {
      enemy = makeTank(aheadX);
    } else if (wave >= 2 && roll < 0.6) {
      enemy = makeShooter(aheadX);
    } else {
      enemy = makeWalker(aheadX);
    }
    this.state.enemies.push(enemy);
  }

  private spawnHazard(): void {
    const aheadX = this.state.player.x + (VIRT_W - PLAYER_SCREEN_X) + 50;
    this.state.hazards.push(makeHazard(aheadX));
  }

  private spawnPickup(): void {
    const aheadX = this.state.player.x + (VIRT_W - PLAYER_SCREEN_X) + 60;
    const y = GROUND_Y - PICKUP_H - (50 + Math.random() * 120);
    this.state.pickups.push(makeStar(aheadX, y));
  }

  private handleCollisions(): void {
    const s = this.state;
    const playerRect = { x: s.player.x, y: s.player.y, w: s.player.w, h: s.player.h };

    // Balas do jogador vs inimigos.
    for (const b of s.bullets) {
      if (b.life <= 0) continue;
      for (const e of s.enemies) {
        if (e.dead) continue;
        if (aabbOverlap(b, e)) {
          b.life = 0;
          e.hp -= 1;
          if (e.hp <= 0) {
            e.dead = true;
            registerKill(s);
            spawnPoof(s, e.x + e.w / 2, e.y + e.h / 2);
            capiSfx.poof();
            s.shake = Math.max(s.shake, 6);
          }
          break;
        }
      }
    }

    // Balas do jogador vs chefe.
    if (s.boss && !s.boss.entering) {
      for (const b of s.bullets) {
        if (b.life <= 0) continue;
        if (aabbOverlap(b, s.boss)) {
          b.life = 0;
          s.boss.hp -= 1;
          if (s.boss.hp <= 0) {
            this.killBoss();
            break;
          }
        }
      }
    }

    // Projéteis inimigos vs jogador (desvia-se pulando).
    if (s.player.invuln <= 0) {
      for (const b of s.enemyBullets) {
        if (b.life <= 0) continue;
        if (aabbOverlap(playerRect, b)) {
          b.life = 0;
          this.damagePlayer();
          break;
        }
      }
    }

    // Inimigos / obstáculos / corpo do chefe vs jogador.
    if (s.player.invuln <= 0) {
      let hit = false;
      for (const e of s.enemies) {
        if (!e.dead && aabbOverlap(playerRect, e)) { hit = true; break; }
      }
      if (!hit) {
        for (const h of s.hazards) {
          if (aabbOverlap(playerRect, h)) { hit = true; break; }
        }
      }
      if (!hit && s.boss && aabbOverlap(playerRect, s.boss)) hit = true;
      if (hit) this.damagePlayer();
    }

    // Jogador vs estrelas.
    for (const pk of s.pickups) {
      if (pk.taken) continue;
      if (aabbOverlap(playerRect, pk)) {
        pk.taken = true;
        registerPickup(s);
        spawnSparkle(s, pk.x + pk.w / 2, pk.y + pk.h / 2);
        capiSfx.pickup();
      }
    }
  }

  private killBoss(): void {
    const s = this.state;
    const boss = s.boss;
    if (!boss) return;
    registerBossKill(s);
    // Explosão grande child-safe.
    for (let i = 0; i < 4; i++) {
      spawnPoof(s, boss.x + Math.random() * boss.w, boss.y + Math.random() * boss.h);
    }
    capiSfx.poof();
    capiSfx.gameover();
    s.shake = Math.max(s.shake, 20);
    s.enemyBullets = [];
    s.boss = null;
  }

  private damagePlayer(): void {
    const s = this.state;
    s.lives -= 1;
    s.player.invuln = INVULN_TIME;
    resetCombo(s);
    s.shake = Math.max(s.shake, 12);
    capiSfx.hit();
    hapticHeavy();
    if (s.lives <= 0) {
      s.lives = 0;
      s.phase = "gameover";
      s.highscore = bestScore(s.highscore, Math.floor(s.score));
      saveHighscore(s.highscore);
      capiSfx.gameover();
    }
  }

  /* ── render ── */

  private resize = (): void => {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    this.canvas.width = Math.floor(cw * this.dpr);
    this.canvas.height = Math.floor(ch * this.dpr);
  };

  private render(): void {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas) return;

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    // Reset + clear na escala de device pixels.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#11151f";
    ctx.fillRect(0, 0, cw, ch);

    // Escala de letterbox para encaixar a resolução virtual.
    const scale = Math.min(cw / VIRT_W, ch / VIRT_H);
    const ox = (cw - VIRT_W * scale) / 2;
    const oy = (ch - VIRT_H * scale) / 2;

    // Screen-shake (offset em px virtuais).
    const sh = this.state.shake;
    const shx = sh > 0 ? (Math.random() * 2 - 1) * sh : 0;
    const shy = sh > 0 ? (Math.random() * 2 - 1) * sh : 0;

    ctx.translate(ox + shx * scale, oy + shy * scale);
    ctx.scale(scale, scale);

    // Recorta na área virtual (esconde o que vaza no shake).
    ctx.beginPath();
    ctx.rect(0, 0, VIRT_W, VIRT_H);
    ctx.clip();

    draw(ctx, this.state);
  }
}
