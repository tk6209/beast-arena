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


## Approved visual production: separate original image assets
The approved reference is to be translated into original, separated images and editable assets, beginning with a complete **Drako vs Panther** battle screen. The first concept created 2026-10-21 depicts a red/gold stylized Drako and a dark/violet Panther in a countryside arena, top HUD, a central arena modifier, six actionable cards, an energy counter and END TURN. **This is concept exploration, not verification against canonical Drako/Panther art**; character silhouette, colors, names, HP and card damage values require canonical review, game-rule validation and approval before implementation.

Asset manifest (each asset independently exportable):
1. `concepts/drako-vs-panther/complete-battle-16x9.png` — composite art-direction reference, 1920x1080 target, non-functional.
2. `backgrounds/arena-main/{sky,far,middle,ground,foreground}.png` — separately parallaxable environment art without characters or UI.
3. `characters/{drako,panther}/{turnaround,portrait,idle,attack,defend,hit,victory,defeat}` — character design + animation references, canonical registry first.
4. `hud/{player-header,opponent-header,arena-condition,health-bar,energy-crystal,round-indicator}` — independent UI frames/icons and typography tokens.
5. `cards/{frame-attack,frame-defense,frame-special,card-back,action-icons,ability-illustrations}` — art only; card strings, costs and damage values are runtime data.
6. `vfx/{attack-trail,hit,shield,heal,ultimate}` — animation-ready transparent sequences.
7. `responsive/{desktop-1920x1080,notebook-1366x768,tablet-landscape,mobile-landscape}` — screen layouts demonstrating safe areas and card legibility.

Production rules: never crop UI elements out of a flattened screenshot as the final HUD. Instead generate/reconstruct discrete transparent assets; record dimensions, alpha, color space, ownership, prompt/reference, approved character version, asset ID, review state and license in a manifest. Use vector/9-sliced layouts for frames, readable dynamic text for game values, Unity prefabs and responsive anchors. No third-party characters or copied UI imagery.

### Validation of first composite
- Top bars show recognizable silhouettes, player and opponent roles, numeric HP and energy; stat values must be backed by current game rules, not invented from generated artwork.
- Field places creatures apart with unobstructed combat and readable VFX trajectories.
- Lower hand has clear card affordances and target cost/damage labels; exact deck size and card list governed by verified gameplay.
- Final art matches canonical Character OS; placeholder explorations must be labeled and not imported as final assets.
- Visual regression at desktop, notebook, tablet and mobile landscape; no UI overlap, unreadable text, or clipped actions.

## Unity WebGL — mandatory disclosure and production gate
**A especificação contempla o processo de WebGL, mas não constitui uma build Unity compilada ou testada.** A entrega só poderá ser declarada após abrir o projeto em um Unity Editor compatível com Web Build Support, validar os assets e suas licenças, gerar os artefatos reais de distribuição, executar testes EditMode/PlayMode e smoke no navegador, medir performance e registrar evidências por SHA. Nenhum projeto, mockup, conceito ou script de build deve ser apresentado como binário WebGL pronto. Merge e publicação permanecem bloqueados até os gates necessários estarem GREEN.
