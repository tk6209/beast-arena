# CAPYNITE / BEAST ARENA — Project North Star + Rebuild-from-GitHub Prompt
Version 1.0 — 2026-10-21

## Project purpose
Build **Capynite**, a cohesive multi-game universe and Hub, with **Beast Arena** as a premium, animated 2.5D/3D strategic card battler delivered via Unity WebGL. The experience targets high artistic quality, expressive character identity, six-card visual composition when compatible with actual rules, readable HUD, lively arena, impactful card-to-animation presentation, and reliable desktop/mobile-supported gameplay. Preserve the existing playable React/Vite game and player progress while evolving toward a shared Unity runtime usable by Capi Wars, Capi Rush and future games.

## Non-negotiable product principles
1. Character OS, the Capynite brand, approved screenshots and existing monster/boss catalogue anchor characters; **never substitute invented/third-party IP**.
2. **Server-authoritative card engine**: inspect `supabase/functions/game-engine/index.ts` and `src/game/serverApi.ts`. The Unity renderer visualizes *confirmed* state, it must not compute reward entitlement, accept forged client scores, or contain service-role keys.
3. Keep the existing web gameplay at `/beast-arena` operational. Run new Unity candidate behind a default-off feature flag and preserve local guest saves, logged-in inventory, identities and multi-game navigation.
4. Real graphics quality requires actual art approvals, production meshes/UVs/rigs, animations, VFX, proper UI, and QA screenshots. Placeholder primitive assets cannot count as AAA.
5. No 'all green', 'WebGL playable', 'merged', 'deployed', '60 FPS' claims without logs, artifact SHA and test evidence. Fix relevant CI and security gates; merge only after approvals.
6. Design a shared `CapyniteCore` package separate from game-specific rules. React Hub and existing standalone worlds remain available.

## Current GitHub source of truth
- Repository: `tk6209/beast-arena`.
- Branch PR #20: `feat/capynite-unity-platform-discovery-20261021`, Unity prototype, JSON contracts, tests, docs; **Draft / not merged**, and branch may be behind main.
- PR #21: CI-only workflow merged into `main`, providing manual Unity Editor test + WebGL artifact build (no deploy).
- `docs/architecture/CAPYNITE_UNITY_DELIVERY_PROGRAM.md`: original architecture and CP-001..010.
- `docs/architecture/CAPYNITE_CARD_BATTLE_VISUAL_TARGET.md`: composition and art target.
- `docs/production/TKFLOW_UNITY_TO_PRODUCTION.md`: PDCATDD gated program.
- `docs/production/CAPYNITE_DELIVERY_MANIFEST.json`: 282 atomic deliverables planned, not all proven.
- `docs/production/ARTIFACT_CUSTODY_20261021.md`: hashes of actual ZIP and concept art files from prior conversations, with **NOT YET UPLOADED** status.
- `src/game/data/catalog.json`, `src/game/data.ts`, `src/components/game/screens/TelaBatalha.tsx`, `src/game/serverApi.ts`, `supabase/functions/game-engine/index.ts`: canonical current card battle code.
- `src/brand/capynite.ts`, `src/App.tsx`: Capynite worlds and routes.
- `unity/Capynite/Assets/`, `unity/Capynite/Packages/`, `scripts/Build-CapyniteUnity.ps1`, `scripts/verify-capynite-webgl.mjs`: current Unity source experiments and unverified build scaffolds.

## Rebuild order — PDCATDD
**DISCOVERY**: clone/ref main+open PRs; inventory asset licenses, approved canonical Drako/Panther plus 4 Capynite heroes and 5 bosses, card rules, backend auth/guest save. Determine the twelfth character from canon; leave reserved until approved.
**PLAN**: BRD->PRD->epics->stories->atomic tasks->dependencies->RED tests->GREEN implementations->screenshots/logs->DoD. Prioritize first playable battle before scaling to 12 rigs.
**RED**: tests for canonical card values/energy, turn order, two-player slot isolation, replay prevention, origin-bound bridge, no rewards from Unity, save continuity, reduced-motion behavior, browser loading and fallback.
**DO/GREEN**: initialize REAL pinned Unity 6 editor-generated project; use Build Support WebGL, Unity Test Framework and glTF importer; build two production-rigged Drako/Panther models with approved original art, 12 well-formed animations each, and one visually polished arena; implement one complete canonical card battle using actual server-confirmed state. Only then scale to 12 characters, 5 arenas, 24 abilities, 144 unique production clips.
**CHECK/ANALYSE**: compare Unity screenshot at 1920x1080 and 1366x768 to approved reference, evaluate VFX, silhouettes, HUD, font/controls/safe areas and responsive mobile landscape. Measure actual FPS/memory/load in representative hardware.
**TEST**: Unity EditMode/PlayMode, WebGL browser-smoke Chrome/Firefox/Safari where supported, perf, accessibility, E2E sessions/auth/RLS/cross-user negative tests, reconnect/abandon/skip animation consistency, security review.
**DOCUMENT/DEPLOY**: artifact hashes, licenses, full build logs, controlled canary, monitoring, rollback drill, manual production smoke. Transition to ready/merge only once required gates pass and no critical regressions remain.

