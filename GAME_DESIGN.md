# Beast Arena — Game Design Document v2.0
> Análise comparativa com best-in-class + Roadmap de implementação

---

## 1. DIAGNÓSTICO — O que os melhores fazem

### Referências estudadas
| Jogo | Ponto forte | Lição para Beast Arena |
|---|---|---|
| **Pokémon TCG Pocket** | Pack opening a cada 12h → ciclo de antecipação, 100M downloads | Recompensas temporizadas criam hábito diário |
| **Marvel Snap** | Deck de 12 cartas, partida em 6 turnos, uma decisão-chave por turno | **Brevidade + decisão impactante** = retenção mobile |
| **Legends of Runeterra** | Progressão 100% f2p, sem pay-to-win, coleção por jogabilidade | Cada batalha deve render algo tangível |
| **GWENT** | Round system (Bo3 em 1 match), scoring > eliminação | Profundidade sem complexidade excessiva |
| **Hearthstone** | Curva de mana que define quando jogar o quê | **Custo de energia por carta** = decisão estratégica |
| **Slay the Spire** | Roguelite + deck building + campanha procedural | Campanha com escolhas permanentes |

---

## 2. PROBLEMAS CRÍTICOS DE GAMEPLAY (estado atual)

### 2.1 Ausência de Custo / Mana
**Problema**: Todas as cartas custam 0. O jogador pode tecnicamente jogar qualquer carta a qualquer momento — não há tensão de recurso.

**Benchmark**: Todo card game tier-1 tem um sistema de custo (mana, energia, cristais). Isso cria:
- Curva de jogo (early/mid/late game)
- Decisões de trade-off por turno
- Poder de cartas raras ser justificado

**Solução Beast Arena**: Sistema de **Energia** (1-3 por carta, regenera 3/turno)

### 2.2 Mão Aleatória Toda Rodada
**Problema**: A cada turno uma mão inteiramente nova é gerada do nada. Não há deck real — é RNG puro.

**Benchmark**: Hearthstone, SNAP, LoR — você joga cartas do seu deck construído. A estratégia vem de QUAIS cartas você colocou no deck, não do que o servidor sorteia.

**Solução**: Sistema de **Deck pessoal (10 cartas)** + saque de 3/turno do deck

### 2.3 Batalhas muito longas e sem tensão
**Problema**: HP alto (100-120), defesa reduz muito dano, batalhas duram 8-15 turnos. Não há senso de urgência.

**Benchmark**: Marvel SNAP = 6 turnos. Pokémon Pocket = ~5-8 turnos. Decisão importa todo turno.

**Solução**: Rebalancear para 5-8 turnos ideais com **dano mais impactante**

### 2.4 IA sem personalidade / previsível
**Problema**: IA faz a "jogada óbvia" — ataca se pode, defende se HP baixo. Sem blefe, sem surpresa.

**Benchmark**: Hearthstone IA tem arquétipos (aggro, control, combo). GWENT IA guarda cartas.

**Solução**: 3 perfis de IA com estratégias distintas

### 2.5 Sem Deck Próprio = Sem Identidade
**Problema**: O jogador não tem "o seu deck". Não há nada que represente seu estilo, sua coleção, suas escolhas.

**Benchmark**: A identidade do jogador em card games É o seu deck. É o que você defende.

**Solução**: Sistema completo de coleção + deck building

---

## 3. SISTEMA DE COLEÇÃO DE CARTAS (visão técnica)

### 3.1 Estrutura de Cartas Colecionáveis
```
RARIDADE     | QUANTIDADE | DROP RATE | PODER
Básica       | 20 cartas  | 60%       | Valor base
Incomum      | 15 cartas  | 25%       | +20% poder
Rara         | 10 cartas  | 12%       | Habilidades especiais
Épica        | 6 cartas   | 2.5%      | Efeitos únicos
Lendária     | 4 cartas   | 0.5%      | Game-changing
```

### 3.2 Como Ganhar Cartas
```
FONTE                | RECOMPENSA           | FREQUÊNCIA
Vitória Campanha     | 2-3 cartas (rng tier)| Por batalha
Daily Reward         | 1 carta aleatória    | Diária
Pack Semanal         | 5 cartas garantidas  | Semanal (Vault)
Missão Completada    | 1 carta do tipo      | Por missão
Ranking Rating       | Pack de 3 cartas     | Por liga subida
Loja (coins)         | Cartas específicas   | A qualquer hora
```

