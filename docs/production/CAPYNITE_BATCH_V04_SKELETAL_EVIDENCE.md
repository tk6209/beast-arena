# CAPYNITE v0.4 — Skeletal animation proof-of-format (2026-10-21)

## Artifacts and reproducibility
Local conversation artifact: `Capynite_Skeletal_Prototype_v04.zip`.
- `rigs/drako_skeletal_demo.glb`: 1504 vertices, 2952 triangles, 10 joints, 12 named animated glTF clips; SHA-256 `116fba2ae4e27871546971d1da4737104b183ee585c2ec1acf32abb2612e2418`.
- `rigs/panther_skeletal_demo.glb`: 1484 vertices, 2916 triangles, 10 joints, 12 named animated glTF clips; SHA-256 `71ac40d6b7ca3fb8e515015b7f756697455b1f25cefa092485abbe45f8b9667d`.
- Generator and independent glTF verifier Python scripts inside ZIP. Generator consumes the v0.3 `models/drako.glb` and `models/panther.glb` **procedural greybox** sources; local paths must be adjusted before reruns.
- `evidence/skeletal_validation.json`, `evidence/rig_unit_checks.json` report GLB structural verification and normalized skin weights.

## What was actually validated
Two GLBs can be parsed as scenes; each mesh has JOINTS_0 and WEIGHTS_0 normalized (sum=1 per vertex), 10 skeleton joints and 12 animation objects with rotation and root translation channels. Each clip has timestamps, valid quaternion magnitudes and finite values. Independent verification test result: PASS.

## What this does *not* establish
- No Unity Editor or Blender exists in this run. No Unity import, rendering, animation playback, PlayMode test or WebGL binary exists.
- Greybox silhouettes, bone placement, skinning/deformations, facial acting and cinematic timing are NOT canonical or artist-approved.
- The pipeline contains 24 *procedural animation demo clips*, **zero of the 144 release-approved cinematic clips**.
- Likewise, the 282-item `CAPYNITE_DELIVERY_MANIFEST.json` must remain without APPROVED items.
- A picture or board that quotes percentages must not be treated as measured project completion.
- No PR merge, production rollout, or assertion of playability.

## Next RED→GREEN checkpoints
1. Import both prototype GLBs with a verified glTF 2.0 importer into pinned Unity 6; check material orientation, bone hierarchy, skin deformation across all clips; capture screenshots/video/tests.
2. Replace placeholders with approved Drako/Panther original character designs and a professional rig; maintain original skin/art rights manifest.
3. Integrate 6 *canonical* Beast Arena card actions into one battle with camera, event timing and VFX; compare before/after/skip deterministic outcomes.
4. Add one playable scene and real Unity WebGL build; test load, exit, keyboard/touch, and performance on actual devices.
5. Expand remaining 10 character rigs, 120 animations, five arenas and 24 card abilities only after vertical slice is confirmed.
6. Complete 96 standalone original art concepts, full backend/RLS, CI, canary and rollback before production.

## Artifact status
PROTOTYPE. Final acceptance gates still RED; PR #20 stays Draft/HOLD.
