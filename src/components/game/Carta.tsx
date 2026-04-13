import React from "react";
import { cartaPaleta } from "@/game/styles";
import type { CartaData } from "@/game/data";

interface CartaProps {
  carta: CartaData;
  sel: boolean;
  onClick?: () => void;
  disabled?: boolean;
  angulo?: number;
}

export default function Carta({ carta, sel, onClick, disabled, angulo = 0 }: CartaProps) {
  const p = cartaPaleta(carta);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: 108,
        height: 158,
        borderRadius: 16,
        border: sel ? `2px solid #ffd54f` : `2px solid ${p.bc}`,
        background: "linear-gradient(180deg, rgba(18,16,34,.98), rgba(8,9,18,.98))",
        boxShadow: sel
          ? `0 0 0 1px #ffd54f, 0 14px 34px rgba(0,0,0,.45), 0 0 24px ${p.bc}55`
          : `0 10px 24px rgba(0,0,0,.38), 0 0 16px ${p.glow}`,
        cursor: disabled ? "default" : "pointer",
        transform: `rotate(${angulo}deg) translateY(${sel ? -34 : 0}px)`,
        transformOrigin: "bottom center",
        transition: "transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
        flexShrink: 0,
        userSelect: "none" as const,
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${p.t}, ${p.m})`,
          padding: "6px 8px 4px",
          borderBottom: `1px solid ${p.bc}55`,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(0,0,0,.32)",
            border: `1px solid ${p.bc}`,
            borderRadius: 999,
            padding: "2px 7px",
            fontSize: 7,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 0.8,
            textTransform: "uppercase" as const,
          }}
        >
          {p.badge}
        </div>

        <div
          style={{
            position: "absolute",
            right: 8,
            top: 6,
            fontFamily: "Oswald, sans-serif",
            fontSize: 12,
            color: "#fff",
            display: "flex",
            alignItems: "baseline",
            gap: 3,
          }}
        >
          <span style={{ fontSize: 8, opacity: 0.8 }}>
            {carta.tipo === "ataque" ? "DMG" : carta.tipo === "defesa" ? "DEF" : ""}
          </span>
          <span>
            {carta.tipo === "ataque" || carta.tipo === "defesa" ? carta.valor || "?" : ""}
          </span>
        </div>

        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 13,
            color: "#fff",
            letterSpacing: 0.9,
            lineHeight: 1.05,
            marginTop: 4,
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 2px 6px rgba(0,0,0,.4)",
          }}
        >
          {carta.nome}
        </div>
      </div>

      {/* Art area */}
      <div
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,.12), transparent 36%), linear-gradient(160deg, ${p.m}dd, ${p.t})`,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${p.bc}44`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,.16) 0%, transparent 60%)",
          }}
        />
        <span
          style={{
            fontSize: 28,
            filter: `drop-shadow(0 0 8px ${p.bc}88)`,
            position: "relative",
            zIndex: 1,
          }}
        >
          {carta.emoji}
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20,17,36,.95), rgba(10,11,22,.98))",
          borderBottom: `1px solid ${p.bc}33`,
          padding: "5px 7px",
          flex: 1,
        }}
      >
        {carta.esp && (
          <div style={{ fontSize: 8, fontWeight: 900, color: "#ffd54f", marginBottom: 2 }}>
            {carta.esp === "explode"
              ? "⚠️ EXPLODE"
              : carta.esp === "tudoOuNada"
              ? "🎲 TUDO OU NADA"
              : carta.esp === "esquiva"
              ? "👉 ESQUIVA"
              : ""}
          </div>
        )}
        <div style={{ fontSize: 8.3, color: "#dbe3ff", lineHeight: 1.28 }}>{carta.desc}</div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
          padding: "3px 7px 5px",
          borderTop: "1px solid rgba(255,255,255,.03)",
        }}
      >
        <div style={{ fontSize: 6.8, color: "#8b94a8", fontStyle: "italic", lineHeight: 1.2 }}>
          Beast Animation Cards • Lab Series
        </div>
      </div>
    </div>
  );
}
