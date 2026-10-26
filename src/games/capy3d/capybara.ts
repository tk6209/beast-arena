/**
 * Procedural 3D capybara heroes for the Capynite worlds, modelled on the
 * "Base Capivara 360°" and "Capy-Heróis 360°" sheets: pear-shaped body, big
 * blocky head with a wide snout and dark nose pad, beady eyes, small round
 * ears, short limbs with dark brown paws. Joint hierarchy so every pose is
 * animated in code, plus a jelly squash (Joshua's favourite) when sliding.
 * Faces -Z; feet at y = 0; ~1.7 m tall.
 */
import * as THREE from "three";
import { inked, toon } from "./toon";

export type CapyHeroId = "capininja" | "capivini" | "capirocket" | "capizozo" | "voxcapy";

/* Palette from the 360° sheet. */
export const CAPY_COLORS = {
  fur: "#c97a2a",
  furDark: "#8a4f22",
  paw: "#3d2a1e",
  nose: "#4a3020",
  inner: "#d09080",
  leather: "#6b4424",
  leatherDark: "#4a2e18",
  metal: "#9aa0a8",
} as const;

export interface CapyRig {
  root: THREE.Group;
  /** Everything above the feet pivot; used for flips and squash. */
  body: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  legL: Limb;
  legR: Limb;
  armL: Limb;
  armR: Limb;
  /** Cloth pieces that flap with speed (scarf tails, headband). */
  flaps: THREE.Object3D[];
  /** Rocket flame (only some heroes). */
  flame: THREE.Object3D | null;
  eyes: THREE.Object3D[];
  mats: THREE.MeshToonMaterial[];
  /** Jelly spring for squash & stretch: value, velocity, last time. */
  jelly: { v: number; vel: number; t: number };
}

interface Limb {
  upper: THREE.Group;
  lower: THREE.Group;
}

const sphere = new THREE.SphereGeometry(1, 30, 22);

function blob(mat: THREE.Material, sx: number, sy: number, sz: number, ink = 0.02): THREE.Mesh {
  const m = inked(sphere, mat, ink / Math.max(0.15, Math.min(sx, sy, sz)));
  m.scale.set(sx, sy, sz);
  return m;
}

/** Smooth pear profile (radius, height) revolved around Y. */
function pear(scale = 1, height = 1): THREE.LatheGeometry {
  const pts = [
    [0.0, 0.0],
    [0.3, 0.02],
    [0.44, 0.12],
    [0.5, 0.3],
    [0.49, 0.48],
    [0.44, 0.66],
    [0.37, 0.82],
    [0.3, 0.94],
    [0.0, 1.02],
  ].map(([r, y]) => new THREE.Vector2(r * scale, y * height));
  return new THREE.LatheGeometry(pts, 32);
}

function limb(parent: THREE.Object3D, x: number, y: number, upperLen: number, lowerLen: number, r: number, mat: THREE.Material, end: THREE.Object3D): Limb {
  const upper = new THREE.Group();
  upper.position.set(x, y, 0);
  parent.add(upper);
  const u = inked(new THREE.CapsuleGeometry(r, upperLen, 6, 14), mat, 0.018);
  u.position.y = -upperLen / 2;
  upper.add(u);
  const lower = new THREE.Group();
  lower.position.y = -upperLen;
  upper.add(lower);
  const l = inked(new THREE.CapsuleGeometry(r * 0.95, lowerLen, 6, 14), mat, 0.018);
  l.position.y = -lowerLen / 2;
  lower.add(l);
  end.position.y -= lowerLen + r * 0.35;
  lower.add(end);
  return { upper, lower };
}

/** Dark padded foot with three toe bumps, like the sheet. */
function foot(color: string): THREE.Group {
  const g = new THREE.Group();
  const mat = toon(color);
  const sole = blob(mat, 0.15, 0.08, 0.21);
  sole.position.set(0, -0.02, -0.05);
  g.add(sole);
  for (const x of [-0.08, 0, 0.08]) {
    const toe = blob(mat, 0.045, 0.045, 0.05, 0.01);
    toe.position.set(x, -0.03, -0.24);
    g.add(toe);
  }
  return g;
}

