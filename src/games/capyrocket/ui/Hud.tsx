import type { HudSnapshot } from "../engine/types";
import { LIFE_MAX } from "../engine/constants";

export default function Hud({ snap }: { snap: HudSnapshot }) {
  return (
    <div className="capy-hud">
      <div className="capy-hud__box">
        <div className="capy-hud__label">Pontos</div>
        <div className="capy-hud__value">{snap.score.toLocaleString("pt-BR")}</div>
      </div>

      <div className="capy-hud__box" style={{ textAlign: "center" }}>
        <div className="capy-hud__label">{snap.bossHp > 0 ? "⚠ Chefe" : "Onda"}</div>
        <div className="capy-hud__value">{snap.bossHp > 0 ? "BOSS" : snap.wave}</div>
      </div>

      <div className="capy-hud__box" style={{ textAlign: "right" }}>
        <div className="capy-hud__label">Vidas</div>
        <div className="capy-hud__lives">
          {"❤".repeat(Math.max(0, Math.min(LIFE_MAX, snap.lives)))}
        </div>
      </div>

      <div className="capy-hud__weapon">
        🔫 {snap.weapon}
        {snap.ammo > 0 && <span className="capy-hud__ammo"> ×{snap.ammo}</span>}
        {snap.rescued > 0 && <span className="capy-hud__ammo"> · 🆘 {snap.rescued}</span>}
      </div>
    </div>
  );
}