### 3.3 Deck Building
- **Tamanho do deck**: 10 cartas (SNAP style — pequeno, decisivo)
- **Limite por carta**: 2 cópias máximo
- **Deck starter**: 10 cartas básicas garantidas
- **Deck salvo**: por monstro (Panther tem deck A, Drako tem deck B)

### 3.4 Multiplayer com Deck Próprio
```
ONLINE:   Supabase Realtime (já existe) → cada player envia deck_id
LOCAL:    QR Code + WebRTC DataChannel  → P2P sem servidor
OFFLINE:  BroadcastChannel (mesma rede) → mesma sessão de browser
```

---

## 4. REBALANCEAMENTO DE NÚMEROS (baseado em benchmark)

### Monstros (HP reduzido ~30%)
| Monstro | HP atual | HP novo | ATK atual | ATK novo |
|---------|----------|---------|-----------|----------|
| Panther | 100 | 70 | 35 | 28 |
| Banana | 120 | 80 | 20 | 16 |
| Drako | 110 | 75 | 40 | 32 |
| Volt | 70 | 50 | 45 | 36 |

### Cartas (custo de energia)
| Tipo | Custo energia | Valor dano/cura |
|------|--------------|-----------------|
| Ataque básico | 1 | 18-25 |
| Ataque médio | 2 | 30-40 |
| Ataque pesado | 3 | 50-65 |
| Defesa | 1-2 | 15-30 |
| Cura | 2 | 20-35 |
| Swarm | 2 | - |
| Evolução | 3 | - |
| Lendária | 3 | efeito único |

### Energia por turno
- Regenera **3 energia** por turno (acumula até 6)
- Encerra turno ao passar OU ao gastar toda energia

---

## 5. CAMPANHA REVISITADA (Slay the Spire style)

```
MUNDO 1 (5 batalhas) → Boss
MUNDO 2 (6 batalhas) → Boss  
MUNDO 3 (7 batalhas) → Boss Final

Entre batalhas: escolha de 1 entre 3 cartas como recompensa
```

### Droops de Campanha
- Vitória normal: 1 carta aleatória (raridade comum/incomum)
- Vitória em dificuldade alta: 1 carta rara garantida
- Boss: 1 carta épica/lendária

---

## 6. MULTIPLAYER OFFLINE (QR/Bluetooth)

### Fluxo P2P via WebRTC
```
HOST                    GUEST
1. Cria sala local     
2. Gera QR com oferta  → Guest scanneia QR
3.                     ← Guest envia resposta ICE
4. Conecta P2P         ← Conecta P2P
5. Envia estado inicial
6. Jogo começa (sem servidor)
```

### Implementação técnica
- `RTCPeerConnection` para troca de estado
- QR Code contém: `{offer: SDP, iceCandidate}`
- Fallback: BroadcastChannel (mesma aba/device)
- Estado local sincronizado por mensagem JSON

---

## 7. PRIORIDADE DE IMPLEMENTAÇÃO

### Sprint 1 (crítico — jogabilidade core)
1. ✅ Sistema de Energia por turno
2. ✅ Deck próprio de 10 cartas + saque por turno
3. ✅ Rebalancear números (HP/dano)
4. ✅ Ganhar cartas por vitória de campanha

### Sprint 2 (coleção completa)
5. Deck Builder UI (TelaDeckBuilder)
6. Tela de Coleção (TelaColecao)
7. Pack Opening animado
8. Cartas salvas no banco (user_cards)

### Sprint 3 (multiplayer evoluído)
9. Multiplayer com deck próprio
10. P2P offline via QR/WebRTC
11. Modo torneio assíncrono

---

## 8. MÉTRICAS DE SUCESSO

| Métrica | Hoje | Meta 30 dias |
|---------|------|--------------|
| Duração média de batalha | 10-15 turnos | 5-8 turnos |
| Retenção D1 | ? | >40% |
| Cartas únicas por jogador | 0 (sem coleção) | 15-30 |
| Sessões por dia | ? | 3-5 (15 min cada) |
| Conversão free→paid | 0% | 5-10% |
