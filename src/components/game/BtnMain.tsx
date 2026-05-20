import React, { useState } from "react";
import { DS } from "@/game/styles";

interface BtnMainProps {
  children: React.ReactNode; onClick?: () => void;
  variant?: string; disabled?: boolean; style?: React.CSSProperties; title?: string;
}

const VARIANTS: Record<string, { bg: string; border: string; shadow: string; textColor?: string }> = {
  gold:   { bg:"linear-gradient(160deg,#7a4f00,#c48000,#f0b429)", border:DS.gold, shadow:`0 8px 28px rgba(240,180,41,.4),inset 0 1px 0 rgba(255,255,255,.15)` },
  blue:   { bg:"linear-gradient(160deg,#082060,#1044a0,#1a6cd0)", border:DS.cyan, shadow:`0 8px 28px rgba(0,212,255,.3),inset 0 1px 0 rgba(255,255,255,.1)` },
  green:  { bg:"linear-gradient(160deg,#062a10,#0e5a1e,#27ae60)", border:DS.green, shadow:`0 8px 28px rgba(39,174,96,.3),inset 0 1px 0 rgba(255,255,255,.1)` },
  red:    { bg:"linear-gradient(160deg,#3a0a08,#7a1510,#c0392b)", border:DS.blood, shadow:`0 8px 28px rgba(192,57,43,.4),inset 0 1px 0 rgba(255,255,255,.1)` },
  ember:  { bg:"linear-gradient(160deg,#4a1800,#8a3400,#ff6b2b)", border:DS.ember, shadow:`0 8px 28px rgba(255,107,43,.35),inset 0 1px 0 rgba(255,255,255,.1)` },
  purple: { bg:"linear-gradient(160deg,#250a50,#4a1490,#8b5cf6)", border:DS.violet, shadow:`0 8px 28px rgba(139,92,246,.35),inset 0 1px 0 rgba(255,255,255,.1)` },
  dark:   { bg:`linear-gradient(160deg,${DS.bg2},${DS.bg3})`, border:DS.bg3, shadow:"0 4px 12px rgba(0,0,0,.4)", textColor:"#8a7a6a" },
};

export default function BtnMain({ children, onClick, variant = "blue", disabled = false, style = {}, title }: BtnMainProps) {
  const [pressed, setPressed] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.blue;

  return (
    <button
      disabled={disabled}
      title={title}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width:"100%", minHeight:50, borderRadius:12,
        border:`1.5px solid ${disabled ? DS.bg3 : v.border}`,
        background: disabled ? `linear-gradient(160deg,${DS.bg2},${DS.bg1})` : v.bg,
        color: disabled ? "#3a3028" : (v.textColor || "#fff"),
        fontFamily: DS.fontDisplay,
        fontSize: 22, letterSpacing: 2.5,
        cursor: disabled ? "default" : "pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:8, padding:"0 20px",
        boxShadow: disabled ? "none" : pressed ? "0 2px 8px rgba(0,0,0,.4)" : v.shadow,
        transform: pressed && !disabled ? "scale(0.97) translateY(1px)" : "scale(1)",
        transition:"transform .1s ease, box-shadow .1s ease",
        position:"relative", overflow:"hidden",
        ...style,
      }}>
      {/* Shine */}
      {!disabled && !pressed && (
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"50%",
          background:"linear-gradient(180deg,rgba(255,255,255,.07),transparent)",
          pointerEvents:"none",borderRadius:"12px 12px 0 0" }} />
      )}
      <span style={{ position:"relative",zIndex:1 }}>{children}</span>
    </button>
  );
}
