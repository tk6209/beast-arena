## Beast Arena — Integração do Catálogo v4 + Sistema de Ondas/Admin

### Parte 1 — Catálogo v4
- Copiar `beast_arena_catalog_v4_final.json` para `src/game/data/catalog.json`
- Criar `src/game/types/catalog.ts` com tipos
- Criar `src/game/data/index.ts` exportando `CATALOG`, `MONSTROS`, `SWARMS`, `CARTAS`, `ONDAS`, `PODERES`
- Manter `src/game/data.ts` (engine/frases/helpers/`novaMao`/`IA_PRESETS`) — apenas trocar a fonte de `MONSTROS`/`SWARMS` pelo JSON, preservando o shape consumido

### Parte 2 — Tabela `waves` + cron + hook de onda ativa
- Migration: tabela `waves` (RLS leitura pública, escrita admin)
- Seed dos 13 registros via `supabase--insert`
- Edge function `activate-waves` + cron diário `0 1 * * *`
- `src/hooks/useWaveAtiva.ts` — Supabase Realtime em `waves`, expõe `{ waveAtual, waveNome, proximaOnda, loading }` globalmente via Context

### Parte 3 — RBAC seguro + tabelas admin
Padrão Lovable: tabela `user_roles` + enum `app_role` + `has_role()` SECURITY DEFINER (não JWT claim).
- Migrations: enum `app_role`, `user_roles`, `has_role`, `sorteios`, `sorteio_participacoes`, `early_access_items`
- Hooks: `useUserRole`, `useCatalog`, `usePlayerAccess`

### Parte 4 — Filtragem da seleção
Jogador comum vê só monstros `status='ativo'` (15 da Onda 0) + seus early_access individuais. Admin/mod vê tudo com `StatusBadge`.
Aplicar `usePlayerAccess` em: TelaMonstro, TelaDeckBuilder, TelaColecao, TelaLoja, IA do matchmaking.

### Parte 5 — Painel Admin
- Rota `/admin` protegida
- `AdminPanel` com abas: Ondas, Sorteios, Conteúdo
- Edge function `executar-sorteio` (embaralha, grava ganhadores, popula `early_access_items`)

### Parte 6 — StatusBadge
- `src/components/ui/StatusBadge.tsx` com tokens do design system
- Inserido nos cards das 4 telas — visível apenas para admin/mod

### Parte 7 — WaveBanner (novo)
- `src/components/game/WaveBanner.tsx` exibido na tela principal (TelaHome / TelaLobbyPrincipal)
- Lê de `useWaveAtiva()` a `proximaOnda` (onda com `status='pre_lancamento'` e menor `release_date` > hoje)
- Calcula countdown em dias até `release_date`
- Texto: `🔥 Nova onda chegando em X dias: [wave_nome]` (estilo neon cyan #00e5ff conforme design system Beast)
- Renderização condicional:
  - Só aparece se existir onda em `pre_lancamento`
  - Oculto para admin (`isAdmin === true`) — admin não precisa ver
  - Mostrado para jogador comum e jogador_vip
- Auto-atualiza diariamente (recalcula countdown ao montar; opcional `setInterval` a cada hora)
- Animação sutil de pulse/glow para chamar atenção sem ser intrusivo

### Ordem de deploy
1. catalog.json + tipos + `src/game/data/index.ts` + ajuste em `data.ts`
2. Migrations (waves, app_role, user_roles, has_role, sorteios, participacoes, early_access)
3. Seed de `waves` (insert tool)
4. Hooks (`useUserRole`, `useWaveAtiva`, `useCatalog`, `usePlayerAccess`)
5. Edge functions `activate-waves` (+cron) e `executar-sorteio`
6. AdminPanel + rota
7. Filtro nas telas + StatusBadge
8. WaveBanner na tela principal
9. Teste completo do fluxo

### Confirmações pendentes
1. **Promoção a admin**: posso promover automaticamente o `user_id` da sessão logada no preview?
2. **Tela do banner**: prefere o WaveBanner em `TelaHome`, `TelaLobbyPrincipal`, ou ambas?