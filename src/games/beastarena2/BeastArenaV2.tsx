import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MONSTER_ORDER } from "./engine/data";
import type { Dificuldade } from "./engine/types";
import { BattleScreen, type BattleStats } from "./ui/BattleScreen";
import { MenuScreen } from "./ui/MenuScreen";
import { loadProgress, registrarResultado, saveProgress, type Progress } from "./ui/progress";
import { ResultScreen } from "./ui/ResultScreen";
import "@fontsource/bangers/400.css";
import "./ba2.css";

type Tela = { t: "menu" } | { t: "batalha"; enemy: string; seed: number } | { t: "resultado"; enemy: string; stats: BattleStats };

function sortearRival(exceto: string, anterior?: string): string {
  const pool = MONSTER_ORDER.filter((m) => m !== exceto && m !== anterior);
  return pool[Math.floor(Math.random() * pool.length)];
}

const novaSeed = () => (Math.random() * 2 ** 31) >>> 0;

export default function BeastArenaV2() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [monstro, setMonstro] = useState(progress.ultimoMonstro);
  const [dificuldade, setDificuldade] = useState<Dificuldade>(progress.dificuldade);
  const [tela, setTela] = useState<Tela>({ t: "menu" });

  useEffect(() => {
    const p = { ...progress, ultimoMonstro: monstro, dificuldade };
    saveProgress(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monstro, dificuldade]);

  useEffect(() => {
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overscrollBehavior = prev;
    };
  }, []);

  const onEnd = useCallback(
    (stats: BattleStats) => {
      if (tela.t !== "batalha") return;
      const p = { ...registrarResultado(progress, monstro, stats.vitoria), ultimoMonstro: monstro, dificuldade };
      setProgress(p);
      saveProgress(p);
      setTela({ t: "resultado", enemy: tela.enemy, stats });
    },
    [dificuldade, monstro, progress, tela],
  );

  return (
    <div className="ba2">
      {tela.t === "menu" && (
        <MenuScreen
          selecionado={monstro}
          dificuldade={dificuldade}
          progress={progress}
          onSelect={setMonstro}
          onDificuldade={setDificuldade}
          onPlay={() => setTela({ t: "batalha", enemy: sortearRival(monstro), seed: novaSeed() })}
          onHub={() => navigate("/")}
        />
      )}
      {tela.t === "batalha" && (
        <BattleScreen
          key={tela.seed}
          player={monstro}
          enemy={tela.enemy}
          dificuldade={dificuldade}
          seed={tela.seed}
          onEnd={onEnd}
          onExit={() => setTela({ t: "menu" })}
        />
      )}
      {tela.t === "resultado" && (
        <ResultScreen
          stats={tela.stats}
          player={monstro}
          enemy={tela.enemy}
          sequencia={progress.sequencia}
          onRematch={() =>
            setTela({ t: "batalha", enemy: tela.stats.vitoria ? sortearRival(monstro, tela.enemy) : tela.enemy, seed: novaSeed() })
          }
          onMenu={() => setTela({ t: "menu" })}
        />
      )}
    </div>
  );
}
