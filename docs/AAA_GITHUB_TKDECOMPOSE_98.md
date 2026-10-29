# Beast Arena — AAA TKDecompose / GitHub-only

Date 2026-10-28. Repo tk6209/beast-arena. Branch feat/beast-arena-aaa-p0-economy-20261028. NOT DEPLOYED. SECURITY HOLD. This is a proposed implementation, not a release certification.

## Delivery state

| Gate | State | Reason |
|---|---|---|
| P0 migration, server economy RPC, JWT session and ledger | CODE / UNVERIFIED | SQL and live HTTP not executed |
| P1 AI Gateway + UI + fallback | CODE / UNVERIFIED | Model/URL/secrets and spend quota not validated |
| P1 hero-centric responsive lobby | CODE / UNVERIFIED | Mobile screenshots and a11y unverified |
| P2 balance, PvP, game loop | RED | Full gameplay testing not done |
| Merge, DB cutover and release | HOLD | Security / regression / independent review not green |

**Important:** The initial economy config snapshots existing server values (win coins 10/20/40 by difficulty, XP 20/30/50, loss 3 coins+8 XP, streak 25%, daily 50..200); existing UI advertised daily 10..75. Product must confirm official rules before production. No silent balance changes. P0 SQL REVOKEs are potentially breaking and require staged rollout.

## Atomic work breakdown (98 tasks)

One row = one independently verifiable change. Evidence per task: objective, input, expected, observed, verdict, HEAD SHA and log/screenshot. CODE / UNVERIFIED is not PASS.

