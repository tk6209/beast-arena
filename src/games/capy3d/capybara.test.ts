import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { buildCapybara, poseCapybara, type CapyHeroId, type CapyPose } from "./capybara";

const HEROES: CapyHeroId[] = ["capininja", "capivini", "capirocket", "capizozo", "voxcapy"];
const MODES: CapyPose["mode"][] = ["run", "air", "fly", "roll", "idle", "wave", "fall"];

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

  it("cambalhota e mortal giram em torno da barriga, não dos pés", () => {
    const rig = buildCapybara("capivini");
    for (const [mode, flip, cy] of [["roll", 0, 0.55], ["air", 0.4, 0.95]] as const) {
      poseCapybara(rig, pose(mode, { flip, t: 0.37, lean: 0 }), 1);
      rig.root.updateMatrixWorld(true);
      const belly = new THREE.Vector3(0, cy, 0).applyMatrix4(rig.body.matrix);
      expect(belly.y).toBeCloseTo(cy, 5);
      expect(belly.z).toBeCloseTo(0, 5);
    }
  });

  it("cada herói tem materiais próprios (piscar um não pinta outro)", () => {
    const a = buildCapybara("capivini");
    const b = buildCapybara("capivini");
    expect(a.mats.some((m) => b.mats.includes(m))).toBe(false);
  });
});
