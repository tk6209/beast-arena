# Beast Lab Battles — AAA modernization, cycle 1

## Technical verdict

**P0 production: BLOCKED, not GREEN.** This iteration ships no production backend change.
Only the unpublished client fails closed; the existing deployed game-engine remains vulnerable
to direct forged reward calls. UI quarantine is NOT a server antifraud fix.

Smallest safe slice delivered: disable client economic/progression writes and projected credits;
retain the existing AI rules as non-rewarding in-memory demo; stage an atomic daily claim,
restrictive grants and strict deck validation outside automatic deployment paths.
Staged server guard denies **all** account actions and init; it is not wired to the live endpoint.

No new project, published frontend, backend deploy, applied production migration, balance
backfill, historic claim reconciliation or destructive operation occurred. SQL ran only against
disposable local PostgreSQL 17 with synthetic fixture tables, not a clone of hosted triggers/RLS.
Skills shaping safety: Secure Supabase and Production Change Safety.

## Actual HEAD and live audit

- Baseline HEAD: `b7066cd81e190c2da60ef768fd1f9e1e14765cbc`.
- Runtime reads on connected project: **67 game_sessions, 39 finished; 0 game_players**.
  Hence no existing battle can be presumed reward-eligible. No historic owner backfill is attempted.
- Live game-engine authenticates JWT subject, but init creates no owner row; slot checks can
  be skipped by omitted slot; init accepts custom player deck and power; finished state can
  be overwritten; state/events are separate unchecked writes.
- Live economy RLS already has owner SELECT-only policies on many tables, but table ACLs
  still include client write privileges. Profiles INSERT and season_pass INSERT remain permitted.
  The service-role account handler bypasses RLS and accepts won, coinBase, xpGain and card JSON.
- Historical migrations inspected: profiles, daily/store inventory, battle_history,
  card_collection and subsequent security migrations. Current policy/grant/constraint queries
  override old file assumptions. Safe name settings still update display_name,
  display_name_normalized and name_changed_at; candidate column grants preserve these fields.
- Catalog/engine mismatch remains: demo snapshot has ten legacy monsters; v4+ catalog has more.
  No claim of all characters being playable/validated.

## Status legend

DONE = implemented and verified in the explicitly named environment, never implies production.
RED = implementation/test absent. BLOCKED = external environment or prerequisite prevents activation.
No cosmetic animation is evidence of AAA maturity.

## Atomic execution register

Every row is one independently verifiable output. Dependencies refer to IDs in this register.

