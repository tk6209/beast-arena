import type { HudSnapshot } from "../engine/types";
import { VICTORY_STORY } from "../engine/story";

export default function VictoryOverlay({
  snap,
  onRestart,
  onChangeHero,
}: {
  snap: HudSnapshot;
  onRestart: () => void;
  onChangeHero?: () => void;
}) {
  return (
    <div className="capy-overlay" role="dialog" aria-modal="true" aria-label="Vitória">
      <div className="capy-overlay__title capy-overlay__title--win">{VICTORY_STORY.title}</div>
      <div className="capy-story__lines">
        {VICTORY_STORY.lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <div className="capy-overlay__score">
        Pontuação: <b>{snap.score.toLocaleString("pt-BR")}</b>
      </div>
      <div className="capy-overlay__record">Recorde: {snap.highscore.toLocaleString("pt-BR")}</div>
      <button
        type="button"
        className="capy-overlay__btn"
        onClick={onRestart}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Jogar de novo
      </button>
      {onChangeHero && (
        <button
          type="button"
          className="capy-overlay__btn capy-overlay__btn--ghost"
          onClick={onChangeHero}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Trocar herói
        </button>
      )}
    </div>
  );
}
