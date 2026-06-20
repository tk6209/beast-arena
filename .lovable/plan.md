## Objetivo

Tornar o avanço do mundo **constante** como no Metal Slug: a câmera sempre rola para frente no mesmo ritmo. As setas / gestos só mudam **a posição do herói dentro da tela**, nunca a velocidade do cenário. Acrescentar VFX de aterrissagem (poeira + anel neon) e simplificar a câmera (sem look-ahead variável — o efeito de aceleração agora vem do herói deslizando para frente na tela).

## Mudanças

### 1. Câmera com scroll constante (`GameState.camX`)

- Adicionar `camX: number` em `GameState` (estado inicial 0).
- No loop de update do `Game.ts`, durante `phase === "playing"`, avançar `s.camX += RUN_SPEED * dt`.
- `cameraX(state)` passa a retornar `state.camX` (não mais `player.x - PLAYER_SCREEN_X`).
- Adicionar `worldFrontier(state)` = `state.camX + VIRT_W` para spawnar à frente da câmera.
- Reset zera `camX`.

### 2. Movimento do herói relativo à câmera

`player.ts`:
- Velocidade base do herói = `RUN_SPEED` (igual à câmera → fica centralizado por padrão).
- `moveX === 1` → herói anda **+180 px/s** mais rápido que a câmera (desliza para frente na tela).
- `moveX === -1` → herói anda **−180 px/s** mais devagar (desliza para trás).
- Agachado: velocidade do herói reduz, mas câmera continua.
- Clamp do herói na "tela" segura: `[camX + 40, camX + VIRT_W − w − 60]`. Se ficar para trás demais, é empurrado pela borda esquerda (sem game over) — feedback claro de que não se pode parar.

### 3. Spawning e cleanup referem `camX`, não `player.x`

Substituir nas funções de spawn (`spawnEnemy/Hazard/Pickup/Crate/Prisoner`) e nos filtros de cleanup (`pickups/crates/prisoners/enemies/hazards/bullets/enemyBullets`):

- `player.x + (VIRT_W − PLAYER_SCREEN_X) + N` → `state.camX + VIRT_W + N`
- `player.x − 200` → `state.camX − 200`
- `onScreenLimit` (em `enemies.ts`) → `state.camX + VIRT_W * 0.95`
- Boss target em `boss.ts` e `Game.ts`: `state.camX + (VIRT_W − BOSS_W − 70)`

Colisões, sombra e desenho do herói continuam usando `player.x` (posição real no mundo).

### 4. VFX de aterrissagem (neon + poeira)

Em `Game.ts handleCollisions`, quando `s.player.landImpact > 0.35`:
- Mantém o `shake` (já existente).
- Spawn **dust burst**: 8 partículas brancas/areia laterais ao pé do herói (vx ±200, vy negativo curto), 0.35s.
- Spawn **anel neon ciano**: 14 partículas radiais coloridas `#00e5ff/#7fd0e0` brotando horizontalmente (vy ~0) — visual puro, sem interferir em hitbox.
- Adicionar `spawnLandingBurst(state, x, y, force)` em `particles.ts`.

### 5. Limpeza do código de câmera

- Remover o comentário desatualizado em `camera.ts` e o `look-ahead`/landing-shake já está em outro lugar.
- `types.ts`: comentário do `player.x` → "posição do herói no mundo (separada do scroll constante da câmera)".

## Arquivos editados

- `src/games/capyrocket/engine/types.ts` — adicionar `camX` em `GameState`.
- `src/games/capyrocket/engine/state.ts` — `camX: 0` no init/reset.
- `src/games/capyrocket/engine/camera.ts` — retornar `state.camX`.
- `src/games/capyrocket/engine/Game.ts` — avançar `camX` no loop; trocar `player.x` por `camX` em spawn/cleanup; chamar `spawnLandingBurst` no impacto.
- `src/games/capyrocket/engine/player.ts` — velocidade do herói = base ± offset; clamp em `[camX+40, camX+VIRT_W−w−60]`.
- `src/games/capyrocket/engine/enemies.ts` — usar `state.camX` em frontier/cleanup.
- `src/games/capyrocket/engine/bullets.ts` — cleanup baseado em `state.camX`.
- `src/games/capyrocket/engine/boss.ts` — target baseado em `state.camX`.
- `src/games/capyrocket/engine/particles.ts` — nova `spawnLandingBurst`.

## Critérios de aceite

- Segurar → faz o herói deslizar para a direita na tela; câmera continua igual.
- Segurar ← faz o herói deslizar para a esquerda; câmera continua igual.
- Soltar → herói volta gradualmente ao centro (porque sua velocidade volta = RUN_SPEED).
- Cenário, hills, prédios, chão e inimigos rolam **sempre no mesmo ritmo**, independentemente do input.
- Pular e cair gera anel ciano + poeira no chão; impacto sacode a tela mas não atinge nada.
- Nenhuma colisão muda; hitbox/pose do agachar inalterados.
