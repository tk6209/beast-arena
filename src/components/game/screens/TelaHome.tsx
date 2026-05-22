import React, { useEffect, useState } from "react";
import { DS } from "@/game/styles";
import { markGesture } from "@/game/voice";
import BtnMain from "@/components/game/BtnMain";
import { MONSTER_IMAGES } from "@/game/monsterImages";
import { MONSTROS } from "@/game/data";
import { supabase } from "@/integrations/supabase/client";
import type { Dificuldade } from "@/pages/Index";

interface TelaHomeProps {
  onIniciar: (modo: string, diff?: Dificuldade) => void;
  user?: any; onLogin?: () => void; onPerfil?: () => void; onLoja?: () => void;
}

const monsterKeys = Object.keys(MONSTROS);

const CSS = `
  @keyframes tapBeat  { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes heroIn   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes btnIn    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes rankIn   { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes glowPulse{ 0%,100%{opacity:.4} 50%{opacity:.9} }
  @keyframes logoGlow { 0%,100%{text-shadow:0 0 20px rgba(240,180,41,.4),0 4px 12px rgba(0,0,0,.8)} 50%{text-shadow:0 0 40px rgba(240,180,41,.85),0 0 80px rgba(255,107,43,.3),0 4px 12px rgba(0,0,0,.8)} }
  @keyframes bgSlide  { from{opacity:0;transform:translateX(-50%) scale(.94)} 15%{opacity:.15} 80%{opacity:.15} to{opacity:0;transform:translateX(-50%) scale(1.04)} }
  @keyframes scanMove { from{top:-2px} to{top:100%} }
`;

/* ── Noise texture as inline SVG data URI ── */
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

