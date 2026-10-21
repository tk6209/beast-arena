# Capynite Unity — developer handoff (source-only prototype)

The portal continues on React/Vite. Unity is an optional, isolated renderer for the Capynite universe, **not the authority for battle results or rewards**.

## What exists in Git today
- `CapyniteCardBattleTarget.cs` — offline primitive-geometry card mock with six actions; attack/heal visual cues are emitted to `CapynitePresentationPlayback.cs`.
- `CapyniteBossArena.cs` — separate real-time boss-gauntlet proof of concept. **Not** a substitute for the existing Beast Arena card game.
- `Editor/CapyniteCardBattleBuild.cs` and `Editor/CapyniteBuild.cs` — scene-generation/build entry points.
- `Editor/CapyniteImportAudit.cs` — fail-closed check for imported Drako/Panther GLBs, skinned meshes, bones and animation clips.
- `BeastArena.Core.asmdef` and `BeastArena.EditModeTests.asmdef` — testable pure C# combat spike, NUnit edit-mode tests.
- `scripts/Build-CapyniteUnity.ps1` — local Unity EditMode → WebGL build → artifact verification gate.
- `packages/game-contracts/src/` — versioned TS runtime contracts, server-confirmed visual event adapter and tests.
- `docs/production/CAPYNITE_UNITY_IMPORT_EXECUTION.md` — exact import/build instructions.

## Source assets
The v0.4 `Capynite_Skeletal_Prototype_v04.zip` delivered in conversation contains two test GLBs with procedural meshes/skin and twelve channels of animation each. These are not present in this Git branch and are **not approved production art**. Put them locally into `Assets/CapyniteImports/` after verifying their hashes and licenses. This import directory intentionally ignores unapproved binary models.

## Editor prerequisite
Initialize the actual `unity/Capynite` project with an installed supported Unity 6 Editor (add Web Build Support, Unity Test Framework, supported glTF importer). **The current repo does not contain an Editor-generated ProjectVersion.txt / packages-lock.json, so Unity execution is unverified.** Let the chosen Editor produce these files and lock their exact versions.

## Validation
1. Import rigs and run `Capynite Production > Verify Drako Panther Imported Rigs`.
2. Generate the card demo scene via `Capynite > Create Card Battle Target Scene` and test visually in Play mode.
3. Run `scripts/Build-CapyniteUnity.ps1` with an installed editor path. It runs 4+ EditMode checks, compiles WebGL and checks output structure.
4. Run device/browser smoke and image comparison against the approved Drako/Panther mockups; verify real card engine parity and result authority before any canary.
5. Merge/release only after all required PDCATDD gates are GREEN, including performance and rollback.

**No actual Unity Editor run, WebGL binary, production game deployment or completed AAA assets are claimed in this branch.**
