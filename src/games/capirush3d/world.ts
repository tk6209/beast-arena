/**
 * CAPI RUSH 3D — Three.js renderer for the pure Capi Rush engine.
 * Reads RushState every frame; never mutates it. Engine z (metres ahead of the
 * player) maps to world -Z; the hero runs in place at the origin.
 */
import * as THREE from "three";
import { BASE_SPEED, CHECKPOINT_EVERY, MAX_SPEED, isSliding, type Obstacle, type Pickup, type RushEvent, type RushState } from "../capirush/engine";
import { buildCapybara, kickJelly, poseCapybara, tintCapybara, type CapyHeroId, type CapyPose, type CapyRig } from "../capy3d/capybara";
import { inked, toon } from "../capy3d/toon";
import { facadeTexture, glowTexture, sidewalkTexture, skyTexture, starTexture, stripeTexture, trackTexture, trainSideTexture } from "../capy3d/textures";

export const LANE_W = 2.3;
const VIEW_AHEAD = 140;
const DECOR_LEN = 168;
const wz = (z: number) => -(z - 0.5);

export type RushPhase = "ready" | "playing" | "paused" | "over";

interface Particle {
  s: THREE.Sprite;
  v: THREE.Vector3;
  life: number;
  age: number;
  grav: number;
  size0: number;
  size1: number;
}

interface Decor {
  obj: THREE.Object3D;
  base: number;
}