export default function TelaHome({ onIniciar, user, onLogin, onPerfil }: TelaHomeProps) {
  const [show, setShow]         = useState(false);
  const [bgIdx, setBgIdx]       = useState(0);
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("rankings").select("player_name,wins")
      .order("wins", { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setRankings(data); });
    const t = setInterval(() => setBgIdx(i => (i + 1) % monsterKeys.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  const m   = MONSTROS[monsterKeys[bgIdx]];
  const img = MONSTER_IMAGES[monsterKeys[bgIdx]];

  /* ═══ FULL-SCREEN CONTAINER ═══ */
  const fullscreen: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    overflow: "hidden",
  };

  /* ── HOME SCREEN ── */
  return (
    <div style={{ ...fullscreen,
      background:`radial-gradient(ellipse at 50% 60%,${m?.glow||DS.ember}12 0%,#0e0806 45%,${DS.bg0} 100%)`,
      transition:"background 1.8s ease" }}>
      <style>{CSS}</style>

      {/* Noise */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:NOISE_BG,backgroundSize:"200px 200px",
        opacity:.04,mixBlendMode:"overlay" as any }} />

      {/* Grid */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`linear-gradient(${DS.bg3}14 1px,transparent 1px),linear-gradient(90deg,${DS.bg3}14 1px,transparent 1px)`,
        backgroundSize:"48px 48px",
        maskImage:"radial-gradient(ellipse 70% 70% at 50% 50%,rgba(0,0,0,.6),transparent)",
        WebkitMaskImage:"radial-gradient(ellipse 70% 70% at 50% 50%,rgba(0,0,0,.6),transparent)" }} />

      {/* Scan line */}
      <div style={{ position:"absolute",left:0,right:0,height:1,zIndex:2,
        background:`linear-gradient(90deg,transparent,${DS.gold}28,transparent)`,
        animation:"scanMove 7s linear infinite",pointerEvents:"none" }} />

      {/* Monster silhouette */}
      {img && (
        <div key={bgIdx} style={{ position:"absolute",bottom:0,left:"50%",
          width:"min(360px,92vw)",height:"58vh",
          pointerEvents:"none",zIndex:1,animation:"bgSlide 4s ease forwards" }}>
          <img src={img} alt="" style={{ width:"100%",height:"100%",
            objectFit:"contain",objectPosition:"bottom",
            filter:"grayscale(1) brightness(.22) sepia(.6)",
            maskImage:"linear-gradient(to top,rgba(0,0,0,.65) 0%,rgba(0,0,0,.15) 50%,transparent 85%)",
            WebkitMaskImage:"linear-gradient(to top,rgba(0,0,0,.65) 0%,rgba(0,0,0,.15) 50%,transparent 85%)" }} />
        </div>
      )}

      {/* Gold orb */}
      <div style={{ position:"absolute",top:"35%",left:"50%",
        width:280,height:280,borderRadius:"50%",pointerEvents:"none",zIndex:1,
        background:`radial-gradient(circle,${DS.gold}0f,transparent 65%)`,
        transform:"translate(-50%,-50%)",animation:"glowPulse 5s ease-in-out infinite" }} />

      {/* ── CONTENT (absolute inset:0, flex centered) ── */}
      <div style={{ position:"absolute",inset:0,zIndex:3,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        paddingTop:"max(env(safe-area-inset-top),16px)",
        paddingBottom:"max(env(safe-area-inset-bottom),16px)",
        paddingLeft:"max(env(safe-area-inset-left),20px)",
        paddingRight:"max(env(safe-area-inset-right),20px)" }}>

        {/* User pill — absolute so doesn't shift center */}
        {user && show && (
          <div onClick={onPerfil} style={{ position:"absolute",
            top:"max(env(safe-area-inset-top),12px)",right:16,
            display:"flex",alignItems:"center",gap:7,cursor:"pointer",
            background:`${DS.bg2}ee`,border:`1px solid ${DS.bg3}`,
            borderRadius:20,padding:"5px 12px",
            boxShadow:"0 4px 16px rgba(0,0,0,.5)",
            animation:"fadeIn .4s .3s both" }}>
            <div style={{ width:7,height:7,borderRadius:"50%",
              background:DS.green,boxShadow:`0 0 6px ${DS.green}` }} />
            <span style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,
              color:"#c8b89a",fontWeight:600 }}>
              {user.email?.split("@")[0]}
            </span>
          </div>
        )}

        {/* Logo */}
        <div style={{ textAlign:"center",marginBottom:28,
          animation:show?"heroIn .6s ease both":"none" }}>
          <div style={{ fontFamily:"'Black Han Sans','Bangers',cursive",
            fontSize:"clamp(68px,19vw,88px)",lineHeight:.85,letterSpacing:5,
            color:DS.gold,animation:"logoGlow 3s ease-in-out infinite" }}>
            BEAST
          </div>
          <div style={{ fontFamily:"'Black Han Sans','Bangers',cursive",
            fontSize:"clamp(42px,11.5vw,58px)",letterSpacing:14,lineHeight:1,
            color:"#bf9060",marginTop:-2 }}>
            ARENA
          </div>
          <div style={{ height:2,marginTop:10,
            background:`linear-gradient(90deg,transparent,${DS.gold},transparent)` }} />
          <div style={{ fontFamily:"'Oswald',sans-serif",fontSize:10,letterSpacing:5,
            color:`${DS.gold}55`,marginTop:6,fontWeight:600,textTransform:"uppercase" }}>
            {monsterKeys.length} MONSTROS · CARD BATTLE
          </div>
        </div>

        {/* CTAs */}
        <div style={{ width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:10,
          animation:show?"btnIn .5s .18s both":"none",opacity:show?1:0 }}>
          {user ? (
            <BtnMain variant="gold" onClick={() => { markGesture(); onIniciar("duel"); }}>
              ⚔️ ENTRAR NA ARENA
            </BtnMain>
          ) : (
            <BtnMain variant="gold" onClick={() => { markGesture(); onLogin?.(); }}>
              ⚔️ ENTRAR NA ARENA
            </BtnMain>
          )}
        </div>

        {/* Ranking */}
        {rankings.length > 0 && show && (
          <div style={{ width:"100%",maxWidth:320,marginTop:16,
            background:`${DS.bg2}d0`,border:`1px solid ${DS.bg3}`,
            borderRadius:12,overflow:"hidden",
            animation:"btnIn .5s .35s both" }}>
            <div style={{ padding:"7px 14px",borderBottom:`1px solid ${DS.bg3}`,
              display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontSize:12 }}>🏆</span>
              <span style={{ fontFamily:"'Black Han Sans','Bangers',cursive",
                fontSize:14,color:DS.gold,letterSpacing:2 }}>RANKING</span>
            </div>
            {rankings.map((r,i) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",
                padding:"6px 14px",
                borderBottom:i<rankings.length-1?`1px solid ${DS.bg3}18`:"none",
                animation:`rankIn .3s ${i*.06}s both` }}>
                <span style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,fontWeight:600,
                  color:i===0?DS.gold:i===1?"#c0c0c0":i===2?"#cd7f32":"#6a5a4a" }}>
                  {["🥇","🥈","🥉"][i]||`${i+1}.`} {r.player_name}
                </span>
                <span style={{ fontFamily:"'Oswald',sans-serif",fontSize:12,
                  color:"#4a3a2a",fontWeight:600 }}>
                  {r.wins}V
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
