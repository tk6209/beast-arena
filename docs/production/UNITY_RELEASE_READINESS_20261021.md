# Capynite Unity — Release Readiness Checkpoint (2026-10-21)

## Latest verified state
- GitHub PR #20 remains DRAFT, not merged.
- Node/web workflows `validate` and `Capynite contracts baseline` are GREEN on `c5429f028584fb0805622c7f2f9facd1e7423844`. **This is not Unity rendering validation**.
- Unity executable and Blender are absent from this execution environment (checked with `which Unity unity-editor blender`).
- Unity-generated `unity/Capynite/ProjectSettings/ProjectVersion.txt`, package lock and Unity 6 Web Build Support remain unavailable.
- 12 prototype GLBs exist in a preproduction ZIP, of which Drako and Panther have experimental skin and 12 animation channel recordings each. No final canonical rig approvals.
- Two individual Drako/Panther concept turnarounds were generated into conversation artifact `Capynite_Art_Review_v05.zip`. Hashes and art review fields in local `manifest.json`. **Not committed to this repository; not rigged or approved.**

## New CI infrastructure
- `.github/workflows/capynite-unity-webgl.yml` added: workflow_dispatch only; GameCI v4 EditMode tests + Editor WebGL build, evidence upload and `verify-capynite-webgl.mjs` artifact validation.
- The workflow requires a real editor-generated Unity project and credentials/licensing provisioned as GitHub Actions secrets (`UNITY_LICENSE` or `UNITY_SERIAL`, `UNITY_EMAIL`, `UNITY_PASSWORD`). **Never send secrets in chat, commit them, or place them in artifact logs.**
- Build method `CapyniteCardBattleBuild.Build` now outputs to an absolute path rooted in `Application.dataPath/../Builds/CardBattleWebGL`, independent of CI runner's working directory.
- The Unity 6-compatible Test Framework dependency is explicitly declared in `Packages/manifest.json`; the eventual selected Unity editor must generate/pin `ProjectVersion.txt` and `packages-lock.json`.

## Mandatory gates before enabling game or merge
1. Source art: approved canonic Drako/Panther front/profile/back and material sheets, individually reviewable.
2. 3D assets: skin-weighted, final topology with production materials and motion clips imported, deformation check in actual Editor.
3. Gameplay: one complete battle plays using **existing authoritative Supabase game-engine** card rules (not `CapyniteCardBattleTarget` mock values). Side-by-side deterministic event parity, no cloned reward engine.
4. Player experience: user-reproducible desktop play, safe controls and exit, game lifecycle, mobile/landscape fallback.
5. Tests: Unity EditMode, PlayMode, all relevant web CI and browser smoke; no unknown critical security or CORS/identity vulnerabilities.
6. Performance: prove sustained FPS under representative hardware, payload/memory budgets, reasonable network loading and fallback.
7. Ops: canary flag disabled by default, artifact hash, release checklist and rollback proof, production smoke and owner signoff.
8. No production merge until required gates GREEN. The existence of a mergeable PR or passing Node-only CI is insufficient.

## External prerequisite action
On a machine with Unity Hub, create/open the Unity 6 project from the tracked `unity/Capynite/Assets` and `Packages`, install Web Build Support and Unity Test Framework, and commit generated `ProjectSettings/ProjectVersion.txt` and `Packages/packages-lock.json` only after confirming the actual editor version. Set up license secrets directly in GitHub repository Actions secrets. Then run `Capynite Unity 6 WebGL — gated build` workflow manually. This prerequisites chain cannot be bypassed by writing dummy .wasm binaries.

## Current delivery classification
**Green**: web code, initial schema contracts, structural GLB proof.
**Amber**: independent concepts and experimental skinned demo GLBs without art/editor approval.
**Red**: Unity asset import, real WebGL binary, functional 3D cinematic gameplay, AAA fidelity, production canary/merge.