/** Dark mitten paw. */
function paw(color: string): THREE.Mesh {
  return blob(toon(color), 0.1, 0.11, 0.09);
}

interface Look {
  /** Body/limb material override (suits). */
  suit?: string;
  footColor?: string;
  handColor?: string;
  brows?: boolean;
  happy?: boolean;
}

export function buildCapybara(id: CapyHeroId): CapyRig {
  const look = LOOKS[id] ?? {};
  const fur = toon(CAPY_COLORS.fur);
  const furDark = toon(CAPY_COLORS.furDark);
  const bodyMat = look.suit ? toon(look.suit) : fur;
  const root = new THREE.Group();
  root.name = `capy-${id}`;
  const body = new THREE.Group();
  root.add(body);
  const hips = new THREE.Group();
  hips.position.y = 0.4;
  body.add(hips);

  // Pear body: wide belly at the bottom, narrowing into the head.
  const torso = new THREE.Group();
  hips.add(torso);
  const trunk = inked(pear(1, 1.05), bodyMat, 0.022);
  trunk.scale.set(1, 1, 0.86);
  trunk.position.y = -0.08;
  const tail = blob(furDark, 0.08, 0.08, 0.07);
  tail.position.set(0, 0.06, 0.42);
  torso.add(trunk, tail);
  if (!look.suit) {
    // Subtle lighter belly, as in the sheet.
    const belly = blob(toon("#d68a3c"), 0.36, 0.38, 0.12, 0);
    belly.position.set(0, 0.3, -0.36);
    torso.add(belly);
  }

  // Head: big, slightly boxy, sits low on the pear (no neck).
  const head = new THREE.Group();
  head.position.set(0, 1.0, -0.02);
  head.scale.setScalar(1.12);
  torso.add(head);
  const skull = blob(fur, 0.38, 0.34, 0.38);
  skull.position.set(0, 0.06, 0.04);
  const cheeks = blob(fur, 0.36, 0.26, 0.34);
  cheeks.position.set(0, -0.06, -0.08);
  const snout = blob(fur, 0.29, 0.25, 0.26);
  snout.position.set(0, -0.04, -0.3);
  // Wide dark nose pad covering the front of the snout.
  const nose = blob(toon(CAPY_COLORS.nose), 0.21, 0.15, 0.1, 0.01);
  nose.position.set(0, 0.01, -0.5);
  const mouth = inked(new THREE.TorusGeometry(0.08, 0.012, 6, 20, Math.PI), toon(CAPY_COLORS.paw), 0);
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.15, -0.5);
  head.add(skull, cheeks, snout, nose, mouth);
  for (const sx of [-1, 1]) {
    const ear = blob(fur, 0.09, 0.085, 0.06);
    ear.position.set(sx * 0.27, 0.32, 0.12);
    const inner = blob(toon(CAPY_COLORS.inner), 0.05, 0.05, 0.02, 0);
    inner.position.set(sx * 0.27, 0.31, 0.07);
    const nostril = blob(toon("#1a0f0a"), 0.04, 0.025, 0.02, 0);
    nostril.position.set(sx * 0.07, 0.04, -0.59);
    head.add(ear, inner, nostril);
  }
  const eyes: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.2, 0.15, -0.26);
    const r = look.happy ? 0.065 : 0.052;
    const ball = blob(toon("#120a06"), r, r * 1.15, r * 0.7, 0);
    const shine = blob(toon("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.7 }), r * 0.35, r * 0.35, r * 0.2, 0);
    shine.position.set(sx * -0.015, 0.022, -r * 0.6);
    eye.add(ball, shine);
    if (look.brows) {
      const brow = blob(furDark, 0.08, 0.022, 0.03, 0.006);
      brow.position.set(sx * 0.01, 0.075, -0.01);
      brow.rotation.z = sx * 0.35;
      eye.add(brow);
    }
    head.add(eye);
    eyes.push(eye);
  }
  if (look.happy) {
    // Big open laugh with buck teeth (Capizozo).
    const open = blob(toon("#3a1414"), 0.12, 0.08, 0.05, 0.008);
    open.position.set(0, -0.14, -0.5);
    const tongue = blob(toon("#e86a6a"), 0.07, 0.035, 0.03, 0);
    tongue.position.set(0, -0.18, -0.53);
    const teeth = blob(toon("#ffffff"), 0.05, 0.035, 0.02, 0.006);
    teeth.position.set(0, -0.085, -0.545);
    head.add(open, tongue, teeth);
    mouth.visible = false;
  }

  const limbMat = look.suit ? toon(look.suit) : fur;
  const legL = limb(hips, -0.2, 0.06, 0.14, 0.12, 0.13, limbMat, foot(look.footColor ?? CAPY_COLORS.paw));
  const legR = limb(hips, 0.2, 0.06, 0.14, 0.12, 0.13, limbMat, foot(look.footColor ?? CAPY_COLORS.paw));
  const armL = limb(torso, -0.44, 0.74, 0.17, 0.15, 0.095, limbMat, paw(look.handColor ?? CAPY_COLORS.paw));
  const armR = limb(torso, 0.44, 0.74, 0.17, 0.15, 0.095, limbMat, paw(look.handColor ?? CAPY_COLORS.paw));

  const rig: CapyRig = { root, body, hips, torso, head, legL, legR, armL, armR, flaps: [], flame: null, eyes, mats: [], jelly: { v: 0, vel: 0, t: -1 } };
  OUTFITS[id]?.(rig);

  // Own material copies so flashing this hero never tints the world or other heroes.
  const own = new Map<THREE.Material, THREE.MeshToonMaterial>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!(mesh.material instanceof THREE.MeshToonMaterial)) return;
    let c = own.get(mesh.material);
    if (!c) {
      c = mesh.material.clone();
      own.set(mesh.material, c);
      rig.mats.push(c);
    }
    mesh.material = c;
  });
  return rig;
}

