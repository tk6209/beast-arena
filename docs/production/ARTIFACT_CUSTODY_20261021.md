# Capynite / Beast Arena — Artifact custody and asset recovery
Status: SOURCE INVENTORY VERIFIED, BINARY UPLOAD NOT YET COMPLETED (2026-10-21).

## IMPORTANT — GitHub does NOT yet contain every visual artifact
The following five archives existed and passed ZIP CRC validation in the conversation execution environment. The GitHub connector in this session can commit UTF-8 source documents, but it does not expose a way to attach local ZIP/PNG/GLB bytes, and the local container has no outbound DNS access to github.com. **This document is custody metadata only, not a substitute for uploading these binaries.** Never claim the assets are stored in GitHub until actual object links and SHA-256 verifications exist.

| Archive | Bytes | ZIP members | PNG members | GLB members | SHA-256 |
|---|---:|---:|---:|---:|---|
| Capynite_Unity_Production_Kit_v01.zip | 8196 | 4 | 0 | 0 | `25268de002d0a9d77c42803db9de5e928b1fb843491967523ec5022fb265d240` |
| Capynite_180_Assets_Visual_Source_Kit_v02.zip | 3663719 | 187 | 181 | 0 | `40b41ad31db875ececf81f5d762cfa5c699967d7cd40bfe49cf0b9fba38cbbb6` |
| Capynite_Production_Assets_v03.zip | 22490009 | 140 | 98 | 17 | `2a2f1e521a5b00737d647e6fe702342c37b5710ecc6521131b2efa7aefc9d2e6` |
| Capynite_Skeletal_Prototype_v04.zip | 65522 | 11 | 0 | 2 | `62d43bc1d0483e05d392583cc3231d9c36f70163e61528a01043be72d7c116f5` |
| Capynite_Art_Review_v05.zip | 4604881 | 4 | 2 | 0 | `6b46d2640b8a7d302956396063084cfe953b4d41d88abfb3f983b928fdcd964f` |

## Additional images from the chat
| Source file | Bytes | SHA-256 |
|---|---:|---|
| `wide_concept_art_turnaround_sheet_on_a_clean_light.png` (Drako) | 2250168 | `4939b2bfa252eb30d4a5c7b9e1436b8d0febd467264852ab50f3ad95f83d9d43` |
| `wide_character_concept_sheet_style_image_on_a_clea.png` (Panther) | 2745746 | `6c5f9ca5a812136ab66b2f136919e5f3dedd5912c7545b9a3ca944879e6972b6` |
| `wide_cinematic_ui_game_promotional_screenshot_a_h.png` (exploration concept only, NOT evidence of GREEN gates) | 3330662 | `bbf786c5aea041ce47a7d99aa6342929834881e3d01e1380a357059018513304` |

## Binary publication protocol
1. Preserve the original five ZIPs. Upload them into a **private or non-public GitHub Release draft**, or Git LFS / authorized binary object storage. Before choosing visibility, verify the child-oriented project artwork and third-party licensing; do not publish unapproved proprietary/reference images as freely redistributable.
2. Check that every uploaded artifact's SHA-256 matches this document; make immutable release asset links and record source commit + creation date.
3. If expanding into Git LFS, track `*.glb`, `*.fbx`, approved `*.png` and `*.blend`; avoid adding the ~22 MB preproduction ZIP directly into normal Git history.
4. Commit an asset manifest with path, canonical character or arena ID, art approval status, generation provenance, license, version, hash and reviewer. Distinguish PREPRODUCTION, PROTOTYPE, REVIEWED, APPROVED.
5. Only mark a deliverable complete in `docs/production/CAPYNITE_DELIVERY_MANIFEST.json` after verified upload + independent checks.
6. Keep Unity editor-generated `ProjectVersion.txt` and `packages-lock.json` tracked after opening the project, but keep `Library/`, `Temp/`, `Builds/` untracked.
7. Archive GameCI WebGL binaries as workflow/release artifacts after actual Editor compilation. Never synthesize a dummy wasm or pass artifact verification as gameplay QA.

## Scope truth
- The 180 PNGs are procedural design/source studies, not 180 approved AAA illustrations.
- The 17 GLBs in v0.3 include 12 character greyboxes and five arena blockouts; not finished models/playable scenes.
- The v0.4 two skeletal demo GLBs contain structural joints and procedural clips; not approved rigs/cinematic gameplay animations.
- The 96 v0.3 PNG studies are not all unique independently authored canonical character concepts.
- 12-character / 5-arena / 24-ability expansion and 144 production animations remain an unverified delivery program.
- Unity Editor + Web Build Support + license, real WebGL build, QA and production deployment are missing.
- PR #21 CI-only infrastructure merged; PR #20 game prototype remains Draft, not a production game.

## For an owner without a PC
The archives are downloadable from the originating ChatGPT conversation. A machine or connected app with **binary upload capability** must transfer those actual bytes to the destination; metadata commits alone cannot accomplish binary upload. No passwords or license secrets should be placed in chat or Git.

## Verified secondary private Library backup
On 2026-10-21, the five source ZIPs plus Drako/Panther turnarounds, approved-reference screenshot, ten additional concept images and the source reference video were successfully uploaded to the user's ChatGPT Library folder `/Capynite-BeastArena-Source-Archives` (19 files total). This provides account-level recovery independent of the local runtime. **It does not make the files part of the GitHub repository**. A binary-capable bridge from Library to GitHub is still needed. Keep private licensed or third-party reference media out of public GitHub releases.
