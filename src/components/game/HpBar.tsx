import React from "react";
import { PODERES } from "@/game/data";
import { aplicarBonusSwarms, type Jogador } from "@/game/engine";
import { hpBarColor, MONSTER_GLOW } from "@/game/styles";

interface HpBarProps {
  jog: Jogador;
  inimigo?: boolean;
}

export default function HpBar({ jog, inimigo }: HpBarProps) {
  const m = jog.monstro;
  const mc = MONSTER_GLOW[m.id] || MONSTER_GLOW.panther;
  const pw = m.poder ? PODERES[m.poder] : null;
  const pct = Math.max(0, (jog.hp / jog.maxHp) * 100);
  const hpC = hpBarColor(pct);
  const fx = aplicarBonusSwarms(jog);
  const atkFinal = m.atk + fx.atkBonus;
  const defFinal = m.def + jog.defAtiva + fx.defBonus;

  const SWARM_COLORS = ["#4caf50", "#2196f3", "#9c27b0", "#ffc107", "#00e5ff"];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        background: "linear-gradient(180deg, rgba(10,17,34,.92), rgba(4,7,18,.95))",
        border: `1px solid ${mc.g}44`,
        borderRadius: 12,
        padding: "0 10px",
        backdropFilter: "blur(8px)",
        boxShadow: `0 4px 16px rgba(0,0,0,.3), 0 0 12px ${mc.g}22`,
      }}
    >
      {/* Emoji avatar */}
      <span style={{ fontSize: 20, filter: `drop-shadow(0 0 4px ${mc.g})`, flexShrink: 0 }}>
        {m.emoji}
      </span>

      {/* Name + level */}
      <div style={{ flexShrink: 0, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 13,
            color: mc.g,
            letterSpacing: 0.8,
            textShadow: `0 0 8px ${mc.g}88`,
            whiteSpace: "nowrap",
          }}
        >
          {m.nome}
        </span>
        {m.nivel > 0 && (
          <span
            style={{
              marginLeft: 4,
              fontSize: 9,
              fontFamily: "Oswald, sans-serif",
              color: pw?.cor || "#7c3aed",
              fontWeight: 700,
            }}
          >
            Lv{m.nivel}
          </span>
        )}
      </div>

      {/* HP bar */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,.06)",
            borderRadius: 999,
            height: 8,
            border: "1px solid rgba(255,255,255,.06)",
            overflow: "hidden",
            minWidth: 40,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${hpC}aa, ${hpC})`,
              transition: "width .45s ease",
              borderRadius: 999,
              boxShadow: `0 0 6px ${hpC}`,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 9,
            fontFamily: "Oswald, sans-serif",
            color: "#e8eefc",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {jog.hp}/{jog.maxHp}
        </span>
      </div>

      {/* ATK / DEF badges */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: "#ff7961", fontFamily: "Nunito, sans-serif", fontWeight: 800 }}>
          ⚔{atkFinal}
        </span>
        <span style={{ fontSize: 9, color: "#82b1ff", fontFamily: "Nunito, sans-serif", fontWeight: 800 }}>
          🛡{defFinal}
        </span>
      </div>

      {/* Status icons */}
      {jog.imune && <span style={{ fontSize: 10 }}>💎</span>}
      {jog.dodgeOnce && <span style={{ fontSize: 10 }}>👋</span>}
      {jog.dobra && <span style={{ fontSize: 10 }}>✖️</span>}

      {/* Swarm dots */}
      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
        {jog.swarms.map((s, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: s ? (SWARM_COLORS[i % SWARM_COLORS.length]) : "rgba(255,255,255,.1)",
              border: s ? `1px solid ${SWARM_COLORS[i % SWARM_COLORS.length]}` : "1px solid rgba(255,255,255,.06)",
              boxShadow: s ? `0 0 4px ${SWARM_COLORS[i % SWARM_COLORS.length]}88` : "none",
            }}
            title={s ? s.nome : "Vazio"}
          />
        ))}
      </div>
    </div>
  );
}