| ID / status | Input → output | Files/resource | Dependencies | Unit / E2E evidence or required test |
|---|---|---|---|---|
| P0.01 DONE | HEAD → baseline SHA | read-only git | none | recorded SHA above |
| P0.02 DONE | live sessions → owner population counts | read-only hosted query | .01 | 67/39/0 counts, no mutations |
| P0.03 DONE | migrations/current schema → policy+ACL+unique audit | existing migrations + hosted catalogs | .01 | RLS/ACL/constraint reads |
| P0.04 DONE | proposed values → typed versioned config | docs/security/p0-release/economyConfig.ts + SQL function | .03 | exact daily array; TS/SQL equality test |
| P0.05 DONE | client monetary call → rejection before network | economyAvailability.ts, serverApi.ts | .02 | 9 RED failures before / 9 PASS after |
| P0.06 DONE | onFim/drop → no React progression/history/card grant | Index.tsx, TelaBatalha.tsx, postBattle.ts | .05 | unit suite; reviewed call removals |
| P0.07 DONE | result render → no pre-credited coin/XP/level | TelaResultado.tsx | .05 | source review; browser result check pending at initial documentation |
| P0.08 DONE | claim/store failure → explicit no-balance-change message | DailyReward, Missoes, Loja | .05 | typed callers compile; full monetary UI E2E RED |
| P0.09 DONE | gem/boost/evolution/pass caller → zero direct write | gems.ts, xpBoost.ts, Evolucao, SeasonPass | .05 | source mutation review; tests .05 |
| P0.10 DONE | legacy rules → memory-only noneligible AI round | demoEngine.ts, serverApi.ts | .05 | actual browser turn=1; eligible=false; reward rejection 503 |
| P0.11 DONE | local profile → serialized daily claim + immutable retry receipt | candidate SQL p0_claim_daily | .04 | real local PostgreSQL 2 and 10 concurrent calls, 100→110, ledger=1 |
| P0.12 DONE | candidate grants → client monetary/session writes denied | candidate SQL | .03 | local authenticated write privileges false; coin UPDATE denied |
| P0.13 DONE | new deck JSON → owner/10-card/inventory/max-two/canonical check | candidate deck trigger | .12 | local valid deck accepted; 8/3-copy/forged/cross-user denied |
| P0.14 DONE | legacy session → no partial settlement | candidate p0_settle_battle + accountBoundary.ts | .02 | repeated/stale/cross-user calls rejected; history=0 |
| P0.15 DONE | SQL late failure → full rollback | local_postgres.py | .11 | before=30, after=30; daily=0, ledger=0 |
| P0.16 DONE | balances 0..20 → exactly-once/nonnegative property sweep | local_postgres.py | .11 | 42 calls, 21 synthetic fixtures, one ledger each |
| P0.17 RED | verified JWT → atomic create session + authorized owner slot | future staged engine + transaction RPC | .03 | guest 401; wrong slot 403; absence must reject |
| P0.18 RED | owned monster/deck → server canonical init state | future init validator + catalog | .13,.17 | forged deck, unowned monster, power=500 reject 422; legitimate ownership succeeds |
| P0.19 RED | versioned state+action → atomic state/events commit | future engine CAS/RPC | .18 | two simultaneous moves: one succeeds, stale returns 409; finished reinit rejected |
| P0.20 RED | authoritative finished state → immutable winner/mode/difficulty/drop event | future finalize RPC | .19 | server winner not payload won; server-recorded card only |
| P0.21 RED | final event → unique battle ledger/history + coins/XP/stats/streak | future settlement RPC | .20,.04 | tampered won/coinBase=500/xpGain=500/forged card rejected; retries same receipt |
| P0.22 RED | same event → shards/achievements/pass/missions atomically | future settlement RPC | .21 | all tables rollback together; exactly-once event key |
| P0.23 RED | owned mission+active DB definition → atomic idempotent claim | future mission RPC | .22 | 2/10 concurrent valid submissions; one credit; DB reward/target canonical |
| P0.24 RED | itemId+request key → atomic priced inventory purchase | future shop RPC | .12 | 2/10 concurrent; insufficient balance, inactive item, duplicate monster; same-key retry |
| P0.25 RED | server-generated pack/drop → recorded inventory grant | future shop/drop RPC | .24,.20 | no client JSON authority; RNG draw recorded once |
| P0.26 RED | canonical owned card keys → usable 10-card builder | TelaDeckBuilder, savePlayerDeck | .13 | current builder remains 8; staged trigger cannot be activated until builder/key migration is ready |
| P0.27 BLOCKED | complete candidate → isolated hosted validation | existing project's isolated test environment | .17–.26 | shared production cannot be used under no-deploy restriction |
| P0.28 BLOCKED | proven isolated candidate → activation replacing ALL legacy handlers | backend deployment | .27 + explicit authorization | no direct legacy escape hatch; rollout/reversal proof |
| P1.A01 RED | actual available Gateway model list → supported selection | future advisor function | P0.27 | load Gateway docs/model support at implementation time, no invented model ID |
| P1.A02 RED | verified inventory+style enum → bounded prompt | future advisor schema | A01 | unknown cards/style/oversized request rejected |
| P1.A03 RED | model reply → validated owned 10-card deck/strategy | future advisor validator | A02,P0.26 | unavailable card and >2 copies rejected; strict JSON schema |
| P1.A04 RED | advisor error/limits → usable UI no economic mutation | future advisor screen | A03 | timeout/retry/rate-limit/accessibility tests |
| P1.L01 RED | existing lobby+device metrics → hero-centric hierarchy | existing TelaLobbyPrincipal | P0 stable | character, power, evolve, play reachable without clipping |
| P1.L02 RED | landscape/portrait+safe area → flexible scroll tracks | existing lobby/styles | L01 | Samsung A73/iOS short landscape screenshots + touch E2E |
| P1.L03 RED | keyboard/touch → mode selector navigation | existing lobby modal | L02 | focus trap, Escape/back, one submission only |
| P2.G01 RED | canonical combat rules → deterministic/replayable simulations | engine rules tests | P0.19 | seeded damage, swarm/evolution parity; no simplification |
| P2.G02 RED | action result → readable impact/energy feedback | existing battle UI | G01 | card valid/invalid; reduced-motion; never changes server result |
| P2.G03 RED | win/loss telemetry → measured balance iteration | balance config/tests | G01 | distribution/duration evidence, not visual claims |
| P3.M01 RED | reconnect/duplicate packet → versioned session recovery | multiplayer transport | P0.19 | reconnect/cross-user/stale packet tests |
| P3.O01 RED | versioned waves/economy → audited liveops changes | admin/waves | P0.28 | authorized edits, version pinning, rollback without balance reset |
| P3.X01 RED | keyboard/screen reader/reduced motion → accessible flow | existing screens | P1.L03 | focus order, labels, contrast, alternatives tested |
| P3.F01 RED | real device baselines → FPS/memory/network budgets | perf harness | P2 | measured p95 frame time, cold load, memory; budgets to define, not invented |

