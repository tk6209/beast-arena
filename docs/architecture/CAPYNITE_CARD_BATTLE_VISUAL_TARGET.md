# CAPYNITE — Card Battle Visual Target (approved 2026-10-21)

Source of truth: user-provided screenshot in conversation (not redistributed as an owned asset). Reference is *composition and interaction*, not permission to duplicate third-party characters, logos, artwork, text or UI.

## Approved composition
- Always-visible player and opposing creatures in a wide illustrated/stylized arena, battle readable at laptop sizes.
- Top: player/monster roster portraits, health/energy indicators, central battle condition, opponent panels; never obscure primary action.
- Center: two combat positions, creature silhouettes and hit reactions; lively but calm background.
- Bottom: six card/action slots with strong differentiation, energy requirements, damage/ability indicators; explicit END TURN.
- Color: each world preserves its Capynite DNA; official assets must come from Character OS registry.
- Adaptive layout: large desktop, notebook, tablet, mobile landscape; smaller screens must retain readable cards and avoid cropped actions.
- Accessibility: keyboard/controller/touch; do not communicate costs only by hue; reduced motion; visible focus; UI safe areas.

## Architecture decision
Beast Arena remains a *turn-based card game*. Do not confuse the real-time boss gauntlet demo with the replacement card game. The Unity presentation layer must subscribe to a validated, deterministic battle state. Animation skipping must never modify logical damage/outcome. Rewards from client are non-authoritative.

## Prototype code included in this branch
`unity/Capynite/Assets/CapyniteCardBattleTarget.cs` is an **offline, placeholder-geometry** interactive mock. It renders six card choices using Unity OnGUI, energy, HP, stages, and a turn action. `Assets/Editor/CapyniteCardBattleBuild.cs` creates the scene from source and invokes WebGL build. It does NOT use final sprites, replace the existing card rules, authenticate, or save rewards. It has NOT been compiled or visually verified in Unity.

## RED→GREEN acceptance work
1. Parity inventory: compare existing Beast Arena energy/deck/turn and combat formulas; write failing fixtures for gameplay rules, then replace prototype-only formulas.
2. Import licensed canonical Capynite monsters, full character roster and five bosses; rig and state machine.
3. Build HUD in UI Toolkit/uGUI with reusable cards, safe areas, responsive anchors, object pooling and visual diff screenshots; OnGUI is temporary.
4. Deterministic card action → battle event → VFX + camera + hit reaction; fast-forward/reduced-motion, no state drift.
5. Validate win/loss, interrupted turn, deck exhaustion, invalid card use, opponent turn and replay attacks.
6. Host Unity WebGL under opt-in feature flag and safe bridge; verify Chrome/Firefox/Safari and representative touch devices.
7. Complete server-authoritative rewards, RLS isolation and rollback before release.

## Build instructions
Open Unity project in installed supported Unity 6 editor. Run menu `Capynite → Create Card Battle Target Scene`; open `Assets/Scenes/CapyniteCardBattle.unity` and Play. Web build menu `Capynite → Build Card Battle WebGL`. Alternative CLI `-batchmode -nographics -quit -projectPath <unity/Capynite> -buildTarget WebGL -executeMethod CapyniteCardBattleBuild.Build -logFile <logfile>`. Output expected: `unity/Capynite/Builds/CardBattleWebGL/index.html` only after editor build succeeds. No binary artifact is claimed.

## Release status
Source implemented; Unity environment validation, engine-generated project files, edit-mode/play-mode tests, WebGL binary and production smoke still pending. PR remains HOLD.
