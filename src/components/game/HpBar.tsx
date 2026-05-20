import React, { useState, useEffect, useRef } from "react";
import { PODERES } from "@/game/data";
import { aplicarBonusSwarms, type Jogador } from "@/game/engine";
import { hpBarColor, MONSTER_GLOW } from "@/game/styles";
import MonsterAvatar from "@/components/game/MonsterAvatar";

interface HpBarProps {
  jog: Jogador;
  inimigo?: boolean;
  hit?: boolean;
}

export default function HpBar({ jog, inimigo, hit }: HpBarProps) {
  const m = jog.monstro;
  const mc = MONSTER_GLOW[m.id] || MONSTER_GLOW.panther;
  const pw = m.poder ? PODERES[m.poder] : null;
  const pct = Math.max(0, (jog.hp / jog.maxHp) * 100);
  const hpC = hpBarColor(pct);
  const fx = aplicarBonusSwarms(jog);
  const atkFinal = m.atk + fx.atkBonus;
  const defFinal = m.def + jog.defAtiva + fx.defBonus;
  const [showFlash, setShowFlash] = useState(false);
  const [particles, setParticles] = useState<{x:number;y:number;id:number}[]>([]);
  const pIdRef = useRef(0);

  useEffect(() => {
    if (hit) {
      setShowFlash(true);
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        x: Math.random() * 100, y: Math.random() * 100, id: ++pIdRef.current,
      }));
      setParticles(newParticles);
      setTimeout(() => setShowFlash(false), 400);
      setTimeout(() => setParticles([]), 800);
    }
  }, [hit]);

  const SWARM_COLORS = ["#4caf50", "#2196f3", "#9c27b0", "#ffc107", "#00e5ff"];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 40,
        background: "linear-gradient(160deg,rgba(16,10,6,.95),rgba(10,6,4,.98))",
        border: `1px solid ${showFlash ? "#ff1744" : mc.g + "44"}`,
        borderRadius: 12,
        padding: "0 10px",
        backdropFilter: "blur(8px)",
        boxShadow: showFlash
          ? `0 0 20px rgba(255,23,68,.6), 0 0 40px rgba(255,23,68,.3)`
          : `0 4px 16px rgba(0,0,0,.3), 0 0 12px ${mc.g}22`,
        transition: "border .2s, box-shadow .2s",
        overflow: "hidden",
      }}
    >
      {/* Monster avatar */}
      <MonsterAvatar monstroId={m.id} size={32} glow={mc.g} />

      {/* Name + level */}
      <div style={{ flexShrink: 0, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "'Bebas Neue','Barlow Condensed',cursive",
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
              fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
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
              background: pct <= 25
                ? `linear-gradient(90deg, #b71c1c, #ef4444)`
                : pct <= 50
                ? `linear-gradient(90deg, ${hpC}aa, ${hpC})`
                : `linear-gradient(90deg, ${hpC}aa, ${hpC})`,
              transition: "width .45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              borderRadius: 999,
              boxShadow: pct <= 25 ? "0 0 10px #ef4444, 0 0 20px #ef444466" : `0 0 6px ${hpC}`,
              // Pulse animation when critical
              animation: pct <= 20 ? "hpCritical 1s ease-in-out infinite" : "none",
            }}
          />
        </div>
        <span
          style={{
            fontSize: pct <= 25 ? 10 : 9,
            fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
            color: pct <= 25 ? "#ef4444" : "#e8d8c4",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontWeight: pct <= 25 ? 700 : 400,
            textShadow: pct <= 25 ? "0 0 8px #ef4444" : "none",
            transition: "color .3s, font-size .3s",
          }}
        >
          {jog.hp}/{jog.maxHp}
        </span>
      </div>

      {/* ATK / DEF badges */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: "#ff7961", fontFamily: "'Rajdhani','Barlow Condensed',sans-serif", fontWeight: 800 }}>
          ⚔{atkFinal}
        </span>
        <span style={{ fontSize: 9, color: "#82b1ff", fontFamily: "'Rajdhani','Barlow Condensed',sans-serif", fontWeight: 800 }}>
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
              width: s ? 10 : 8,
              height: s ? 10 : 8,
              borderRadius: 999,
              background: s ? (SWARM_COLORS[i % SWARM_COLORS.length]) : "rgba(255,255,255,.1)",
              border: s ? `1px solid ${SWARM_COLORS[i % SWARM_COLORS.length]}` : "1px solid rgba(255,255,255,.06)",
              boxShadow: s ? `0 0 6px ${SWARM_COLORS[i % SWARM_COLORS.length]}` : "none",
              transition: "all .3s ease",
            }}
            title={s ? `${s.emoji} ${s.nome}: ${s.desc || s.efeito}` : "Slot Swarm vazio"}
          />
        ))}
      </div>

      {/* Hit flash overlay */}
      {showFlash && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none",
          background: "rgba(255,23,68,.25)",
          animation: "hitFlash .4s ease-out forwards",
        }} />
      )}

      {/* Hit particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          width: 4, height: 4, borderRadius: 999,
          background: "#ff1744",
          boxShadow: "0 0 6px #ff1744",
          pointerEvents: "none",
          animation: "hitParticle .6s ease-out forwards",
        }} />
      ))}

      <style>{`
        @keyframes hpCritical {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes hitFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes hitParticle {
          0% { opacity: 1; transform: scale(1) translate(0,0); }
          100% { opacity: 0; transform: scale(0.3) translate(${Math.random()>0.5?'':'-'}20px, ${Math.random()>0.5?'':'-'}15px); }
        }
      `}</style>
    </div>
  );
}
