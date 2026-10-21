# Capynite Unity Platform — Delivery Program (PDCATDD)
Status: PLAN / HOLD FOR IMPLEMENTATION. Baseline: main at branch creation, 2026-10-21. Owner repo: tk6209/beast-arena.
Scope: Unity is an *optional runtime* for worlds. Keep existing React Hub, Beast Arena card rules, Capi Wars and Capi Rush intact until feature-flagged replacements satisfy their own gates. No forced engine migration.

## Discovery evidence (inspected)
- package.json: React 18, TypeScript, Vite 5, Vitest, Supabase. No Unity build integration in inspected manifest.
- src/App.tsx: /, /beast-arena, /capi-rush and /admin routes; /beast-arena landscape gated.
- src/brand/capynite.ts: game registry and local storage names; runtime currently spa|standalone|locked.
- src/games/capyrocket/engine/Game.ts: fixed-step Canvas2D engine separate from React; reuse gameplay concepts, not C# binaries.
- docs/JOSHUA_UNIVERSE.md and docs/capynite/CAPYNITE_CHARACTER_OS.md: canonical visual/character direction.
- GAME_DESIGN.md: deck / energy / reward mechanics documented; documentation != verified implementation.
Not yet verified: runtime functionality, full game engine files, live Supabase policies, CI, production, Unity installation, asset licensing, existing asset rigs and build size.

## Architecture decision records
ADR-001: Capynite Hub remains the authoritative entry point and game registry. Unity WebGL loads on demand at isolated route /beast-arena/next behind a disabled-by-default feature flag. /beast-arena remains unchanged until canary acceptance.
ADR-002: JSON Schema message envelope v1 is platform-agnostic; TypeScript and C# bindings must be generated/validated against a single source, never drift.
ADR-003: Host page holds authentication; Unity does not persist tokens, service_role keys or claims of reward entitlement. A short-lived server-scoped game session is minted on the backend. Browser-to-Unity messaging limited to strict origin and schema validation.
ADR-004: All leaderboard wins, rewards, user inventory and final match results are server-validated. Client-side events are untrusted. Multiplayer needs independent authority/replay protection.
ADR-005: Character OS is canonical; character recipes, materials, rig/animation and asset licenses require explicit registry/manifests. Color accents retained per game, not globally forced.
ADR-006: No game writes old progress fields until migration contracts, authenticated identity link, RLS tests and rollback established. Guest save conversion is opt-in, idempotent, audited.
ADR-007: Unity major/minor editor is pinned by ProjectVersion.txt and packages-lock.json; WebGL output isn't committed to Git; artifacts deployed separately with asset hash and cache strategy.

## Backlog → RED → GREEN → evidence → DoD
| ID | Dependency | Atomic deliverable | RED evidence before implementation | GREEN acceptance and evidence |
| --- | --- | --- | --- | --- |
| CP-001 | none | Read-only inventory of existing routes, persistence keys, battle rules, secrets, licenses and CI | Baseline gaps checklist | source links, HEAD SHA, npm ci/test/lint/build outputs; deployment snapshot |
| CP-002 | CP-001 | Author canonical event schemas and versioning/compatibility policy | invalid message, unknown version, oversize payload tests fail | schema-driven tests: valid/invalid, replay, origin, malformed input; TS/C# fixture parity |
| CP-003 | CP-002 | Unity foundation with pinned LTS editor, URP, Addressables if justified, WebGL build pipeline | empty project web build smoke fails | Linux/Windows supported editor build evidence, version/asset manifests, reproducible build |
| CP-004 | CP-003 | Runtime host /beast-arena/next and isolated iframe or Unity canvas loader | unavailable/failed build, blocked origin, timeout and cleanup tests | fallback, loading/error/exit, orientation, accessibility, back navigation; no legacy route regression |
| CP-005 | CP-002,CP-003 | Character OS Unity package and Drako/Panther canonical assets | missing rig/animation/licenses tests | rig profiles, animation states, import reports, licensed asset audit |
| CP-006 | CP-003,CP-005 | Battle scene, HUD, camera, animation, attack/defense/VFX/audio | deterministic battle fixture, hit reaction, loss/win and pause tests | playable complete fight and video evidence on desktop + mobile representative devices |
| CP-007 | CP-002,CP-004,CP-006 | Bridge typed host events and battle launch/deep link | reject stale, duplicated, cross-world and unknown events | contract tests, telemetry trace, exiting to Hub without dropping session |
| CP-008 | CP-001,CP-002,CP-007 | Backend game session, authoritative results, progression integration | cross-user claim, repeat reward, forged win, replay, expired token tests | RLS+server-side validation matrix, guest/profile separation, rollback of test reward |
| CP-009 | CP-004..008 | Perf, UX, child safety, accessibility and cross-browser hardening | representative regression screens/trace fail | real WebGL metrics FPS, load size, memory, crash, mobile input, captions/mute controls |
| CP-010 | CP-001..009 | Staged canary → production → postdeploy smoke | kill-switch rollback drill | flag-on cohort, game launch/fight/exit/save smoke, telemetry/alerts, documented rollback |
DoD per atomic task: RED test committed before fix; GREEN implementation; review; build; tests; documentation; traceable screenshot/log; no unknown critical/blocking risk. No merge on stale evidence. Merge after all applicable gates pass and review is approved.

## Release mechanics
Branch series: feat/capynite-unity-contracts → feat/capynite-unity-runtime → feat/capynite-character-pipeline → feat/beast-arena-unity-slice → feat/capynite-unity-backend → release/capynite-unity-canary.
Each PR contains exact tested SHA, generated artifacts, preview address, screenshots/video, accessibility and risk notes, rollback proof. Unity changes isolated so current SPA can deploy unchanged.
Canary: flag disabled default; verified WebGL asset hosting and CORS/CSP; monitor launch success, fatal errors, server result rejection, p95 load, FPS, mobile memory and user drop-off. Abort on auth/inventory corruption, cross-user leaks, crashes or excessive regressions. Enable gradually only with explicit production evidence. Keep immediate flag-off rollback.

## Risks / blockers
- Unity editor/CI runner not shown to be available; WebGL production cannot be truthfully claimed until tested.
- New 3D character models/rigs may not exist; canonical art and rights confirmation required.
- Current battle loop/rewards and Supabase RLS require source/DB inspection before authoritative integration design.
- Unity WebGL on mobile is device/browser-specific; fallback must preserve old web route.
- Multiplayer anti-cheat and server authority should not be implied from current Realtime usage alone.

## Delivery log
2026-10-21: initial source audit and delivery plan documented. Discovery and contract work started. No Unity player, production release, successful tests or merge claimed.
