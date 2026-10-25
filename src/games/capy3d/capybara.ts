/**
 * Procedural 3D capybara heroes for the Capynite worlds. Chibi biped built from
 * primitives with a joint hierarchy, so every pose (run, jump, roll, idle,
 * wave, fall) is animated in code. Faces -Z; feet at y = 0; ~1.75 m tall.
 */
import * as THREE from "three";
import { inked, toon } from "./toon";

export type CapyHeroId = "capininja" | "capivini" | "capirocket" | "capizozo" | "voxcapy";

interface Style {
  fur: string;
  furDark: string;
  belly: string;
  shoe: string;
  sole: string;
  extra: (rig: CapyRig) => void;
}

const FUR = "#c4813f";
const FUR_DARK = "#9a5f2b";
const BELLY = "#e0a868";

export interface CapyRig {
  root: THREE.Group;
  /** Everything above the feet pivot; used for flips and rolls. */
  body: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  legL: Limb;
  legR: Limb;
  armL: Limb;
  armR: Limb;
  /** Cloth pieces that flap with speed (scarf tails, cape). */
  flaps: THREE.Object3D[];
  /** Rocket flame (only some heroes). */
  flame: THREE.Object3D | null;
  eyes: THREE.Object3D[];
  mats: THREE.MeshToonMaterial[];
}

interface Limb {
  upper: THREE.Group;
  lower: THREE.Group;
}

const geo = {
  sphere: new THREE.SphereGeometry(1, 28, 20),
  sphereLo: new THREE.SphereGeometry(1, 16, 12),
  capsule: (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 6, 14),
  box: (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d),
  cyl: (rt: number, rb: number, h: number, s = 18) => new THREE.CylinderGeometry(rt, rb, h, s),
};

function blob(mat: THREE.Material, sx: number, sy: number, sz: number, ink = 0.022): THREE.Mesh {
  const m = inked(geo.sphere, mat, ink / Math.max(0.2, Math.min(sx, sy, sz)));
  m.scale.set(sx, sy, sz);
  return m;
}

function limb(parent: THREE.Object3D, x: number, y: number, upperLen: number, lowerLen: number, r: number, mat: THREE.Material, end: THREE.Object3D): Limb {
  const upper = new THREE.Group();
  upper.position.set(x, y, 0);
  parent.add(upper);
  const u = inked(geo.capsule(r, upperLen), mat, 0.02);
  u.position.y = -upperLen / 2;
  upper.add(u);
  const lower = new THREE.Group();
  lower.position.y = -upperLen;
  upper.add(lower);
  const l = inked(geo.capsule(r * 0.92, lowerLen), mat, 0.02);
  l.position.y = -lowerLen / 2;
  lower.add(l);
  end.position.y -= lowerLen + r * 0.4;
  lower.add(end);
  return { upper, lower };
}

function shoe(color: string, sole: string): THREE.Group {
  const g = new THREE.Group();
  const top = blob(toon(color), 0.15, 0.11, 0.24);
  top.position.set(0, 0.02, -0.06);
  const s = inked(geo.box(0.27, 0.06, 0.46), toon(sole), 0.015);
  s.position.set(0, -0.07, -0.06);
  g.add(top, s);
  return g;
}

function hand(color: string): THREE.Mesh {
  return blob(toon(color), 0.11, 0.11, 0.11);
}

