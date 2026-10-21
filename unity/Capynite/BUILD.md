# Capynite playable boss gauntlet — local build procedure

This folder contains **Unity scene generator and gameplay source**, not a verified Unity WebGL binary. Unity Editor and Web Build Support are required. Use a supported Unity 6 version and let Unity generate ProjectSettings/ProjectVersion.txt and Packages/packages-lock.json; commit those generated files afterward to lock the actual tested version.

## Create project and import
1. In Unity Hub create a 3D Core project (Built-in render pipeline) named Capynite. Copy its generated ProjectSettings and packages lock to this tracked folder after confirming the engine version. These prototype primitives use Shader.Find("Standard"), not URP.
2. Open this folder as the Unity project, resolve packages if the chosen editor requires adjustments.
3. Use menu `Capynite → Create Playable Boss Arena` then open `Assets/Scenes/CapyniteBossArena.unity` and press Play.
4. Controls: WASD/arrows move, Space attack, Shift dodge, keys 1–4 change Capivini / Capininja / Capirocket / Capizozo, R restarts. Five bosses in canonical Capi Wars stage order. All actors use **placeholder 3D primitives**, not final Character OS assets.

## Produce WebGL via Unity CLI
```bash
UNITY_BIN=/path/to/Unity
"$UNITY_BIN" -batchmode -nographics -quit \
  -projectPath "$(pwd)/unity/Capynite" \
  -buildTarget WebGL \
  -executeMethod CapyniteBuild.BuildWebGL \
  -logFile "$(pwd)/capynite-webgl-build.log"
```
Expected artifact on successful build: `unity/Capynite/Builds/WebGL/index.html`. Serve through an HTTP server; do not open file://. The Unity CLI must return success and produce all WebGL assets. Log build duration/size and browser smoke; no result is currently claimed.

## Known prototype limits
- This is a **real-time prototype**, separate from Beast Arena card-game rules; not a migration or final gameplay.
- No audio, imported canonical character rigs, VFX pipeline, touch input, Supabase auth, authoritative results or mobile performance verification.
- No reward persistence, no server calls. Production feature flag must remain disabled.
- Scene source is generated in Unity, not yet checked into the repository as a serialized .unity file.
