import type { HudSnapshot } from "../engine/types";

export default function GameOverOverlay({
  snap,
  onRestart,
}: {
  snap: HudSnapshot;
  onRestart: () => void;
}) {
  const isRecord = snap.score >= snap.highscore && snap.score > 0;
  return (
    <div className="capy-overlay" role="dialog" aria-modal="true" aria-label="Fim de jogo">
      <div className="capy-overlay__title">FIM DE JOGO</div>
      <div className="capy-overlay__score">
        Pontuação: <b>{snap.score.toLocaleString("pt-BR")}</b>
      </div>
      <div className="capy-overlay__record">
        {isRecord ? "🏆 Novo recorde!" : `Recorde: ${snap.highscore.toLocaleString("pt-BR")}`}
      </div>
      <button
        type="button"
        className="capy-overlay__btn"
        onClick={onRestart}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Jogar de novo
      </button>
      <div className="capy-overlay__hint">ou toque na tela / pressione Enter</div>
    </div>
  );
}
