# Capynite — Joshua Edition

## Canonical universe brief

**Status:** Active foundation  
**Owner:** Joshua / Capynite  
**Scope:** Shared identity and navigation layer for every game shipped from this repository.

## North star

Capynite is the universe. Beast Arena and Capi Wars are worlds inside it.

The product should feel like a child-owned game universe rather than a collection of unrelated prototypes. Every experience may keep its own gameplay art direction, but the player should always recognize the same universe, authorship and continuity.

**Canonical lockup**

- CAPYNITE
- JOSHUA EDITION
- “Um universo. Muitos jogos. Aventuras sem fim.”
- Home world: CapyCity

## Design principles

1. **Joshua first.** The shell carries a clear Joshua Edition creator mark without pretending an illustrated character is Joshua's physical likeness.
2. **Worlds, not menu items.** Games are presented as places the player enters.
3. **Shared DNA, distinct games.** Beast Arena may remain competitive/neon; Capi Wars may remain run-and-gun/cartoon. Shared typography, navigation, motion language and universe marks connect them.
4. **Alive by default.** Subtle idle motion, glow, depth, world status and progression cues should make static screens feel inhabited.
5. **Child-safe excitement.** Stylized action, readable shapes, no gore, no horror realism.
6. **Progress has memory.** Existing local progress is surfaced by the Capynite Passport; future account progress should migrate to a shared server profile.

## Information architecture

```text
CAPYNITE / JOSHUA EDITION
├── Capynite Hub (/)
│   ├── Passport snapshot
│   ├── World 01 — Beast Arena
│   ├── World 02 — Capi Wars
│   └── World 03 — locked expansion slot
├── Beast Arena (/beast-arena)
│   └── existing battle / collection / social / progression systems
└── Capi Wars (/capyrocket.html)
    └── existing five-stage run-and-gun campaign
```

## Shared visual language

- Base: near-black indigo `#050611`
- Violet signal: `#B794FF`
- Electric cyan: `#38E1FF`
- Capy gold: `#FFCF4A`
- Action orange: `#FF7A45`
- Success mint: `#22E3A0`
- Display typography: Bebas Neue / Black Han Sans
- UI typography: Barlow / Oswald / Nunito
- Surfaces: dark glass, strong silhouettes, readable high-contrast cards
- Motion: slow ambient drift + fast tactile press feedback

## Creator signature

The `J` crest represents **Joshua Edition**. It is a creator mark, not a portrait or character likeness. If a canonical CapiJosh character is produced later, it must be added as a Character OS recipe with explicit reference art and must not overwrite this creator mark.

## Capynite Passport v1

The first implementation is intentionally read-only and backward compatible:

- player name: `beast_arena_nome`
- Beast Arena local guest wins: `beast_guest_wins`
- Capi Wars high score: `capy_highscore`
- last selected world: `capynite_last_world`

No existing gameplay storage key is renamed in this release.

### Future v2

Move the passport to an authenticated shared profile and introduce cross-game achievements only after migrations, RLS and account-linking tests are defined.

## World contract

Every world entry must define:

- stable `id`
- title + eyebrow
- status (`live` or `coming-soon`)
- runtime (`spa`, `standalone`, `locked`)
- route
- two accent colors
- short feature line
- child-safe description

The contract lives in `src/brand/capynite.ts` and is covered by unit tests.

## Release acceptance criteria

- `/` clearly identifies CAPYNITE + JOSHUA EDITION.
- Both existing games are launchable from the hub.
- A future world is visible but cannot be launched.
- Beast Arena and Capi Wars have a visible return path to the universe.
- Existing gameplay routes and standalone Capi Wars entry remain unchanged.
- Hub works in portrait and landscape; gameplay orientation rules remain scoped to the games.
- Existing local progress is surfaced without destructive migration.
- `.env` is not tracked and a safe `.env.example` documents required public variables.
- Build and unit tests must pass before merge.
