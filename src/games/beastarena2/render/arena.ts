import { Application, Assets, ColorMatrixFilter, Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { FLYING, MONSTER_ART } from "../assets";
import { ELEMENTO_INFO, MONSTERS } from "../engine/data";
import type { BattleEvent, CardDef, Efetividade, Elemento, MonsterDef, Side } from "../engine/types";
import { Animator, ease, lerp, rand } from "./anim";
import { Particles } from "./particles";
import { fxTextures, hexNum, paintBackdrop, PALETTES, type FxTextures, type Palette } from "./textures";
import { sfx } from "../sfx";

export interface Insets {
  top: number;
  bottom: number;
}

interface Rig {
  side: Side;
  def: MonsterDef;
  root: Container;
  body: Container;
  sprite: Sprite;
  shadow: Sprite;
  aura: Sprite;
  pad: Container;
  shield: Sprite;
  shieldOn: number;
  flash: ColorMatrixFilter;
  baseH: number;
  flying: boolean;
  lunge: { x: number; y: number; sx: number; sy: number; rot: number };
  statuses: { queimar: number; veneno: number; congelado: number; furia: number; evolucao: number; esquiva: number; espinhos: number };
  dead: boolean;
  phase: number;
  emitAcc: number;
}

const other = (s: Side): Side => (s === "player" ? "enemy" : "player");

export class Arena {
  readonly anim = new Animator();
  private app!: Application;
  private fx!: FxTextures;
  private parts = new Particles();
  private camera = new Container();
  private world = new Container();
  private bg = new Sprite();
  private bgKey = "";
  private rays: Sprite[] = [];
  private back = new Container();
  private front = new Container();
  private texts = new Container();
  private flashLayer = new Graphics();
  private rigs!: Record<Side, Rig>;
  private pal: Palette;
  private w = 1;
  private h = 1;
  private insets: Insets = { top: 0, bottom: 0 };
  private shake = 0;
  private zoom = 1;
  private destroyed = false;
  private moteAcc = 0;
  private reducedMotion = false;

  private constructor(private player: string, private enemy: string) {
    this.pal = PALETTES[MONSTERS[enemy].elemento];
  }

  static async create(host: HTMLElement, player: string, enemy: string): Promise<Arena> {
    const a = new Arena(player, enemy);
    try {
      await a.init(host);
    } catch (err) {
      a.destroy();
      throw err;
    }
    return a;
  }

  private async init(host: HTMLElement) {
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.app = new Application();
    await this.app.init({
      resizeTo: host,
      antialias: true,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      powerPreference: "high-performance",
    });
    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }
    host.appendChild(this.app.canvas);
    this.app.canvas.style.position = "absolute";
    this.app.canvas.style.inset = "0";
    this.fx = fxTextures();

    await Promise.all([Assets.load(MONSTER_ART[this.player]), Assets.load(MONSTER_ART[this.enemy])]);
    try {
      await document.fonts?.load("64px Bangers");
    } catch {
      /* font optional */
    }

    const stage = this.app.stage;
    stage.addChild(this.camera);
    this.camera.addChild(this.world);
    this.world.addChild(this.bg);
    for (let i = 0; i < 3; i++) {
      const r = new Sprite(this.fx.soft);
      r.anchor.set(0.5, 0);
      r.blendMode = "add";
      r.tint = hexNum(this.pal.glow);
      r.alpha = 0.12;
      this.rays.push(r);
      this.world.addChild(r);
    }
    this.world.addChild(this.back);
    this.rigs = { enemy: this.makeRig("enemy", this.enemy), player: this.makeRig("player", this.player) };
    this.world.addChild(this.rigs.enemy.pad, this.rigs.player.pad);
    this.world.addChild(this.rigs.enemy.root, this.rigs.player.root);
    this.world.addChild(this.parts.layer, this.front, this.texts);
    stage.addChild(this.flashLayer);

    this.app.ticker.add((t) => this.tick(t.deltaMS));
  }

  private makeRig(side: Side, id: string): Rig {
    const def = MONSTERS[id];
    const root = new Container();
    const body = new Container();
    const shadow = new Sprite(this.fx.soft);
    shadow.anchor.set(0.5);
    shadow.tint = 0x000000;
    shadow.alpha = 0.7;
    const aura = new Sprite(this.fx.soft);
    aura.anchor.set(0.5);
    aura.blendMode = "add";
    aura.tint = hexNum(def.cor);
    aura.alpha = 0.35;
    const sprite = new Sprite(Texture.from(MONSTER_ART[id]));
    sprite.anchor.set(0.5, 1);
    if (side === "player") sprite.scale.x = -1;
    const flash = new ColorMatrixFilter();
    const shield = new Sprite(this.fx.hex);
    shield.anchor.set(0.5);
    shield.alpha = 0;
    shield.blendMode = "add";
    root.addChild(shadow, body);
    body.addChild(aura, sprite, shield);

    const pad = new Container();
    const padGlow = new Sprite(this.fx.soft);
    padGlow.anchor.set(0.5);
    padGlow.tint = hexNum(def.cor);
    padGlow.blendMode = "add";
    padGlow.alpha = 0.55;
    const ring = new Graphics();
    pad.addChild(padGlow, ring);
    pad.label = "pad";

    return {
      side,
      def,
      root,
      body,
      sprite,
      shadow,
      aura,
      pad,
      shield,
      shieldOn: 0,
      flash,
      baseH: 100,
      flying: FLYING.has(id),
      lunge: { x: 0, y: 0, sx: 1, sy: 1, rot: 0 },
      statuses: { queimar: 0, veneno: 0, congelado: 0, furia: 0, evolucao: 0, esquiva: 0, espinhos: 0 },
      dead: false,
      phase: side === "player" ? 0 : Math.PI,
      emitAcc: 0,
    };
  }

  /* ---------------- Layout ---------------- */

  layout(w: number, h: number, insets: Insets) {
    if (!this.rigs) return;
    this.w = w;
    this.h = h;
    this.insets = insets;
    const portrait = h > w * 1.05;
    const top = insets.top;
    const ah = Math.max(120, h - insets.top - insets.bottom);
    const horizon = top + ah * (portrait ? 0.3 : 0.36);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Hand size changes trigger layout too; only repaint (and free the old canvas) when the backdrop really changes.
    const key = `${Math.round(w)}x${Math.round(h)}@${Math.round(horizon)}:${dpr}`;
    if (key !== this.bgKey) {
      const old = this.bgKey ? this.bg.texture : null;
      this.bg.texture = paintBackdrop(w, h, horizon, this.pal, dpr);
      this.bgKey = key;
      old?.destroy(true);
    }
    this.bg.width = w;
    this.bg.height = h;
    this.camera.pivot.set(w / 2, h / 2);
    this.camera.position.set(w / 2, h / 2);

    this.rays.forEach((r, i) => {
      r.position.set(w * (0.25 + i * 0.25), -h * 0.05);
      r.width = w * 0.35;
      r.height = horizon * 1.6;
    });

    const place = (rig: Rig, fx: number, fy: number, size: number) => {
      const x = w * fx;
      const y = top + ah * fy;
      rig.root.position.set(x, y);
      rig.pad.position.set(x, y);
      rig.baseH = size;
      const tex = rig.sprite.texture;
      const s = size / tex.height;
      rig.sprite.scale.set(rig.side === "player" ? -s : s, s);
      const sw = tex.width * s;
      rig.shadow.width = sw * 0.95;
      rig.shadow.height = sw * 0.22;
      rig.aura.width = sw * 1.6;
      rig.aura.height = size * 1.5;
      rig.aura.position.set(0, -size * 0.5);
      rig.shield.width = rig.shield.height = Math.max(sw, size) * 1.18;
      rig.shield.position.set(0, -size * 0.52);
      const padW = sw * 1.25;
      const g = rig.pad.getChildAt(0) as Sprite;
      g.width = padW * 1.3;
      g.height = padW * 0.38;
      const ring = rig.pad.getChildAt(1) as Graphics;
      ring.clear();
      ring.ellipse(0, 0, padW / 2, padW * 0.13).stroke({ width: 3, color: hexNum(rig.def.cor), alpha: 0.9 });
      ring.ellipse(0, 0, padW * 0.4, padW * 0.1).stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
    };

    const maxW = w * (portrait ? 0.55 : 0.34);
    const sizeFor = (id: string, target: number) => {
      const t = Texture.from(MONSTER_ART[id]);
      const aspect = t.width / t.height;
      return Math.min(target, maxW / aspect);
    };
    if (portrait) {
      place(this.rigs.enemy, 0.68, 0.47, sizeFor(this.enemy, ah * 0.3));
      place(this.rigs.player, 0.32, 0.9, sizeFor(this.player, ah * 0.42));
    } else {
      place(this.rigs.enemy, 0.7, 0.6, sizeFor(this.enemy, ah * 0.44));
      place(this.rigs.player, 0.29, 0.97, sizeFor(this.player, ah * 0.58));
    }
  }

  /** Screen position of a fighter's chest — used by the DOM layer to aim cards. */
  anchorOf(side: Side): { x: number; y: number } {
    const r = this.rigs?.[side];
    if (!r) return { x: this.w / 2, y: this.h / 2 };
    return { x: r.root.x, y: r.root.y - r.baseH * 0.55 };
  }

  /* ---------------- Frame loop ---------------- */

  private tick(deltaMs: number) {
    if (this.destroyed) return;
    const dt = this.anim.tick(deltaMs);
    const t = this.anim.now / 1000;
    this.parts.update(dt);

    // Camera shake & zoom
    this.shake *= Math.pow(0.86, deltaMs / 16.7);
    const s = this.reducedMotion ? 0 : this.shake;
    this.camera.position.set(this.w / 2 + rand(-s, s), this.h / 2 + rand(-s, s));
    this.zoom = lerp(this.zoom, 1, 1 - Math.pow(0.88, deltaMs / 16.7));
    this.camera.scale.set(this.zoom);

    this.rays.forEach((r, i) => {
      r.rotation = Math.sin(t * 0.2 + i * 2) * 0.25;
      r.alpha = 0.08 + Math.sin(t * 0.7 + i) * 0.04;
    });

    // Ambient motes
    this.moteAcc += dt;
    while (this.moteAcc > 140) {
      this.moteAcc -= 140;
      this.parts.spawn(this.fx.soft, {
        x: rand(0, this.w),
        y: this.h - this.insets.bottom * 0.5,
        vx: rand(-8, 8),
        vy: rand(-40, -18),
        life: rand(4000, 7000),
        scale: rand(0.03, 0.08),
        alpha: 0.7,
        alphaTo: 0,
        tint: this.pal.mote,
      });
    }

    for (const side of ["player", "enemy"] as Side[]) this.updateRig(this.rigs[side], t, dt);
  }

  private updateRig(r: Rig, t: number, dt: number) {
    const breathe = Math.sin(t * 2.4 + r.phase);
    const float = r.flying ? Math.sin(t * 1.6 + r.phase) * r.baseH * 0.05 - r.baseH * 0.12 : 0;
    const sx = r.dead ? 1 : 1 - breathe * 0.012;
    const sy = r.dead ? 1 : 1 + breathe * 0.022;
    r.body.position.set(r.lunge.x, float + r.lunge.y);
    r.body.scale.set(sx * r.lunge.sx, sy * r.lunge.sy);
    r.body.rotation = r.lunge.rot;
    const lift = r.flying ? Math.abs(float) / (r.baseH * 0.2) : 0;
    r.shadow.alpha = (r.dead ? 0.3 : 0.55) * (1 - lift * 0.4);
    r.shadow.position.set(r.lunge.x * 0.6, 0);
    r.aura.alpha = r.dead ? 0 : 0.22 + 0.08 * Math.sin(t * 3 + r.phase) + (r.statuses.furia > 0 ? 0.25 : 0);
    r.aura.tint = r.statuses.furia > 0 ? 0xff3030 : r.statuses.evolucao > 0 ? 0xffd54f : hexNum(r.def.cor);
    r.sprite.tint = r.statuses.congelado > 0 ? 0xa8e4ff : 0xffffff;
    const pad = r.pad.getChildAt(0) as Sprite;
    pad.alpha = 0.4 + 0.15 * Math.sin(t * 2 + r.phase);

    // Shield bubble
    const targetA = r.shieldOn > 0 ? 0.85 : 0;
    r.shield.alpha = lerp(r.shield.alpha, targetA, 0.15);
    r.shield.rotation += (dt / 1000) * 0.3;

    // Status emitters
    if (r.dead) return;
    r.emitAcc += dt;
    if (r.emitAcc < 90) return;
    r.emitAcc = 0;
    const cx = r.root.x + r.lunge.x;
    const top = r.root.y - r.baseH;
    const wid = r.baseH * 0.35;
    if (r.statuses.queimar > 0) {
      this.parts.spawn(this.fx.ember, { x: cx + rand(-wid, wid), y: r.root.y - rand(0, r.baseH * 0.8), vx: rand(-10, 10), vy: rand(-90, -50), life: 700, scale: rand(0.6, 1.1), scaleTo: 0.2, alpha: 1 });
    }
    if (r.statuses.veneno > 0 && Math.random() < 0.6) {
      this.parts.spawn(this.fx.bubble, { x: cx + rand(-wid, wid), y: r.root.y - rand(0, r.baseH * 0.5), vy: rand(-50, -25), vx: rand(-6, 6), life: 1100, scale: rand(0.4, 0.8), alpha: 0.9, add: false });
    }
    if (r.statuses.congelado > 0 && Math.random() < 0.5) {
      this.parts.spawn(this.fx.snow, { x: cx + rand(-wid * 1.4, wid * 1.4), y: top + rand(-10, r.baseH * 0.4), vy: rand(20, 45), vx: rand(-10, 10), vrot: rand(-2, 2), life: 1400, scale: rand(0.3, 0.6), alpha: 0.9 });
    }
    if (r.statuses.evolucao > 0 && Math.random() < 0.35) {
      this.parts.spawn(this.fx.star, { x: cx + rand(-wid, wid), y: r.root.y - rand(0, r.baseH), vy: rand(-40, -20), life: 800, scale: rand(0.1, 0.2), scaleTo: 0, tint: 0xffd54f });
    }
  }

  /* ---------------- State sync from the HUD view ---------------- */

  setStatus(side: Side, st: Partial<Rig["statuses"]> & { escudo?: number }) {
    const r = this.rigs?.[side];
    if (!r) return;
    Object.assign(r.statuses, st);
    if (st.escudo !== undefined) {
      if (st.escudo > 0 && r.shieldOn === 0) this.shieldUp(r);
      r.shieldOn = st.escudo;
    }
  }

  private shieldUp(r: Rig) {
    r.shield.alpha = 0;
    const sc = r.shield.scale.x;
    r.shield.scale.set(sc * 0.4);
    void this.anim.to(r.shield.scale, { x: sc, y: sc }, 380, ease.outBack);
  }

  /* ---------------- FX primitives ---------------- */

  private bump(power: number) {
    this.shake = Math.min(26, this.shake + power);
  }

  private screenFlash(color: number, alpha: number, ms: number) {
    const g = this.flashLayer;
    g.clear().rect(0, 0, this.w, this.h).fill({ color });
    g.alpha = alpha;
    void this.anim.run(ms, (k) => (g.alpha = alpha * (1 - k)), { realTime: true });
  }

  private flashRig(r: Rig, ms = 140) {
    r.sprite.filters = [r.flash];
    return this.anim.run(ms, (k) => {
      r.flash.brightness(1 + 2.2 * (1 - k), false);
      if (k >= 1) r.sprite.filters = [];
    }, { realTime: true });
  }

  floatText(x: number, y: number, text: string, color: number, size: number, opts: { sub?: string; subColor?: number; dir?: number } = {}) {
    const style = new TextStyle({
      fontFamily: "Bangers, 'Black Han Sans', Impact, sans-serif",
      fontSize: size,
      fill: color,
      stroke: { color: 0x120818, width: Math.max(4, size * 0.14), join: "round" },
      dropShadow: { color: 0x000000, alpha: 0.6, blur: 4, distance: 3, angle: Math.PI / 2 },
      letterSpacing: 1,
    });
    const t = new Text({ text, style });
    t.anchor.set(0.5);
    t.position.set(x, y);
    t.scale.set(0.2);
    const holder = new Container();
    holder.addChild(t);
    if (opts.sub) {
      const st = new Text({
        text: opts.sub,
        style: new TextStyle({ fontFamily: style.fontFamily, fontSize: size * 0.42, fill: opts.subColor ?? 0xffffff, stroke: { color: 0x120818, width: 5, join: "round" } }),
      });
      st.anchor.set(0.5);
      st.position.set(x, y - size * 0.72);
      st.scale.set(0.2);
      holder.addChild(st);
      void this.anim.to(st.scale, { x: 1, y: 1 }, 260, ease.outBack);
    }
    this.texts.addChild(holder);
    const dir = opts.dir ?? (Math.random() < 0.5 ? -1 : 1);
    void this.anim.to(t.scale, { x: 1, y: 1 }, 260, ease.outBack);
    void (async () => {
      await this.anim.run(1100, (k) => {
        holder.y = -k * 60;
        holder.x = dir * k * 18;
        holder.alpha = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
      }, { realTime: true });
      holder.destroy({ children: true });
    })();
  }

  private burst(x: number, y: number, el: Elemento, power: number) {
    const n = Math.round(10 + power * 1.4);
    const col = hexNum(ELEMENTO_INFO[el].cor);
    // Core flash + ring
    this.parts.spawn(this.fx.star, { x, y, life: 260, scale: 0.6 + power * 0.03, scaleTo: 1.4 + power * 0.04, alpha: 1, alphaTo: 0, tint: 0xffffff, rot: rand(0, 1) });
    this.parts.spawn(this.fx.soft, { x, y, life: 320, scale: 0.8, scaleTo: 2.6 + power * 0.05, alpha: 0.9, tint: col });
    this.parts.spawn(this.fx.ring, { x, y, life: 380, scale: 0.2, scaleTo: 1.6 + power * 0.04, alpha: 1, tint: col });
    for (let i = 0; i < 8; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(300, 700);
      this.parts.spawn(this.fx.spark, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.12, life: rand(250, 420), scale: rand(0.6, 1), alpha: 1, tint: 0xffffff, stretch: true });
    }
    switch (el) {
      case "fogo":
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const sp = rand(80, 420);
          this.parts.spawn(this.fx.ember, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, ay: -200, drag: 0.06, life: rand(450, 900), scale: rand(0.8, 1.8), scaleTo: 0.2 });
        }
        this.parts.spawn(this.fx.smoke, { x, y: y - 10, vy: -40, life: 900, scale: 0.6, scaleTo: 1.6, alpha: 0.35, tint: 0x442222, add: false });
        break;
      case "agua":
        for (let i = 0; i < n; i++) {
          const a = rand(-Math.PI, 0);
          const sp = rand(200, 520);
          this.parts.spawn(this.fx.drop, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ay: 1400, life: rand(500, 800), scale: rand(0.4, 0.9), alpha: 1, stretch: true, add: false });
        }
        this.parts.spawn(this.fx.ring, { x, y: y + 20, life: 520, scale: 0.3, scaleTo: 2.2, alpha: 0.8, tint: 0x9be7ff });
        break;
      case "natureza":
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const sp = rand(120, 380);
          this.parts.spawn(this.fx.leaf, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, ay: 260, drag: 0.05, vrot: rand(-8, 8), life: rand(700, 1100), scale: rand(0.5, 1), alpha: 1, add: false });
        }
        break;
      case "raio":
        this.lightning(x, y, col);
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const sp = rand(300, 800);
          this.parts.spawn(this.fx.spark, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.1, life: rand(200, 400), scale: rand(0.5, 1), tint: 0xfff3a0, stretch: true });
        }
        break;
      case "sombra":
        for (let i = 0; i < Math.round(n / 2); i++) {
          const a = rand(0, Math.PI * 2);
          const sp = rand(40, 200);
          this.parts.spawn(this.fx.smoke, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.05, life: rand(700, 1100), scale: rand(0.3, 0.6), scaleTo: 1.5, alpha: 0.75, tint: 0x7a3dff });
        }
        break;
      case "cristal":
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const sp = rand(220, 600);
          this.parts.spawn(this.fx.shard, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ay: 600, drag: 0.04, vrot: rand(-10, 10), life: rand(500, 900), scale: rand(0.35, 0.8), alpha: 1 });
        }
        break;
    }
  }

  private lightning(x: number, y: number, col: number) {
    for (let b = 0; b < 2; b++) {
      const g = new Graphics();
      const pts: number[] = [];
      let px = x + rand(-60, 60);
      let py = -20;
      pts.push(px, py);
      const steps = 9;
      for (let i = 1; i <= steps; i++) {
        py = lerp(-20, y, i / steps);
        px = i === steps ? x : lerp(px, x, 0.3) + rand(-28, 28);
        pts.push(px, py);
      }
      g.poly(pts, false).stroke({ width: 14, color: col, alpha: 0.35, join: "round", cap: "round" });
      g.poly(pts, false).stroke({ width: 4, color: 0xffffff, alpha: 1, join: "round", cap: "round" });
      g.blendMode = "add";
      this.front.addChild(g);
      void (async () => {
        await this.anim.run(220 + b * 60, (k) => (g.alpha = 1 - k), { realTime: true });
        g.destroy();
      })();
    }
    this.screenFlash(0xfff6c0, 0.18, 120);
  }

  /* ---------------- Choreography ---------------- */

  private async lungeTo(r: Rig, power: number) {
    const target = this.rigs[other(r.side)];
    const dx = target.root.x - r.root.x;
    const dy = target.root.y - target.baseH * 0.4 - (r.root.y - r.baseH * 0.4);
    const L = r.lunge;
    // Anticipation
    await this.anim.run(110, (k) => {
      const e = ease.outQuad(k);
      L.x = -dx * 0.06 * e;
      L.y = -dy * 0.06 * e;
      L.sx = 1 + 0.08 * e;
      L.sy = 1 - 0.1 * e;
    });
    // Strike
    const reach = Math.min(0.42, 0.28 + power * 0.006);
    await this.anim.run(110, (k) => {
      const e = ease.inCubic(k);
      L.x = lerp(-dx * 0.06, dx * reach, e);
      L.y = lerp(-dy * 0.06, dy * reach, e);
      L.sx = lerp(1.08, 0.9, e);
      L.sy = lerp(0.9, 1.1, e);
      L.rot = (r.side === "player" ? 0.12 : -0.12) * e;
    });
  }

  private recover(r: Rig, ms = 280) {
    const L = r.lunge;
    const from = { ...L };
    return this.anim.run(ms, (k) => {
      const e = ease.outBack(k);
      L.x = lerp(from.x, 0, e);
      L.y = lerp(from.y, 0, e);
      L.sx = lerp(from.sx, 1, e);
      L.sy = lerp(from.sy, 1, e);
      L.rot = lerp(from.rot, 0, ease.outCubic(k));
    });
  }

  private async jab(r: Rig) {
    const target = this.rigs[other(r.side)];
    const dx = (target.root.x - r.root.x) * 0.12;
    const dy = (target.root.y - r.root.y) * 0.12;
    await this.anim.run(70, (k) => {
      r.lunge.x = dx * ease.outQuad(k);
      r.lunge.y = dy * ease.outQuad(k);
    });
  }

  private knockback(r: Rig, power: number) {
    const dir = r.side === "player" ? -1 : 1;
    const L = r.lunge;
    const amt = Math.min(36, 8 + power * 0.9);
    return this.anim.run(380, (k) => {
      const e = k < 0.25 ? ease.outCubic(k / 0.25) : 1 - ease.inOutSine((k - 0.25) / 0.75);
      L.x = dir * amt * e;
      L.y = -amt * 0.25 * e;
      L.rot = dir * 0.14 * e;
      L.sx = 1 - 0.06 * e;
      L.sy = 1 + 0.04 * e;
    });
  }

  private chest(r: Rig) {
    return { x: r.root.x + r.lunge.x, y: r.root.y - r.baseH * 0.55 + r.lunge.y + (r.flying ? -r.baseH * 0.12 : 0) };
  }

  async intro() {
    const { player, enemy } = this.rigs;
    for (const r of [enemy, player]) {
      r.lunge.y = -this.h;
    }
    sfx.whoosh();
    await this.anim.wait(150);
    for (const r of [enemy, player]) {
      const L = r.lunge;
      await this.anim.run(380, (k) => (L.y = lerp(-this.h, 0, ease.inQuad(k))));
      L.sy = 0.7;
      L.sx = 1.25;
      this.bump(10);
      sfx.slam();
      const p = r.root;
      for (let i = 0; i < 16; i++) {
        const a = rand(Math.PI, Math.PI * 2);
        this.parts.spawn(this.fx.smoke, { x: p.x + rand(-20, 20), y: p.y, vx: Math.cos(a) * rand(80, 240), vy: Math.sin(a) * rand(10, 60), drag: 0.08, life: 800, scale: 0.3, scaleTo: 0.9, alpha: 0.5, tint: 0xd0c0ff, add: false });
      }
      void this.anim.run(320, (k) => {
        L.sy = lerp(0.7, 1, ease.outElastic(k));
        L.sx = lerp(1.25, 1, ease.outElastic(k));
      });
      await this.anim.wait(120);
    }
  }

  /** Visualize one engine event. `card` is the card currently resolving, if any. */
  async handle(ev: BattleEvent, card: CardDef | null, actor: Side | null): Promise<void> {
    if (!this.rigs) return;
    switch (ev.e) {
      case "jogar": {
        const r = this.rigs[ev.side];
        const c = hexNum(card?.raridade === "assinatura" ? "#ffd54f" : r.def.cor);
        this.parts.spawn(this.fx.ring, { x: r.root.x, y: r.root.y, life: 600, scale: 0.4, scaleTo: 2.4, alpha: 0.9, tint: c });
        for (let i = 0; i < 14; i++) {
          this.parts.spawn(this.fx.soft, { x: r.root.x + rand(-r.baseH * 0.4, r.baseH * 0.4), y: r.root.y, vy: rand(-260, -120), life: 600, scale: rand(0.08, 0.16), scaleTo: 0, tint: c });
        }
        if (card?.raridade === "assinatura") {
          this.anim.slowMo(500, 0.6);
          this.zoom = 1.05;
          this.screenFlash(c, 0.18, 300);
          sfx.signature();
        }
        await this.anim.wait(card?.kind === "ataque" ? 80 : 180);
        return;
      }
      case "dano": {
        const target = this.rigs[ev.alvo];
        const fromActor = actor !== null && ev.alvo !== actor;
        const attacker = actor ? this.rigs[actor] : null;
        if (fromActor && attacker) {
          if (ev.hit === 1) await this.lungeTo(attacker, ev.valor + ev.bloqueado);
          else await this.jab(attacker);
        }
        await this.impact(target, ev.valor, ev.bloqueado, ev.efetividade, ev.critico, ev.elemento, ev.hits > 1);
        if (fromActor && attacker && ev.hit === ev.hits) void this.recover(attacker);
        await this.anim.wait(ev.hits > 1 ? 40 : 160);
        return;
      }
      case "tick": {
        const r = this.rigs[ev.alvo];
        const el: Elemento = ev.status === "queimar" ? "fogo" : "natureza";
        const p = this.chest(r);
        this.burst(p.x, p.y, el, 4);
        void this.flashRig(r, 100);
        this.bump(4);
        sfx.tick(ev.status);
        this.floatText(p.x, p.y - 20, `-${ev.valor}`, ev.status === "queimar" ? 0xff9a3c : 0x8dff6a, 44, { sub: ev.status === "queimar" ? "QUEIMADURA" : "VENENO", subColor: 0xffffff });
        await this.anim.wait(420);
        return;
      }
      case "esquivou": {
        const r = this.rigs[ev.alvo];
        if (actor && actor !== ev.alvo) await this.lungeTo(this.rigs[actor], 6);
        const dir = r.side === "player" ? -1 : 1;
        sfx.dodge();
        for (let i = 0; i < 3; i++) {
          const ghost = new Sprite(r.sprite.texture);
          ghost.anchor.set(0.5, 1);
          ghost.scale.copyFrom(r.sprite.scale);
          ghost.position.set(r.root.x, r.root.y);
          ghost.tint = 0x88ccff;
          ghost.alpha = 0.45 - i * 0.12;
          ghost.blendMode = "add";
          this.back.addChild(ghost);
          void (async () => {
            await this.anim.run(380, (k) => {
              ghost.x = r.root.x + dir * 40 * (1 - k) * (i + 1);
              ghost.alpha = (0.45 - i * 0.12) * (1 - k);
            });
            ghost.destroy();
          })();
        }
        await this.anim.run(140, (k) => (r.lunge.x = dir * 70 * ease.outCubic(k)));
        const p = this.chest(r);
        this.floatText(p.x, p.y - 30, "ESQUIVOU!", 0x9fe3ff, 40, { dir });
        if (actor && actor !== ev.alvo) void this.recover(this.rigs[actor]);
        await this.recover(r, 300);
        return;
      }
      case "errou": {
        const r = this.rigs[other(ev.side)];
        const p = this.chest(r);
        if (actor) await this.lungeTo(this.rigs[actor], 4);
        sfx.miss();
        for (let i = 0; i < 6; i++) this.parts.spawn(this.fx.smoke, { x: p.x + rand(-30, 30), y: p.y + rand(-20, 20), vy: -30, life: 700, scale: 0.2, scaleTo: 0.7, alpha: 0.5, tint: 0x999999, add: false });
        this.floatText(p.x, p.y - 30, "ERROU!", 0xbbbbbb, 44);
        if (actor) void this.recover(this.rigs[actor]);
        await this.anim.wait(420);
        return;
      }
      case "cura": {
        const r = this.rigs[ev.alvo];
        const p = this.chest(r);
        sfx.heal();
        for (let i = 0; i < 22; i++) {
          this.parts.spawn(i % 3 ? this.fx.soft : this.fx.star, { x: r.root.x + rand(-r.baseH * 0.35, r.baseH * 0.35), y: r.root.y - rand(0, r.baseH * 0.6), vy: rand(-180, -80), life: rand(600, 1000), scale: i % 3 ? rand(0.08, 0.16) : rand(0.12, 0.22), scaleTo: 0, tint: 0x7dff8a });
        }
        this.floatText(p.x, p.y - 30, `+${ev.valor}`, 0x6dff7d, 50);
        await this.anim.wait(380);
        return;
      }
      case "escudo": {
        const r = this.rigs[ev.alvo];
        const p = this.chest(r);
        sfx.shield();
        this.parts.spawn(this.fx.hex, { x: p.x, y: p.y, life: 500, scale: 0.2, scaleTo: 0.8, alpha: 0.9 });
        this.floatText(p.x, p.y - 40, `+${ev.valor}`, 0x7fd4ff, 42, { sub: "ESCUDO", subColor: 0xd7f2ff });
        await this.anim.wait(300);
        return;
      }
      case "espinhos": {
        const r = this.rigs[ev.alvo];
        const p = this.chest(r);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          this.parts.spawn(this.fx.shard, { x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, drag: 0.15, rot: a + Math.PI / 2, life: 500, scale: 0.4, alpha: 1, tint: 0x9dff7a });
        }
        this.floatText(p.x, p.y - 10, `ESPINHOS ${ev.valor}`, 0xb6ff8a, 30);
        await this.anim.wait(250);
        return;
      }
      case "status": {
        const r = this.rigs[ev.alvo];
        const p = this.chest(r);
        const label: Record<string, [string, number]> = {
          queimar: ["QUEIMANDO!", 0xff8c3a],
          veneno: ["ENVENENADO!", 0x8dff6a],
          congelar: ["CONGELADO!", 0x9fe3ff],
          esquiva: ["ESQUIVA PRONTA", 0x9fe3ff],
          furia: ["FÚRIA!", 0xff4d4d],
          evolucao: ["EVOLUÇÃO!", 0xffd54f],
        };
        const [txt, col] = label[ev.status];
        if (ev.status === "furia" || ev.status === "evolucao") {
          sfx.powerUp();
          this.parts.spawn(this.fx.ring, { x: r.root.x, y: r.root.y - r.baseH * 0.4, life: 500, scale: 1.5, scaleTo: 0.3, alpha: 0.9, tint: col });
          r.lunge.sy = 1.15;
          void this.anim.to(r.lunge, { sy: 1 }, 300, ease.outElastic);
        } else if (ev.status === "congelar") {
          sfx.freeze();
          for (let i = 0; i < 14; i++) this.parts.spawn(this.fx.snow, { x: p.x + rand(-50, 50), y: p.y + rand(-50, 50), vx: rand(-60, 60), vy: rand(-60, 60), drag: 0.08, vrot: rand(-4, 4), life: 900, scale: rand(0.4, 0.8), alpha: 1 });
        }
        this.floatText(p.x, p.y - 60, txt, col, 30);
        await this.anim.wait(ev.alvo === actor ? 280 : 200);
        return;
      }
      case "passiva": {
        const r = this.rigs[ev.side];
        const p = this.chest(r);
        this.floatText(p.x, p.y - r.baseH * 0.45, `${r.def.passivaNome}`, 0xffffff, 24, { sub: ev.texto, subColor: 0xffe27a });
        await this.anim.wait(200);
        return;
      }
      case "ko": {
        const r = this.rigs[ev.side];
        r.dead = true;
        this.anim.slowMo(900, 0.35);
        this.zoom = 1.12;
        this.screenFlash(0xffffff, 0.6, 400);
        this.bump(22);
        sfx.ko();
        const p = this.chest(r);
        this.burst(p.x, p.y, r.def.elemento, 30);
        this.burst(p.x, p.y, this.rigs[other(ev.side)].def.elemento, 20);
        const gray = new ColorMatrixFilter();
        gray.desaturate();
        r.sprite.filters = [gray];
        const dir = r.side === "player" ? -1 : 1;
        await this.anim.run(900, (k) => {
          const e = ease.outCubic(k);
          r.lunge.x = dir * 30 * e;
          r.lunge.y = r.baseH * 0.08 * e;
          r.lunge.rot = dir * 1.35 * ease.inQuad(k);
          r.lunge.sy = 1 - 0.15 * e;
          r.sprite.alpha = 1 - 0.55 * e;
        });
        return;
      }
      case "escudoExpirou":
        return;
      default:
        return;
    }
  }

  private async impact(r: Rig, valor: number, bloqueado: number, ef: Efetividade, crit: boolean, el: Elemento, multi: boolean) {
    const p = this.chest(r);
    const power = valor + bloqueado;
    const stop = this.reducedMotion ? 0 : Math.min(140, (multi ? 30 : 55) + power * 2.5 + (crit ? 60 : 0));
    this.anim.hitStop(stop);
    this.burst(p.x + rand(-12, 12), p.y + rand(-12, 12), el, power);
    this.bump(Math.min(20, 3 + power * 0.55 + (crit ? 8 : 0)));
    if (crit || power >= 18) this.zoom = 1.06;
    sfx.hit(power, crit, ef);

    if (bloqueado > 0) {
      sfx.block();
      this.parts.spawn(this.fx.hex, { x: p.x, y: p.y, life: 300, scale: 0.7, scaleTo: 0.9, alpha: 1 });
      for (let i = 0; i < 10; i++) {
        const a = rand(0, Math.PI * 2);
        this.parts.spawn(this.fx.spark, { x: p.x, y: p.y, vx: Math.cos(a) * 500, vy: Math.sin(a) * 500, drag: 0.15, life: 300, scale: 0.7, tint: 0x9fe3ff, stretch: true });
      }
    }
    if (valor > 0) {
      void this.flashRig(r);
      void this.knockback(r, power);
      const sub = crit ? "CRÍTICO!" : ef === "super" ? "SUPER EFETIVO!" : ef === "fraco" ? "pouco efetivo" : undefined;
      const color = crit ? 0xff3d3d : ef === "super" ? 0xffe14a : ef === "fraco" ? 0xc9c9c9 : 0xffffff;
      const size = Math.min(84, 40 + valor * 1.6) * (crit ? 1.15 : 1);
      this.floatText(p.x + rand(-20, 20), p.y - 30, `-${valor}`, color, size, { sub, subColor: crit ? 0xffd0d0 : 0xfff6b5 });
      if (navigator.vibrate) try { navigator.vibrate(Math.min(60, 10 + valor * 2)); } catch { /* ignore */ }
    } else if (bloqueado > 0) {
      this.floatText(p.x, p.y - 30, `BLOQUEOU ${bloqueado}`, 0x7fd4ff, 34);
    }
    if (bloqueado > 0 && valor === 0) await this.anim.wait(60);
  }

  async celebrate(side: Side) {
    const r = this.rigs[side];
    sfx.victory();
    for (let j = 0; j < 3; j++) {
      await this.anim.run(220, (k) => (r.lunge.y = -r.baseH * 0.18 * Math.sin(k * Math.PI)));
    }
    for (let i = 0; i < 60; i++) {
      const cols = [0xff5c8a, 0xffe14a, 0x5bdc5b, 0x2fb8ff, 0xb07cff];
      this.parts.spawn(this.fx.shard, { x: rand(0, this.w), y: -20, vx: rand(-40, 40), vy: rand(120, 300), vrot: rand(-8, 8), life: rand(2200, 3400), scale: rand(0.2, 0.4), alpha: 1, alphaTo: 0.6, tint: cols[i % cols.length], add: false });
    }
  }

  destroy() {
    this.destroyed = true;
    this.anim.clear();
    if (this.bgKey) {
      this.bg.texture.destroy(true);
      this.bgKey = "";
    }
    try {
      this.app?.destroy(true, { children: true });
    } catch {
      /* already gone */
    }
  }
}
