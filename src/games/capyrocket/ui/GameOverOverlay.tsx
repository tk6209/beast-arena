import type { HudSnapshot } from "../engine/types";

export default function GameOverOverlay({
  snap,
  onRestart,
  onContinue,
  onChangeHero,
}: {
  snap: HudSnapshot;
  onRestart: () => void;
  onContinue?: () => void;
  onChangeHero?: () => void;
}) {
  const isRecord = snap.score >= snap.highscore && snap.score > 0;
  return (
    <div className="capy-overlay" role="dialog" aria-modal="true" aria-label="Fim de jogo">
      <div className="capy-overlay__title">FIM DE JOGO</div>
      {snap.charName && <div className="capy-overlay__record">com {snap.charName}</div>}
      <div className="capy-overlay__score">
        Pontuação: <b>{snap.score.toLocaleString("pt-BR")}</b>
      </div>
      <div className="capy-overlay__record">
        {isRecord ? "🏆 Novo recorde!" : `Recorde: ${snap.highscore.toLocaleString("pt-BR")}`}
      </div>
      {snap.canContinue && onContinue && (
        <button
          type="button"
          className="capy-overlay__btn"
          onClick={onContinue}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Continuar — Fase {snap.checkpointStage}
        </button>
      )}
      <button
        type="button"
        className={snap.canContinue ? "capy-overlay__btn capy-overlay__btn--ghost" : "capy-overlay__btn"}
        onClick={onRestart}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {snap.canContinue ? "Recomeçar do início" : "Jogar de novo"}
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
      <div className="capy-overlay__hint">ou toque na tela / pressione Enter</div>
    </div>
  );
}
