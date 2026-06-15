import type { HudSnapshot } from "../engine/types";
import { MAX_LIVES } from "../engine/constants";

export default function Hud({ snap }: { snap: HudSnapshot }) {
  return (
    <div className="capy-hud">
      <div className="capy-hud__box">
        <div className="capy-hud__label">Pontos</div>
        <div className="capy-hud__value">{snap.score.toLocaleString("pt-BR")}</div>
      </div>

      <div className="capy-hud__box" style={{ textAlign: "center" }}>
        <div className="capy-hud__label">Onda</div>
        <div className="capy-hud__value">{snap.wave}</div>
      </div>

      <div className="capy-hud__box" style={{ textAlign: "right" }}>
        <div className="capy-hud__label">Vidas</div>
        <div className="capy-hud__lives">
          {"❤".repeat(Math.max(0, snap.lives))}
          <span style={{ opacity: 0.25 }}>
            {"❤".repeat(Math.max(0, MAX_LIVES - snap.lives))}
          </span>
        </div>
      </div>
    </div>
  );
}