/* ───────────── Outfits (Capy-Heróis 360°) ───────────── */

const LOOKS: Partial<Record<CapyHeroId, Look>> = {
  capivini: { brows: true },
  capininja: { suit: "#27304d", footColor: CAPY_COLORS.leatherDark, brows: true },
  capirocket: { brows: true },
  capizozo: { happy: true },
};

/** Tactical leather vest with a pouch grid and a belt, as worn by the squad. */
function tacticalVest(rig: CapyRig, color: string = CAPY_COLORS.leather) {
  const mat = toon(color);
  const vest = inked(pear(1.06, 0.62), mat, 0.016);
  vest.scale.set(1, 1, 0.9);
  vest.position.y = 0.3;
  rig.torso.add(vest);
  const pouch = toon(CAPY_COLORS.leatherDark);
  for (const [x, y] of [
    [-0.15, 0.62],
    [0.15, 0.62],
    [-0.16, 0.45],
    [0.16, 0.45],
  ]) {
    const p = inked(new THREE.BoxGeometry(0.17, 0.13, 0.08), pouch, 0.01);
    p.position.set(x, y, -0.43 + (0.62 - y) * -0.12);
    rig.torso.add(p);
  }
  const belt = inked(new THREE.TorusGeometry(0.5, 0.045, 8, 30), toon(CAPY_COLORS.leatherDark), 0.01);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1, 0.88, 1);
  belt.position.y = 0.22;
  const buckle = inked(new THREE.BoxGeometry(0.12, 0.08, 0.03), toon(CAPY_COLORS.metal), 0.008);
  buckle.position.set(0, 0.22, -0.455);
  rig.torso.add(belt, buckle);
  for (const sx of [-1, 1]) {
    const pad = blob(toon(CAPY_COLORS.leatherDark), 0.11, 0.06, 0.1, 0.01);
    pad.position.set(sx * 0.33, 0.86, 0);
    rig.torso.add(pad);
  }
}

