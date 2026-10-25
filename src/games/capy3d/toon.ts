/**
 * Toon look shared by every Capynite 3D world: 3-band cel shading plus an
 * inverted-hull outline. Kept tiny on purpose so all games look like one family.
 */
import * as THREE from "three";

let ramp: THREE.DataTexture | null = null;

/** 3-step light ramp: shadow, mid, lit. */
export function toonRamp(): THREE.DataTexture {
  if (ramp) return ramp;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

const toonCache = new Map<string, THREE.MeshToonMaterial>();

export function toon(color: THREE.ColorRepresentation, opts: { emissive?: THREE.ColorRepresentation; emissiveIntensity?: number } = {}): THREE.MeshToonMaterial {
  const key = `${new THREE.Color(color).getHexString()}|${opts.emissive ?? ""}|${opts.emissiveIntensity ?? ""}`;
  let m = toonCache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp() });
    if (opts.emissive !== undefined) {
      m.emissive = new THREE.Color(opts.emissive);
      m.emissiveIntensity = opts.emissiveIntensity ?? 1;
    }
    toonCache.set(key, m);
  }
  return m;
}

const outlineCache = new Map<number, THREE.MeshBasicMaterial>();

/** Back-face material pushed along normals: a constant-width ink line. */
export function outlineMaterial(thickness = 0.022): THREE.MeshBasicMaterial {
  let m = outlineCache.get(thickness);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: 0x1a0f0a, side: THREE.BackSide });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n transformed += normalize(normal) * ${thickness.toFixed(4)};`);
    };
    m.customProgramCacheKey = () => `outline-${thickness}`;
    outlineCache.set(thickness, m);
  }
  return m;
}

/** A toon mesh with its outline hull as a child. */
export function inked(geo: THREE.BufferGeometry, mat: THREE.Material, thickness = 0.022): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  if (thickness > 0) {
    const hull = new THREE.Mesh(geo, outlineMaterial(thickness));
    hull.raycast = () => {};
    mesh.add(hull);
  }
  return mesh;
}
