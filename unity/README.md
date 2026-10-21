# Capynite Unity runtime — implementation gate
Status: FOUNDATION SPEC ONLY. No Unity project, scene, WebGL build or verified playability is included in this PR.

Target: Unity 6 LTS editor pinned in unity/Capynite/ProjectSettings/ProjectVersion.txt when the project is first generated using Unity Hub; URP performance profiles; WebGL loader on a separate feature-flagged route; shared C# bridge adapter with fixtures matching packages/game-contracts/schemas/game-envelope.v1.schema.json.

### Local prerequisite
Install Unity Hub and a licensed/available Unity 6 LTS editor with Web Build Support. Do not invent ProjectVersion.txt or packages-lock.json without an editor-generated project. Commit text source and project settings; exclude Library, Temp, obj and generated WebGL outputs. Track only properly licensed art.

### Acceptance
Open project in pinned editor; build WebGL; launch and exit from Capynite Hub; battle flow Drako vs Panther end-to-end; strict schema/origin validation; server-validated game results; perf profile and mobile fallback. A README alone does not satisfy these gates.
