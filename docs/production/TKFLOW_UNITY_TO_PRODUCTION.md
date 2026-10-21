# TKFLOW — Capynite Unity Full Delivery
Date: 2026-10-21. Reference: user-approved Drako vs Panther 16:9 screen. Branch is a prototype, *not a shipped Unity game*.

## Discovery / truth baseline
- The earlier 180-PNG ZIP is **procedural preproduction source**, not 180 approved AAA characters/scene assets.
- There is an approved composite and concept boards; no proof of 96 individually reviewed final concept images.
- This environment has no Unity or Blender executable: no truthful WebGL build, rig import, PlayMode test, browser release, performance or production claim can be made.
- Prior Unity scripts are prototypes and do not preserve canonical card-game rules. No replacement of /beast-arena is authorized on this evidence.
- PR #20 remains Draft/HOLD; the mergeable status is a conflict check, **not** acceptance.

## Decomposition: BRD > PRD > Epics > Stories > Atomic Tasks > RED/GREEN > Evidence > DoD
Source of truth: `docs/production/CAPYNITE_DELIVERY_MANIFEST.json` contains 282 unique atomic records, all TODO until evidence is captured.
| Epic | Count | RED criterion | GREEN acceptance | Dependency |
|--|--:|--|--|--|
| ART-01 original concepts | 96 | Concept missing, inconsistent silhouette/illegal reference | 96 original independently inspectable images, canonical/rights review, 16:9 battle screen | character canon |
| CHAR-02 rigged models | 12 | Missing mesh/skin/material/animation export | 12 rigged models imported in pinned Unity + inspector review | ART-01 approved turnarounds |
| ANIM-03 cinematic clips | 144 | Missing clips, broken rig, event desync | 12 named animations x 12 characters, coverage, event sync and replay test | CHAR-02 |
| ARENA-04 playable environments | 5 | Missing collision, cameras, lighting and web performance | all five scenes playable with full HUD and transitions | pipeline + ART-01 |
| CARD-05 abilities | 24 | Fake animation-only effects or incorrect cost/damage | 24 cards with deterministic core, event->VFX, invalid-action test and UI | rules parity, CHAR-02 |
| WEB-06 build/prod | 1 | No editor/web artifact, smoke or rollback | pinned Unity build, wasm/data/loader files, edit/play tests, browser smoke, profiling, canary, independent review, rollback | all above |

## PDCATDD ordered workflow
1. PLAN: inventory actual monsters/card rules, assets, licenses, approved art and latest main HEAD. Freeze design tokens and image reference.
2. RED: failing unit + contract tests for card costs, target rules, persistent saves, malformed Unity frames, invalid rewards and deterministic replays.
3. DO: complete 24-image L1 identities first. Human approval for Drako/Panther silhouettes. Do not claim turnaround from front-only screenshot.
4. GREEN: L2 48 image set, model/drill rig first two characters, Unity import fixture. Reproduce approved battle composition with separated artwork and runtime text.
5. CHECK: construct first arena, six functioning canonical cards, attack/defense/hit/turn transitions. Record desktop & mobile snapshots.
6. ANALYSE: build and profile, fix geometry/UV/materials/animation state issues and compare in-game screenshot to approved concept.
7. TEST: L3 24 image polish, expand to remaining 10 characters / four arenas / 18 abilities, run cross-browser matrix, accessibility and security.
8. DOCUMENT: export licenses, asset manifests, attribution, visual regression, hash-bound release evidence.
9. DEPLOY: opt-in canary behind default-off feature flag, smoke/telemetry/rollback, then gated full rollout and merge after approvals.

## Review and release gates
- L1: 24 concepts individually generated and reviewed. L2: 48. L3: 24. A composite contact sheet alone is NOT a completed set of independent assets.
- All 12 characters must reuse Character OS principles; names and additional roster identities beyond documented canon must be approved.
- 60 desktop FPS is a target not a fact. Record p50/p95 FPS, loading, peak memory, input delay, device/browser/version.
- No Unity project-version spoofing. Editor-generated ProjectVersion.txt, packages lock and artifacts required.
- Runtime security: host session authentication, deny cross-account rewards, server-authoritative battle results, replay protection and RLS checks.
- Never override failing CI, skip required checks, or merge unfinished proof-of-concept as production.
- Hard stop / HOLD on unknown security, unauthorized art, regressions, no binary, or no rollback.

## Evidence schema
Each manifest item changes TODO->IN_REVIEW->APPROVED only after an artifact path, source commit, review metadata and tests with actual outputs are attached. A checked checkbox is not a substitute for evidence.

## Current run evidence
- GitHub commits contain initial documented architecture, TS validator/tests, prototype C# battle logic, editor scene generation and manifest.
- Asset ZIP inspected in current runtime: 187 archive entries, of which 181 PNG (180 procedural source and one concept board).
- Unity editor and Blender absent here. Nothing compiled. Production unchanged.
