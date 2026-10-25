import { useEffect, useRef, useState } from "react";
import { MONSTER_ART } from "../assets";
import { ELEMENTO_INFO, MONSTERS } from "../engine/data";
import type { Side } from "../engine/types";

export interface FighterView {
  monsterId: string;
  hp: number;
  hpMax: number;
  escudo: number;
  espinhos: number;
  esquiva: number;
  queimar: number;
  veneno: number;
  congelado: number;
  furia: number;
  evolucao: number;
  energia: number;
  energiaMax: number;
  mao: number;
  deck: number;
}

function HpBar({ hp, max, escudo }: { hp: number; max: number; escudo: number }) {
  const pct = Math.max(0, Math.min(1, hp / max));
  const [chip, setChip] = useState(pct);
  const [hit, setHit] = useState(false);
  const prev = useRef(pct);
  useEffect(() => {
    if (pct < prev.current) {
      setHit(true);
      const t1 = setTimeout(() => setHit(false), 180);
      const t2 = setTimeout(() => setChip(pct), 450);
      prev.current = pct;
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    prev.current = pct;
    setChip(pct);
  }, [pct]);
  const color = pct > 0.5 ? "var(--ba2-hp-hi)" : pct > 0.25 ? "var(--ba2-hp-mid)" : "var(--ba2-hp-lo)";
  const shieldPct = Math.min(1, escudo / max);
  return (
    <div className={`ba2-hp ${hit ? "ba2-hp-hit" : ""} ${pct <= 0.25 ? "ba2-hp-danger" : ""}`}>
      <div className="ba2-hp-chip" style={{ width: `${Math.max(chip, pct) * 100}%` }} />
      <div className="ba2-hp-fill" style={{ width: `${pct * 100}%`, background: color }} />
      {escudo > 0 && <div className="ba2-hp-shield" style={{ width: `${Math.min(100, shieldPct * 100)}%` }} />}
      <div className="ba2-hp-num">
        {Math.max(0, hp)}
        <small>/{max}</small>
      </div>
    </div>
  );
}

function Badges({ f }: { f: FighterView }) {
  const list: [string, string, number, string][] = [];
  if (f.escudo > 0) list.push(["esc", "🛡️", f.escudo, "Escudo: absorve dano até o seu próximo turno"]);
  if (f.espinhos > 0) list.push(["esp", "🌵", f.espinhos, "Espinhos: quem te bater toma dano"]);
  if (f.esquiva > 0) list.push(["esq", "💨", f.esquiva, "Esquiva: desvia do próximo golpe"]);
  if (f.furia > 0) list.push(["fur", "💢", f.furia, "Fúria: próximo ataque mais forte"]);
  if (f.evolucao > 0) list.push(["evo", "⭐", f.evolucao, "Evolução: todos os ataques mais fortes"]);
  if (f.queimar > 0) list.push(["que", "🔥", f.queimar, "Queimadura: 3 de dano por turno"]);
  if (f.veneno > 0) list.push(["ven", "☠️", f.veneno, "Veneno: dano no início do turno, diminui 1"]);
  if (f.congelado > 0) list.push(["con", "❄️", f.congelado, "Congelado: menos energia no próximo turno"]);
  return (
    <div className="ba2-badges">
      {list.map(([k, icon, v, title]) => (
        <span key={k} className={`ba2-badge ba2-badge-${k}`} title={title}>
          {icon}
          <b>{v}</b>
        </span>
      ))}
    </div>
  );
}

export function FighterPanel({ side, f, ativo, onInfo }: { side: Side; f: FighterView; ativo: boolean; onInfo?: () => void }) {
  const def = MONSTERS[f.monsterId];
  const el = ELEMENTO_INFO[def.elemento];
  return (
    <div className={`ba2-panel ba2-panel-${side} ${ativo ? "ba2-panel-on" : ""}`} style={{ ["--c" as string]: def.cor }}>
      <button className="ba2-panel-face" onClick={onInfo} aria-label={`Ver ${def.nome}`}>
        <img src={MONSTER_ART[f.monsterId]} alt="" draggable={false} />
        <span className="ba2-panel-el" style={{ background: el.cor }}>
          {el.icone}
        </span>
      </button>
      <div className="ba2-panel-main">
        <div className="ba2-panel-top">
          <span className="ba2-panel-name">{side === "enemy" ? `${def.nome}` : def.nome}</span>
          {side === "enemy" && (
            <span className="ba2-panel-hand" title="Cartas na mão do inimigo">
              🂠 {f.mao}
            </span>
          )}
        </div>
        <HpBar hp={f.hp} max={f.hpMax} escudo={f.escudo} />
        <Badges f={f} />
      </div>
    </div>
  );
}

export function EnergyOrbs({ energia, max }: { energia: number; max: number }) {
  const slots = Math.max(max, energia);
  return (
    <div className="ba2-energy" aria-label={`Energia ${energia} de ${max}`}>
      <div className="ba2-energy-num">
        {energia}
        <small>/{max}</small>
      </div>
      <div className="ba2-energy-orbs">
        {Array.from({ length: slots }, (_, i) => (
          <span key={i} className={`ba2-orb ${i < energia ? "ba2-orb-on" : ""}`} />
        ))}
      </div>
    </div>
  );
}