export function buildCapybara(id: CapyHeroId): CapyRig {
  const style = STYLES[id] ?? STYLES.capivini;
  const fur = toon(style.fur);
  const furDark = toon(style.furDark);
  const root = new THREE.Group();
  root.name = `capy-${id}`;
  const body = new THREE.Group();
  root.add(body);
  const hips = new THREE.Group();
  hips.position.y = 0.72;
  body.add(hips);

  // Torso: pear-shaped, chunky.
  const torso = new THREE.Group();
  hips.add(torso);
  const chest = blob(fur, 0.44, 0.48, 0.38);
  chest.position.y = 0.32;
  const belly = blob(toon(style.belly), 0.32, 0.36, 0.2, 0.012);
  belly.position.set(0, 0.28, -0.22);
  const back = blob(furDark, 0.4, 0.42, 0.2, 0.012);
  back.position.set(0, 0.36, 0.18);
  const tail = blob(furDark, 0.08, 0.07, 0.08);
  tail.position.set(0, 0.05, 0.36);
  torso.add(chest, belly, back, tail);

  // Head: big, capybara block-snout.
  const head = new THREE.Group();
  head.position.set(0, 0.86, -0.04);
  torso.add(head);
  const skull = blob(fur, 0.4, 0.36, 0.42);
  skull.position.set(0, 0.06, 0.04);
  // Capybara snout: long, tall and blunt, with a small dark pad.
  const muzzle = blob(fur, 0.27, 0.26, 0.36);
  muzzle.position.set(0, -0.02, -0.32);
  const nose = blob(toon("#4a2c1a"), 0.13, 0.06, 0.05, 0.008);
  nose.position.set(0, 0.07, -0.66);
  const brow = blob(furDark, 0.34, 0.12, 0.28, 0.01);
  brow.position.set(0, 0.25, -0.06);
  head.add(skull, muzzle, nose, brow);
  for (const sx of [-1, 1]) {
    const ear = blob(furDark, 0.09, 0.08, 0.06);
    ear.position.set(sx * 0.3, 0.33, 0.12);
    ear.rotation.z = sx * -0.4;
    const nostril = blob(toon("#1a0f0a"), 0.035, 0.02, 0.02, 0);
    nostril.position.set(sx * 0.06, 0.07, -0.69);
    head.add(ear, nostril);
  }
  const eyes: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.17, 0.15, -0.34);
    const white = blob(toon("#ffffff"), 0.085, 0.1, 0.05, 0.012);
    const pupil = blob(toon("#1a0f0a"), 0.055, 0.07, 0.03, 0);
    pupil.position.set(sx * -0.01, -0.01, -0.03);
    const shine = blob(toon("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.6 }), 0.02, 0.02, 0.012, 0);
    shine.position.set(sx * -0.025, 0.02, -0.055);
    eye.add(white, pupil, shine);
    head.add(eye);
    eyes.push(eye);
  }

  const shoeL = shoe(style.shoe, style.sole);
  const shoeR = shoe(style.shoe, style.sole);
  const legL = limb(hips, -0.2, 0.02, 0.26, 0.24, 0.12, fur, shoeL);
  const legR = limb(hips, 0.2, 0.02, 0.26, 0.24, 0.12, fur, shoeR);
  const armL = limb(torso, -0.46, 0.55, 0.22, 0.2, 0.09, fur, hand(style.fur));
  const armR = limb(torso, 0.46, 0.55, 0.22, 0.2, 0.09, fur, hand(style.fur));

  const rig: CapyRig = { root, body, hips, torso, head, legL, legR, armL, armR, flaps: [], flame: null, eyes, mats: [] };
  style.extra(rig);
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

/* ───────────── Outfits ───────────── */

function scarf(rig: CapyRig, color: string, tails = 2) {
  const mat = toon(color);
  const ring = inked(new THREE.TorusGeometry(0.3, 0.09, 12, 28), mat, 0.015);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.74, 0);
  rig.torso.add(ring);
  for (let i = 0; i < tails; i++) {
    const pivot = new THREE.Group();
    pivot.position.set((i - (tails - 1) / 2) * 0.14, 0.74, 0.28);
    const cloth = inked(geo.box(0.12, 0.05, 0.5), mat, 0.012);
    cloth.position.z = 0.25;
    pivot.add(cloth);
    rig.torso.add(pivot);
    rig.flaps.push(pivot);
  }
}

function vest(rig: CapyRig, color: string, pockets: string) {
  const mat = toon(color);
  const v = blob(mat, 0.47, 0.4, 0.41, 0.015);
  v.position.y = 0.36;
  rig.torso.add(v);
  for (const sx of [-1, 1]) {
    const p = inked(geo.box(0.16, 0.14, 0.06), toon(pockets), 0.01);
    p.position.set(sx * 0.17, 0.26, -0.38);
    rig.torso.add(p);
  }
}

function backpack(rig: CapyRig, color: string, strap: string) {
  const bag = inked(new THREE.CapsuleGeometry(0.2, 0.22, 6, 14), toon(color), 0.018);
  bag.position.set(0, 0.42, 0.4);
  bag.scale.set(1.1, 1, 0.65);
  const flap = blob(toon(strap), 0.2, 0.08, 0.14, 0.01);
  flap.position.set(0, 0.62, 0.44);
  rig.torso.add(bag, flap);
  for (const sx of [-1, 1]) {
    const s = inked(geo.box(0.06, 0.6, 0.04), toon(strap), 0.01);
    s.position.set(sx * 0.2, 0.42, -0.36);
    s.rotation.x = 0.15;
    rig.torso.add(s);
  }
}

