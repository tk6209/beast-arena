/* ═══════════════════════════════════════════════════════
   BEAST ARENA — Game Juice Utilities
   Screen shake · floating numbers · particle bursts
   Brawl Stars / Clash Royale style feedback
═══════════════════════════════════════════════════════ */

const HOST_ID = "beast-juice-host";

function ensureHost(): HTMLDivElement {
  let el = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = HOST_ID;
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "9999",
      overflow: "hidden",
    } as CSSStyleDeclaration);
    document.body.appendChild(el);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes beastShake {
        0%,100% { transform: translate(0,0) }
        10% { transform: translate(-6px,-2px) }
        20% { transform: translate(7px, 3px) }
        30% { transform: translate(-5px, 4px) }
        40% { transform: translate(6px,-3px) }
        50% { transform: translate(-4px,-4px) }
        60% { transform: translate(5px, 2px) }
        70% { transform: translate(-3px, 3px) }
        80% { transform: translate(4px,-2px) }
        90% { transform: translate(-2px, 1px) }
      }
      @keyframes beastShakeSmall {
        0%,100% { transform: translate(0,0) }
        25% { transform: translate(-3px,-1px) }
        50% { transform: translate(3px, 2px) }
        75% { transform: translate(-2px, 1px) }
      }
      @keyframes beastFloat {
        0%   { transform: translate(-50%,-50%) scale(.3); opacity: 0; }
        15%  { transform: translate(-50%,-60%) scale(1.25); opacity: 1; }
        30%  { transform: translate(-50%,-65%) scale(1);    opacity: 1; }
        100% { transform: translate(-50%,-150%) scale(.9);  opacity: 0; }
      }
      @keyframes beastSpark {
        0%   { transform: translate(-50%,-50%) scale(.4); opacity: 1; }
        100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(.1); opacity: 0; }
      }
      .beast-shake { animation: beastShake .45s cubic-bezier(.36,.07,.19,.97) both; }
      .beast-shake-sm { animation: beastShakeSmall .25s ease-out both; }
    `;
    document.head.appendChild(style);
  }
  return el;
}

/** Shake the entire app root. `strength`: "sm" | "md" */
export function screenShake(strength: "sm" | "md" = "md") {
  const root = document.getElementById("root") || document.body;
  const cls = strength === "sm" ? "beast-shake-sm" : "beast-shake";
  root.classList.remove(cls);
  // force reflow
  void (root as HTMLElement).offsetWidth;
  root.classList.add(cls);
  window.setTimeout(() => root.classList.remove(cls), 500);
}

export interface FloatOpts {
  color?: string;
  size?: number;
  prefix?: string;
  duration?: number;
}

/** Big bouncy number that floats up from a screen point. */
export function floatingNumber(x: number, y: number, value: number | string, opts: FloatOpts = {}) {
  const host = ensureHost();
  const el = document.createElement("div");
  const color = opts.color ?? "#ffd166";
  const size = opts.size ?? 38;
  const dur = opts.duration ?? 1100;
  el.textContent = `${opts.prefix ?? ""}${value}`;
  Object.assign(el.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    transform: "translate(-50%,-50%)",
    color,
    fontFamily: "'Black Han Sans', 'Bangers', cursive",
    fontSize: `${size}px`,
    letterSpacing: "1px",
    textShadow:
      "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000," +
      "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000," +
      `0 0 18px ${color}`,
    animation: `beastFloat ${dur}ms cubic-bezier(.2,.7,.3,1) forwards`,
    willChange: "transform,opacity",
  } as CSSStyleDeclaration);
  host.appendChild(el);
  window.setTimeout(() => el.remove(), dur + 80);
}

export interface BurstOpts {
  count?: number;
  color?: string;
  spread?: number;
  size?: number;
}

/** Particle burst at a screen point (combo, crit, unlock). */
export function particleBurst(x: number, y: number, opts: BurstOpts = {}) {
  const host = ensureHost();
  const count = opts.count ?? 14;
  const color = opts.color ?? "#f0b429";
  const spread = opts.spread ?? 90;
  const size = opts.size ?? 8;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = spread * (0.5 + Math.random() * 0.8);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const dur = 550 + Math.random() * 300;
    const p = document.createElement("div");
    Object.assign(p.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 12px ${color}, 0 0 22px ${color}aa`,
      animation: `beastSpark ${dur}ms cubic-bezier(.2,.7,.3,1) forwards`,
      "--dx": `${dx}px`,
      "--dy": `${dy}px`,
    } as any);
    host.appendChild(p);
    window.setTimeout(() => p.remove(), dur + 60);
  }
}

/** Get the center point of an HTMLElement in viewport coords. */
export function centerOf(el: Element | null): { x: number; y: number } {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}