import React from "react";
import { PODERES } from "@/game/data";
import { aplicarBonusSwarms, type Jogador } from "@/game/engine";
import { hpBarColor, MONSTER_GLOW } from "@/game/styles";
import SwarmBadge from "./SwarmBadge";

interface MonstroProps {
  jog: Jogador;
  inimigo?: boolean;
}

export default function MonstroDisplay({ jog, inimigo }: MonstroProps) {
  const m = jog.monstro;
  const mc = MONSTER_GLOW[m.id] || MONSTER_GLOW.panther;
  const pw = m.poder ? PODERES[m.poder] : null;
  const pct = Math.max(0, (jog.hp / jog.maxHp) * 100);
  const hpC = hpBarColor(pct);
  const fx = aplicarBonusSwarms(jog);
  const atkFinal = m.atk + fx.atkBonus;
  const defFinal = m.def + jog.defAtiva + fx.defBonus;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: inimigo ? "row-reverse" : "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: inimigo ? 68 : 84,
          height: inimigo ? 68 : 84,
          borderRadius: 20,
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,.08), transparent 28%), linear-gradient(145deg, #0d1830, #132646 52%, #0b1122)",
          border: `1px solid ${mc.g}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: inimigo ? 34 : 42,
          boxShadow: `0 0 0 1px rgba(255,255,255,.03), 0 0 22px ${mc.g}44, inset 0 1px 0 rgba(255,255,255,.06)`,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,.11), transparent 50%)",
          }}
        />
        <span
          style={{
            position: "relative",
            zIndex: 1,
            filter: `drop-shadow(0 0 8px ${mc.g})`,
          }}
        >
          {m.emoji}
        </span>

        {m.nivel > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: pw?.cor || "#7c3aed",
              borderTopLeftRadius: 10,
              padding: "3px 7px",
              fontSize: 9,
              fontFamily: "Oswald, sans-serif",
              color: "#fff",
              fontWeight: 700,
              boxShadow: "0 0 12px rgba(0,0,0,.25)",
            }}
          >
            Lv{m.nivel}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 5,
            flexDirection: inimigo ? "row-reverse" : "row",
          }}
        >
          <span
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: inimigo ? 16 : 19,
              color: mc.g,
              letterSpacing: 1,
              textShadow: `0 0 12px ${mc.g}`,
            }}
          >
            {m.nome}
          </span>
          {pw && <span style={{ fontSize: 12 }}>{pw.emoji}</span>}
          {jog.imune && <span style={{ fontSize: 12 }}>💎</span>}
          {jog.dodgeOnce && <span style={{ fontSize: 12 }}>👋</span>}
        </div>

        {/* HP Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 8, fontFamily: "Oswald, sans-serif", color: "#91a0bd", width: 18 }}>HP</span>
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,.05)",
              borderRadius: 999,
              height: 10,
              border: "1px solid rgba(255,255,255,.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${hpC}aa, ${hpC})`,
                transition: "width .45s ease",
                borderRadius: 999,
                boxShadow: `0 0 10px ${hpC}`,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 10,
              fontFamily: "Oswald, sans-serif",
              color: "#e8eefc",
              minWidth: 42,
              textAlign: "right" as const,
            }}
          >
            {jog.hp}/{jog.maxHp}
          </span>
        </div>

        {/* ATK / DEF */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 5,
            flexDirection: inimigo ? "row-reverse" : "row",
          }}
        >
          <span style={{ fontSize: 10.5, color: "#ff7961", fontFamily: "Nunito, sans-serif", fontWeight: 800 }}>
            ⚔️ {atkFinal}
          </span>
          <span style={{ fontSize: 10.5, color: "#82b1ff", fontFamily: "Nunito, sans-serif", fontWeight: 800 }}>
            🛡️ {defFinal}
          </span>
          {jog.dobra && (
            <span style={{ fontSize: 10.5, color: "#ffd54f", fontWeight: 800 }}>✖️ ×2</span>
          )}
        </div>

        {/* Swarms */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 6,
            flexWrap: "wrap",
            flexDirection: inimigo ? "row-reverse" : "row",
          }}
        >
          {jog.swarms.map((s, i) =>
            s ? <SwarmBadge key={s.id + i} swarm={s} /> : <SwarmBadge key={`empty-${i}`} empty />
          )}
        </div>
      </div>
    </div>
  );
}
