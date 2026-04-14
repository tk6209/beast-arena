

# Beast Arena — Plano de Atualização Comercial

## Visão Geral

Transformar o Beast Arena de um protótipo funcional em um jogo comercial completo, seguindo práticas de mercado de jogos de cartas digitais como Pokémon TCG Live, Hearthstone, e Marvel Snap.

---

## Fase 1: Autenticação e Perfil do Jogador

**O que muda para o usuário:** Login real com Google e email. Progresso salvo na nuvem. Avatar e perfil personalizável.

**Detalhes técnicos:**
- Implementar auth com email + Google OAuth via Lovable Cloud
- Criar tabela `profiles` (avatar_url, display_name, level, xp, coins, created_at)
- Criar tabela `user_stats` (total_wins, total_losses, win_streak, best_streak, favorite_monster)
- Migrar ranking para referenciar `user_id` ao invés de `player_name`
- Tela de perfil acessível da home

---

## Fase 2: Economia e Progressão

**O que muda para o usuário:** Sistema de moedas, XP, e desbloqueio gradual de conteúdo.

- **Moedas (Coins):** Ganhas ao vencer batalhas (10 fácil, 20 médio, 40 avançado)
- **XP e Level:** XP por partida (win/loss), level up desbloqueia monstros, poderes e skins
- **Loja de Packs:** Gastar moedas para comprar pacotes de cartas/swarms raros
- **Monstros desbloqueáveis:** Começar com 2 monstros, desbloquear os outros por XP/moedas
- **Daily Rewards:** Recompensa diária ao logar (streak de dias aumenta prêmio)
- Tabelas: `user_inventory`, `shop_items`, `daily_rewards`

---

## Fase 3: Expansão de Conteúdo

**O que muda para o usuário:** Mais monstros, cartas, e variedade.

- **5 novos monstros** com habilidades únicas (total: 10)
- **Cartas combo:** Cartas que combinam com tipo do monstro para efeito bônus
- **Cartas lendárias:** Pool separado com cartas raras e poderosas
- **Mais swarms** com raridades e efeitos novos (drain, reflect, stun)
- **Skins de monstros:** Variantes visuais desbloqueáveis
- Atualizar data.ts + edge function com novo conteúdo

---

## Fase 4: UX e Polish Visual

**O que muda para o usuário:** Experiência mais fluida e profissional.

- **Tutorial interativo:** Primeira partida guiada com tooltips passo-a-passo
- **Animações de combate:** Partículas, screen shake melhorado, transições de turno cinematográficas
- **Animação de abertura de pack:** Efeito "reveal" ao abrir pacotes na loja
- **Indicadores visuais de status:** Ícones de buff/debuff sobre o monstro (veneno, escudo, dobro)
- **Histórico de partidas:** Tela com últimas 20 partidas (adversário, resultado, data)
- **Responsividade tablet/desktop:** Layout adaptado para telas maiores
- **Loading skeleton:** Substituir "Carregando..." por skeleton screens
- **Haptic feedback:** Vibração ao jogar cartas (navigator.vibrate)

---

## Fase 5: Multiplayer Robusto

**O que muda para o usuário:** Multiplayer funcional e confiável.

- **Matchmaking automático:** Fila de espera por dificuldade ao invés de código manual
- **Timer de turno:** 30 segundos por jogada, perde turno se expirar
- **Chat rápido:** Emojis pré-definidos durante a batalha (GG, Wow, etc.)
- **Spectator mode:** Assistir partidas em andamento
- **Anti-cheat básico:** Toda lógica no edge function (já implementado), validar inputs
- Tabelas: `matchmaking_queue`, atualizar `game_sessions` com timer

---

## Fase 6: Engajamento e Retenção

**O que muda para o usuário:** Razões para voltar todo dia.

- **Missões diárias:** "Vença 3 partidas", "Use 5 cartas de cura", "Evolua 2 vezes" — premiam moedas/XP
- **Season Pass:** Trilha de recompensas por temporada (30 níveis, rewards por tier)
- **Conquistas/Achievements:** Badges permanentes (ex: "Derrotou todos no avançado")
- **Leaderboard semanal:** Ranking que reseta toda semana com prêmios
- Tabelas: `missions`, `user_missions`, `achievements`, `user_achievements`, `seasons`

---

## Fase 7: Monetização (Opcional)

**O que muda para o usuário:** Opção de comprar conteúdo cosmético.

- **Moedas premium:** Compra com dinheiro real via Stripe/Paddle
- **Skins exclusivas:** Apenas com moedas premium
- **Battle Pass premium:** Trilha extra de recompensas
- **Sem pay-to-win:** Apenas cosméticos e aceleradores de XP

---

## Fase 8: Qualidade e Infraestrutura

- **Testes E2E:** Vitest + Playwright para fluxos críticos
- **Error tracking:** Sentry ou similar para bugs em produção
- **Analytics:** Eventos de gameplay (cartas jogadas, monstros escolhidos, taxa de abandono)
- **PWA:** Manifest + service worker para instalação no celular
- **SEO e Open Graph:** Meta tags, preview de compartilhamento
- **Rate limiting:** No edge function para prevenir abuso
- **Backup de dados:** Políticas de retenção no banco

---

## Ordem de Implementação Sugerida

1. **Auth + Perfil** (base para tudo)
2. **Economia básica** (moedas + XP)
3. **Tutorial interativo**
4. **Polish visual** (animações, status icons, responsividade)
5. **Expansão de conteúdo** (novos monstros/cartas)
6. **Missões diárias + conquistas**
7. **Multiplayer robusto**
8. **Loja + packs**
9. **PWA + infraestrutura**
10. **Monetização** (se desejado)

---

## Resumo de Tabelas Novas

```text
profiles          — avatar, display_name, level, xp, coins
user_stats        — wins, losses, streaks
user_inventory    — owned monsters, skins, cards
shop_items        — itens disponíveis na loja
daily_rewards     — registro de login diário
missions          — definição de missões
user_missions     — progresso do jogador
achievements      — definição de conquistas
user_achievements — conquistas desbloqueadas
seasons           — season pass data
matchmaking_queue — fila de matchmaking
```

Posso começar implementando qualquer fase. Recomendo iniciar pela **Fase 1 (Auth + Perfil)** pois é a fundação de todo o resto.

