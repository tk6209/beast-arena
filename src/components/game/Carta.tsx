import React from "react";
import { cartaPaleta } from "@/game/styles";
import type { CartaData } from "@/game/data";

interface CartaProps {
  carta: CartaData;
  sel: boolean;
  onClick?: () => void;
  disabled?: boolean;
  angulo?: number;
  mini?: boolean;
}

/* ─── MINI THUMBNAIL (64×90) ─── */
function CartaMini({ carta, sel, onClick, disabled }: CartaProps) {
  const p = cartaPaleta(carta);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: 64,
        height: 90,
        borderRadius: 10,
        border: sel ? "2px solid #ffd54f" : `1.5px solid ${p.bc}88`,
        background: "linear-gradient(180deg, rgba(18,16,34,.98), rgba(8,9,18,.98))",
        boxShadow: sel
          ? `0 0 0 1px #ffd54f, 0 6px 16px rgba(0,0,0,.4), 0 0 14px ${p.bc}55`
          : `0 4px 12px rgba(0,0,0,.3)`,
        cursor: disabled ? "default" : "pointer",
        transform: sel ? "translateY(-6px) scale(1.08)" : "translateY(0)",
        transition: "transform .18s ease, box-shadow .18s ease",
        flexShrink: 0,
        userSelect: "none" as const,
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      {/* Type badge */}
      <div
        style={{
          background: `linear-gradient(135deg, ${p.t}, ${p.m})`,
          padding: "3px 4px 2px",
          borderBottom: `1px solid ${p.bc}44`,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 6,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 0.5,
            textTransform: "uppercase" as const,
          }}
        >
          {p.badge}
        </span>
      </div>

      {/* Emoji */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,.08), transparent 36%), linear-gradient(160deg, ${p.m}dd, ${p.t})`,
        }}
      >
        <span style={{ fontSize: 22, filter: `drop-shadow(0 0 4px ${p.bc}88)` }}>
          {carta.emoji}
        </span>
      </div>

      {/* Value */}
      <div
        style={{
          background: "rgba(0,0,0,.5)",
          padding: "2px 0",
          textAlign: "center",
        }}
      >
        <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 10, color: "#fff", fontWeight: 700 }}>
          {carta.tipo === "ataque" || carta.tipo === "defesa" ? carta.valor || "?" : "✦"}
        </span>
      </div>
    </div>
  );
}

/* ─── FULL CARD (260×380) ─── */
export default function Carta({ carta, sel, onClick, disabled, angulo = 0, mini }: CartaProps) {
  if (mini) return <CartaMini carta={carta} sel={sel} onClick={onClick} disabled={disabled} />;

  const p = cartaPaleta(carta);
  const W = 260;
  const H = 380;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: W,
        height: H,
        borderRadius: 22,
        border: sel ? `3px solid #ffd54f` : `2px solid ${p.bc}`,
        background: "linear-gradient(180deg, rgba(18,16,34,.98), rgba(8,9,18,.98))",
        boxShadow: sel
          ? `0 0 0 2px #ffd54f, 0 20px 50px rgba(0,0,0,.5), 0 0 36px ${p.bc}66`
          : `0 16px 40px rgba(0,0,0,.45), 0 0 24px ${p.glow}`,
        cursor: disabled ? "default" : "pointer",
        transform: `rotate(${angulo}deg)`,
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
          padding: "10px 14px 8px",
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
            padding: "3px 10px",
            fontSize: 9,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 1,
            textTransform: "uppercase" as const,
          }}
        >
          {p.badge}
        </div>

        <div
          style={{
            position: "absolute",
            right: 14,
            top: 10,
            fontFamily: "Oswald, sans-serif",
            fontSize: 18,
            color: "#fff",
            display: "flex",
            alignItems: "baseline",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 11, opacity: 0.8 }}>
            {carta.tipo === "ataque" ? "DMG" : carta.tipo === "defesa" ? "DEF" : ""}
          </span>
          <span style={{ fontWeight: 700 }}>
            {carta.tipo === "ataque" || carta.tipo === "defesa" ? carta.valor || "?" : ""}
          </span>
        </div>

        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 20,
            color: "#fff",
            letterSpacing: 1.2,
            lineHeight: 1.1,
            marginTop: 6,
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 2px 8px rgba(0,0,0,.5)",
          }}
        >
          {carta.nome}
        </div>
      </div>

      {/* Art area — BIG */}
      <div
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,.14), transparent 40%), linear-gradient(160deg, ${p.m}dd, ${p.t})`,
          height: 130,
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
            background: "linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 60%)",
          }}
        />
        <span
          style={{
            fontSize: 56,
            filter: `drop-shadow(0 0 14px ${p.bc}aa)`,
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
          padding: "10px 14px",
          flex: 1,
        }}
      >
        {carta.esp && (
          <div style={{ fontSize: 11, fontWeight: 900, color: "#ffd54f", marginBottom: 4 }}>
            {carta.esp === "explode"
              ? "⚠️ EXPLODE"
              : carta.esp === "tudoOuNada"
              ? "🎲 TUDO OU NADA"
              : carta.esp === "esquiva"
              ? "👉 ESQUIVA"
              : ""}
          </div>
        )}
        <div style={{ fontSize: 13, color: "#dbe3ff", lineHeight: 1.4 }}>{carta.desc}</div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
          padding: "5px 14px 8px",
          borderTop: "1px solid rgba(255,255,255,.03)",
        }}
      >
        <div style={{ fontSize: 9, color: "#8b94a8", fontStyle: "italic", lineHeight: 1.2 }}>
          Beast Animation Cards • Lab Series
        </div>
      </div>
    </div>
  );
}