| ID | Atomic change | Objective evidence / DoD | Dependency | State |
|---|---|---|---|---|
| SEC-01 | Inventariar RLS e grants no staging | Snapshot pg_policies | — | RED |
| SEC-02 | Confirmar schema de profiles | DDL read-back | SEC-01 | RED |
| SEC-03 | Revogar atualização de coins, xp, gems | JWT A/B write denied | SEC-02 | CODE / UNVERIFIED |
| SEC-04 | Preservar display_name | JWT A positive profile edit | SEC-03 | RED |
| SEC-05 | Revogar INSERT/UPDATE de game_sessions | JWT negative HTTP | SEC-01 | CODE / UNVERIFIED |
| SEC-06 | Impedir criação fraudulenta de game_players | JWT negative HTTP | SEC-05 | CODE / UNVERIFIED |
| SEC-07 | Revogar inserção de game_events | Drop forjado negado | SEC-05 | CODE / UNVERIFIED |
| SEC-08 | Revogar INSERT/UPDATE de user_cards | Inventário imutável pelo cliente | SEC-03 | CODE / UNVERIFIED |
| SEC-09 | Revogar INSERT de battle_history | Histórico apenas por settlement | SEC-03 | CODE / UNVERIFIED |
| SEC-10 | Bloquear writes user_missions/inventory/stats | Inspeção de grants | SEC-03 | CODE / UNVERIFIED |
| SEC-11 | Restringir RPC EXECUTE a service_role | Testes has_function_privilege | SEC-01 | CODE / UNVERIFIED |
| SEC-12 | Testar user A vs B | Cross-account 403 | SEC-11 | RED |
| SEC-13 | Testar onboarding de novo perfil | Auth trigger sem regressão | SEC-03 | RED |
| SEC-14 | Verificar multiplayer e convites após REVOKE | E2E rooms sem erro | SEC-06 | RED |
| ECO-01 | Criar versão de regras econômicas | Única versão ativa | SEC-02 | CODE / UNVERIFIED |
| ECO-02 | Homologar valores diários oficiais | Assinatura produto | ECO-01 | RED |
| ECO-03 | Criar ledger único por evento | UNIQUE(user_id,event_key) | SEC-02 | CODE / UNVERIFIED |
| ECO-04 | Criar RPC para progressão atômica | Transação rollback on failure | ECO-03 | CODE / UNVERIFIED |
| ECO-05 | Lock no perfil por operação | Prova de serialização | ECO-04 | CODE / UNVERIFIED |
| ECO-06 | Resgatar daily por UTC | Crédito uma vez/dia | ECO-05 | CODE / UNVERIFIED |
| ECO-07 | Cálculo de streak max 7 | Relógio controlado 7 dias | ECO-06 | RED |
| ECO-08 | Resgatar missão completa | Condições de progresso server-side | ECO-05 | CODE / UNVERIFIED |
| ECO-09 | Recusar missão de outro usuário | JWT cruzado negado | ECO-08 | RED |
| ECO-10 | Comprar com preço DB | Sem preço enviado pelo cliente | ECO-05 | CODE / UNVERIFIED |
| ECO-11 | Persistir idempotência de compras | Retry sem cobrança duplicada | ECO-10 | CODE / UNVERIFIED |
| ECO-12 | Bloquear compra de monstro já possuído | Uma unidade sem double debit | ECO-10 | CODE / UNVERIFIED |
| ECO-13 | Vincular sessão ao JWT/slot | game_players autenticado | SEC-06 | CODE / UNVERIFIED |
| ECO-14 | Validar monstro/power/deck no init | Dados reais do backend | ECO-13 | CODE / UNVERIFIED |
| ECO-15 | Bloquear mutação em jogo finalizado | HTTP 409 | ECO-13 | CODE / UNVERIFIED |
| ECO-16 | Implementar CAS em ações concorrentes | Zero lost updates | ECO-15 | CODE / UNVERIFIED |
| ECO-17 | Derivar vencedor da sessão finalizada | Cliente won ignorado | ECO-14 | CODE / UNVERIFIED |
| ECO-18 | Liquidar batalha idempotente | Uma concessão por sessionId | ECO-17 | CODE / UNVERIFIED |
| ECO-19 | Conceder drops de eventos do servidor | Carta forjada impossível | ECO-18 | CODE / UNVERIFIED |
| ECO-20 | Salvar battle_history única | Uma sessão um resultado | ECO-18 | CODE / UNVERIFIED |
| ECO-21 | Conceder shards e season XP | Valores em ledger | ECO-18 | CODE / UNVERIFIED |
| ECO-22 | Processar missões de batalhas | Uma transição por sessão | ECO-18 | CODE / UNVERIFIED |
| ECO-23 | Integrar XP Boost/cargas em RPC | Sem bônus repetido | ECO-21 | RED |
| ECO-24 | Usar recibos retornados pelo servidor | Sem saldo otimista | ECO-18 | CODE / UNVERIFIED |
| ECO-25 | Reconciliar eventos passados | Plano seguro sem backfill cego | ECO-20 | RED |
| AI-01 | Definir 4 estilos de jogo | Enum fechado | — | CODE / UNVERIFIED |
| AI-02 | Ler cartas por JWT validado | Sem userId arbitrário | SEC-12 | CODE / UNVERIFIED |
| AI-03 | Filtrar preferidas possuídas | Declaração não prova posse | AI-02 | CODE / UNVERIFIED |
| AI-04 | Validar monstro desbloqueado | 403 para bloqueado | AI-02 | CODE / UNVERIFIED |
| AI-05 | Validar mínimo 10 slots | Erro 422 coleção curta | AI-03 | CODE / UNVERIFIED |
| AI-06 | Definir contrato JSON de recomendação | 10 IDs e estratégia | AI-05 | CODE / UNVERIFIED |
| AI-07 | Configurar gateway/modelo reais | Teste com credenciais do ambiente | AI-06 | RED |
| AI-08 | Adicionar cotas de inferência | Máximo dia/usuário | AI-07 | RED |
| AI-09 | Rejeitar carta inexistente | Falha segura | AI-06 | CODE / UNVERIFIED |
| AI-10 | Limitar duplicatas à quantity | No máximo 2 | AI-09 | CODE / UNVERIFIED |
| AI-11 | Fallback determinístico identificado | Não se passar por IA | AI-10 | CODE / UNVERIFIED |
| AI-12 | UI seleção de estilo/cartas | Controles responsivos | AI-03 | CODE / UNVERIFIED |
| AI-13 | Aplicar deck sem salvar automaticamente | Undo/confirmar | AI-12 | CODE / UNVERIFIED |
| AI-14 | Usar deck salvo em batalha real | Mesmas 10 cartas | ECO-14 | RED |
| AI-15 | Telemetria de custo e latência | Sem PII | AI-08 | RED |
| UX-01 | Atualizar barra perfil/moedas/gemas | Dados DB | SEC-03 | CODE / UNVERIFIED |
| UX-02 | Exibir liga/troféus reais | Dados de player_leagues | UX-01 | CODE / UNVERIFIED |
| UX-03 | Centralizar monstro ativo | Palco sem clipping | UX-01 | CODE / UNVERIFIED |
| UX-04 | Exibir poder/fragmentos reais | User_monsters | UX-03 | CODE / UNVERIFIED |
| UX-05 | Implementar Trocar monstro | Callback testado | UX-03 | CODE / UNVERIFIED |
| UX-06 | Implementar Evoluir monstro | Callback testado | UX-04 | CODE / UNVERIFIED |
| UX-07 | Unificar seletor e JOGAR | Uma ação principal | UX-03 | CODE / UNVERIFIED |
| UX-08 | Oferecer Solo/Online/Sala QR | Seleção explícita | UX-07 | CODE / UNVERIFIED |
| UX-09 | Layout portrait | 360x640 a 430x932 | UX-03 | CODE / UNVERIFIED |
| UX-10 | Layout landscape | 640x360 a 1440x900 | UX-03 | CODE / UNVERIFIED |
| UX-11 | Navegação inferior mobile | safe-area e 44px | UX-09 | CODE / UNVERIFIED |
| UX-12 | Cards de Season/Missões | Estados vazios | UX-01 | CODE / UNVERIFIED |
| UX-13 | Acessibilidade teclado/foco | WCAG e reduced-motion | UX-11 | RED |
| UX-14 | Visual QA dispositivos reais | Capturas e interações | UX-13 | RED |
| GAME-01 | Medir mediana e P95 de turnos | Telemetria por modo | ECO-18 | RED |
| GAME-02 | Balancear custo de energia | Simulador 10 monstros | GAME-01 | RED |
| GAME-03 | Telegraphing da IA | Intenção legível | GAME-02 | RED |
| GAME-04 | Exibir previsão de dano | Mesma fórmula server | GAME-02 | RED |
| GAME-05 | Revisar sinergias e combos | Sem estratégia dominante | GAME-02 | RED |
| GAME-06 | Refinar VFX existentes | FPS estável | GAME-03 | RED |
| GAME-07 | Áudio adaptativo e acessível | Preferências respeitadas | GAME-06 | RED |
| GAME-08 | Feedback de vitória/derrota | Sem repetição de rewards | GAME-06 | RED |
| GAME-09 | Teste de baixa conectividade | Sem turno perdido | ECO-16 | RED |
| GAME-10 | Multiplayer autoritativo | PvP seguro | SEC-14 | RED |
| GAME-11 | Medição de retenção e diversão | Eventos sem PII | GAME-01 | RED |
| QA-01 | Criar fixtures A/B staging | Identidades sintéticas | SEC-01 | RED |
| QA-02 | Executar SQL guardrail read-only | Resultados no HEAD | QA-01 | RED |
| QA-03 | Rodar Vitest deckAdvisor | 7 cenários reais | AI-11 | RED |
| QA-04 | Injetar coinBase/xpGain/won | 422 e zero delta | ECO-17 | RED |
| QA-05 | Forjar carta lendária | 403 sem inventário | ECO-19 | RED |
| QA-06 | Repetir settlement 10x | Um ledger/histórico | ECO-18 | RED |
| QA-07 | Concorrência 10x daily | Um crédito | ECO-06 | RED |
| QA-08 | Concorrência 10x mission | Um crédito | ECO-08 | RED |
| QA-09 | Concorrência 10x compra | Sem gasto indevido | ECO-11 | RED |
| QA-10 | Sessão de jogador B | Negada | SEC-12 | RED |
| QA-11 | Reconexão/refresh durante partida | Idempotência e estado correto | ECO-16 | RED |
| QA-12 | Verificar shards/card pós-batalha | Prova DB antes/depois | ECO-21 | RED |
| QA-13 | Validar login/OAuth/perfil | Sem regressões | SEC-13 | RED |
| QA-14 | Executar lint/typecheck/test/build | Logs+SHA anexados | QA-03 | RED |
| QA-15 | Revisão independente de segurança | Aprovação distinta | QA-14 | RED |
| QA-16 | Smoke visual android/ios | Capturas e devices | UX-14 | RED |
| QA-17 | Canary+rollback testado | Métricas GREEN | QA-15 | RED |
| QA-18 | Aprovação oficial do balanceamento | Assinatura produto | ECO-02 | RED |
| QA-19 | Merge somente após gates críticos | Checklist DoD | QA-17 | RED |

