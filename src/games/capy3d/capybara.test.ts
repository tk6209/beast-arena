import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { buildCapybara, poseCapybara, type CapyHeroId, type CapyPose } from "./capybara";

const HEROES: CapyHeroId[] = ["capininja", "capivini", "capirocket", "capizozo", "voxcapy"];
const MODES: CapyPose["mode"][] = ["run", "air", "fly", "squash", "idle", "wave", "fall"];

const pose = (mode: CapyPose["mode"], extra: Partial<CapyPose> = {}): CapyPose => ({ t: 1.3, mode, phase: 2, effort: 0.5, vy: 3, lean: 0.4, flip: 0, fall: 1, ...extra });

describe("capivara 3D", () => {
  it("monta todos os heróis com ~1,75 m e sem valores inválidos em qualquer pose", () => {
    for (const id of HEROES) {
      const rig = buildCapybara(id);
      for (const mode of MODES) {
        poseCapybara(rig, pose(mode), 1);
        rig.root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(rig.root);
        expect(Number.isFinite(box.max.y), `${id}/${mode}`).toBe(true);
      }
      poseCapybara(rig, pose("idle"), 1);
      rig.root.updateMatrixWorld(true);
      const h = new THREE.Box3().setFromObject(rig.root).max.y;
      expect(h, id).toBeGreaterThan(1.5);
      expect(h, id).toBeLessThan(2.3);
    }
  });

  it("mortal gira em torno da barriga, não dos pés", () => {
    const rig = buildCapybara("capivini");
    poseCapybara(rig, pose("air", { flip: 0.4, t: 0.37, lean: 0 }), 1);
    rig.root.updateMatrixWorld(true);
    const belly = new THREE.Vector3(0, 0.85, 0).applyMatrix4(rig.body.matrix);
    expect(belly.y).toBeCloseTo(0.85, 5);
    expect(belly.z).toBeCloseTo(0, 5);
  });

  it("agachar achata a capivara (mais baixa e mais larga) e ela volta com efeito gelatina", () => {
    const rig = buildCapybara("capizozo");
    const size = () => {
      rig.root.updateMatrixWorld(true);
      return new THREE.Box3().setFromObject(rig.root).getSize(new THREE.Vector3());
    };
    let t = 0;
    for (let i = 0; i < 60; i++) poseCapybara(rig, pose("idle", { t: (t += 1 / 60) }), 1);
    const normal = size();
    for (let i = 0; i < 40; i++) poseCapybara(rig, pose("squash", { t: (t += 1 / 60) }), 1);
    const flat = size();
    expect(flat.y).toBeLessThan(normal.y * 0.65);
    expect(flat.x).toBeGreaterThan(normal.x * 1.2);
    // Released: overshoots past normal (stretch) before settling — the jelly wobble.
    let maxScaleY = 0;
    for (let i = 0; i < 40; i++) {
      poseCapybara(rig, pose("idle", { t: (t += 1 / 60) }), 1);
      maxScaleY = Math.max(maxScaleY, rig.body.scale.y);
    }
    expect(maxScaleY).toBeGreaterThan(1.02);
    for (let i = 0; i < 120; i++) poseCapybara(rig, pose("idle", { t: (t += 1 / 60) }), 1);
    expect(rig.body.scale.y).toBeCloseTo(1, 2);
  });

  it("cada herói tem materiais próprios (piscar um não pinta outro)", () => {
    const a = buildCapybara("capivini");
    const b = buildCapybara("capivini");
    expect(a.mats.some((m) => b.mats.includes(m))).toBe(false);
  });
});
