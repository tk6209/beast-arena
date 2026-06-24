import { hapticHeavy } from "../vendor/haptic";
import { capiSfx } from "../vendor/sfx";
import { updateBoss } from "./boss";
import { updateBullets } from "./bullets";
import { aabbOverlap } from "./collision";
import { hazardHitbox, playerHitbox, playerPickupBox } from "./geometry";
import {
  BOSS_WAVE,
  CRATE_MIN_GAP,
  CRATE_RND_GAP,
  FIXED_DT,
  GROUND_Y,
  HAZARD_MIN_GAP,
  HAZARD_RND_GAP,
  INVULN_TIME,
  PICKUP_H,
  PICKUP_MIN_GAP,
  PICKUP_RND_GAP,
  PRISONER_BONUS,
  PRISONER_MIN_GAP,
  PRISONER_RND_GAP,
  ROCKET_SPLASH,
  RUN_SPEED,
  VIRT_H,
  VIRT_W,
} from "./constants";
import { updateEnemies, updateEnemyBullets, updateHazards } from "./enemies";
import {
  makeBoss,
  makeHazard,
  makePrisoner,
  makeShooter,
  makeStar,
  makeTank,
  makeWalker,
  makeWeaponCrate,
} from "./entities";
import { CRATE_WEAPONS, activeWeapon } from "./weapons";
import { bossForWave, getCharacter, type CharacterConfig } from "./characters";
import { InputManager } from "./input";
import { spawnLandingBurst, spawnPoof, spawnSparkle, updateParticles } from "./particles";
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
  private character: CharacterConfig;
  private state: GameState;
  private input = new InputManager();

  constructor(characterId?: string) {
    this.character = getCharacter(characterId ?? "peao");
    this.state = createInitialState(this.character);
  }

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

  setMoveX(dir: -1 | 0 | 1): void {
    this.input.state.moveX = dir;
  }

  setCrouch(on: boolean): void {
    this.input.state.crouch = on;
  }

  restart(): void {
    resetState(this.state, this.character);
    this.notify(true);
  }

  /** Troca o personagem ativo e recomeça (usado pela tela de seleção). */
  setCharacter(characterId: string): void {
    this.character = getCharacter(characterId);
    this.restart();
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
      bossName: s.boss ? s.boss.name : "",
      weapon: activeWeapon(s).name,
      ammo: s.special ? s.special.ammo : 0,
      charName: s.charName,
      rescued: s.rescued,
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
      prev.weapon !== snap.weapon ||
      prev.ammo !== snap.ammo ||
      prev.bossName !== snap.bossName ||
      prev.charName !== snap.charName ||
      prev.rescued !== snap.rescued ||
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

    // Câmera runner: avança sozinha a ritmo constante.
    s.camX += RUN_SPEED * dt;

    const bossActive = !!s.boss;

    // Chefe a cada BOSS_WAVE ondas (uma vez por marco). Pausa spawns normais.
    if (!bossActive && s.spawner.wave % BOSS_WAVE === 0 && s.spawner.wave !== s.lastBossWave) {
      s.lastBossWave = s.spawner.wave;
      s.boss = makeBoss(s.camX + VIRT_W + 80, bossForWave(s.spawner.wave));
      s.enemies = [];
      s.hazards = [];
    }

    // Regeneração do Capi Curandeiro.
    if (s.healEvery > 0 && s.lives < s.maxLives) {
      s.healTimer -= dt;
      if (s.healTimer <= 0) {
        s.healTimer = s.healEvery;
        s.lives += 1;
        spawnSparkle(s, s.player.x + s.player.w / 2, s.player.y);
        capiSfx.pickup();
      }
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

    // Caixas de arma especial num timer próprio.
    s.crateTimer -= dt;
    if (s.crateTimer <= 0) {
      s.crateTimer = CRATE_MIN_GAP + Math.random() * CRATE_RND_GAP;
      this.spawnCrate();
    }

    // Refém (Capi prisioneiro) num timer próprio — não durante o chefe.
    s.prisonerTimer -= dt;
    if (s.prisonerTimer <= 0) {
      s.prisonerTimer = PRISONER_MIN_GAP + Math.random() * PRISONER_RND_GAP;
      if (!bossActive && s.spawner.wave >= 2) this.spawnPrisoner();
    }
    for (const pr of s.prisoners) pr.bob += dt;

    updateBullets(s, dt, this.input.state);
    updateEnemies(s, dt);
    updateEnemyBullets(s, dt);
    updateHazards(s);
    updateParticles(s, dt);
    for (const pk of s.pickups) pk.spin += dt * 3;
    s.pickups = s.pickups.filter((pk) => !pk.taken && pk.x > s.camX - 200);
    s.crates = s.crates.filter((c) => !c.taken && c.x > s.camX - 200);
    s.prisoners = s.prisoners.filter((pr) => !pr.freed && pr.x > s.camX - 200);

    this.handleCollisions();

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 60);
  }

  /** Escolhe o tipo de inimigo conforme a onda (dificuldade crescente). */
  private spawnEnemy(): void {
    const wave = this.state.spawner.wave;
    const aheadX = this.state.camX + VIRT_W + 40;
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
    const aheadX = this.state.camX + VIRT_W + 50;
    this.state.hazards.push(makeHazard(aheadX));
  }

  private spawnPickup(): void {
    const aheadX = this.state.camX + VIRT_W + 60;
    const y = GROUND_Y - PICKUP_H - (50 + Math.random() * 120);
    this.state.pickups.push(makeStar(aheadX, y));
  }

  private spawnCrate(): void {
    const aheadX = this.state.camX + VIRT_W + 50;
    const pick = CRATE_WEAPONS[(Math.random() * CRATE_WEAPONS.length) | 0];
    this.state.crates.push(makeWeaponCrate(aheadX, pick.id as "shotgun" | "bazooka", pick.ammo));
  }

  private spawnPrisoner(): void {
    const aheadX = this.state.camX + VIRT_W + 60;
    this.state.prisoners.push(makePrisoner(aheadX));
  }

  private handleCollisions(): void {
    const s = this.state;
    // Geometria canônica (geometry.ts): hurtBox = dano (inset, perdoa raspões);
    // pickBox = coleta (corpo cheio, generoso).
    const hurtBox = playerHitbox(s.player);
    const pickBox = playerPickupBox(s.player);

    // Shake + VFX (poeira + anel neon ciano) de aterrissagem.
    if (s.player.landImpact > 0.35) {
      s.shake = Math.max(s.shake, 5 * s.player.landImpact);
      spawnLandingBurst(
        s,
        s.player.x + s.player.w / 2,
        s.player.y + s.player.h,
        0.6 + s.player.landImpact,
      );
      s.player.landImpact = 0;
    }

    // Balas do jogador vs inimigos e chefe.
    for (const b of s.bullets) {
      if (b.life <= 0) continue;

      // Foguete: explode em área no 1º contato.
      if (b.kind === "rocket") {
        let hit = false;
        for (const e of s.enemies) {
          if (!e.dead && aabbOverlap(b, e)) { hit = true; break; }
        }
        if (!hit && s.boss && !s.boss.entering && aabbOverlap(b, s.boss)) hit = true;
        if (hit) {
          b.life = 0;
          this.explodeRocket(b.x + b.w / 2, b.y + b.h / 2, b.damage);
        }
        continue;
      }

      // Normal/perfurante: atravessa até `pierce` inimigos antes de sumir.
      for (const e of s.enemies) {
        if (e.dead) continue;
        if (aabbOverlap(b, e)) {
          this.damageEnemy(e, b.damage);
          if (b.pierce > 0) b.pierce -= 1;
          else { b.life = 0; break; }
        }
      }
      if (b.life > 0 && s.boss && !s.boss.entering && aabbOverlap(b, s.boss)) {
        this.damageBoss(b.damage);
        if (b.pierce > 0) b.pierce -= 1;
        else b.life = 0;
      }
    }

    // Projéteis inimigos vs jogador (desvia-se pulando).
    if (s.player.invuln <= 0) {
      for (const b of s.enemyBullets) {
        if (b.life <= 0) continue;
        if (aabbOverlap(hurtBox, b)) {
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
        if (!e.dead && aabbOverlap(hurtBox, e)) { hit = true; break; }
      }
      if (!hit) {
        for (const h of s.hazards) {
          // Núcleo da mina (menor que o desenho) → pulinho já limpa, raspão não doa.
          if (aabbOverlap(hurtBox, hazardHitbox(h))) { hit = true; break; }
        }
      }
      if (!hit && s.boss && aabbOverlap(hurtBox, s.boss)) hit = true;
      if (hit) this.damagePlayer();
    }

    // Jogador vs estrelas.
    for (const pk of s.pickups) {
      if (pk.taken) continue;
      if (aabbOverlap(pickBox, pk)) {
        pk.taken = true;
        registerPickup(s);
        spawnSparkle(s, pk.x + pk.w / 2, pk.y + pk.h / 2);
        capiSfx.pickup();
      }
    }

    // Jogador vs caixas de arma (coletadas correndo).
    for (const c of s.crates) {
      if (c.taken) continue;
      if (aabbOverlap(pickBox, c)) {
        c.taken = true;
        s.special = { id: c.weapon, ammo: c.ammo };
        s.fireCooldown = 0; // dispara já com a arma nova
        spawnSparkle(s, c.x + c.w / 2, c.y + c.h / 2);
        capiSfx.pickup();
      }
    }

    // Jogador vs reféns (resgate: bônus + arma especial, estilo Metal Slug).
    for (const pr of s.prisoners) {
      if (pr.freed) continue;
      if (aabbOverlap(pickBox, pr)) {
        pr.freed = true;
        s.rescued += 1;
        s.score += PRISONER_BONUS;
        const drop = CRATE_WEAPONS[(Math.random() * CRATE_WEAPONS.length) | 0];
        s.special = { id: drop.id as "shotgun" | "bazooka", ammo: drop.ammo };
        s.fireCooldown = 0;
        spawnSparkle(s, pr.x + pr.w / 2, pr.y + 8);
        spawnSparkle(s, pr.x + pr.w / 2, pr.y + 24);
        s.shake = Math.max(s.shake, 8);
        capiSfx.pickup();
      }
    }
  }

  private damageEnemy(e: { hp: number; dead: boolean; x: number; y: number; w: number; h: number }, dmg: number): void {
    const s = this.state;
    e.hp -= dmg;
    if (e.hp <= 0) {
      e.dead = true;
      registerKill(s);
      spawnPoof(s, e.x + e.w / 2, e.y + e.h / 2);
      capiSfx.poof();
      s.shake = Math.max(s.shake, 6);
    }
  }

  private damageBoss(dmg: number): void {
    const s = this.state;
    if (!s.boss) return;
    s.boss.hp -= dmg;
    s.shake = Math.max(s.shake, 5);
    if (s.boss.hp <= 0) this.killBoss();
  }

  /** Explosão da bazuca: dano em área a todos os inimigos no raio + chefe. */
  private explodeRocket(cx: number, cy: number, dmg: number): void {
    const s = this.state;
    for (let i = 0; i < 5; i++) {
      spawnPoof(s, cx + (Math.random() * 2 - 1) * 30, cy + (Math.random() * 2 - 1) * 30);
    }
    capiSfx.poof();
    s.shake = Math.max(s.shake, 16);
    for (const e of s.enemies) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      if (Math.hypot(ex - cx, ey - cy) <= ROCKET_SPLASH) this.damageEnemy(e, dmg);
    }
    if (s.boss && !s.boss.entering) {
      const bx = s.boss.x + s.boss.w / 2;
      const by = s.boss.y + s.boss.h / 2;
      if (Math.hypot(bx - cx, by - cy) <= ROCKET_SPLASH + 80) this.damageBoss(dmg);
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
    // Esquiva: chance de ignorar o golpe (com um respiro de invulnerabilidade).
    if (s.dodge > 0 && Math.random() < s.dodge) {
      s.player.invuln = INVULN_TIME * 0.5;
      spawnSparkle(s, s.player.x + s.player.w / 2, s.player.y + s.player.h / 2);
      return;
    }
    s.lives -= 1;
    s.player.invuln = INVULN_TIME;
    s.special = null; // perde a arma especial ao levar dano (estilo Metal Slug)
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