## Required adversarial test matrix

| Scenario | Stimulus | Required result |
|---|---|---|
| R01 | coinBase=500 / xpGain=500 / won=true in client payload | Reject 422, zero currency delta |
| R02 | Fake save_card_drop with legendary JSON | Reject 403, inventory unchanged |
| R03 | 10 parallel settlement attempts for same session | Exactly one ledger and one battle history row |
| R04 | JWT B attempts settlement of A's session | 403/409, no leakage |
| R05 | Unfinished, replayed or falsified session | No payouts |
| R06 | Direct authenticated UPDATE profiles coins, XP, gems | Permission denied; display_name still editable |
| R07 | Direct INSERT card_drop/game_events/user_cards | Permission denied |
| R08 | 10 concurrent daily requests same UTC day | Exactly one coin grant |
| R09 | Consecutive days 1–7 and midnight | Configured amounts, no free signup-day surprise |
| R10 | 10 concurrent valid mission claims | One grant, others idempotent |
| R11 | Inactive product / inadequate balance | Rejected, zero inventory grant |
| R12 | Duplicate monster unlock and replayed purchase id | No double debit |
| R13 | AI returns 10 cards with invented key or third copy | Invalid output rejected, fallback labeled |
| R14 | Player has fewer than 10 legal card slots | 422, no invented deck |
| R15 | Portrait 360x640 / landscape 844x390 | All actions visible and touch >=44px |
| R16 | New-user auth, QR multiplayer, profile name | No regressions after REVOKE |

## Execution loop — PDCATDD

Plan: capture staging schema/RLS and baseline git SHA. Do: apply migration in a cloned staging database before Edge/client. Check: SELECT-only permission and ledger probe. Analyse: reconcile cross-account and concurrency gaps. Test: npm ci, npm test, npm run lint, npm run build, HTTP real JWT A/B, 10x collision and device screenshots. Document: evidence with exact commit. Deploy: gated canary and rollback rehearsal; do not merge while RED/HOLD.

## Known gaps and release blockers

- SQL migration not executed or syntax-validated against staging; the React/Edge build is not run.
- Existing QR multiplayer room creation may be blocked by deliberate direct-write REVOKEs; secure join endpoints need validation.
- AI Gateway requires a real supported AI_GATEWAY_MODEL, AI_GATEWAY_URL and LOVABLE_API_KEY; model credentials not committed. Per-user quotas still missing.
- This first settlement covers AI (slot 0) only. PvP authoritative settlement remains RED.
- Card drops rely on trusted persisted event ordering; session write + event write are not one DB transaction yet.
- XP Boost charges, full event-derived mission progress, achievements and pack openings require one trusted transaction path before release.
- Legacy user data/backfill must not be silently overwritten.
- Independent review and real test evidence required before merge.
