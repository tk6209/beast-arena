// Minimal tween/timer system driven by the Pixi ticker. Respects a global time
// scale so hit-stop and slow-motion affect everything consistently.

export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inQuad: (t: number) => t * t,
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

interface Job {
  elapsed: number;
  duration: number;
  update: (k: number) => void;
  done: () => void;
  realTime: boolean;
}

export class Animator {
  timeScale = 1;
  private jobs: Job[] = [];
  private freezeUntil = 0;
  private slowUntil = 0;
  private slowScale = 1;
  now = 0;

  tick(deltaMs: number) {
    const real = performance.now();
    let scale = this.timeScale;
    if (real < this.freezeUntil) scale = 0;
    else if (real < this.slowUntil) scale *= this.slowScale;
    const dt = Math.min(deltaMs, 50) * scale;
    this.now += dt;
    const jobs = this.jobs;
    for (let i = jobs.length - 1; i >= 0; i--) {
      const j = jobs[i];
      j.elapsed += j.realTime ? Math.min(deltaMs, 50) : dt;
      const k = j.duration <= 0 ? 1 : Math.min(1, j.elapsed / j.duration);
      j.update(k);
      if (k >= 1) {
        jobs.splice(i, 1);
        j.done();
      }
    }
    return dt;
  }

  /** Effective scaled delta for continuous effects (particles, idle). */
  get scale() {
    const real = performance.now();
    if (real < this.freezeUntil) return 0;
    if (real < this.slowUntil) return this.timeScale * this.slowScale;
    return this.timeScale;
  }

  hitStop(ms: number) {
    this.freezeUntil = Math.max(this.freezeUntil, performance.now() + ms);
  }

  slowMo(ms: number, scale: number) {
    this.slowUntil = performance.now() + ms;
    this.slowScale = scale;
  }

  run(duration: number, update: (k: number) => void, opts: { realTime?: boolean } = {}): Promise<void> {
    return new Promise((resolve) => {
      this.jobs.push({ elapsed: 0, duration, update, done: resolve, realTime: !!opts.realTime });
    });
  }

  wait(ms: number) {
    return this.run(ms, () => {});
  }

  /** Tween numeric props of any object. */
  to(target: object, props: Record<string, number>, duration: number, e: Ease = ease.outCubic): Promise<void> {
    const t = target as Record<string, number>;
    const keys = Object.keys(props);
    const from = keys.map((k) => t[k]);
    const dest = keys.map((k) => props[k]);
    return this.run(duration, (k) => {
      const v = e(k);
      keys.forEach((key, i) => {
        t[key] = from[i] + (dest[i] - from[i]) * v;
      });
    });
  }

  clear() {
    for (const j of this.jobs) j.done();
    this.jobs = [];
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