const STYLES: Record<CapyHeroId, Style> = {
  capininja: {
    fur: FUR,
    furDark: FUR_DARK,
    belly: BELLY,
    shoe: "#2a3047",
    sole: "#e9e9f2",
    extra: (rig) => {
      const cloth = toon("#2b3352");
      const hood = blob(cloth, 0.45, 0.43, 0.42, 0.015);
      hood.position.set(0, 0.11, 0.13);
      const opening = blob(toon(FUR), 0.3, 0.13, 0.1, 0.01);
      opening.position.set(0, 0.15, -0.27);
      const mask = blob(cloth, 0.32, 0.18, 0.31, 0.012);
      mask.position.set(0, -0.08, -0.3);
      rig.head.add(hood, opening, mask);
      for (const sx of [-1, 1]) {
        const ear = blob(cloth, 0.1, 0.1, 0.07);
        ear.position.set(sx * 0.28, 0.4, 0.12);
        rig.head.add(ear);
      }
      const suit = blob(cloth, 0.46, 0.44, 0.4, 0.012);
      suit.position.y = 0.38;
      const belt = inked(new THREE.TorusGeometry(0.42, 0.05, 8, 28), toon("#c23a3a"), 0.01);
      belt.rotation.x = Math.PI / 2;
      belt.position.y = 0.14;
      rig.torso.add(suit, belt);
      // Long red headband tails: the silhouette you see from behind.
      for (let i = 0; i < 2; i++) {
        const pivot = new THREE.Group();
        pivot.position.set((i - 0.5) * 0.12, 0.2, 0.45);
        const tail = inked(geo.box(0.08, 0.03, 0.55), toon("#e0413e"), 0.01);
        tail.position.z = 0.27;
        pivot.add(tail);
        rig.head.add(pivot);
        rig.flaps.push(pivot);
      }
      const band = inked(new THREE.TorusGeometry(0.43, 0.035, 8, 30), toon("#e0413e"), 0.008);
      band.rotation.x = Math.PI / 2 - 0.15;
      band.position.set(0, 0.2, 0.04);
      rig.head.add(band);
      // Katana on the back.
      const blade = inked(geo.box(0.05, 0.9, 0.04), toon("#c9d2e3"), 0.01);
      blade.position.set(0, 0.45, 0.42);
      blade.rotation.z = 0.7;
      const grip = inked(geo.cyl(0.04, 0.04, 0.24), toon("#e0413e"), 0.01);
      grip.position.set(-0.32, 0.82, 0.42);
      grip.rotation.z = 0.7;
      rig.torso.add(blade, grip);
    },
  },
  capivini: {
    fur: FUR,
    furDark: FUR_DARK,
    belly: BELLY,
    shoe: "#6b3f22",
    sole: "#2b1a10",
    extra: (rig) => {
      const leather = toon("#5b3820");
      const jacket = blob(leather, 0.46, 0.44, 0.4, 0.015);
      jacket.position.y = 0.37;
      const collar = inked(new THREE.TorusGeometry(0.28, 0.07, 10, 26), toon("#7a4b2a"), 0.012);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.72;
      rig.torso.add(jacket, collar);
      backpack(rig, "#2f6fb0", "#3b2416");
      // Explorer goggles on the forehead.
      const strap = inked(new THREE.TorusGeometry(0.42, 0.03, 8, 30), toon("#3b2416"), 0.008);
      strap.rotation.x = Math.PI / 2 - 0.2;
      strap.position.set(0, 0.18, 0.04);
      rig.head.add(strap);
      for (const sx of [-1, 1]) {
        const lens = inked(geo.cyl(0.08, 0.08, 0.06), toon("#38e1ff", { emissive: "#0b6c80", emissiveIntensity: 0.6 }), 0.012);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(sx * 0.13, 0.3, -0.3);
        rig.head.add(lens);
      }
    },
  },
  capirocket: {
    fur: FUR,
    furDark: FUR_DARK,
    belly: BELLY,
    shoe: "#4b5530",
    sole: "#1c1f14",
    extra: (rig) => {
      vest(rig, "#5f6b3a", "#47512b");
      // Rocket pack: two tanks + nozzles; flame shown while airborne.
      const pack = new THREE.Group();
      pack.position.set(0, 0.42, 0.38);
      for (const sx of [-1, 1]) {
        const tank = inked(new THREE.CapsuleGeometry(0.11, 0.36, 6, 14), toon("#d94b2b"), 0.015);
        tank.position.x = sx * 0.14;
        const cap = inked(new THREE.ConeGeometry(0.11, 0.16, 14), toon("#f1f1f1"), 0.01);
        cap.position.set(sx * 0.14, 0.34, 0);
        const nozzle = inked(geo.cyl(0.07, 0.1, 0.1), toon("#333"), 0.01);
        nozzle.position.set(sx * 0.14, -0.3, 0);
        pack.add(tank, cap, nozzle);
      }
      rig.torso.add(pack);
      const flame = new THREE.Group();
      for (const sx of [-1, 1]) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 12), new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
        f.rotation.x = Math.PI;
        f.position.set(sx * 0.14, -0.6, 0);
        flame.add(f);
      }
      flame.visible = false;
      pack.add(flame);
      rig.flame = flame;
      const helmet = blob(toon("#5f6b3a"), 0.42, 0.24, 0.44, 0.015);
      helmet.position.set(0, 0.24, 0.05);
      rig.head.add(helmet);
    },
  },
  capizozo: {
    fur: "#cf8d48",
    furDark: "#a5672f",
    belly: "#ecb878",
    shoe: "#ffcf4a",
    sole: "#ffffff",
    extra: (rig) => {
      vest(rig, "#7a5a36", "#5d4327");
      // Backwards cap + propeller: unmistakable from behind.
      const cap = blob(toon("#ff7a2e"), 0.4, 0.2, 0.42, 0.015);
      cap.position.set(0, 0.28, 0.05);
      const brim = inked(geo.cyl(0.22, 0.22, 0.04), toon("#ff7a2e"), 0.01);
      brim.scale.set(1, 1, 0.7);
      brim.position.set(0, 0.26, 0.42);
      brim.rotation.x = -0.25;
      const stem = inked(geo.cyl(0.02, 0.02, 0.14), toon("#333"), 0.006);
      stem.position.set(0, 0.5, 0.05);
      const prop = new THREE.Group();
      prop.position.set(0, 0.58, 0.05);
      for (const c of ["#38e1ff", "#ff4d6d"]) {
        const blade = inked(geo.box(0.36, 0.015, 0.07), toon(c), 0.006);
        blade.rotation.y = c === "#38e1ff" ? 0 : Math.PI / 2;
        prop.add(blade);
      }
      prop.name = "propeller";
      rig.head.add(cap, brim, stem, prop);
      rig.flaps.push(prop);
    },
  },
  voxcapy: {
    fur: FUR,
    furDark: FUR_DARK,
    belly: BELLY,
    shoe: "#2d2d2d",
    sole: "#f0f0f0",
    extra: (rig) => {
      scarf(rig, "#e8402e", 2);
      backpack(rig, "#3c8f4a", "#2b5a33");
      const beanie = blob(toon("#e8402e"), 0.42, 0.24, 0.44, 0.015);
      beanie.position.set(0, 0.24, 0.05);
      const pom = blob(toon("#ffffff"), 0.1, 0.1, 0.1);
      pom.position.set(0, 0.48, 0.08);
      rig.head.add(beanie, pom);
    },
  },
};