## Explicit acceptance scenarios

| Objective | Input | Expected | Observed | Conclusion / evidence |
|---|---|---|---|---|
| Reject client reward forgery | won=true, coinBase=500, xpGain=500, fake card | no request/write | 9 client boundary tests pass | DONE only client; evidence unit log |
| Daily concurrency | 2 then 10 calls, synthetic balance=100 | 10 coins once | balance=110; ledger=1; identical retry receipts | DONE local PostgreSQL |
| Proposed daily schedule | synthetic day 1–7 eligibility | 10,15,20,30,40,50,75 | exact values | DONE local; proposal not external approval |
| Mission/purchase concurrency | 2/10 staged requests | closed until atomic implementation | all return 503 | DONE denial only; **successful atomic claims/purchases RED** |
| Insufficient/inactive/duplicate unlock | negative/short balance, inactive shop, same monster | atomic rejection and unchanged rows | no implementation exercised | RED, no fabricated store evidence |
| Owner slot/session | live 0 owner rows | no reward eligibility assumed | candidate settlement always denied | DONE fail closed; valid owner success RED |
| Replay settlement | stale/cross-user IDs repeated | no mutation | balance unchanged; history=0 | DONE denial; valid exactly-once history RED |
| Direct economic writes | authenticated ACL check; UPDATE coins=500 | denied | table grants false; coin update rejected | DONE synthetic grants, hosted change BLOCKED |
| Preserve name settings | UPDATE display_name; source normalized field | allowed while currency blocked | local name accepted, production trigger untouched | DONE limited fixture; real cooldown E2E RED |
| Deck antiforgery | 10 owned canonical cards; 8 / 3 copies / value=500 / other owner | only first accepted | rejection cases all fail | DONE synthetic DB; existing UI conversion RED |
| ACID late error | force ledger INSERT trigger to raise | no partial credit/claim | 30→30; claims=0; ledger=0 | DONE local |
| Property invariants | 21 initial balances, two daily calls each | nonnegative, exactly one credit | all 42 calls satisfy | DONE finite property sweep, not exhaustive proof |
| Guest demo | init, choose fogo, pass turn | playable; no persisted rewards | actual browser demo=true, eligible=false, turn=1; settlement=503 | DONE engine/browser module; full UI guest entry RED |
| Server failure messaging | unavailable boundary | helpful error, no visual pre-credit | client 503 message; counters not rendered | DONE source/unit; UI screenshot result pending |

## Verification and evidence inventory

- First RED run: 1 file, **9 failed** (`/tmp/p0-red.log`).
- Full available suite: **26 files, 180 tests passed** (`/tmp/p0-unit.log`).
  Existing React act warnings and multiple auth-client warning remain; no false clean-console claim.
- Focused final boundary/config/demo suite: **21 tests passed** (`/tmp/p0-focused-final.log`).
- Local PostgreSQL report: `docs/security/p0-release/evidence/local-postgres.json` (synthetic only).
- Browser module proof: `/tmp/browser/p0/check_demo.py`, initial landing screenshot
  `/tmp/browser/p0/start.png`; demo turn and reward rejection printed. This does not prove login E2E.
- Harness latest automatic build/typecheck: **build OK 2026-10-28T22:16:29Z**.
  Manual build/typecheck not run (platform runs them automatically); server candidate Deno integration
  typecheck/deploy not run. SQL parsed/executed locally; live policies not altered.

## Safe handoff / no activation instructions disguised as completion

Do not copy these candidates into automatic function/migration paths yet.
First implement P0.17–.26 and run on an isolated environment within this existing project.
All live unsafe account handlers must be replaced together; enabling the daily RPC alone is unsafe.
Rollback retains additive ledger audit data and restores only captured reviewed safe ACLs;
see p0-release/ROLLBACK.md. Full production antifraud is explicitly **not delivered** this turn.
No AI Gateway model or cosmetic AAA feature was invented or deployed.