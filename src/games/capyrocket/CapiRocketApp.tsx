import { useEffect, useRef, useState } from "react";
import { Game } from "./engine/Game";
import type { HudSnapshot } from "./engine/types";
import OrientationGate from "./ui/OrientationGate";
import Hud from "./ui/Hud";
import TapLayer from "./ui/TapLayer";
import GameOverOverlay from "./ui/GameOverOverlay";

const INITIAL_SNAP: HudSnapshot = {
  score: 0,
  lives: 3,
  wave: 1,
  phase: "playing",
  highscore: 0,
};

export default function CapiRocketApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [snap, setSnap] = useState<HudSnapshot>(INITIAL_SNAP);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new Game();
    gameRef.current = game;
    const unsub = game.subscribe(setSnap);
    game.mount(canvasRef.current);
    return () => {
      unsub();
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const handleTap = () => {
    if (!started) setStarted(true);
    gameRef.current?.queueJump();
  };

  return (
    <OrientationGate>
      <div className="capy-stage">
        <canvas ref={canvasRef} className="capy-canvas" />
        <Hud snap={snap} />

        {snap.phase === "playing" && <TapLayer onTap={handleTap} />}

        {snap.phase === "playing" && !started && (
          <div className="capy-start-hint">Toque para PULAR</div>
        )}

        {snap.phase === "gameover" && (
          <GameOverOverlay
            snap={snap}
            onRestart={() => {
              setStarted(true);
              gameRef.current?.restart();
            }}
          />
        )}
      </div>
    </OrientationGate>
  );
}
