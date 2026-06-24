# CAPI WARS — Especificação viva (spec-driven)

Este documento define os **invariantes** observáveis do jogo. Cada item tem um
ID e é **travado por um teste** em `__tests__/specs.test.ts` (o "harness").
Fluxo sustentável: ao mudar comportamento, **primeiro** atualize/adicione o
spec aqui e o teste correspondente; depois implemente até o harness passar.

Geometria única: `engine/geometry.ts` é a **fonte de verdade** de hitbox,
âncora do sprite e ponta da arma. Sprite (`capySprite.ts`), colisões
(`Game.ts`) e tiros (`bullets.ts`) derivam dela — não duplique números.

## Render / Geometria (GEO)

- **GEO-1 — Tiros saem da arma.** A origem do tiro (`muzzlePoint`) fica à
  FRENTE do centro do herói (lado para onde olha) e na altura do peito do
  sprite — nunca colada ao chão. `center < muzzle.x` (olhando à direita) e
  `spriteTop < muzzle.y < GROUND_Y − 30`.
- **GEO-2 — Sprite e mundo coerentes.** O herói é desenhado na posição REAL
  `p.x − camX` (igual a inimigos/balas/minas). A ponta do cano em tela
  (`muzzle.x − camX`) fica à frente do centro desenhado por exatamente
  `MUZZLE_FORWARD`. (Sem isto, o tiro "sai do canto da tela".)

## Colisão (COL)

- **COL-1 — Hitbox de dano é menor que o corpo visível.** `playerHitbox` é um
  inset estrito do retângulo do jogador (recuo lateral e no topo > 0), para
  que raspões não contem como dano.
- **COL-2 — Sem dano ao passar raspando.** Uma mina encostada na borda lateral
  do herói, mas fora do inset, **não** colide com `playerHitbox`.
- **COL-3 — Pular limpa a mina.** Com o herói no ar acima da mina, a hitbox de
  dano não sobrepõe a mina mesmo com sobreposição horizontal.
- **COL-4 — Coleta é generosa.** Estrelas/caixas/reféns usam `playerPickupBox`
  (corpo cheio), maior que a hitbox de dano.
- **COL-5 — Mina perdoadora.** A mina só machuca pelo NÚCLEO (`hazardHitbox`):
  recuado nas laterais e só na parte de baixo. Um pulinho curto já limpa, e
  passar de lado não causa dano — só toca quem realmente está em cima dela.

## Movimento (MOV)

- **MOV-1 — Herói acompanha a câmera.** Sem input, a posição em TELA do herói
  (`p.x − camX`) permanece constante (ele não é empurrado para a borda).

## Armas (WPN)

- **WPN-1 — Bala nasce no cano.** A bala disparada surge em `muzzlePoint`
  (mesma origem do flash do cano).