/* ───────────── Animation ───────────── */

export interface CapyPose {
  /** Seconds, for idle/cloth. */
  t: number;
  mode: "run" | "air" | "roll" | "idle" | "fall" | "fly" | "wave";
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

export function poseCapybara(rig: CapyRig, p: CapyPose, blend = 1) {
  const { legL, legR, armL, armR } = rig;
  const s = Math.sin(p.phase);
  const c = Math.cos(p.phase);
  let hipsY = 0.72;
  let pitch = 0;
  let headPitch = 0;
  const target = {
    lu: 0, ll: 0, ru: 0, rl: 0,
    alu: 0, all: -0.4, aru: 0, arl: -0.4,
    alz: 0.15, arz: -0.15,
  };

  // Sign convention (rotation.x): limb +angle swings FORWARD (-Z); knees use
  // -angle (shin folds back), elbows +angle (forearm folds forward).
  switch (p.mode) {
    case "run": {
      const k = 0.75 + p.effort * 0.35;
      target.lu = s * 0.95 * k;
      target.ru = -s * 0.95 * k;
      target.ll = -(Math.max(0, c) * 1.6 * k + 0.2);
      target.rl = -(Math.max(0, -c) * 1.6 * k + 0.2);
      target.alu = -s * 0.9 * k;
      target.aru = s * 0.9 * k;
      target.all = 1.4;
      target.arl = 1.4;
      hipsY = 0.72 + Math.abs(c) * 0.09;
      pitch = -0.22 - p.effort * 0.12;
      headPitch = 0.12;
      break;
    }
    case "air": {
      const rising = p.vy > 0;
      target.lu = rising ? 1.3 : 0.5;
      target.ll = rising ? -1.9 : -0.7;
      target.ru = rising ? 0.2 : -0.3;
      target.rl = rising ? -1.1 : -0.4;
      target.alu = 2.5;
      target.aru = 2.3;
      target.all = 0.3;
      target.arl = 0.3;
      target.alz = 0.45;
      target.arz = -0.45;
      pitch = -0.1;
      break;
    }
    case "fly": {
      target.lu = -0.4;
      target.ll = -0.7;
      target.ru = -0.2;
      target.rl = -0.5;
      target.alu = -0.5;
      target.aru = -0.5;
      target.all = 0.6;
      target.arl = 0.6;
      target.alz = 0.9;
      target.arz = -0.9;
      pitch = -0.55;
      hipsY = 0.72 + Math.sin(p.t * 6) * 0.04;
      break;
    }
    case "roll": {
      // Tucked ball: knees to chest, arms hugging them.
      target.lu = 2.2;
      target.ll = -2.4;
      target.ru = 2.2;
      target.rl = -2.4;
      target.alu = 0.9;
      target.aru = 0.9;
      target.all = 1.6;
      target.arl = 1.6;
      hipsY = 0.42;
      pitch = 0;
      headPitch = -0.4;
      break;
    }
    case "idle":
    case "wave": {
      const b = Math.sin(p.t * 2.2);
      hipsY = 0.72 + b * 0.012;
      target.lu = 0.05;
      target.ru = -0.05;
      target.ll = -0.08;
      target.rl = -0.08;
      target.alu = -0.05 + b * 0.04;
      target.all = 0.25;
      target.alz = 0.18;
      if (p.mode === "wave") {
        target.aru = 2.7;
        target.arz = -0.35 - Math.sin(p.t * 9) * 0.3;
        target.arl = 0.4;
      } else {
        target.aru = -0.05 - b * 0.04;
        target.arl = 0.25;
      }
      headPitch = -0.05 + Math.sin(p.t * 1.1) * 0.05;
      pitch = 0;
      break;
    }
    case "fall": {
      const f = p.fall;
      target.lu = 1.2 * f;
      target.ll = -0.5;
      target.ru = 0.6 * f;
      target.rl = -0.9;
      target.alu = 2.6 * f;
      target.aru = 2.4 * f;
      target.alz = 0.7;
      target.arz = -0.7;
      pitch = 1.45 * f;
      hipsY = 0.72 - 0.42 * f;
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
  rig.hips.position.y = lerp(rig.hips.position.y, hipsY, k);
  rig.head.rotation.x = lerp(rig.head.rotation.x, headPitch, k);

  // Spins (roll, flip) pivot around the belly, not the feet: body.position = c - R·c.
  const spin = (theta: number, cy: number) => {
    rig.body.rotation.x = theta;
    rig.body.position.set(0, cy - cy * Math.cos(theta), -cy * Math.sin(theta));
  };
  if (p.mode === "roll") {
    spin(-((p.t * 13) % (Math.PI * 2)), 0.55);
  } else {
    rig.hips.rotation.x = lerp(rig.hips.rotation.x, pitch, k);
    if (p.flip > 0 && p.flip < 1) spin(-p.flip * Math.PI * 2, 0.95);
    else spin(0, 0);
  }
  rig.body.rotation.z = lerp(rig.body.rotation.z, -p.lean * 0.35, k);

  // Cloth & propeller.
  for (const f of rig.flaps) {
    if (f.name === "propeller") f.rotation.y += 0.4 + p.effort * 0.6;
    else f.rotation.x = -0.15 - p.effort * 0.5 + Math.sin(p.t * 18 + f.position.x * 9) * (0.1 + p.effort * 0.2);
  }
  if (rig.flame) {
    rig.flame.visible = p.mode === "fly" || (p.mode === "air" && p.vy > 0);
    rig.flame.scale.setScalar(0.8 + Math.random() * 0.5);
  }
  // Blink.
  const blink = (p.t % 3.2) < 0.12 ? 0.15 : 1;
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
