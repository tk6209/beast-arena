import { useEffect, useRef, useState } from "react";
import { Game } from "./engine/Game";
import type { HudSnapshot } from "./engine/types";
import OrientationGate from "./ui/OrientationGate";
import Hud from "./ui/Hud";
import DualControls from "./ui/DualControls";
import GameOverOverlay from "./ui/GameOverOverlay";
import VictoryOverlay from "./ui/VictoryOverlay";
import CharacterSelect from "./ui/CharacterSelect";
import StoryIntro from "./ui/StoryIntro";

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
  chapter: "O Corredor",
  chapterN: 1,
  canContinue: false,
  checkpointStage: 1,
};

export default function CapiRocketApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [snap, setSnap] = useState<HudSnapshot>(INITIAL_SNAP);
  const [charId, setCharId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [briefed, setBriefed] = useState(false);

  // O jogo só é criado depois que um herói é escolhido. Começa PAUSADO para o
  // briefing de história; o botão "Avançar" despausa.
  useEffect(() => {
    if (!charId || !canvasRef.current) return;
    const game = new Game(charId);
    gameRef.current = game;
    const unsub = game.subscribe(setSnap);
    game.mount(canvasRef.current);
    game.setPaused(true);
    return () => {
      unsub();
      game.destroy();
      gameRef.current = null;
    };
  }, [charId]);

  // Banner de capítulo: aparece por ~3s quando o capítulo muda (e ao começar).
  const [chapterBanner, setChapterBanner] = useState<string | null>(null);
  useEffect(() => {
    if (!briefed || snap.phase !== "playing") return;
    setChapterBanner(`FASE ${snap.chapterN} — ${snap.chapter}`);
    const t = setTimeout(() => setChapterBanner(null), 3200);
    return () => clearTimeout(t);
  }, [snap.chapterN, briefed, snap.chapter, snap.phase]);

  const backToSelect = () => {
    setStarted(false);
    setBriefed(false);
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
              setBriefed(false);
              setCharId(id);
            }}
          />
        )}

        {charId && !briefed && (
          <StoryIntro
            heroName={snap.charName}
            onStart={() => {
              setBriefed(true);
              gameRef.current?.setPaused(false);
            }}
          />
        )}

        {charId && briefed && (
          <>
            <Hud snap={snap} />

            {snap.phase === "playing" && (
              <DualControls
                onMove={(d) => {
                  if (!started) setStarted(true);
                  gameRef.current?.setMoveX(d);
                }}
                onCrouch={(c) => gameRef.current?.setCrouch(c)}
                onAim={(x, y) => gameRef.current?.setAim(x, y)}
                onJump={() => {
                  if (!started) setStarted(true);
                  gameRef.current?.queueJump();
                }}
              />
            )}

            {snap.phase === "playing" && !started && (
              <div className="capy-start-hint">◄ MOVER &nbsp;·&nbsp; MIRA ►</div>
            )}

            {snap.phase === "playing" && chapterBanner && (
              <div className="capy-chapter" key={snap.chapterN}>
                {chapterBanner}
              </div>
            )}

            {snap.phase === "victory" && (
              <VictoryOverlay
                snap={snap}
                onRestart={() => {
                  setStarted(true);
                  gameRef.current?.restart();
                }}
                onChangeHero={backToSelect}
              />
            )}

            {snap.phase === "gameover" && (
              <GameOverOverlay
                snap={snap}
                onRestart={() => {
                  setStarted(true);
                  gameRef.current?.restart();
                }}
                onContinue={() => {
                  setStarted(true);
                  gameRef.current?.continueFromCheckpoint();
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
