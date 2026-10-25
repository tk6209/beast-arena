import { MONSTER_ART } from "../assets";
import { MONSTERS } from "../engine/data";
import type { BattleStats } from "./BattleScreen";

interface Props {
  stats: BattleStats;
  player: string;
  enemy: string;
  sequencia: number;
  onRematch: () => void;
  onMenu: () => void;
}

export function ResultScreen({ stats, player, enemy, sequencia, onRematch, onMenu }: Props) {
  const win = stats.vitoria;
  const hero = win ? player : enemy;
  const m = MONSTERS[hero];
  const estrelas = win ? 1 + (stats.hpRestante >= MONSTERS[player].hp * 0.5 ? 1 : 0) + (stats.turnos <= 6 ? 1 : 0) : 0;
  return (
    <div className={`ba2-result ${win ? "ba2-result-win" : "ba2-result-lose"}`} style={{ ["--c" as string]: m.cor }}>
      <div className="ba2-result-rays" />
      <div className="ba2-result-title">{win ? "VITÓRIA!" : "DERROTA"}</div>
      {win && (
        <div className="ba2-stars">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < estrelas ? "ba2-star-on" : ""} style={{ animationDelay: `${0.35 + i * 0.25}s` }}>
              ★
            </span>
          ))}
        </div>
      )}
      <img className="ba2-result-img" src={MONSTER_ART[hero]} alt="" />
      <div className="ba2-result-sub">{win ? `${MONSTERS[player].nome} venceu ${MONSTERS[enemy].nome}!` : `${MONSTERS[enemy].nome} venceu desta vez…`}</div>
      <div className="ba2-result-stats">
        <div>
          <b>{stats.danoCausado}</b>
          <span>dano total</span>
        </div>
        <div>
          <b>{stats.maiorGolpe}</b>
          <span>maior golpe</span>
        </div>
        <div>
          <b>{stats.cartas}</b>
          <span>cartas</span>
        </div>
        <div>
          <b>{stats.turnos}</b>
          <span>turnos</span>
        </div>
      </div>
      {win && sequencia > 1 && <div className="ba2-streak">🔥 {sequencia} vitórias seguidas!</div>}
      <div className="ba2-result-actions">
        <button className="ba2-btn ba2-btn-big" onClick={onRematch}>
          {win ? "PRÓXIMA LUTA" : "REVANCHE"}
        </button>
        <button className="ba2-btn ba2-btn-ghost" onClick={onMenu}>
          Trocar monstro
        </button>
      </div>
    </div>
  );
}
