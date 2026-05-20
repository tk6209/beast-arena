import React, { useState, useRef, useEffect } from "react";
import type { CartaData } from "@/game/data";
import { cartaPaleta } from "@/game/styles";

interface CartaProps {
  carta: CartaData; sel?: boolean; disabled?: boolean;
  onClick?: () => void; mini?: boolean;
}

const RARITY_SHIMMER: Record<string, string> = {
  lendario: "linear-gradient(135deg,#ffd54f,#ff9800,#ffd54f)",
  epico:    "linear-gradient(135deg,#ce93d8,#7b1fa2,#ce93d8)",
  raro:     "linear-gradient(135deg,#64b5f6,#1565c0,#64b5f6)",
  incomum:  "linear-gradient(135deg,#81c784,#2e7d32,#81c784)",
};

const TYPE_ICON: Record<string, string> = {
  ataque:"⚔️", defesa:"🛡️", cura:"💚", evolucao:"⭐",
  swarm:"🐾", desafio:"⚡", poderzinho:"✨",
};

export default function Carta({ carta, sel = false, disabled = false, onClick, mini = false }: CartaProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [pressed, setPressed]         = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const p = cartaPaleta(carta);

  const W = mini ? 78 : 100;
  const H = mini ? 116 : 148;

  function handleTouchStart() {
    longPressRef.current = setTimeout(() => setShowPreview(true), 500);
  }
  function handleTouchEnd() {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    setPressed(false);
  }

  const raridade = carta.raridade || "comum";
  const hasShimmer = ["lendario","epico","raro"].includes(raridade);

  return (
    <>
      {/* Long-press preview */}
      {showPreview && (
        <div style={{ position:"fixed",inset:0,zIndex:9999,
          background:"rgba(0,0,0,.88)",backdropFilter:"blur(12px)",
          display:"flex",alignItems:"center",justifyContent:"center" }}
          onClick={() => setShowPreview(false)}>
          <div style={{ background:`linear-gradient(145deg,${p.t}ee,#0a0f1e)`,
            border:`2px solid ${p.bc}`,borderRadius:24,padding:"24px 20px",
            maxWidth:220,textAlign:"center",
            boxShadow:`0 0 60px ${p.bc}44,0 20px 60px rgba(0,0,0,.6)` }}>
            <div style={{ fontSize:52,marginBottom:10,filter:`drop-shadow(0 0 12px ${p.bc})` }}>
              {carta.emoji}
            </div>
            <div style={{ fontFamily:"Bangers,cursive",fontSize:22,color:"#f0f4ff",
              letterSpacing:1,marginBottom:6 }}>{carta.nome}</div>
            {carta.custo != null && (
              <div style={{ display:"inline-flex",alignItems:"center",gap:4,
                background:"rgba(255,213,79,.12)",border:"1px solid rgba(255,213,79,.3)",
                borderRadius:8,padding:"3px 10px",marginBottom:10 }}>
                <span style={{ fontSize:14 }}>⚡</span>
                <span style={{ fontFamily:"Bangers,cursive",fontSize:15,color:"#ffd54f" }}>
                  {carta.custo} energia
                </span>
              </div>
            )}
            <div style={{ fontFamily:"Nunito,sans-serif",fontSize:13,color:"#8a95aa",
              lineHeight:1.5,marginBottom:8 }}>{carta.desc}</div>
            {carta.valor != null && carta.valor > 0 && (
              <div style={{ fontFamily:"Oswald,sans-serif",fontSize:13,color:p.bc,letterSpacing:.5 }}>
                {carta.tipo==="ataque"?`⚔️ ${carta.valor} dano`:carta.tipo==="defesa"?`🛡️ ${carta.valor} defesa`:carta.tipo==="cura"?`💚 +${carta.valor} HP`:""}
              </div>
            )}
            <div style={{ fontFamily:"Nunito,sans-serif",fontSize:9,color:"#2a3448",marginTop:12 }}>
              Toque para fechar
            </div>
          </div>
        </div>
      )}

      <div
        onClick={disabled ? undefined : onClick}
        onPointerDown={() => { if (!disabled) { setPressed(true); handleTouchStart(); } }}
        onPointerUp={() => { handleTouchEnd(); if (!disabled && onClick) {} }}
        onPointerLeave={handleTouchEnd}
        style={{
          width: W, height: H,
          borderRadius: 12,
          position: "relative",
          flexShrink: 0,
          cursor: disabled ? "default" : "pointer",
          userSelect: "none",
          // Selection lift
          transform: sel
            ? "translateY(-10px) scale(1.08) rotate(-1deg)"
            : pressed && !disabled
            ? "scale(0.94) translateY(2px)"
            : "translateY(0) scale(1)",
          transition: "transform .16s cubic-bezier(.34,1.56,.64,1), box-shadow .16s ease, opacity .16s",
          // Disabled dim
          opacity: disabled && !sel ? 0.38 : 1,
          filter: disabled && !sel ? "grayscale(0.5)" : "none",
          // Shadow
          boxShadow: sel
            ? `0 0 0 2px #ffd54f, 0 12px 32px rgba(0,0,0,.5), 0 0 24px ${p.bc}66`
            : pressed
            ? "0 2px 8px rgba(0,0,0,.4)"
            : `0 6px 18px rgba(0,0,0,.45), 0 0 0 1px ${p.bc}22`,
          // Background
          background: `linear-gradient(160deg,${p.t}f0,${p.m}f0,rgba(8,9,20,.96))`,
          border: `1.5px solid ${sel ? "#ffd54f" : p.bc}${sel ? "" : "55"}`,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>

        {/* Rarity shimmer border on top */}
        {hasShimmer && (
          <div style={{ position:"absolute",top:0,left:0,right:0,height:2,
            background:RARITY_SHIMMER[raridade] || "transparent",
            backgroundSize:"200%",animation:"shimBar 2s linear infinite",zIndex:5 }} />
        )}

        {/* Top strip: type + cost */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"4px 6px 3px",
          background:`linear-gradient(135deg,${p.t},${p.m})`,
          borderBottom:`1px solid ${p.bc}44` }}>
          <span style={{ fontFamily:"Oswald,sans-serif",fontSize:7,color:"rgba(255,255,255,.85)",
            letterSpacing:.8,textTransform:"uppercase",fontWeight:700 }}>
            {TYPE_ICON[carta.tipo] || ""} {p.badge}
          </span>
          {carta.custo != null && (
            <div style={{ display:"flex",alignItems:"center",gap:2,
              background:"rgba(0,0,0,.35)",borderRadius:4,padding:"1px 4px" }}>
              <span style={{ fontSize:8,lineHeight:1 }}>⚡</span>
              <span style={{ fontFamily:"Bangers,cursive",fontSize:10,color:"#ffd54f",letterSpacing:.5 }}>
                {carta.custo}
              </span>
            </div>
          )}
        </div>

        {/* Emoji — large and centered */}
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",
          position:"relative",padding:"4px 0" }}>
          {/* Glow behind emoji */}
          <div style={{ position:"absolute",width:48,height:48,borderRadius:"50%",
            background:`radial-gradient(circle,${p.bc}25,transparent 70%)`,pointerEvents:"none" }} />
          <span style={{ fontSize: mini ? 28 : 36,
            filter:`drop-shadow(0 0 8px ${p.bc}88)`,position:"relative",zIndex:1 }}>
            {carta.emoji}
          </span>
        </div>

        {/* Card name */}
        <div style={{ padding:"2px 5px 1px",textAlign:"center" }}>
          <div style={{ fontFamily:"Bangers,cursive",fontSize: mini ? 9 : 11,color:"#f0f4ff",
            letterSpacing:.5,lineHeight:1.1,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {carta.nome}
          </div>
        </div>

        {/* Value badge */}
        {carta.valor != null && carta.valor > 0 && (
          <div style={{ padding:"2px 5px 4px",textAlign:"center" }}>
            <span style={{ fontFamily:"Bangers,cursive",fontSize: mini ? 13 : 16,
              color:p.bc,letterSpacing:.5,
              textShadow:`0 0 8px ${p.bc}88` }}>
              {carta.tipo==="ataque"?`-${carta.valor}`:carta.tipo==="defesa"?`+${carta.valor}`:carta.tipo==="cura"?`+${carta.valor}`:carta.valor}
            </span>
          </div>
        )}

        {/* Selected glow overlay */}
        {sel && (
          <div style={{ position:"absolute",inset:0,borderRadius:11,pointerEvents:"none",
            background:"linear-gradient(135deg,rgba(255,213,79,.08),transparent 60%)",
            border:"1.5px solid rgba(255,213,79,.3)" }} />
        )}
      </div>

      <style>{`@keyframes shimBar{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </>
  );
}
