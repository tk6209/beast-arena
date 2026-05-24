# Evolução de Personagens — estilo Brawl Stars

Cada monstro que o jogador possui terá seu **próprio nível de poder** (1 → 11), independente dos outros. O jogador escolhe em qual monstro investir, e isso muda os atributos em batalha.

## 1. Conceitos do sistema

- **Nível de Poder (PL)**: 1–11 por monstro.
- **Power Shards** (fragmentos): moeda específica do monstro. Caem em vitórias, baús, missões e loja.
- **Coins**: custo paralelo para evoluir (já existe no projeto).
- **Curva de upgrade** (shards / coins por nível):

  ```text
  PL 1→2:  10 sh /   50 c
  PL 2→3:  20 sh /  100 c
  PL 3→4:  40 sh /  200 c
  PL 4→5:  80 sh /  400 c
  PL 5→6: 130 sh /  800 c
  PL 6→7: 200 sh / 1500 c
  PL 7→8: 300 sh / 2500 c
  PL 8→9: 450 sh / 4000 c
  PL 9→10: 650 sh / 6000 c
  PL10→11: 900 sh / 9000 c
  ```

- **Escalamento de atributos** por nível:
  - HP: `base × (1 + 0.06 × (PL−1))` (≈ +60% no PL 11)
  - Dano: `base × (1 + 0.05 × (PL−1))` (≈ +50% no PL 11)

- **Perks desbloqueáveis** (escolha do jogador, como Star Powers / Gadgets):
  - **PL 5** — desbloqueia 1 *Gadget* (escolher 1 de 2 ativos: ex. "Recarga rápida", "Escudo inicial")
  - **PL 7** — desbloqueia 1 *Star Power* passiva (escolher 1 de 2: ex. "Cura ao matar", "Dano crítico +15%")
  - **PL 9** — desbloqueia *Hyper* (escolher 1 de 2: efeito ultimate único do monstro)
  - **PL 11** — *Mythic Gear* (slot extra, escolher 1 de 3 modificadores)

## 2. Banco de dados (nova migração)

Tabela `user_monsters`:

- `user_id` (uuid)
- `monster_id` (text) — chave em `MONSTROS`
- `power_level` (int, default 1)
- `shards` (int, default 0)
- `selected_gadget` (text, nullable)
- `selected_star_power` (text, nullable)
- `selected_hyper` (text, nullable)
- `selected_gear` (text, nullable)
- `total_battles` (int)
- Unique (`user_id`, `monster_id`)
- RLS: dono lê/insere/atualiza.

Backfill: para cada `user_inventory` com `item_type='monster'`, criar linha `power_level=1` se não existir.

## 3. Frontend

- **`src/game/evolution.ts`** (novo) — constantes da curva, perks por monstro, helpers `getStats(monsterId, pl)`, `getUpgradeCost(pl)`, `canUpgrade(pl, shards, coins)`.
- **`src/components/game/screens/TelaEvolucao.tsx`** (novo)
  - Header: avatar + nome do monstro + PL grande + barra de shards (X/Y).
  - Stats antes/depois (HP, Dano) com seta verde se há upgrade.
  - Botão "EVOLUIR" (gasta shards + coins; toast + animação de level-up).
  - Ao atingir PL 5/7/9/11: modal de **escolha de perk** (2–3 cards, jogador escolhe um — gravado em `selected_*`).
  - Bloqueia perks já escolhidos (decisão permanente nesta versão; podemos adicionar "respec" pago depois).
- **`TelaMonstro.tsx`** — overlay com badge `PL{n}` em cada card e botão "Evoluir →" abre `TelaEvolucao`.
- **`TelaLobbyPrincipal.tsx`** — chip "EVOLUIR" no DIÁRIO ou ícone no avatar quando há upgrade disponível.
- **Drop de shards**: ao concluir batalha (vitória = 10 shards do monstro usado, derrota = 3). Aplicado em `postBattle.ts`.
- **Aplicação em batalha**: `engine.ts` / `TelaBatalha.tsx` lê PL do monstro do jogador (e do oponente quando online) e aplica multiplicadores em HP e dano. Para batalha IA o oponente escala PL ≈ ao do jogador.

## 4. Loja
- Adicionar "Pacote de Shards" (item_type `shards`, item_key = monsterId) — opcional nesta primeira entrega, podemos só dropar em batalha.

## 5. Roteamento
- Em `pages/Index.tsx`, novo modo `"evolucao"` com `monstroSelecionado: string`.
- Navegação: Lobby/Monstro → Evolução → volta.

## 6. Fora de escopo (próximas iterações)
- Trocar perks pagando gemas.
- Caixas com shards aleatórios.
- Visual "skin" diferente por PL (5/7/9/11 ganha aura nova).
- Balanceamento PvP por PL no matchmaking.

## Ordem de implementação

1. Migration `user_monsters` + backfill.
2. `evolution.ts` (regras puras).
3. `TelaEvolucao.tsx` + modal de perks.
4. Hook em `TelaMonstro` (badge + botão).
5. Integração `postBattle` (drop de shards).
6. Integração `engine`/`TelaBatalha` (stats por PL).
7. QA: subir 1 monstro até PL 11, validar perks e batalha.