function backpack(rig: CapyRig, color: string, strap: string) {
  const bag = inked(new THREE.CapsuleGeometry(0.2, 0.22, 6, 14), toon(color), 0.018);
  bag.position.set(0, 0.55, 0.42);
  bag.scale.set(1.1, 1, 0.65);
  rig.torso.add(bag);
  for (const sx of [-1, 1]) {
    const s = inked(new THREE.BoxGeometry(0.06, 0.55, 0.04), toon(strap), 0.01);
    s.position.set(sx * 0.2, 0.6, -0.36);
    s.rotation.x = 0.2;
    rig.torso.add(s);
  }
}

const OUTFITS: Record<CapyHeroId, (rig: CapyRig) => void> = {
  capivini: (rig) => {
    tacticalVest(rig);
    // Glowing blue potion on the belt — the leader's signature item.
    const flask = new THREE.Group();
    const glass = blob(toon("#3fb8ff", { emissive: "#1d7fd0", emissiveIntensity: 0.6 }), 0.09, 0.09, 0.09, 0.012);
    const neck = inked(new THREE.CylinderGeometry(0.03, 0.035, 0.08, 10), toon("#cfe9ff"), 0.008);
    neck.position.y = 0.1;
    const cork = inked(new THREE.CylinderGeometry(0.033, 0.033, 0.04, 10), toon("#8a5a34"), 0.006);
    cork.position.y = 0.15;
    flask.add(glass, neck, cork);
    flask.position.set(0.4, 0.2, -0.22);
    rig.torso.add(flask);
  },
  capininja: (rig) => {
    const cloth = toon("#27304d");
    // Hood around the head, mask over the snout: only the eye band shows fur.
    // Hood wraps the top/back; the face opening leaves the eye band in fur.
    const hood = blob(cloth, 0.42, 0.4, 0.36, 0.014);
    hood.position.set(0, 0.1, 0.16);
    const hoodBrow = blob(cloth, 0.36, 0.1, 0.2, 0.01);
    hoodBrow.position.set(0, 0.3, -0.12);
    const mask = blob(cloth, 0.33, 0.17, 0.3, 0.012);
    mask.position.set(0, -0.12, -0.27);
    const maskTip = blob(cloth, 0.25, 0.12, 0.12, 0.01);
    maskTip.position.set(0, -0.06, -0.5);
    rig.head.add(hood, hoodBrow, mask, maskTip);
    for (const sx of [-1, 1]) {
      const ear = blob(cloth, 0.09, 0.09, 0.07);
      ear.position.set(sx * 0.27, 0.36, 0.12);
      rig.head.add(ear);
    }
    // Brown cross straps, belt and pouches.
    const leather = toon(CAPY_COLORS.leather);
    for (const sx of [-1, 1]) {
      const strap = inked(new THREE.BoxGeometry(0.07, 0.95, 0.05), leather, 0.008);
      strap.position.set(0, 0.55, -0.4);
      strap.rotation.z = sx * 0.55;
      rig.torso.add(strap);
    }
    const belt = inked(new THREE.TorusGeometry(0.5, 0.045, 8, 30), leather, 0.01);
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1, 0.88, 1);
    belt.position.y = 0.22;
    rig.torso.add(belt);
    // Katana on the back.
    const blade = inked(new THREE.BoxGeometry(0.06, 0.95, 0.05), toon("#3a3f52"), 0.01);
    blade.position.set(0, 0.6, 0.44);
    blade.rotation.z = 0.6;
    const guard = inked(new THREE.BoxGeometry(0.16, 0.04, 0.08), toon("#a08a5a"), 0.006);
    guard.position.set(-0.24, 0.92, 0.44);
    guard.rotation.z = 0.6;
    const grip = inked(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 10), toon(CAPY_COLORS.leatherDark), 0.008);
    grip.position.set(-0.33, 1.06, 0.44);
    grip.rotation.z = 0.6;
    rig.torso.add(blade, guard, grip);
  },
  capirocket: (rig) => {
    tacticalVest(rig);
    // Bazooka resting on the right shoulder, red warhead forward.
    const zook = new THREE.Group();
    const tube = inked(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 16), toon("#4b5038"), 0.014);
    tube.rotation.x = Math.PI / 2;
    const rim = inked(new THREE.CylinderGeometry(0.125, 0.125, 0.12, 16), toon("#3a3d2b"), 0.01);
    rim.rotation.x = Math.PI / 2;
    rim.position.z = 0.5;
    const warhead = inked(new THREE.ConeGeometry(0.1, 0.26, 16), toon("#e0402e"), 0.012);
    warhead.rotation.x = -Math.PI / 2;
    warhead.position.z = -0.68;
    const tip = blob(toon("#ffcf4a"), 0.04, 0.04, 0.04, 0.006);
    tip.position.z = -0.8;
    const grip = inked(new THREE.BoxGeometry(0.06, 0.16, 0.06), toon("#2d2f22"), 0.008);
    grip.position.set(0, -0.14, -0.05);
    zook.add(tube, rim, warhead, tip, grip);
    zook.position.set(0.36, 0.98, 0.0);
    zook.rotation.x = -0.12;
    rig.torso.add(zook);
    const flame = new THREE.Group();
    const f = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.55, 12),
      new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    f.rotation.x = -Math.PI / 2;
    f.position.z = 0.82;
    flame.add(f);
    flame.visible = false;
    zook.add(flame);
    rig.flame = flame;
  },
  capizozo: (rig) => {
    tacticalVest(rig);
  },
  voxcapy: (rig) => {
    const mat = toon("#e8402e");
    const ring = inked(new THREE.TorusGeometry(0.3, 0.09, 12, 28), mat, 0.015);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.9, -0.02);
    rig.torso.add(ring);
    for (let i = 0; i < 2; i++) {
      const pivot = new THREE.Group();
      pivot.position.set((i - 0.5) * 0.14, 0.9, 0.28);
      const cloth = inked(new THREE.BoxGeometry(0.12, 0.05, 0.5), mat, 0.012);
      cloth.position.z = 0.25;
      pivot.add(cloth);
      rig.torso.add(pivot);
      rig.flaps.push(pivot);
    }
    backpack(rig, "#3c8f4a", "#2b5a33");
    const beanie = blob(toon("#e8402e"), 0.39, 0.22, 0.4, 0.015);
    beanie.position.set(0, 0.24, 0.06);
    const pom = blob(toon("#ffffff"), 0.1, 0.1, 0.1);
    pom.position.set(0, 0.46, 0.08);
    rig.head.add(beanie, pom);
  },
};

