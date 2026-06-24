import { describe, it, expect } from "vitest";
import { Game } from "../engine/Game";
import { aabbOverlap } from "../engine/collision";
import { GROUND_Y } from "../engine/constants";
import {
  HIT_INSET_TOP,
  HIT_INSET_X,
  MUZZLE_FORWARD,
  hazardHitbox,
  muzzlePoint,
  playerHitbox,
  playerPickupBox,
  spriteTopY,
} from "../engine/geometry";
import { makeHazard } from "../engine/entities";
import { updateBullets } from "../engine/bullets";
import { createInitialState } from "../engine/state";

// Harness do spec-driven development. Cada bloco trava um invariante de SPEC.md.

describe("GEO — geometria do herói", () => {
  it("GEO-1: o tiro sai da arma (à frente e na altura do peito, não no chão)", () => {
    const p = createInitialState().player; // de pé, olhando à direita
    const center = p.x + p.w / 2;
    const m = muzzlePoint(p);
    expect(m.x).toBeGreaterThan(center); // à frente
    expect(m.y).toBeGreaterThan(spriteTopY(p)); // abaixo do topo do sprite
    expect(m.y).toBeLessThan(GROUND_Y - 30); // bem acima do chão (não "no fundo")
  });

  it("GEO-2: cano em tela fica à frente do centro desenhado por MUZZLE_FORWARD", () => {
    const p = createInitialState().player;
    const camX = 1234; // câmera arbitrária
    const drawnCenter = p.x - camX + p.w / 2;
    const muzzleScreenX = muzzlePoint(p).x - camX;
    expect(muzzleScreenX - drawnCenter).toBeCloseTo(MUZZLE_FORWARD, 5);
  });
});

describe("COL — colisão", () => {
  it("COL-1: hitbox de dano é um inset estrito do corpo", () => {
    const p = createInitialState().player;
    const hb = playerHitbox(p);
    expect(HIT_INSET_X).toBeGreaterThan(0);
    expect(HIT_INSET_TOP).toBeGreaterThan(0);
    expect(hb.x).toBeGreaterThan(p.x);
    expect(hb.w).toBeLessThan(p.w);
    expect(hb.y).toBeGreaterThan(p.y);
    expect(hb.y + hb.h).toBeCloseTo(p.y + p.h, 5); // base nos pés
  });

  it("COL-2: passar raspando (mina na margem do inset) não causa dano", () => {
    const p = createInitialState().player;
    // Mina encostada à direita do corpo visível, mas dentro da margem do inset.
    const mine = makeHazard(p.x + p.w - HIT_INSET_X + 1);
    expect(aabbOverlap(playerPickupBox(p), mine)).toBe(true); // toca o corpo cheio
    expect(aabbOverlap(playerHitbox(p), mine)).toBe(false); // mas não a hitbox de dano
  });

  it("COL-3: pular limpa a mina (sem sobreposição vertical no ar)", () => {
    const p = createInitialState().player;
    const mine = makeHazard(p.x); // mesmo x → sobreposição horizontal garantida
    p.y -= 70; // no ar
    const hb = playerHitbox(p);
    expect(hb.y + hb.h).toBeLessThan(mine.y); // base do herói acima da mina
    expect(aabbOverlap(hb, mine)).toBe(false);
  });

  it("COL-5: um pulinho curto já limpa a mina (núcleo perdoador)", () => {
    const p = createInitialState().player;
    const mine = makeHazard(p.x); // mesmo x
    // No chão, em cima da mina → toca o núcleo (dano).
    expect(aabbOverlap(playerHitbox(p), hazardHitbox(mine))).toBe(true);
    // Pulinho curto de 22px → já limpa o núcleo (sem dano).
    p.y -= 22;
    expect(aabbOverlap(playerHitbox(p), hazardHitbox(mine))).toBe(false);
    // E o núcleo é menor que o desenho da mina.
    const core = hazardHitbox(mine);
    expect(core.w).toBeLessThan(mine.w);
    expect(core.y).toBeGreaterThan(mine.y);
  });

  it("COL-4: caixa de coleta é maior que a hitbox de dano", () => {
    const p = createInitialState().player;
    const hb = playerHitbox(p);
    const pb = playerPickupBox(p);
    expect(pb.w).toBeGreaterThan(hb.w);
    expect(pb.h).toBeGreaterThan(hb.h);
  });
});

describe("MOV — movimento", () => {
  it("MOV-1: sem input, o herói mantém a posição em tela (acompanha a câmera)", () => {
    const game = new Game() as unknown as {
      update: (dt: number) => void;
      state: { player: { x: number }; camX: number };
    };
    const screen0 = game.state.player.x - game.state.camX;
    for (let i = 0; i < 120; i++) game.update(1 / 60);
    const screen1 = game.state.player.x - game.state.camX;
    expect(Math.abs(screen1 - screen0)).toBeLessThan(2);
  });
});

describe("WPN — armas", () => {
  it("WPN-1: a bala nasce na ponta do cano (muzzlePoint)", () => {
    const s = createInitialState();
    s.fireCooldown = 0;
    const m = muzzlePoint(s.player);
    updateBullets(s, 1 / 60);
    expect(s.bullets.length).toBeGreaterThan(0);
    const b = s.bullets[0];
    expect(b.y).toBeCloseTo(m.y, 5); // origem vertical = cano (pellet único, vy=0)
    expect(Math.abs(b.x - m.x)).toBeLessThan(30); // origem horizontal ≈ cano (+ avanço de 1 frame)
  });
});
