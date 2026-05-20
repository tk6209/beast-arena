import React, { useState, useRef } from "react";
import type { CartaData } from "@/game/data";
import { cartaPaleta, DS } from "@/game/styles";

interface CartaProps {
  carta: CartaData; sel?: boolean; disabled?: boolean;
  onClick?: () => void; mini?: boolean;
}

const RARITY_TOP: Record<string, string> = {
  lendario: `linear-gradient(90deg,${DS.goldD},${DS.gold},#fff9c4,${DS.gold},${DS.goldD})`,
  epico:    `linear-gradient(90deg,#4a0080,${DS.violet},#d4aaff,${DS.violet},#4a0080)`,
  raro:     `linear-gradient(90deg,#004888,${DS.cyan},#aaeeff,${DS.cyan},#004888)`,
  incomum:  `linear-gradient(90deg,#063a14,#27ae60,#aaffcc,#27ae60,#063a14)`,
};

const TYPE_ICON: Record<string, string> = {
  ataque:"⚔️", defesa:"🛡️", cura:"💚", evolucao:"⭐",
  swarm:"🐾", desafio:"⚡", poderzinho:"✨",
};

export default function Carta({ carta, sel=false, disabled=false, onClick, mini=false }: CartaProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [pressed, setPressed]         = useState(false);
  const longRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const p = cartaPaleta(carta);
  const rar = carta.raridade || "comum";
  const hasRarBorder = ["lendario","epico","raro","incomum"].includes(rar);

  const W = mini ? 80 : 104;
  const H = mini ? 120 : 156;

  function pDown() { longRef.current = setTimeout(()=>setShowPreview(true),480); setPressed(true); }
  function pUp()   { if(longRef.current) clearTimeout(longRef.current); setPressed(false); }

  return (
    <>
      {/* Preview modal */}
      {showPreview && (
        <div style={{ position:"fixed",inset:0,zIndex:9999,
          background:"rgba(0,0,0,.92)",backdropFilter:"blur(16px)",
          display:"flex",alignItems:"center",justifyContent:"center" }}
          onClick={()=>setShowPreview(false)}>
          <div style={{ background:`linear-gradient(160deg,${p.t}f8,${DS.bg1})`,
            border:`2px solid ${p.rarBc||p.bc}`,borderRadius:20,
            padding:"28px 24px",maxWidth:220,textAlign:"center",
            boxShadow:`0 0 80px ${p.bc}44,0 24px 64px rgba(0,0,0,.8)` }}>
            {hasRarBorder && (
              <div style={{ position:"absolute",top:0,left:0,right:0,height:2,
                background:RARITY_TOP[rar],backgroundSize:"200%",
                animation:"shimmer 2s linear infinite",borderRadius:"20px 20px 0 0" }} />
            )}
            <div style={{ fontSize:60,marginBottom:12,
              filter:`drop-shadow(0 0 16px ${p.bc})` }}>{carta.emoji}</div>
            <div style={{ fontFamily:DS.fontDisplay,fontSize:24,color:"#f5ede0",
              letterSpacing:1.5,marginBottom:6,lineHeight:1 }}>{carta.nome}</div>
            {carta.custo!=null && (
              <div style={{ display:"inline-flex",alignItems:"center",gap:5,
                background:`${DS.gold}14`,border:`1px solid ${DS.gold}40`,
                borderRadius:8,padding:"3px 12px",marginBottom:10 }}>
                <span style={{ fontSize:14 }}>⚡</span>
                <span style={{ fontFamily:DS.fontDisplay,fontSize:16,color:DS.gold }}>
                  {carta.custo} ENERGIA
                </span>
              </div>
            )}
            <div style={{ fontFamily:DS.fontUI,fontSize:13,color:"#7a6a5a",lineHeight:1.5,marginBottom:10 }}>
              {carta.desc}
            </div>
            {carta.valor!=null && carta.valor>0 && (
              <div style={{ fontFamily:DS.fontDisplay,fontSize:18,color:p.bc,letterSpacing:1 }}>
                {carta.tipo==="ataque"?`⚔️ ${carta.valor} DANO`:
                 carta.tipo==="defesa"?`🛡️ ${carta.valor} DEFESA`:
                 carta.tipo==="cura"?`💚 +${carta.valor} HP`:""}
              </div>
            )}
            <div style={{ fontFamily:DS.fontUI,fontSize:9,color:"#3a2a1a",marginTop:14,letterSpacing:1 }}>
              TOQUE PARA FECHAR
            </div>
          </div>
          <style>{`@keyframes shimmer{0%,100%{background-position:-200% 0}50%{background-position:200% 0}}`}</style>
        </div>
      )}

      <div
        onClick={disabled ? undefined : onClick}
        onPointerDown={disabled ? undefined : pDown}
        onPointerUp={pUp}
        onPointerLeave={pUp}
        style={{
          width:W, height:H, borderRadius:12,
          position:"relative", flexShrink:0,
          cursor:disabled?"default":"pointer",
          userSelect:"none" as const,
          // Transform
          transform: sel
            ? "translateY(-12px) scale(1.1) rotate(-1.5deg)"
            : pressed && !disabled
            ? "scale(0.93) translateY(2px)"
            : "translateY(0) scale(1)",
          transition:"transform .16s cubic-bezier(.34,1.56,.64,1),box-shadow .16s,opacity .14s",
          // Disabled
          opacity: disabled && !sel ? 0.32 : 1,
          filter:  disabled && !sel ? "grayscale(0.6) brightness(.8)" : "none",
          // Shadow
          boxShadow: sel
            ? `0 0 0 2px ${DS.gold},0 16px 40px rgba(0,0,0,.7),0 0 32px ${p.bc}66`
            : pressed ? "0 2px 8px rgba(0,0,0,.5)"
            : `0 8px 24px rgba(0,0,0,.6),0 0 0 1px ${p.bc}28`,
          // Background
          background:`linear-gradient(170deg,${p.t}f8,${p.m}ee,${DS.bg1}fc)`,
          border:`1.5px solid ${sel?DS.gold:p.bc+"44"}`,
          overflow:"hidden",
          display:"flex", flexDirection:"column" as const,
        }}>

        {/* Rarity shimmer top edge */}
        {hasRarBorder && (
          <div style={{ position:"absolute",top:0,left:0,right:0,height:2,
            background:RARITY_TOP[rar],backgroundSize:"200%",
            animation:"shimmer 2s linear infinite",zIndex:6,pointerEvents:"none" }} />
        )}

        {/* Type header */}
        <div style={{ background:`linear-gradient(135deg,${p.t},${p.m})`,
          padding:"3px 6px",display:"flex",alignItems:"center",
          justifyContent:"space-between",borderBottom:`1px solid ${p.bc}30` }}>
          <span style={{ fontFamily:DS.fontUI,fontSize:7,fontWeight:700,
            color:"rgba(255,255,255,.75)",letterSpacing:.8,textTransform:"uppercase" as const }}>
            {TYPE_ICON[carta.tipo]||""} {p.badge}
          </span>
          {carta.custo!=null && (
            <div style={{ display:"flex",alignItems:"center",gap:1,
              background:"rgba(0,0,0,.4)",borderRadius:3,padding:"1px 4px" }}>
              <span style={{ fontSize:7,lineHeight:1 }}>⚡</span>
              <span style={{ fontFamily:DS.fontDisplay,fontSize:11,color:DS.gold }}>{carta.custo}</span>
            </div>
          )}
        </div>

        {/* Emoji + glow */}
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",
          position:"relative",padding:"2px 0" }}>
          <div style={{ position:"absolute",width:50,height:50,borderRadius:"50%",
            background:`radial-gradient(circle,${p.bc}22,transparent 70%)`,pointerEvents:"none" }} />
          <span style={{ fontSize:mini?30:38,
            filter:`drop-shadow(0 2px 8px ${p.bc}99)`,
            position:"relative",zIndex:1 }}>
            {carta.emoji}
          </span>
        </div>

        {/* Name */}
        <div style={{ padding:"0 5px 2px",textAlign:"center" }}>
          <div style={{ fontFamily:DS.fontDisplay,fontSize:mini?9:11,color:"#f0e8d8",
            letterSpacing:.5,lineHeight:1,whiteSpace:"nowrap",
            overflow:"hidden",textOverflow:"ellipsis" }}>
            {carta.nome}
          </div>
        </div>

        {/* Value */}
        {carta.valor!=null && carta.valor>0 && (
          <div style={{ padding:"2px 5px 5px",textAlign:"center" }}>
            <span style={{ fontFamily:DS.fontDisplay,fontSize:mini?15:19,
              color:p.bc,letterSpacing:.5,
              textShadow:`0 0 10px ${p.bc}88` }}>
              {carta.tipo==="ataque"||carta.tipo==="desafio"?`-${carta.valor}`:
               carta.tipo==="defesa"||carta.tipo==="cura"?`+${carta.valor}`:carta.valor}
            </span>
          </div>
        )}

        {/* Selected overlay */}
        {sel && (
          <div style={{ position:"absolute",inset:0,borderRadius:11,pointerEvents:"none",
            background:"linear-gradient(135deg,rgba(240,180,41,.07),transparent 55%)",
            border:`1.5px solid ${DS.gold}44` }} />
        )}

        <style>{`@keyframes shimmer{0%,100%{background-position:-200% 0}50%{background-position:200% 0}}`}</style>
      </div>
    </>
  );
}