/* ───────────── Animation ───────────── */

export interface CapyPose {
  /** Seconds, for idle/cloth. */
  t: number;
  /** "squash" = slide: flattened pancake capybara. */
  mode: "run" | "air" | "squash" | "idle" | "fall" | "fly" | "wave";
  /** Run cycle phase in radians (advance with distance). */
  phase: number;
  /** 0..1: how hard the hero runs (speed). */
  effort: number;
  /** Vertical speed while airborne (+ up). */
  vy: number;
  /** -1..1 lateral lean (lane switch). */
  lean: number;
  /** 0..1 progress of a front flip (double jump). */
  flip: number;
  /** 0..1 progress of the fall (game over). */
  fall: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Give the jelly a kick (landing, hit). Positive = squash down. */
export function kickJelly(rig: CapyRig, amount: number) {
  rig.jelly.vel += amount;
}

/** Squash amount the body currently shows (0 = normal, 1 = pancake). */
export function jellyValue(rig: CapyRig) {
  return rig.jelly.v;
}

export function poseCapybara(rig: CapyRig, p: CapyPose, blend = 1) {
  const { legL, legR, armL, armR } = rig;
  const s = Math.sin(p.phase);
  const c = Math.cos(p.phase);
  let hipsY = 0.4;
  let pitch = 0;
  let headPitch = 0;
  const target = {
    lu: 0, ll: 0, ru: 0, rl: 0,
    alu: 0, all: 0.3, aru: 0, arl: 0.3,
    alz: 0.15, arz: -0.15,
  };

  // Sign convention (rotation.x): limb +angle swings FORWARD (-Z); knees use
  // -angle (shin folds back), elbows +angle (forearm folds forward).
  switch (p.mode) {
    case "run": {
      const k = 0.8 + p.effort * 0.35;
      target.lu = s * 1.0 * k;
      target.ru = -s * 1.0 * k;
      target.ll = -(Math.max(0, c) * 1.4 * k + 0.2);
      target.rl = -(Math.max(0, -c) * 1.4 * k + 0.2);
      target.alu = -s * 1.0 * k;
      target.aru = s * 1.0 * k;
      target.all = 1.2;
      target.arl = 1.2;
      target.alz = 0.3;
      target.arz = -0.3;
      hipsY = 0.4 + Math.abs(c) * 0.07;
      pitch = -0.16 - p.effort * 0.1;
      headPitch = 0.1;
      break;
    }
    case "air": {
      const rising = p.vy > 0;
      target.lu = rising ? 1.2 : 0.5;
      target.ll = rising ? -1.6 : -0.6;
      target.ru = rising ? 0.2 : -0.3;
      target.rl = rising ? -1.0 : -0.4;
      target.alu = 2.5;
      target.aru = 2.3;
      target.all = 0.3;
      target.arl = 0.3;
      target.alz = 0.5;
      target.arz = -0.5;
      pitch = -0.08;
      break;
    }
    case "fly": {
      target.lu = -0.4;
      target.ll = -0.6;
      target.ru = -0.2;
      target.rl = -0.4;
      target.alu = -0.4;
      target.aru = -0.4;
      target.all = 0.6;
      target.arl = 0.6;
      target.alz = 1.0;
      target.arz = -1.0;
      pitch = -0.5;
      hipsY = 0.4 + Math.sin(p.t * 6) * 0.04;
      break;
    }
    case "squash": {
      // Pancake slide: legs splayed forward, arms out like a starfish.
      target.lu = 1.5;
      target.ll = 0;
      target.ru = 1.5;
      target.rl = 0;
      target.alu = 0.2;
      target.aru = 0.2;
      target.all = 0.1;
      target.arl = 0.1;
      target.alz = 1.35;
      target.arz = -1.35;
      hipsY = 0.36;
      pitch = 0;
      headPitch = -0.15;
      break;
    }
    case "idle":
    case "wave": {
      const b = Math.sin(p.t * 2.2);
      hipsY = 0.4 + b * 0.01;
      target.lu = 0.04;
      target.ru = -0.04;
      target.ll = -0.05;
      target.rl = -0.05;
      target.alu = -0.05 + b * 0.04;
      target.all = 0.2;
      target.alz = 0.12;
      if (p.mode === "wave") {
        target.aru = 2.7;
        target.arz = -0.3 - Math.sin(p.t * 9) * 0.3;
        target.arl = 0.4;
      } else {
        target.aru = -0.05 - b * 0.04;
        target.arl = 0.2;
      }
      headPitch = -0.04 + Math.sin(p.t * 1.1) * 0.05;
      break;
    }
    case "fall": {
      const f = p.fall;
      target.lu = 1.1 * f;
      target.ll = -0.4;
      target.ru = 0.6 * f;
      target.rl = -0.8;
      target.alu = 2.6 * f;
      target.aru = 2.4 * f;
      target.alz = 0.8;
      target.arz = -0.8;
      pitch = 1.4 * f;
      hipsY = 0.4 - 0.12 * f;
      headPitch = -0.3 * f;
      break;
    }
  }

  const k = blend;
  legL.upper.rotation.x = lerp(legL.upper.rotation.x, target.lu, k);
  legL.lower.rotation.x = lerp(legL.lower.rotation.x, target.ll, k);
  legR.upper.rotation.x = lerp(legR.upper.rotation.x, target.ru, k);
  legR.lower.rotation.x = lerp(legR.lower.rotation.x, target.rl, k);
  armL.upper.rotation.x = lerp(armL.upper.rotation.x, target.alu, k);
  armL.lower.rotation.x = lerp(armL.lower.rotation.x, target.all, k);
  armR.upper.rotation.x = lerp(armR.upper.rotation.x, target.aru, k);
  armR.lower.rotation.x = lerp(armR.lower.rotation.x, target.arl, k);
  armL.upper.rotation.z = lerp(armL.upper.rotation.z, -target.alz, k);
  armR.upper.rotation.z = lerp(armR.upper.rotation.z, -target.arz, k);
  legL.upper.rotation.z = lerp(legL.upper.rotation.z, p.mode === "squash" ? -0.5 : 0, k);
  legR.upper.rotation.z = lerp(legR.upper.rotation.z, p.mode === "squash" ? 0.5 : 0, k);
  rig.hips.position.y = lerp(rig.hips.position.y, hipsY, k);
  rig.head.rotation.x = lerp(rig.head.rotation.x, headPitch, k);
  rig.hips.rotation.x = lerp(rig.hips.rotation.x, pitch, k);

  // Front flip pivots around the belly, not the feet: body.position = c - R·c.
  const spin = (theta: number, cy: number) => {
    rig.body.rotation.x = theta;
    rig.body.position.set(0, cy - cy * Math.cos(theta), -cy * Math.sin(theta));
  };
  if (p.flip > 0 && p.flip < 1 && p.mode !== "squash") spin(-p.flip * Math.PI * 2, 0.85);
  else spin(0, 0);
  rig.body.rotation.z = lerp(rig.body.rotation.z, -p.lean * 0.3, k);

  // Jelly spring: target 1 while squashing, 0 otherwise; under-damped so it wobbles.
  const j = rig.jelly;
  const dt = j.t < 0 ? 0 : Math.min(0.05, Math.max(0, p.t - j.t));
  j.t = p.t;
  const goal = p.mode === "squash" ? 1 : 0;
  j.vel += ((goal - j.v) * 220 - j.vel * 13) * dt;
  j.v += j.vel * dt;
  const v = Math.max(-0.35, Math.min(1.1, j.v));
  // Volume-ish preserving: flatter means wider.
  const sy = 1 - 0.58 * v;
  const sxz = 1 + 0.42 * v;
  rig.body.scale.set(sxz, Math.max(0.3, sy), sxz);

  // Cloth & flame.
  for (const f of rig.flaps) {
    f.rotation.x = -0.15 - p.effort * 0.5 + Math.sin(p.t * 18 + f.position.x * 9) * (0.1 + p.effort * 0.2);
  }
  if (rig.flame) {
    rig.flame.visible = p.mode === "fly" || (p.mode === "air" && p.vy > 0);
    rig.flame.scale.setScalar(0.8 + Math.random() * 0.5);
  }
  // Blink (squeezed shut while squashed — the funny face).
  const blink = p.mode === "squash" ? 0.25 : p.t % 3.2 < 0.12 ? 0.15 : 1;
  for (const e of rig.eyes) e.scale.y = blink;
}

/** Flash the whole hero (hit / pickup). 0 = normal. */
export function tintCapybara(rig: CapyRig, color: THREE.Color | null, amount: number) {
  for (const m of rig.mats) {
    if (!m.userData.baseEmissive) m.userData.baseEmissive = m.emissive.clone();
    if (color && amount > 0) m.emissive.copy(m.userData.baseEmissive as THREE.Color).lerp(color, amount);
    else m.emissive.copy(m.userData.baseEmissive as THREE.Color);
  }
}
