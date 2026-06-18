import { useEffect, useRef, useState } from "react";
import { Game } from "./engine/Game";
import type { HudSnapshot } from "./engine/types";
import OrientationGate from "./ui/OrientationGate";
import Hud from "./ui/Hud";
import TapLayer from "./ui/TapLayer";
import GameOverOverlay from "./ui/GameOverOverlay";
import CharacterSelect from "./ui/CharacterSelect";

const INITIAL_SNAP: HudSnapshot = {
  score: 0,
  lives: 3,
  wave: 1,
  phase: "playing",
  highscore: 0,
  bossHp: 0,
  bossName: "",
  weapon: "Pistola",
  ammo: 0,
  charName: "",
  rescued: 0,
};

export default function CapiRocketApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [snap, setSnap] = useState<HudSnapshot>(INITIAL_SNAP);
  const [charId, setCharId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // O jogo só é criado depois que um herói é escolhido.
  useEffect(() => {
    if (!charId || !canvasRef.current) return;
    const game = new Game(charId);
    gameRef.current = game;
    const unsub = game.subscribe(setSnap);
    game.mount(canvasRef.current);
    return () => {
      unsub();
      game.destroy();
      gameRef.current = null;
    };
  }, [charId]);

  const handleTap = () => {
    if (!started) setStarted(true);
    gameRef.current?.queueJump();
  };

  const backToSelect = () => {
    setStarted(false);
    setSnap(INITIAL_SNAP);
    setCharId(null);
  };

  return (
    <OrientationGate>
      <div className="capy-stage">
        <canvas ref={canvasRef} className="capy-canvas" />

        {!charId && (
          <CharacterSelect
            onSelect={(id) => {
              setStarted(false);
              setCharId(id);
            }}
          />
        )}

        {charId && (
          <>
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
                onChangeHero={backToSelect}
              />
            )}
          </>
        )}
      </div>
    </OrientationGate>
  );
}
