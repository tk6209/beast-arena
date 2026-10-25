import { Container, Sprite, Texture } from "pixi.js";

export interface ParticleOpts {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  ax?: number;
  ay?: number;
  drag?: number;
  life: number;
  scale?: number;
  scaleTo?: number;
  alpha?: number;
  alphaTo?: number;
  rot?: number;
  vrot?: number;
  tint?: number;
  add?: boolean;
  /** Orient the sprite along its velocity (sparks). */
  stretch?: boolean;
}

interface P extends Required<Omit<ParticleOpts, "x" | "y" | "tint" | "add" | "stretch">> {
  s: Sprite;
  age: number;
  stretch: boolean;
}

export class Particles {
  readonly layer = new Container();
  private live: P[] = [];
  private pool: Sprite[] = [];

  spawn(tex: Texture, o: ParticleOpts) {
    if (this.live.length > 900) return;
    const s = this.pool.pop() ?? new Sprite();
    s.texture = tex;
    s.anchor.set(0.5);
    s.position.set(o.x, o.y);
    s.tint = o.tint ?? 0xffffff;
    s.blendMode = o.add === false ? "normal" : "add";
    s.visible = true;
    this.layer.addChild(s);
    this.live.push({
      s,
      age: 0,
      vx: o.vx ?? 0,
      vy: o.vy ?? 0,
      ax: o.ax ?? 0,
      ay: o.ay ?? 0,
      drag: o.drag ?? 0,
      life: o.life,
      scale: o.scale ?? 1,
      scaleTo: o.scaleTo ?? o.scale ?? 1,
      alpha: o.alpha ?? 1,
      alphaTo: o.alphaTo ?? 0,
      rot: o.rot ?? Math.random() * Math.PI * 2,
      vrot: o.vrot ?? 0,
      stretch: !!o.stretch,
    });
  }

  update(dtMs: number) {
    const dt = dtMs / 1000;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.age += dtMs;
      const k = p.age / p.life;
      if (k >= 1) {
        p.s.visible = false;
        this.layer.removeChild(p.s);
        this.pool.push(p.s);
        this.live.splice(i, 1);
        continue;
      }
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      if (p.drag) {
        const d = Math.pow(1 - p.drag, dt * 60);
        p.vx *= d;
        p.vy *= d;
      }
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      const sc = p.scale + (p.scaleTo - p.scale) * k;
      if (p.stretch) {
        const sp = Math.hypot(p.vx, p.vy);
        p.s.rotation = Math.atan2(p.vy, p.vx);
        p.s.scale.set(sc * (0.6 + Math.min(2.2, sp / 400)), sc);
      } else {
        p.rot += p.vrot * dt;
        p.s.rotation = p.rot;
        p.s.scale.set(sc);
      }
      p.s.alpha = p.alpha + (p.alphaTo - p.alpha) * k;
    }
  }

  clear() {
    for (const p of this.live) {
      this.layer.removeChild(p.s);
      this.pool.push(p.s);
    }
    this.live = [];
  }
}
