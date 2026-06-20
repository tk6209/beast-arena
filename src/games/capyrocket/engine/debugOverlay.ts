import { PLAYER_SCREEN_X } from "./constants";
import type { GameState, InputState } from "./types";

/**
 * Overlay de debug: vetor de velocidade, vetor de mira e flags de input.
 * Desenhado no espaço virtual (mesmo transform do `draw`).
 */
export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  input: InputState,
): void {
  const p = state.player;
  const screenX = p.x - state.camX;
  const screenY = p.y;
  const cx = screenX + p.w / 2;
  const cy = screenY + p.h / 2;

  ctx.save();

  // Hitbox.
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX, screenY, p.w, p.h);

  // Vetor velocidade (horizontal = moveX * 60, vertical = vy escalado).
  const vx = input.moveX * 60;
  const vy = p.vy * 0.05;
  drawArrow(ctx, cx, cy, cx + vx, cy + vy, "#7CFC00", "vel");

  // Vetor mira.
  let ax = input.aimX;
  let ay = input.aimY;
  if (ax === 0 && ay === 0) {
    ax = p.facingX;
    ay = 0;
  }
  const mag = Math.hypot(ax, ay) || 1;
  drawArrow(
    ctx,
    cx,
    cy,
    cx + (ax / mag) * 70,
    cy + (ay / mag) * 70,
    "#ff3b8a",
    "aim",
  );

  // Painel de flags.
  const lines = [
    `phase=${state.phase}`,
    `moveX=${input.moveX}  crouch=${input.crouch ? 1 : 0}`,
    `aim=(${input.aimX},${input.aimY})  facing=${p.facingX}`,
    `onGround=${p.onGround ? 1 : 0}  jumps=${p.jumpsUsed}/${p.maxJumps}`,
    `vy=${p.vy.toFixed(0)}  crouchT=${p.crouchT.toFixed(2)}  airT=${p.airT.toFixed(2)}`,
    `p.x=${p.x.toFixed(0)}  camX=${state.camX.toFixed(0)}  screenX=${screenX.toFixed(0)}`,
    `trail=${PLAYER_SCREEN_X}  jumpQ=${input.jumpQueued ? 1 : 0}`,
  ];
  ctx.font = "12px ui-monospace, Menlo, monospace";
  const pad = 6;
  const lh = 14;
  const w = 260;
  const h = lines.length * lh + pad * 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(8, 8, w, h);
  ctx.strokeStyle = "rgba(0,229,255,0.6)";
  ctx.strokeRect(8, 8, w, h);
  ctx.fillStyle = "#cfe9ff";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 8 + pad, 8 + pad + lh * (i + 1) - 3);
  }

  ctx.fillStyle = "rgba(0,229,255,0.7)";
  ctx.fillText("F3: toggle debug", 8 + pad, 8 + h + 14);

  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label: string,
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 6;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ah * Math.cos(ang - 0.5), y2 - ah * Math.sin(ang - 0.5));
  ctx.lineTo(x2 - ah * Math.cos(ang + 0.5), y2 - ah * Math.sin(ang + 0.5));
  ctx.closePath();
  ctx.fill();
  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.fillText(label, x2 + 4, y2 - 4);
}