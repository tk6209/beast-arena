import { useEffect, useRef } from "react";
import { MONSTER_ART } from "../assets";
import { CARDS, ELEMENTO_INFO, FORTE_CONTRA, MONSTER_ORDER, MONSTERS } from "../engine/data";
import { HP_GLOBAL } from "../engine/engine";
import type { Dificuldade, Elemento } from "../engine/types";
import { sfx, unlockAudio } from "../sfx";
import type { Progress } from "./progress";
import { CardView } from "./CardView";

interface Props {
  selecionado: string;
  dificuldade: Dificuldade;
  progress: Progress;
  onSelect: (id: string) => void;
  onDificuldade: (d: Dificuldade) => void;
  onPlay: () => void;
  onHub: () => void;
}

const DIFS: { id: Dificuldade; nome: string }[] = [
  { id: "facil", nome: "Fácil" },
  { id: "normal", nome: "Normal" },
  { id: "dificil", nome: "Difícil" },
];

export function MenuScreen({ selecionado, dificuldade, progress, onSelect, onDificuldade, onPlay, onHub }: Props) {
  const m = MONSTERS[selecionado];
  const el = ELEMENTO_INFO[m.elemento];
  const sig = CARDS[m.assinatura];
  const rosterRef = useRef<HTMLDivElement>(null);
  const forte = FORTE_CONTRA[m.elemento];
  const fraco = (Object.keys(FORTE_CONTRA) as Elemento[]).filter((k) => FORTE_CONTRA[k].includes(m.elemento));
  const maxHp = Math.max(...MONSTER_ORDER.map((id) => MONSTERS[id].hp));
  const wins = progress.porMonstro[selecionado] ?? 0;

  useEffect(() => {
    // Scroll only the roster strip; scrollIntoView would also shift the page on iOS.
    const strip = rosterRef.current;
    const node = strip?.querySelector<HTMLElement>(`[data-id="${selecionado}"]`);
    if (strip && node) strip.scrollTo({ left: node.offsetLeft - strip.clientWidth / 2 + node.clientWidth / 2, behavior: "smooth" });
  }, [selecionado]);

  return (
    <div className="ba2-menu" style={{ ["--c" as string]: m.cor, ["--c2" as string]: m.cor2 }}>
      <div className="ba2-menu-bg" />
      <div className="ba2-menu-top">
        <button className="ba2-link" onClick={onHub}>
          ← Capynite
        </button>
        <div className="ba2-logo">
          BEAST<span>ARENA</span>
          <em>V2</em>
        </div>
        <div className="ba2-record" title="Vitórias / derrotas">
          🏆 {progress.vitorias} · 💀 {progress.derrotas}
        </div>
      </div>

      <div className="ba2-menu-hero">
        <div className="ba2-hero-art" key={selecionado}>
          <div className="ba2-hero-glow" />
          <img src={MONSTER_ART[selecionado]} alt={m.nome} draggable={false} />
          <div className="ba2-hero-pad" />
        </div>
        <div className="ba2-hero-info">
          <div className="ba2-hero-el" style={{ background: el.cor }}>
            {el.icone} {el.nome}
          </div>
          <div className="ba2-hero-name">{m.nome}</div>
          <div className="ba2-hero-title">{m.titulo}</div>
          <div className="ba2-stat">
            <span>VIDA</span>
            <div className="ba2-stat-bar">
              <i style={{ width: `${(m.hp / maxHp) * 100}%` }} />
            </div>
            <b>{Math.round(m.hp * HP_GLOBAL)}</b>
          </div>
          <div className="ba2-stat">
            <span>FORÇA</span>
            <div className="ba2-stat-bar">
              <i style={{ width: `${((m.forca - 0.85) / 0.3) * 100}%` }} />
            </div>
            <b>{Math.round(m.forca * 100)}</b>
          </div>
          <div className="ba2-hero-pass">
            <b>{m.passivaNome}</b> {m.passivaTexto}
          </div>
          <div className="ba2-hero-matchup">
            <span>
              Forte: {forte.map((x) => ELEMENTO_INFO[x].icone).join(" ")}
            </span>
            <span>
              Fraco: {fraco.map((x) => ELEMENTO_INFO[x].icone).join(" ")}
            </span>
            {wins > 0 && <span>🏆 {wins}</span>}
          </div>
        </div>
        <div className="ba2-hero-sig">
          <div className="ba2-hero-sig-label">Carta especial</div>
          <CardView card={sig} />
        </div>
      </div>

      <div className="ba2-roster" ref={rosterRef}>
        {MONSTER_ORDER.map((id) => {
          const mm = MONSTERS[id];
          return (
            <button
              key={id}
              data-id={id}
              className={`ba2-roster-item ${id === selecionado ? "ba2-roster-on" : ""}`}
              style={{ ["--c" as string]: mm.cor }}
              onClick={() => {
                unlockAudio();
                sfx.click();
                onSelect(id);
              }}
            >
              <img src={MONSTER_ART[id]} alt="" draggable={false} />
              <span>{mm.nome}</span>
              <i style={{ background: ELEMENTO_INFO[mm.elemento].cor }}>{ELEMENTO_INFO[mm.elemento].icone}</i>
            </button>
          );
        })}
      </div>

      <div className="ba2-menu-bottom">
        <div className="ba2-seg" role="radiogroup" aria-label="Dificuldade">
          {DIFS.map((d) => (
            <button
              key={d.id}
              role="radio"
              aria-checked={dificuldade === d.id}
              className={dificuldade === d.id ? "ba2-seg-on" : ""}
              onClick={() => {
                sfx.click();
                onDificuldade(d.id);
              }}
            >
              {d.nome}
            </button>
          ))}
        </div>
        <button
          className="ba2-play"
          onClick={() => {
            unlockAudio();
            sfx.slam();
            onPlay();
          }}
        >
          BATALHAR!
        </button>
      </div>
    </div>
  );
}