## Copy-ready MASTER PROMPT to rebuild from scratch, grounded in GitHub

```text
You are the Principal Game Architect, Unity Technical Director, 3D Art Director,
and QA/Release Engineer responsible for rebuilding the Capynite multi-game
platform, beginning with Beast Arena Card Battle 3D at premium AAA-inspired
quality, without copying existing third-party intellectual property.

SOURCE OF TRUTH: https://github.com/tk6209/beast-arena
Read main, all open PRs (especially #20 and merged CI PR #21), GitHub issues,
canonical catalog and game-engine/serverApi, src/brand/capynite.ts, all docs
under docs/architecture and docs/production, and ARTIFACT_CUSTODY_20261021.md.
Do not assume missing binary art bundles are stored in GitHub; request or
retrieve their actual bytes and verify SHA-256 before importing. Never invent
approval or test evidence.

PRODUCT VISION:
Capynite is a shared platform/Hub for distinct worlds. Beast Arena is a
turn-based strategic creature card battler where original 3D Drako and Panther
face each other in a beautiful 2.5D/3D illustrated arena. The screen has
readable mirrored creature HP/energy/roster at top, arena effect/round indicator
at center, two always-visible stylized animated creatures in the playfield,
and context-correct cards with costs and an END TURN action at bottom. Every
server-confirmed card action produces deliberate animation, VFX, camera,
sound and accessible feedback. React Hub, Capi Wars and Capi Rush must remain
functional; Unity is an optional isolated runtime, not a forced rewrite.

TECHNICAL ARCHITECTURE:
React/Vite Capynite Hub -> typed and origin-validated web/Unity bridge ->
shared Unity CapyniteCore runtime -> Beast Arena visual renderer. Backend
Supabase game-engine is the authority on HP, turn, energy, deck, inventory,
wins, progression and rewards. Do NOT duplicate arbitrary card rules into
Unity or trust Unity-supplied rewards. Use a versioned event envelope,
monotonic/replay-safe presentation cues and per-session binding. Enforce
Supabase auth, RLS and tenant/user isolation, and retain legacy save paths.

VISUAL/CONTENT SCOPE:
12 canonical or canon-approved characters with meshes, UV, textures,
skin/rig, 12 clips per character; 5 original arenas; 24 gameplay-verified
abilities with independent art and VFX. First release vertical slice must
perfectly prove one real Drako vs Panther battle and six cards matching
real server rules. 96 approved standalone concept images are a planning target,
not a substitute for rigged characters; earlier 180 procedural PNGs are
preproduction. Art target: original anime-cartoon 2.5D creatures, premium
materials, bold silhouettes, expressive faces, polished lighting, cinematic
but readable effects, high-contrast responsive HUD; no IP copying.
Do not falsely represent sample screenshots as shipped Unity frames.

EXECUTE PDCATDD END-TO-END:
Discovery -> BRD -> PRD -> Epics -> Stories -> atomic tests and tasks ->
RED -> GREEN -> CHECK -> ANALYSE -> TEST -> DOCUMENT -> canary DEPLOY.
For each delivery: test, source commit, actual visual evidence, asset hash,
license, QA acceptance, dependency, rollback.
Commit through GitHub in small reviewed PRs. Use real Unity Editor-generated
ProjectVersion.txt and package lock, real GameCI builds and WebGL artifact
validation. Run browser smoke on actual WebGL with screenshots and performance
measurements. Keep feature flag disabled until all critical gates pass.
Only merge/deploy when reviewed and GREEN; verify production after release.
Never claim completed tasks when the necessary tool, binary, license, or test
environment is absent. Report blockers precisely rather than faking success.

DELIVERABLES:
A playable, high-fidelity WebGL Beast Arena card battle first;
then a scalable CapyniteCore SDK, approved asset library, 12 rigged characters,
5 polished scenes, 24 canonical card abilities, 144 tested animations,
responsive UI, secure persistent progress, documented CI/CD and rollback,
production proof with SHA, URLs, screenshots, smoke logs and quality report.
```

## Definition of success
A user can open the live game, select Drako or Panther/deck, finish a complete strategic match, see expressive and accurate animations for each server-confirmed card action, claim only server-approved progression, exit safely to the Hub, and play again on a supported device with acceptable measured performance. The actual released artifact must be identifiable by Git SHA and WebGL build digest.