export class Rush3D {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 260);
  private sun: THREE.DirectionalLight;
  private hero!: CapyRig;
  private heroId: CapyHeroId | null = null;
  private heroHolder = new THREE.Group();
  private track!: THREE.Mesh;
  private trackTex: THREE.CanvasTexture;
  private gate: THREE.Group;
  private gateGlow = 0;
  private walkTex: THREE.CanvasTexture;
  private walks: THREE.Mesh[] = [];
  private decor: Decor[] = [];
  private obstacles = new Map<number, THREE.Object3D>();
  private pickups = new Map<number, THREE.Object3D>();
  private parts: Particle[] = [];
  private partPool: THREE.Sprite[] = [];
  private glowTex = glowTexture();
  private starTex = starTexture();
  private shieldBubble: THREE.Mesh;
  private magnetRing: THREE.Mesh;
  private speedLines: THREE.Mesh[] = [];
  private camPos = new THREE.Vector3(0, 3, 6);
  private camLook = new THREE.Vector3(0, 1.3, -6);
  private shake = 0;
  private time = 0;
  private runPhase = 0;
  private lastLaneX = 0;
  private lean = 0;
  private flip = 0;
  private fall = 0;
  private hitFlash = 0;
  private pickupFlash = 0;
  private wasAir = false;
  private width = 1;
  private height = 1;
  private reduced: boolean;
  private shared = {
    coinGeo: new THREE.CylinderGeometry(0.32, 0.32, 0.08, 28),
    coinMat: toon("#ffc83a", { emissive: "#8a5200", emissiveIntensity: 0.35 }),
    coinRim: toon("#e8a51c"),
    post: new THREE.CylinderGeometry(0.07, 0.07, 1, 12),
    postMat: toon("#9aa4b5"),
    hurdle: new THREE.MeshToonMaterial({ map: stripeTexture("#ffffff", "#e8402e", 5) }),
    hazard: new THREE.MeshToonMaterial({ map: stripeTexture("#ffcf2e", "#222222", 6) }),
  };
  private trainTex: Record<string, THREE.CanvasTexture> = {};

  constructor(private host: HTMLElement) {
    this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const c = this.renderer.domElement;
    c.style.display = "block";
    c.style.width = "100%";
    c.style.height = "100%";
    host.appendChild(c);

    // Sunny CapyCity afternoon.
    this.scene.background = skyTexture("#3fa9ff", "#8fd3ff", "#ffe2b8");
    this.scene.fog = new THREE.Fog(0xffd9b0, 45, VIEW_AHEAD);
    this.scene.add(new THREE.HemisphereLight(0xcfeaff, 0xc08a5a, 1.6));
    this.sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
    this.sun.position.set(-5, 12, 4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -9;
    sc.right = 9;
    sc.top = 12;
    sc.bottom = -12;
    sc.near = 1;
    sc.far = 40;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun, this.sun.target);

    this.trackTex = trackTexture();
    this.walkTex = sidewalkTexture();
    this.buildGround();
    this.buildDecor();
    this.buildSkyline();

    this.gate = this.buildGate();
    this.scene.add(this.gate);
    this.scene.add(this.heroHolder);
    this.shieldBubble = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.shieldBubble.position.y = 0.95;
    this.heroHolder.add(this.shieldBubble);
    this.magnetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.95, 40),
      new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.magnetRing.rotation.x = -Math.PI / 2;
    this.magnetRing.position.y = 0.04;
    this.heroHolder.add(this.magnetRing);

    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.03, 2.2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      m.rotation.x = -Math.PI / 2;
      this.speedLines.push(m);
      this.scene.add(m);
    }
    this.resize();
  }

  /* ───────── World building ───────── */

  private buildGround() {
    const len = VIEW_AHEAD + 30;
    this.trackTex.repeat.set(3, len / 4);
    const track = new THREE.Mesh(new THREE.PlaneGeometry(LANE_W * 3 + 0.6, len), new THREE.MeshToonMaterial({ map: this.trackTex }));
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, -len / 2 + 15);
    track.receiveShadow = true;
    this.track = track;
    this.scene.add(track);

    const rail = new THREE.BoxGeometry(0.1, 0.12, len);
    const railMat = toon("#c9cfd8");
    for (let l = -1; l <= 1; l++) {
      for (const sx of [-1, 1]) {
        const r = new THREE.Mesh(rail, railMat);
        r.position.set(l * LANE_W + sx * 0.62, 0.06, -len / 2 + 15);
        r.receiveShadow = true;
        this.scene.add(r);
      }
    }
    this.walkTex.repeat.set(2, len / 3);
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, len), new THREE.MeshToonMaterial({ map: this.walkTex }));
      w.position.set(sx * (LANE_W * 1.5 + 0.3 + 2.1), 0.175, -len / 2 + 15);
      w.receiveShadow = true;
      this.walks.push(w);
      this.scene.add(w);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.42, len), toon("#f2e6d4"));
      curb.position.set(sx * (LANE_W * 1.5 + 0.42), 0.21, -len / 2 + 15);
      this.scene.add(curb);
      const street = new THREE.Mesh(new THREE.PlaneGeometry(40, len), toon("#7fbf5a"));
      street.rotation.x = -Math.PI / 2;
      street.position.set(sx * (LANE_W * 1.5 + 4.6 + 20), 0.01, -len / 2 + 15);
      this.scene.add(street);
    }
  }

  private buildDecor() {
    const palettes: [string, string, string][] = [
      ["#ff8f6b", "#ffd2b8", "#9fe3ff"],
      ["#ffd166", "#fff1c9", "#bdf0ff"],
      ["#7cc6ff", "#e3f4ff", "#ffe9a8"],
      ["#b48cff", "#ece2ff", "#9fe3ff"],
      ["#6fdc9a", "#dbffe9", "#bdf0ff"],
      ["#ff6fa8", "#ffd6e7", "#fff3a8"],
    ];
    const facades = palettes.map(([w, t, l]) => facadeTexture(w, t, l));
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // Buildings: two continuous rows, recycled along the track.
    for (const sx of [-1, 1]) {
      let z = 0;
      while (z < DECOR_LEN) {
        const w = 4 + rnd() * 3;
        const d = 6 + rnd() * 5;
        const h = 5 + rnd() * 11;
        const i = Math.floor(rnd() * facades.length);
        const geo = new THREE.BoxGeometry(w, h, d);
        // Tile windows every ~3 m whatever the building size.
        const uv = geo.attributes.uv as THREE.BufferAttribute;
        const norm = geo.attributes.normal as THREE.BufferAttribute;
        for (let k = 0; k < uv.count; k++) {
          const nx = Math.abs(norm.getX(k));
          const ny = Math.abs(norm.getY(k));
          const sU = nx > 0.5 ? d / 3 : w / 3;
          const sV = ny > 0.5 ? d / 3 : h / 3;
          uv.setXY(k, uv.getX(k) * sU, uv.getY(k) * sV);
        }
        const mat = new THREE.MeshToonMaterial({ map: facades[i], gradientMap: toon("#fff").gradientMap });
        const b = inked(geo, mat, 0.05);
        b.position.set(sx * (LANE_W * 1.5 + 4.9 + w / 2), h / 2, 0);
        b.castShadow = false;
        b.receiveShadow = true;
        const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.4, d + 0.3), toon(palettes[i][1]));
        roof.position.y = h / 2 + 0.2;
        b.add(roof);
        if (rnd() < 0.35) {
          const tank = inked(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 14), toon("#9b6b45"), 0.03);
          tank.position.set((rnd() - 0.5) * (w - 1.5), h / 2 + 1.2, (rnd() - 0.5) * (d - 1.5));
          b.add(tank);
        }
        // Awning at street level.
        const aw = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, d * 0.7), toon(palettes[(i + 2) % palettes.length][0]));
        aw.position.set(-sx * (w / 2 + 0.4), -h / 2 + 2.6, 0);
        aw.rotation.z = sx * 0.3;
        b.add(aw);
        this.scene.add(b);
        this.decor.push({ obj: b, base: z + d / 2 });
        z += d + 0.6;
      }
    }

    // Street props on the sidewalks.
    const trunk = toon("#8a5a34");
    const leaves = [toon("#4fcf5f"), toon("#7be36b"), toon("#ffb347")];
    for (let i = 0; i < 28; i++) {
      const sx = i % 2 ? 1 : -1;
      const base = (i / 28) * DECOR_LEN + rnd() * 2;
      const g = new THREE.Group();
      const kind = i % 4;
      if (kind === 0 || kind === 2) {
        const t = inked(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 10), trunk, 0.03);
        t.position.y = 0.8;
        const crown = inked(new THREE.IcosahedronGeometry(1.0, 1), leaves[Math.floor(rnd() * leaves.length)], 0.04);
        crown.position.y = 2.2;
        crown.scale.set(1, 0.9, 1);
        t.castShadow = crown.castShadow = true;
        g.add(t, crown);
      } else if (kind === 1) {
        const pole = inked(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 10), toon("#3b4a66"), 0.02);
        pole.position.y = 1.8;
        const arm = inked(new THREE.BoxGeometry(0.9, 0.08, 0.08), toon("#3b4a66"), 0.015);
        arm.position.set(-sx * 0.4, 3.55, 0);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), toon("#fff4c2", { emissive: "#ffe28a", emissiveIntensity: 0.8 }));
        lamp.position.set(-sx * 0.82, 3.45, 0);
        g.add(pole, arm, lamp);
      } else {
        const bench = inked(new THREE.BoxGeometry(0.6, 0.12, 1.6), toon("#ff7a45"), 0.02);
        bench.position.y = 0.55;
        const backr = inked(new THREE.BoxGeometry(0.1, 0.5, 1.6), toon("#ff7a45"), 0.02);
        backr.position.set(sx * 0.3, 0.85, 0);
        const hyd = inked(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 12), toon("#e8402e"), 0.02);
        hyd.position.set(-sx * 0.9, 0.35, 1.5);
        g.add(bench, backr, hyd);
      }
      g.position.set(sx * (LANE_W * 1.5 + 2.4), 0.35, 0);
      this.scene.add(g);
      this.decor.push({ obj: g, base });
    }
  }

  private buildSkyline() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xa9c8ef, fog: false });
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xc9dcf5, fog: false });
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 46; i++) {
      const far = i % 2 === 0;
      const w = 6 + rnd() * 10;
      const h = 14 + rnd() * (far ? 40 : 26);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4), far ? mat2 : mat);
      const x = (rnd() - 0.5) * 260;
      m.position.set(x, h / 2 - 2, far ? -235 : -205);
      this.scene.add(m);
    }
  }

  /** Checkpoint arch spanning the tracks: flag banner on two striped towers. */
  private buildGate(): THREE.Group {
    const g = new THREE.Group();
    const span = LANE_W * 3 + 1.6;
    const towerMat = new THREE.MeshToonMaterial({ map: stripeTexture("#ffffff", "#2fb85a", 4) });
    for (const sx of [-1, 1]) {
      const t = inked(new THREE.BoxGeometry(0.5, 5.2, 0.5), towerMat, 0.03);
      t.position.set((sx * span) / 2, 2.6, 0);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), toon("#ffd34a", { emissive: "#b07a00", emissiveIntensity: 0.5 }));
      cap.position.set((sx * span) / 2, 5.4, 0);
      g.add(t, cap);
    }
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const x = c.getContext("2d")!;
    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 6; j++) {
        x.fillStyle = (i + j) % 2 ? "#1b1b22" : "#ffffff";
        x.fillRect(i * 16, j * 16, 16, 16);
      }
    }
    x.fillStyle = "#2fb85a";
    x.fillRect(40, 14, 432, 68);
    x.strokeStyle = "#ffffff";
    x.lineWidth = 6;
    x.strokeRect(40, 14, 432, 68);
    x.fillStyle = "#ffffff";
    x.font = "bold 54px Impact, 'Bebas Neue', sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("CHECKPOINT", 256, 50);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const banner = inked(new THREE.BoxGeometry(span, 1.1, 0.2), [toon("#1b1b22"), toon("#1b1b22"), toon("#1b1b22"), toon("#1b1b22"), new THREE.MeshToonMaterial({ map: tex }), new THREE.MeshToonMaterial({ map: tex })] as unknown as THREE.Material, 0.03);
    banner.position.y = 4.6;
    g.add(banner);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(span, 4.2),
      new THREE.MeshBasicMaterial({ color: 0x6dff8a, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    glow.position.y = 2.1;
    glow.name = "glow";
    g.add(glow);
    g.visible = false;
    return g;
  }

  private placeGate(s: RushState, dt: number) {
    const next = s.nextCheckpoint;
    const prev = next - CHECKPOINT_EVERY;
    let z: number | null = null;
    if (next - s.distance < 140) z = next - s.distance;
    else if (prev > 0 && s.distance - prev < 12) z = prev - s.distance;
    this.gate.visible = z !== null;
    if (z === null) return;
    this.gate.position.set(0, 0, wz(z));
    this.gateGlow = Math.max(0, this.gateGlow - dt);
    const glow = this.gate.getObjectByName("glow") as THREE.Mesh;
    (glow.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.05 * Math.sin(this.time * 5) + this.gateGlow * 0.5;
  }

  private celebrateCheckpoint(px: number) {
    this.gateGlow = 1;
    this.pickupFlash = 1;
    const cols = [0x2fb85a, 0xffd34a, 0xff5c8a, 0x38e1ff, 0xffffff];
    for (let i = 0; i < 60; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 8, 3 + Math.random() * 5, 2 + Math.random() * 6);
      this.spawn(new THREE.Vector3(px + (Math.random() - 0.5) * 6, 4.5, -1), cols[i % cols.length], v, 1.2 + Math.random() * 0.6, 0.35, 0.15, 7, this.starTex, false);
    }
  }

  setHero(id: CapyHeroId) {
    if (id === this.heroId) return;
    if (this.hero) this.heroHolder.remove(this.hero.root);
    this.heroId = id;
    this.hero = buildCapybara(id);
    this.heroHolder.add(this.hero.root);
  }

  resize() {
    const w = this.host.clientWidth || 360;
    const h = this.host.clientHeight || 640;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Portrait needs a taller view to keep the side lanes in frame.
    this.camera.fov = this.camera.aspect < 0.8 ? 64 : 52;
    this.camera.updateProjectionMatrix();
  }

  /* ───────── Dynamic objects ───────── */

  private trainColors = ["#e8402e", "#2f7fe0", "#ffb020", "#26b56a", "#8a5cf6"];

  private makeObstacle(o: Obstacle): THREE.Object3D {
    const g = new THREE.Group();
    const sh = this.shared;
    if (o.kind === "barrier") {
      for (const sx of [-1, 1]) {
        const p = inked(sh.post, sh.postMat, 0.02);
        p.scale.y = 0.85;
        p.position.set(sx * 0.95, 0.42, 0);
        const foot = inked(new THREE.BoxGeometry(0.2, 0.1, 0.7), sh.postMat, 0.015);
        foot.position.set(sx * 0.95, 0.05, 0);
        g.add(p, foot);
      }
      const plank = inked(new THREE.BoxGeometry(2.1, 0.34, 0.12), sh.hurdle, 0.02);
      plank.position.y = 0.6;
      const plank2 = inked(new THREE.BoxGeometry(2.1, 0.12, 0.1), toon("#f2f2f2"), 0.015);
      plank2.position.y = 0.25;
      g.add(plank, plank2);
    } else if (o.kind === "bar") {
      for (const sx of [-1, 1]) {
        const p = inked(sh.post, sh.postMat, 0.02);
        p.scale.y = 2.3;
        p.position.set(sx * 1.0, 1.15, 0);
        g.add(p);
      }
      const board = inked(new THREE.BoxGeometry(2.2, 0.6, 0.14), sh.hazard, 0.025);
      board.position.y = 1.55;
      const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), toon("#ff3b3b", { emissive: "#ff2020", emissiveIntensity: 1 }));
      lightL.position.set(-0.85, 1.95, 0);
      const lightR = lightL.clone();
      lightR.position.x = 0.85;
      g.add(board, lightL, lightR);
    } else {
      const len = o.len;
      const color = this.trainColors[o.id % this.trainColors.length];
      let side = this.trainTex[color];
      if (!side) side = this.trainTex[color] = trainSideTexture(color, "#ffffff");
      const sideMat = new THREE.MeshToonMaterial({ map: side, gradientMap: toon("#fff").gradientMap });
      sideMat.map = side.clone();
      sideMat.map.repeat.set(len / 3.5, 1);
      sideMat.map.needsUpdate = true;
      const bodyMat = toon(color);
      const roofMat = toon("#e6e9ef");
      const mats = [sideMat, sideMat, roofMat, bodyMat, bodyMat, bodyMat];
      const body = inked(new THREE.BoxGeometry(2.05, 2.3, len), mats as unknown as THREE.Material, 0.04);
      body.position.set(0, 1.45, -len / 2);
      const roof = inked(new THREE.CylinderGeometry(1.03, 1.03, len, 20, 1, false, -Math.PI / 2, Math.PI), roofMat, 0.03);
      roof.rotation.x = Math.PI / 2;
      roof.scale.set(1, 1, 0.28);
      roof.position.set(0, 2.6, -len / 2);
      // Front face: windshield + headlights + bumper.
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), toon("#1f2b3d", { emissive: "#3a6ea5", emissiveIntensity: 0.25 }));
      glass.position.set(0, 1.95, 0.011);
      const bump = inked(new THREE.BoxGeometry(2.1, 0.35, 0.25), toon("#3a3a44"), 0.02);
      bump.position.set(0, 0.35, 0);
      g.add(body, roof, glass, bump);
      for (const sx of [-1, 1]) {
        const hl = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), toon("#fff6c8", { emissive: "#ffe58a", emissiveIntensity: 1.2 }));
        hl.position.set(sx * 0.65, 0.9, 0.012);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffe9a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
        glow.scale.setScalar(1.2);
        glow.position.set(sx * 0.65, 0.9, 0.1);
        g.add(hl, glow);
      }
      const wheels = inked(new THREE.BoxGeometry(1.8, 0.4, len - 0.8), toon("#2b2b33"), 0.02);
      wheels.position.set(0, 0.2, -len / 2);
      g.add(wheels);
      g.userData.dispose = [sideMat, sideMat.map];
    }
    g.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) c.castShadow = true;
    });
    return g;
  }

  private makePickup(p: Pickup): THREE.Object3D {
    const g = new THREE.Group();
    const sh = this.shared;
    if (p.kind === "coin") {
      const coin = inked(sh.coinGeo, sh.coinMat, 0.02);
      coin.rotation.x = Math.PI / 2;
      const star = new THREE.Mesh(new THREE.CircleGeometry(0.17, 5), sh.coinRim);
      star.position.z = 0.045;
      const star2 = star.clone();
      star2.position.z = -0.045;
      star2.rotation.y = Math.PI;
      const spin = new THREE.Group();
      spin.add(coin, star, star2);
      spin.name = "spin";
      g.add(spin);
      return g;
    }
    const spin = new THREE.Group();
    spin.name = "spin";
    let glowColor = 0xffffff;
    switch (p.kind) {
      case "shield": {
        glowColor = 0x6fd0ff;
        const s = inked(new THREE.SphereGeometry(0.36, 22, 16), toon("#4fb3ff", { emissive: "#1f6fbf", emissiveIntensity: 0.4 }), 0.025);
        const cross = inked(new THREE.BoxGeometry(0.12, 0.42, 0.12), toon("#ffffff"), 0.01);
        cross.position.z = 0.32;
        const cross2 = cross.clone();
        cross2.rotation.z = Math.PI / 2;
        spin.add(s, cross, cross2);
        break;
      }
      case "magnet": {
        glowColor = 0xff4d6d;
        const u = inked(new THREE.TorusGeometry(0.3, 0.11, 12, 24, Math.PI), toon("#ff3b55"), 0.02);
        u.rotation.z = Math.PI;
        spin.add(u);
        for (const sx of [-1, 1]) {
          const tip = inked(new THREE.BoxGeometry(0.22, 0.2, 0.22), toon("#e8edf5"), 0.015);
          tip.position.set(sx * 0.3, 0.08, 0);
          spin.add(tip);
        }
        break;
      }
      case "jet": {
        glowColor = 0xffa040;
        const body = inked(new THREE.CapsuleGeometry(0.16, 0.42, 6, 14), toon("#f2f2f2"), 0.02);
        const nose = inked(new THREE.ConeGeometry(0.16, 0.25, 14), toon("#ff5a2e"), 0.015);
        nose.position.y = 0.42;
        spin.add(body, nose);
        for (let i = 0; i < 3; i++) {
          const fin = inked(new THREE.BoxGeometry(0.04, 0.2, 0.2), toon("#ff5a2e"), 0.01);
          const a = (i / 3) * Math.PI * 2;
          fin.position.set(Math.cos(a) * 0.17, -0.25, Math.sin(a) * 0.17);
          fin.rotation.y = -a;
          spin.add(fin);
        }
        spin.rotation.z = -0.5;
        break;
      }
      case "multi": {
        glowColor = 0xffd34a;
        const shape = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 0.17 : 0.42;
          const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
          if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        const star = inked(new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), toon("#ffd34a", { emissive: "#b06a00", emissiveIntensity: 0.4 }), 0.02);
        star.position.z = -0.06;
        spin.add(star);
        break;
      }
      case "gift": {
        glowColor = 0xff7ad9;
        const box = inked(new THREE.BoxGeometry(0.55, 0.45, 0.55), toon("#b35cff"), 0.025);
        const rib = inked(new THREE.BoxGeometry(0.58, 0.47, 0.12), toon("#ffd34a"), 0.01);
        const rib2 = rib.clone();
        rib2.rotation.y = Math.PI / 2;
        const bow = inked(new THREE.TorusGeometry(0.1, 0.04, 8, 16), toon("#ffd34a"), 0.01);
        bow.position.y = 0.3;
        spin.add(box, rib, rib2, bow);
        break;
      }
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: glowColor, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
    glow.scale.setScalar(1.6);
    g.add(glow, spin);
    g.userData.power = true;
    return g;
  }

  private syncDynamic(s: RushState) {
    const seenO = new Set<number>();
    for (const o of s.obstacles) {
      if (o.z > VIEW_AHEAD) continue;
      seenO.add(o.id);
      let obj = this.obstacles.get(o.id);
      if (!obj) {
        obj = this.makeObstacle(o);
        this.obstacles.set(o.id, obj);
        this.scene.add(obj);
      }
      obj.position.set(o.lane * LANE_W, 0, wz(o.z));
    }
    for (const [id, obj] of this.obstacles) {
      if (!seenO.has(id)) {
        this.disposeObj(obj);
        this.obstacles.delete(id);
      }
    }

    const seenP = new Set<number>();
    const px = s.laneX * LANE_W;
    for (const p of s.pickups) {
      if (p.z > VIEW_AHEAD) continue;
      seenP.add(p.id);
      let obj = this.pickups.get(p.id);
      if (!obj) {
        obj = this.makePickup(p);
        this.pickups.set(p.id, obj);
        this.scene.add(obj);
      }
      const baseY = p.h === 1 ? 1.75 : 0.62;
      let y = baseY + (obj.userData.power ? Math.sin(this.time * 3 + p.id) * 0.12 : 0);
      let x = p.lane * LANE_W;
      if (p.pulled) {
        const k = Math.max(0, Math.min(1, 1 - p.z / 18));
        y = THREE.MathUtils.lerp(baseY, s.y + 1.0, k);
        x = THREE.MathUtils.lerp(x, px, k);
      }
      obj.position.set(x, y, wz(p.z));
      const spin = obj.getObjectByName("spin");
      if (spin) spin.rotation.y = this.time * (obj.userData.power ? 2 : 4) + p.id;
    }
    for (const [id, obj] of this.pickups) {
      if (!seenP.has(id)) {
        // Collected (or passed): sparkle if it vanished near the hero.
        if (Math.abs(obj.position.z) < 2.5) this.burst(obj.position, obj.userData.power ? 0xffffff : 0xffd34a, obj.userData.power ? 22 : 7, 4);
        this.disposeObj(obj);
        this.pickups.delete(id);
      }
    }
  }

  private disposeObj(obj: THREE.Object3D) {
    this.scene.remove(obj);
    const extra = obj.userData.dispose as (THREE.Material | THREE.Texture)[] | undefined;
    extra?.forEach((d) => d.dispose());
    obj.traverse((c) => {
      if ((c as THREE.Sprite).isSprite) ((c as THREE.Sprite).material as THREE.Material).dispose();
    });
  }

  /* ───────── Particles ───────── */

  private spawn(pos: THREE.Vector3, color: number, v: THREE.Vector3, life: number, size0: number, size1: number, grav = 0, tex: THREE.Texture = this.glowTex, additive = true) {
    if (this.parts.length > 260) return;
    const s = this.partPool.pop() ?? new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    const m = s.material as THREE.SpriteMaterial;
    m.map = tex;
    m.color.setHex(color);
    m.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    m.opacity = 1;
    m.needsUpdate = true;
    s.position.copy(pos);
    s.scale.setScalar(size0);
    this.scene.add(s);
    this.parts.push({ s, v, life, age: 0, grav, size0, size1 });
  }

  private burst(pos: THREE.Vector3, color: number, n: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.2, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.5 + Math.random()));
      this.spawn(pos.clone(), color, v, 0.35 + Math.random() * 0.3, 0.35, 0.05, 6, i % 2 ? this.starTex : this.glowTex);
    }
  }

  private dust(x: number, n: number) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 1.2, 1 + Math.random() * 3);
      this.spawn(new THREE.Vector3(x + (Math.random() - 0.5) * 0.6, 0.15, 0.2), 0xe8d5bd, v, 0.5 + Math.random() * 0.3, 0.3, 1.0, 0, this.glowTex, false);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        this.scene.remove(p.s);
        this.partPool.push(p.s);
        this.parts.splice(i, 1);
        continue;
      }
      p.v.y -= p.grav * dt;
      p.s.position.addScaledVector(p.v, dt);
      p.s.scale.setScalar(p.size0 + (p.size1 - p.size0) * k);
      (p.s.material as THREE.SpriteMaterial).opacity = 1 - k * k;
    }
  }

  /* ───────── Frame ───────── */

  frame(dt: number, s: RushState, events: RushEvent[], phase: RushPhase) {
    this.time += dt;
    const hero = this.hero;
    if (!hero) return;
    const px = s.laneX * LANE_W;
    const air = s.y > 0.02;
    const effort = Math.max(0, Math.min(1, (s.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)));

    for (const e of events) {
      if (e === "double-jump") this.flip = 0.0001;
      if (e === "jump") this.dust(px, 6);
      if (e === "hit" || e === "shield-break") {
        this.shake = this.reduced ? 0 : 0.45;
        this.hitFlash = 1;
        this.burst(new THREE.Vector3(px, 1.4, 0), e === "hit" ? 0xff5050 : 0x7fd8ff, 18, 6);
      }
      if (e === "coin") this.pickupFlash = Math.max(this.pickupFlash, 0.25);
      if (e.endsWith("-pickup") || e === "gift") {
        this.pickupFlash = 1;
        this.burst(new THREE.Vector3(px, 1.2, 0), 0xffffff, 20, 5);
      }
      if (e === "over") this.fall = 0.0001;
      if (e === "checkpoint") this.celebrateCheckpoint(px);
    }
    if (this.wasAir && !air && phase === "playing") {
      this.dust(px, 8);
      kickJelly(hero, 7);
    }
    this.wasAir = air;

    // World scroll.
    const d = s.distance;
    this.trackTex.offset.y = d / 4;
    this.walkTex.offset.y = d / 3;
    for (const it of this.decor) {
      it.obj.position.z = ((((it.base + d) % DECOR_LEN) + DECOR_LEN) % DECOR_LEN) - (DECOR_LEN - 18);
    }
    this.syncDynamic(s);
    this.placeGate(s, dt);

    // Hero placement + pose.
    const laneVel = (s.laneX - this.lastLaneX) / Math.max(dt, 1e-3);
    this.lastLaneX = s.laneX;
    this.lean = THREE.MathUtils.lerp(this.lean, THREE.MathUtils.clamp(laneVel / 8, -1, 1), 1 - Math.pow(0.001, dt));
    if (this.flip > 0) this.flip += dt / 0.5;
    if (this.flip >= 1) this.flip = 0;
    if (this.fall > 0 && this.fall < 1) this.fall = Math.min(1, this.fall + dt / 0.6);
    if (phase === "playing") this.runPhase += dt * (8.5 + effort * 5);
    if (phase === "playing" && !air && !isSliding(s)) {
      // Little dust kicks while running.
      if (Math.random() < dt * 10) this.dust(px, 1);
    }

    let mode: CapyPose["mode"] = "run";
    if (phase === "ready") mode = Math.floor(this.time / 3.5) % 3 === 1 ? "wave" : "idle";
    else if (phase === "over") mode = "fall";
    else if (s.jet > 0) mode = "fly";
    else if (isSliding(s)) mode = "squash";
    else if (air) mode = "air";
    const blend = 1 - Math.pow(0.0005, dt);
    poseCapybara(hero, { t: this.time, mode, phase: this.runPhase, effort: phase === "playing" ? effort : 0, vy: s.vy, lean: phase === "playing" ? this.lean : 0, flip: this.flip, fall: this.fall }, blend);

    this.heroHolder.position.set(phase === "ready" ? 0 : px, phase === "ready" ? 0 : s.y, 0);
    hero.root.rotation.y = phase === "ready" ? Math.sin(this.time * 0.6) * 0.35 : 0;
    // Blink while invulnerable after a hit.
    hero.root.visible = !(phase === "playing" && s.invuln > 0 && s.jet <= 0 && Math.floor(this.time * 14) % 2 === 0);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3);
    this.pickupFlash = Math.max(0, this.pickupFlash - dt * 3);
    if (this.hitFlash > 0) tintCapybara(hero, new THREE.Color(0xff2a2a), this.hitFlash * 0.8);
    else if (this.pickupFlash > 0) tintCapybara(hero, new THREE.Color(0xfff2b0), this.pickupFlash * 0.5);
    else tintCapybara(hero, null, 0);

    this.shieldBubble.visible = phase !== "ready" && s.shield;
    if (this.shieldBubble.visible) this.shieldBubble.scale.setScalar(1 + Math.sin(this.time * 6) * 0.03);
    this.magnetRing.visible = phase !== "ready" && s.magnet > 0;
    this.magnetRing.rotation.z += dt * 3;
    if (s.jet > 0 && phase === "playing" && Math.random() < dt * 40) {
      this.spawn(new THREE.Vector3(px + (Math.random() - 0.5) * 0.3, s.y + 0.5, 0.5), 0xffa040, new THREE.Vector3(0, -2, 6), 0.4, 0.5, 0.1);
    }
    if (s.multi > 0 && phase === "playing" && Math.random() < dt * 12) {
      this.spawn(new THREE.Vector3(px + (Math.random() - 0.5), s.y + 0.5 + Math.random() * 1.2, 0.3), 0xffd34a, new THREE.Vector3(0, 0.5, 3), 0.6, 0.25, 0.02, 0, this.starTex);
    }

    this.updateParticles(dt);
    this.updateSpeedLines(dt, phase === "playing" ? effort + (s.jet > 0 ? 0.6 : 0) : 0);
    this.updateCamera(dt, s, phase, px);

    this.sun.position.set(px - 5, 12, 4);
    this.sun.target.position.set(px, 0, -4);
    this.renderer.render(this.scene, this.camera);
  }

  private updateSpeedLines(dt: number, k: number) {
    for (const m of this.speedLines) {
      const mat = m.material as THREE.MeshBasicMaterial;
      if (k < 0.35) {
        mat.opacity = Math.max(0, mat.opacity - dt * 3);
        continue;
      }
      m.position.z += dt * 60;
      if (m.position.z > 6 || mat.opacity <= 0.01) {
        m.position.set((Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 2.5), 0.4 + Math.random() * 3.5, -20 - Math.random() * 15);
        m.rotation.set(0, 0, 0);
        m.lookAt(this.camera.position.x, m.position.y, 100);
        m.rotation.x = Math.PI / 2;
      }
      mat.opacity = Math.min(0.5, (k - 0.35) * 0.9);
    }
  }

  private updateCamera(dt: number, s: RushState, phase: RushPhase, px: number) {
    const portrait = this.camera.aspect < 0.8;
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();
    if (phase === "ready") {
      // Showcase: in front of the hero, slightly below eye level, hero big in frame.
      pos.set(Math.sin(this.time * 0.25) * 0.6, portrait ? 1.35 : 1.25, portrait ? -4.6 : -3.9);
      look.set(0, portrait ? 1.05 : 0.95, 0);
    } else {
      const back = portrait ? 5.1 : 4.4;
      const up = portrait ? 2.85 : 2.45;
      const fly = s.jet > 0 ? 1.2 : 0;
      pos.set(px * 0.92, up + s.y * 0.55 + fly * 0.5, back + fly);
      look.set(px * 0.94, 1.15 + s.y * 0.55, -7);
    }
    const k = phase === "ready" ? 1 - Math.pow(0.02, dt) : 1 - Math.pow(0.0008, dt);
    this.camPos.lerp(pos, k);
    // Lateral follow is snappier so lane switches never push the hero off screen.
    if (phase !== "ready") this.camPos.x = THREE.MathUtils.lerp(this.camPos.x, pos.x, 1 - Math.pow(0.00002, dt));
    this.camLook.lerp(look, k);
    this.shake = Math.max(0, this.shake - dt);
    const sh = this.shake * this.shake * 1.2;
    this.camera.position.set(this.camPos.x + (Math.random() - 0.5) * sh, this.camPos.y + (Math.random() - 0.5) * sh, this.camPos.z);
    this.camera.lookAt(this.camLook);
  }

  /** Snap the camera (used when switching between menu and run). */
  snapCamera() {
    this.camPos.set(0, 3.2, 6);
    this.camLook.set(0, 1.25, -7);
  }

  get size() {
    return { w: this.width, h: this.height };
  }

  destroy() {
    for (const obj of [...this.obstacles.values(), ...this.pickups.values()]) this.disposeObj(obj);
    this.obstacles.clear();
    this.pickups.clear();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
