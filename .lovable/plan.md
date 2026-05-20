# Roadmap Visual: Beast Arena → Qualidade Brawl Stars / Clash Royale

## Diagnóstico atual

O jogo já tem uma boa base (Dark Fantasy Arcade, paleta âmbar/obsidiana, Bangers/Oswald), mas o que separa dele dos top mobile games é:

- **Personagens são emojis** (🐆🍌🐵...) — Brawl/Clash usam ilustrações 3D-renderizadas
- **Cartas são gradientes CSS** sem arte ilustrada
- **Lobby estático** — falta cenário/parallax/personagem "vivo" no centro
- **Sem feedback "juicy"** — faltam squash & stretch, partículas em cada ação, screen shake, números flutuantes grandes
- **Tipografia funcional**, mas sem o "chunky cartoon" outline grosso característico do gênero
- **UI plana** — botões precisam de profundidade 3D (bevel, sombra inferior espessa, brilho superior)

## Fase 1 — Identidade Visual dos Personagens (impacto máximo)

O salto de qualidade nº 1. Substituir todos os emojis por ilustrações próprias.

- Gerar 10 ilustrações de mascotes em **estilo cartoon 3D-rendered** (Brawl Stars vibe): contorno preto grosso, sombreamento cell-shaded, cores saturadas, pose dinâmica de "idle hero"
- Variações por raridade: aura/glow ao fundo (comum cinza → lendário dourado animado)
- Aplicar em: TelaMonstro (cards de seleção), Lobby (hero central), TelaBatalha (avatar), Carta (quando carta de monstro)
- Bônus: 2-3 frames de animação por monstro (idle breathing, ataque, dano) — pode ser CSS keyframes simples sobre PNG

## Fase 2 — Cartas Ilustradas (segundo maior impacto)

Hoje cartas são caixas coloridas com texto. Clash Royale tem moldura ornada + arte + custo destacado.

- Template de moldura por raridade (comum → lendário): borda metálica com gemas, brilho animado em lendários
- Ilustração central por arquetipo de carta (ataque, defesa, cura, swarm, evolução, poder)
- Badge de custo de energia no canto (círculo gota d'água estilo Clash)
- Hover/seleção: lift 3D + brilho holográfico passando

## Fase 3 — Lobby Cinemático

Transformar o lobby principal em uma "vitrine" do jogo.

- **Background parallax** em camadas (céu/montanhas/névoa/chão) com leve movimento ao tilt do device
- **Personagem central animado**: monstro favorito do jogador em pose hero, breathing idle, reage a clique
- **Botão JOGAR gigante** estilo Brawl (vermelho/dourado, pulse animado, ícone de espada)
- Cards de modo (PvP / Solo / Eventos) tipo "menu radial" ou carrossel horizontal
- Partículas ambient (fagulhas douradas subindo, poeira)
- Trilha de fundo (opt-in via prefs já existentes)

## Fase 4 — Game Feel ("Juice")

Pequenos detalhes que fazem o jogo "sentir caro":

- **Screen shake** em hits críticos e ultimates
- **Números flutuantes** de dano grandes, com outline preto, escala bouncy, cor por tipo
- **Squash & stretch** ao jogar carta (encolhe e estica antes de voar pro alvo)
- **Particle bursts** em combos, vitórias, level up (confetti dourado)
- **Haptic feedback** (já tem `haptic.ts`) em todos os botões principais
- **Transições de tela** com wipe/iris (não fade simples)
- Botões com profundidade 3D real: sombra inferior de 4-6px que "afunda" no press

## Fase 5 — Sistema de Progressão Visível (retenção comercial)

Brawl/Clash viciam pelo loop visual de progressão. Componentes que faltam ou estão fracos:

- **Caixas/Baús** animadas abrindo com luz dourada explodindo (recompensa diária, vitória)
- **Barra de troféus** estilo Brawl com ticks de liga e meta da próxima
- **Tela de level-up fullscreen** com fanfarra (não só toast)
- **Showcase de novo monstro desbloqueado**: tela dedicada estilo "NOVO BRAWLER" com câmera orbitando

## Recomendação de execução

Sugiro começarmos pela **Fase 1 (mascotes ilustrados)** porque é o que mais separa visualmente o jogo dos competidores. Posso gerar as 10 ilustrações em uma única rodada usando o gerador premium, criar um componente `<MonsterIllustration>` que substitui o emoji em todas as telas, e adicionar a aura por raridade.

Depois disso, **Fase 4 (juice)** dá um retorno enorme por ser mudança de código pura, sem assets.

## Detalhes técnicos

- Assets em `src/assets/monsters/<key>.png` — importados estaticamente para cache
- Novo componente `MonsterIllustration` com props `monster`, `size`, `rarity`, `animated` substituindo os spots de `{MONSTROS[x].emoji}`
- Novo módulo `src/game/juice.ts` com helpers `screenShake()`, `floatingNumber()`, `particleBurst()`
- Novo componente `<CardFrame rarity="lendario">` envolvendo `<Carta>` com moldura SVG
- Lobby parallax via `transform: translate3d` nos `useEffect` ouvindo `deviceorientation`
- Manter design tokens existentes em `styles.ts` — só adicionar `--gradient-hero`, `--shadow-3d-button`

## Confirme o caminho

Quer que eu siga com a **Fase 1 (ilustrações de monstros) + Fase 4 (juice)** como primeiro entregável? Ou prefere outra ordem (ex: começar pelas cartas ilustradas, ou pelo lobby cinemático)?
