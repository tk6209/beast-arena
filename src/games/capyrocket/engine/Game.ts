import { loadAssets, type GameAssets } from "../assets";
import { hapticHeavy } from "../vendor/haptic";
import { capiSfx } from "../vendor/sfx";
import { updateBullets } from "./bullets";
import { aabbOverlap } from "./collision";
import {
  FIXED_DT,
  GROUND_Y,
  INVULN_TIME,
  PICKUP_H,
  PICKUP_MIN_GAP,
  PICKUP_RND_GAP,
  PLAYER_SCREEN_X,
  VIRT_H,
  VIRT_W,
} from "./constants";
import { updateEnemies } from "./enemies";
import { makeStar, makeWalker } from "./entities";
import { InputManager } from "./input";
import { spawnPoof, spawnSparkle, updateParticles } from "./particles";
import { updatePlayer } from "./player";
import { draw } from "./render";
import {
  addDistance,
  bestScore,
  registerKill,
  registerPickup,
  resetCombo,
  saveHighscore,
} from "./scoring";
import { createInitialState, resetState } from "./state";
import { tickSpawner } from "./spawner";
import type { GameState, HudSnapshot } from "./types";

type HudListener = (snap: HudSnapshot) => void;

/**
 * Orquestrador do jogo: dono do canvas, loop de timestep fixo, input e estado.
 * Vive fora do React — o React só monta o canvas e lê o snapshot do HUD.
 */
export class Game {
  private state: GameState = createInitialState();
  private input = new InputManager();
  private assets: GameAssets | null = null;

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
    loadAssets().then((a) => {
      this.assets = a;
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
      prev.highscore !== snap.highscore;
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

    // Spawn de inimigos pelo diretor de ondas.
    const cmds = tickSpawner(s.spawner, dt);
    for (let i = 0; i < cmds.length; i++) this.spawnEnemy();

    // Spawn de estrelas num timer próprio.
    s.pickupTimer -= dt;
    if (s.pickupTimer <= 0) {
      s.pickupTimer = PICKUP_MIN_GAP + Math.random() * PICKUP_RND_GAP;
      this.spawnPickup();
    }

    updateBullets(s, dt);
    updateEnemies(s, dt);
    updateParticles(s, dt);
    for (const pk of s.pickups) pk.spin += dt * 3;
    s.pickups = s.pickups.filter((pk) => !pk.taken && pk.x > s.player.x - 200);

    this.handleCollisions();

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 60);
  }

  private spawnEnemy(): void {
    const aheadX = this.state.player.x + (VIRT_W - PLAYER_SCREEN_X) + 40;
    this.state.enemies.push(makeWalker(aheadX));
  }

  private spawnPickup(): void {
    const aheadX = this.state.player.x + (VIRT_W - PLAYER_SCREEN_X) + 60;
    const y = GROUND_Y - PICKUP_H - (40 + Math.random() * 120);
    this.state.pickups.push(makeStar(aheadX, y));
  }

  private handleCollisions(): void {
    const s = this.state;
    const playerRect = { x: s.player.x, y: s.player.y, w: s.player.w, h: s.player.h };

    // Balas vs inimigos.
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

    // Jogador vs inimigos.
    if (s.player.invuln <= 0) {
      for (const e of s.enemies) {
        if (e.dead) continue;
        if (aabbOverlap(playerRect, e)) {
          this.damagePlayer();
          break;
        }
      }
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

    draw(ctx, this.state, this.assets);
  }
}
