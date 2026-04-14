

# Plano: Missões Automáticas, Conquistas, VFX por Monstro, Chat de Batalha e Lobby 360°

## Resumo

5 blocos de trabalho: (1) progresso automático de missões durante batalha, (2) verificação automática de conquistas pós-batalha, (3) efeitos visuais específicos por monstro na cutscene, (4) chat rápido em batalha multiplayer, (5) lobby redesenhado com monstro 360° arrastável e menus em segundo plano.

---

## 1. Progresso Automático de Missões

Após cada batalha (em `TelaResultado.tsx` → `updateUserProgress`), adicionar chamada a uma nova função `updateMissionProgress` que:
- Busca `user_missions` ativas do dia
- Cruza com `daily_missions` pelo `mission_type`
- Incrementa `progress` baseado no tipo: `win_battle` (+1 por vitória), `use_heal` (contagem passada via props), `evolve_monster` (idem), `play_cards` (total jogadas)
- Marca `completed = true` quando `progress >= target_value`
- Passa contadores de ações da batalha (`TelaBatalha` → `TelaResultado`) via novo objeto `battleStats`

**Arquivos:** `TelaBatalha.tsx` (contadores), `TelaResultado.tsx` (nova função), `Index.tsx` (passar props)

## 2. Verificação Automática de Conquistas

Na mesma `updateUserProgress` em `TelaResultado.tsx`:
- Busca `achievements` e `user_achievements` do jogador
- Busca `user_stats` atualizado (já salvo antes)
- Para cada achievement não desbloqueado, checa `requirement_type` vs valor atual:
  - `total_wins`, `win_streak`, `best_streak` → de `user_stats`
  - `rating` → de `player_leagues`
  - `total_battles` → `total_wins + total_losses`
- Se `requirement_value` atingido, insere em `user_achievements`
- Mostra toast/notificação de conquista desbloqueada

**Arquivos:** `TelaResultado.tsx`

## 3. Efeitos Visuais por Monstro na Cutscene

Em `BattleIntro.tsx`, adicionar partículas temáticas por `monstroId`:
- **Drako:** partículas de fogo (🔥, gradiente vermelho/laranja, trail de chamas)
- **Crystal:** cristais brilhantes (💎, flashes brancos/roxos, reflexos)
- **Volt:** raios elétricos (⚡, linhas zigzag amarelas, flashes)
- **Tsunami:** ondas de água (🌊, bolhas azuis, ondulação)
- **Panther/outros:** partículas genéricas de energia

Implementado como mapa `MONSTER_FX` que define: emoji, cores, quantidade e animação CSS para cada monstro. Renderizado em phase >= 1 para P1 e phase >= 2 para P2.

**Arquivos:** `BattleIntro.tsx`

## 4. Chat Rápido em Batalha Multiplayer

Novo componente `BattleChat.tsx`:
- 6 emojis pré-definidos: "GG 👏", "Wow 😮", "Boa jogada 🎯", "Haha 😂", "Ops 😅", "👀"
- Botão flutuante no canto que abre painel de emojis
- Envio via `game_events` (type: `chat`, payload: emoji escolhido)
- Recepção via Realtime — emoji aparece flutuando sobre a tela do oponente por 2s
- Limitado a 1 mensagem a cada 3 segundos (anti-spam)

Integrado em `TelaBatalha.tsx` apenas quando `modo === "multi"`.

**Arquivos:** novo `BattleChat.tsx`, `TelaBatalha.tsx`

## 5. Lobby com Monstro 360° e Layout Redistribuído

Redesenhar `TelaLobbyPrincipal.tsx`:
- **Monstro central com arraste 360°:** touch/mouse drag horizontal rotaciona o monstro (usando `rotateY` CSS transform). Imagem 2D com perspectiva simulada — ao arrastar, aplica `rotateY(Xdeg)` + leve `scale` para dar sensação de profundidade.
- **Menus em segundo plano:** botões laterais ficam com `opacity: 0.6` e `blur(1px)` quando não focados, monstro sempre em primeiro plano com `z-index` superior.
- **QR Code centralizado** na parte inferior, acima da bottom bar.
- **Distribuição vertical:** menu esquerdo (Liga, Season, Loja) e direito (modos de jogo) distribuídos uniformemente com `justify-content: space-evenly`.
- Bottom bar permanece como está.

**Arquivos:** `TelaLobbyPrincipal.tsx`

---

## Banco de Dados

Nenhuma alteração de schema necessária. Todas as tabelas já existem. Inserção de dados em `achievements` e `daily_missions` será feita via insert tool se as tabelas estiverem vazias.

## Ordem de Implementação

1. Contadores de batalha + progresso de missões
2. Verificação de conquistas
3. VFX por monstro na cutscene
4. Chat de batalha
5. Lobby 360°

