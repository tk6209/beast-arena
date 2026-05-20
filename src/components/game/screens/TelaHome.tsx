import React, { useEffect, useState, useCallback } from "react";
import { DS, pageBg } from "@/game/styles";
import { falar, markGesture } from "@/game/voice";
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
  @keyframes heroIn     { 0%{opacity:0;transform:translateY(60px) scale(.85)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes titleIn    { 0%{opacity:0;transform:translateX(-30px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes subtitleIn { 0%{opacity:0;transform:translateX(30px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes btnIn      { 0%{opacity:0;transform:translateY(24px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes glowOrb    { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.6} 50%{transform:translate(-50%,-50%) scale(1.3);opacity:1} }
  @keyframes scanDown   { 0%{transform:translateY(-8px);opacity:0} 50%{opacity:.6} 100%{transform:translateY(8px);opacity:0} }
  @keyframes tapBeat    { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
  @keyframes bgMonster  { 0%{opacity:0;transform:scale(.92)} 20%{opacity:.14} 80%{opacity:.14} 100%{opacity:0;transform:scale(1.04)} }
  @keyframes rankRow    { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes particleUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-80px) scale(0)} }
  @keyframes logoGlow   { 0%,100%{filter:drop-shadow(0 0 12px rgba(240,180,41,.4))} 50%{filter:drop-shadow(0 0 28px rgba(240,180,41,.8)) drop-shadow(0 0 56px rgba(255,107,43,.3))} }
`;

function TapGate({ onReady }: { onReady: () => void }) {
  return (
    <div onClick={onReady} onTouchStart={onReady}
      style={{ position:"fixed",inset:0,zIndex:99999,background:DS.bg0,
        display:"flex",alignItems:"center",justifyContent:"center",
        flexDirection:"column",gap:20,cursor:"pointer" }}>
      <div style={{ fontFamily:DS.fontDisplay,fontSize:56,
        background:"linear-gradient(180deg,#fff5,var(--gold))",
        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
        letterSpacing:6,textAlign:"center",lineHeight:1 }}>
        BEAST<br/>ARENA
      </div>
      <div style={{ fontFamily:DS.fontUI,fontSize:13,color:DS.gold,
        letterSpacing:4,animation:"tapBeat 1.4s ease-in-out infinite",
        textTransform:"uppercase" }}>
        ▶ TOQUE PARA ENTRAR
      </div>
    </div>
  );
}

export default function TelaHome({ onIniciar, user, onLogin, onPerfil }: TelaHomeProps) {
  const [ready, setReady]       = useState(false);
  const [show, setShow]         = useState(false);
  const [bgIdx, setBgIdx]       = useState(0);
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("rankings").select("player_name,wins").order("wins",{ascending:false}).limit(5).then(({data})=>{ if(data) setRankings(data); });
    const t = setInterval(() => setBgIdx(i => (i+1) % monsterKeys.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setShow(true), 120);
    return () => clearTimeout(t);
  }, [ready]);

  const m = MONSTROS[monsterKeys[bgIdx]];
  const img = MONSTER_IMAGES[monsterKeys[bgIdx]];

  if (!ready) return <TapGate onReady={() => setReady(true)} />;

  return (
    <div style={{
      minHeight:"100dvh",
      background:`radial-gradient(ellipse at 50% 70%, ${m?.glow || DS.ember}10 0%, #0d0806 40%, ${DS.bg0} 100%)`,
      position:"relative",overflow:"hidden",transition:"background 1.5s ease",
    }}>
      <style>{CSS}</style>

      {/* Scan line effect */}
      <div style={{ position:"fixed",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${DS.gold}44,transparent)`,
        animation:"scanDown 4s linear infinite",pointerEvents:"none",zIndex:2 }} />

      {/* Grid texture */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`linear-gradient(${DS.bg3}18 1px,transparent 1px),linear-gradient(90deg,${DS.bg3}18 1px,transparent 1px)`,
        backgroundSize:"48px 48px",maskImage:"radial-gradient(ellipse at center,rgba(0,0,0,.4) 0%,transparent 75%)",
        WebkitMaskImage:"radial-gradient(ellipse at center,rgba(0,0,0,.4) 0%,transparent 75%)" }} />

      {/* Monster silhouette BG */}
      {img && (
        <div key={bgIdx} style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"min(380px,95vw)",height:"62vh",pointerEvents:"none",zIndex:1,
          animation:"bgMonster 3.5s ease forwards" }}>
          <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"contain",
            objectPosition:"bottom",
            filter:`grayscale(1) brightness(.25) sepia(1) hue-rotate(${m?.glow?.includes("ff")?"0":"200"}deg)`,
            maskImage:"linear-gradient(to top,rgba(0,0,0,.7) 0%,rgba(0,0,0,.2) 55%,transparent 90%)",
            WebkitMaskImage:"linear-gradient(to top,rgba(0,0,0,.7) 0%,rgba(0,0,0,.2) 55%,transparent 90%)" }} />
        </div>
      )}

      {/* Gold orb */}
      <div style={{ position:"fixed",top:"30%",left:"50%",width:280,height:280,
        borderRadius:"50%",background:`radial-gradient(circle,${DS.gold}10,transparent 65%)`,
        transform:"translate(-50%,-50%)",animation:"glowOrb 5s ease-in-out infinite",
        pointerEvents:"none",zIndex:1,transition:"all 1.5s ease" }} />

      {/* Content */}
      <div style={{ position:"relative",zIndex:3,minHeight:"100dvh",display:"flex",
        flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:"env(safe-area-inset-top,0px) 20px 24px" }}>

        {/* Top user pill */}
        {user && (
          <div onClick={onPerfil} style={{ position:"absolute",top:"calc(env(safe-area-inset-top,0px) + 12px)",right:16,
            display:"flex",alignItems:"center",gap:8,cursor:"pointer",
            background:`${DS.bg2}e0`,border:`1px solid ${DS.bg3}`,
            borderRadius:20,padding:"6px 12px",
            boxShadow:`0 4px 12px rgba(0,0,0,.5)`,
            animation:show?"fadeIn .4s .5s both":"none",opacity:show?1:0 }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:DS.green,boxShadow:`0 0 6px ${DS.green}` }} />
            <span style={{ fontFamily:DS.fontUI,fontSize:12,color:"#c8b89a",fontWeight:600 }}>
              {user.email?.split("@")[0]}
            </span>
          </div>
        )}

        {/* Logo */}
        <div style={{ textAlign:"center",marginBottom:8,
          animation:show?"heroIn .7s cubic-bezier(.22,1,.36,1) both":"none" }}>
          <div style={{ position:"relative",display:"inline-block" }}>
            <div style={{ fontFamily:DS.fontDisplay,lineHeight:.88,letterSpacing:4 }}>
              <div style={{ fontSize:"clamp(64px,18vw,88px)",
                background:"linear-gradient(170deg,#fff9e6 0%,var(--gold) 40%,#b8860b 100%)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                animation:"logoGlow 3s ease-in-out infinite",
                textShadow:"none" }}>
                BEAST
              </div>
              <div style={{ fontSize:"clamp(48px,13vw,64px)",
                background:"linear-gradient(170deg,#e8d0b0 0%,#c0955a 50%,#7a5c30 100%)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                letterSpacing:12 }}>
                ARENA
              </div>
            </div>
            {/* Decorative line */}
            <div style={{ height:2,background:`linear-gradient(90deg,transparent,${DS.gold},transparent)`,
              marginTop:6,marginBottom:4 }} />
          </div>
          <div style={{ fontFamily:DS.fontUI,fontSize:11,color:`${DS.gold}88`,
            letterSpacing:5,textTransform:"uppercase",fontWeight:600 }}>
            CARD BATTLE · {monsterKeys.length} MONSTROS
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ width:"100%",maxWidth:320,display:"flex",flexDirection:"column",
          gap:10,marginTop:20,
          animation:show?"btnIn .5s .25s both":"none",opacity:show?1:0 }}>
          {user ? (
            <BtnMain variant="gold" onClick={() => { markGesture(); onIniciar("duel"); }}>
              ⚔️ ENTRAR NA ARENA
            </BtnMain>
          ) : (
            <>
              <BtnMain variant="gold" onClick={() => { markGesture(); onLogin?.(); }}>
                ⚔️ ENTRAR / REGISTRAR
              </BtnMain>
              <BtnMain variant="dark" onClick={() => { markGesture(); onIniciar("duel"); }}>
                JOGAR SEM CONTA
              </BtnMain>
            </>
          )}
        </div>

        {/* Ranking snippet */}
        {rankings.length > 0 && (
          <div style={{ width:"100%",maxWidth:320,marginTop:20,
            background:`${DS.bg2}cc`,border:`1px solid ${DS.bg3}`,
            borderRadius:12,overflow:"hidden",
            animation:show?"fadeUp .5s .45s both":"none",opacity:show?1:0 }}>
            <div style={{ padding:"8px 14px",borderBottom:`1px solid ${DS.bg3}`,
              display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontSize:12 }}>🏆</span>
              <span style={{ fontFamily:DS.fontDisplay,fontSize:14,color:DS.gold,letterSpacing:2 }}>
                RANKING
              </span>
            </div>
            {rankings.map((r,i) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",
                padding:"7px 14px",
                borderBottom:i<rankings.length-1?`1px solid ${DS.bg3}22`:"none",
                animation:`rankRow .3s ${i*.06}s both` }}>
                <span style={{ fontFamily:DS.fontUI,fontSize:12,fontWeight:600,
                  color:i===0?DS.gold:i===1?"#c8c8c8":i===2?"#cd7f32":"#8a7a6a" }}>
                  {["🥇","🥈","🥉"][i]||`${i+1}.`} {r.player_name}
                </span>
                <span style={{ fontFamily:DS.fontUI,fontSize:12,color:"#5a4a3a",fontWeight:600 }}>
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
