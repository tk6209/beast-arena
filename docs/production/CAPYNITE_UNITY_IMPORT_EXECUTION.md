# Capynite v0.5 — Actual Unity import/build runner

All scripts in this increment are **source only**, not evidence that Unity Editor/WebGL ran.

## Inputs
- Download `Capynite_Skeletal_Prototype_v04.zip` from the chat delivery.
- Place `rigs/drako_skeletal_demo.glb` and `rigs/panther_skeletal_demo.glb` under `unity/Capynite/Assets/CapyniteImports/`.
- Create/open the project with a **real installed compatible Unity 6 Editor**, install matching Web Build Support, the Unity Test Framework, and a compatible editor glTF importer (e.g. glTFast). Save editor-generated ProjectVersion.txt and packages-lock.json. Do not fabricate version files.
- Run Unity Editor menu `Capynite Production → Verify Drako Panther Imported Rigs` to check skinned meshes, bones and 12 clips/model.
- Run `Capynite → Create Card Battle Target Scene` for the basic demo (still placeholder gameplay).

## Windows PowerShell run (when Unity is installed)
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Build-CapyniteUnity.ps1 -UnityExe "C:\Path\To\Unity.exe"
```
The script fails closed if the project isn't initialized, Unity EditMode tests fail, the WebGL compilation fails or required output files are missing.

## Important separation
- Tests are split using `BeastArena.Core.asmdef` and `BeastArena.EditModeTests.asmdef`, with NUnit-based tests in Editor only.
- The C# `CapynitePresentationPlayback` receives animation cues with a strict session and monotonic sequence; all battle results still belong to the Supabase edge function.
- The current `CapyniteCardBattleTarget` scene remains an **offline demo with fake card numbers**; it must not be presented as canonical gameplay.
- A glTF import structural PASS does not prove deformation quality, UI fidelity or canonical character review.
- The WebGL artifact verifier only checks output structure, not browser playability/performance.
- Production merge/rollout requires signed-off gameplay parity, asset licenses, WebGL browser smoke, performance and server-side reward/RLS checks.

## Next gate
Wire the **server-confirmed** visual events to the Unity host only behind a default-disabled feature flag; require an origin-bound handshake and viewport/UI smoke. Do not expose Supabase session secrets in Unity.
