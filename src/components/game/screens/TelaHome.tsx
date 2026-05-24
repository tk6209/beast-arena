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
  user?: any; onLogin?: () => void; onPerfil?: () => void; onLoja?: () => void; onLobby?: () => void;
}

const monsterKeys = Object.keys(MONSTROS);

const CSS = `
  @keyframes tapBeat  { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes heroIn   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes btnIn    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes rankIn   { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes glowPulse{ 0%,100%{opacity:.4} 50%{opacity:.9} }
  @keyframes logoGlow { 0%,100%{text-shadow:0 0 18px rgba(183,148,255,.45),0 4px 12px rgba(0,0,0,.8)} 50%{text-shadow:0 0 36px rgba(183,148,255,.85),0 0 72px rgba(124,58,237,.35),0 4px 12px rgba(0,0,0,.8)} }
  @keyframes arenaGlow{ 0%,100%{text-shadow:0 0 18px rgba(56,225,255,.45),0 4px 12px rgba(0,0,0,.8)} 50%{text-shadow:0 0 36px rgba(56,225,255,.85),0 0 72px rgba(56,225,255,.35),0 4px 12px rgba(0,0,0,.8)} }
  @keyframes bgSlide  { from{opacity:0;transform:translateX(-50%) scale(.94)} 15%{opacity:.15} 80%{opacity:.15} to{opacity:0;transform:translateX(-50%) scale(1.04)} }
  @keyframes scanMove { from{top:-2px} to{top:100%} }
`;

/* ── Noise texture as inline SVG data URI ── */
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

export default function TelaHome({ user, onLogin, onPerfil, onLobby }: TelaHomeProps) {
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
      background:`radial-gradient(ellipse at 50% 60%,${m?.glow||DS.violet}1f 0%,#0a0822 45%,${DS.bg0} 100%)`,
      transition:"background 1.8s ease" }}>
      <style>{CSS}</style>

      {/* Noise */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:NOISE_BG,backgroundSize:"200px 200px",
        opacity:.04,mixBlendMode:"overlay" as any }} />

      {/* Neon ambient glows */}
      <div style={{ position:"absolute",top:"6%",left:"-18%",width:340,height:340,
        borderRadius:"50%",pointerEvents:"none",zIndex:0,
        background:`radial-gradient(circle,${DS.goldD}33,transparent 70%)`,filter:"blur(60px)" }} />
      <div style={{ position:"absolute",bottom:"10%",right:"-18%",width:340,height:340,
        borderRadius:"50%",pointerEvents:"none",zIndex:0,
        background:`radial-gradient(circle,${DS.cyan}26,transparent 70%)`,filter:"blur(60px)" }} />

      {/* Grid */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`linear-gradient(${DS.bg3}14 1px,transparent 1px),linear-gradient(90deg,${DS.bg3}14 1px,transparent 1px)`,
        backgroundSize:"48px 48px",
        maskImage:"radial-gradient(ellipse 70% 70% at 50% 50%,rgba(0,0,0,.6),transparent)",
        WebkitMaskImage:"radial-gradient(ellipse 70% 70% at 50% 50%,rgba(0,0,0,.6),transparent)" }} />

      {/* Scan line */}
      <div style={{ position:"absolute",left:0,right:0,height:1,zIndex:2,
        background:`linear-gradient(90deg,transparent,${DS.cyan}33,transparent)`,
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

      {/* Violet orb */}
      <div style={{ position:"absolute",top:"35%",left:"50%",
        width:280,height:280,borderRadius:"50%",pointerEvents:"none",zIndex:1,
        background:`radial-gradient(circle,${DS.gold}1a,transparent 65%)`,
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
        <div style={{ textAlign:"center",marginBottom:32,
          animation:show?"heroIn .6s ease both":"none" }}>
          <div style={{ fontFamily:"'Bebas Neue','Black Han Sans',cursive",
            fontSize:"clamp(72px,20vw,96px)",lineHeight:.82,letterSpacing:2,
            color:DS.gold,animation:"logoGlow 3s ease-in-out infinite" }}>
            BEAST
          </div>
          <div style={{ fontFamily:"'Bebas Neue','Black Han Sans',cursive",
            fontSize:"clamp(64px,18vw,88px)",letterSpacing:4,lineHeight:.82,
            color:DS.cyan,marginTop:-8,
            animation:"arenaGlow 3s ease-in-out infinite" }}>
            ARENA
          </div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:14 }}>
            <div style={{ height:1,width:32,
              background:`linear-gradient(90deg,transparent,${DS.cyan}aa)` }} />
            <div style={{ fontFamily:"'Barlow','Oswald',sans-serif",fontSize:11,letterSpacing:4,
              color:"#e8e6ff",fontWeight:700,textTransform:"uppercase",whiteSpace:"nowrap" }}>
              {monsterKeys.length} Monstros <span style={{color:DS.goldD,margin:"0 4px"}}>•</span> Card Battle
            </div>
            <div style={{ height:1,width:32,
              background:`linear-gradient(90deg,${DS.cyan}aa,transparent)` }} />
          </div>
        </div>

        {/* CTAs */}
        <div style={{ width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:10,
          animation:show?"btnIn .5s .18s both":"none",opacity:show?1:0 }}>
          {user ? (
            <BtnMain variant="neon" onClick={() => { markGesture(); onLobby?.(); }}>
              ⚔️ ENTRAR NA ARENA
            </BtnMain>
          ) : (
            <BtnMain variant="neon" onClick={() => { markGesture(); onLogin?.(); }}>
              ⚔️ ENTRAR NA ARENA
            </BtnMain>
          )}
        </div>

        {/* Ranking */}
        {rankings.length > 0 && show && (
          <div style={{ width:"100%",maxWidth:320,marginTop:20,
            transform:"rotate(-1deg)",
            animation:"btnIn .5s .35s both" }}>
            <div style={{ position:"relative",
              background:`linear-gradient(160deg,${DS.bg1}f5,${DS.bg2}f0)`,
              border:`1px solid ${DS.bg3}80`,
              borderTopRightRadius:32,borderBottomLeftRadius:32,
              borderTopLeftRadius:12,borderBottomRightRadius:12,
              padding:"16px 18px",overflow:"hidden",
              boxShadow:`0 12px 28px rgba(0,0,0,.55),0 0 24px ${DS.goldD}1f` }}>
              {/* Accent stripe */}
              <div style={{ position:"absolute",top:0,right:0,width:120,height:2,
                background:`linear-gradient(270deg,${DS.cyan},transparent)` }} />
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",
                    background:DS.cyan,boxShadow:`0 0 8px ${DS.cyan}`,
                    animation:"glowPulse 1.6s ease-in-out infinite" }} />
                  <span style={{ fontFamily:"'Bebas Neue','Black Han Sans',cursive",
                    fontSize:18,color:"#e8e6ff",letterSpacing:3 }}>RANKING</span>
                </div>
                <span style={{ fontFamily:"'Barlow',sans-serif",fontSize:9,letterSpacing:2,
                  color:`${DS.cyan}cc`,fontWeight:700,textTransform:"uppercase" }}>
                  Season 01
                </span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {rankings.slice(0,5).map((r,i) => {
                  const isFirst = i === 0;
                  const accent = isFirst ? DS.cyan : DS.gold;
                  return (
                    <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                      background: isFirst ? `${DS.bg2}` : `${DS.bg2}80`,
                      padding:"8px 10px",borderRadius:10,
                      borderLeft:`3px solid ${isFirst ? DS.cyan : `${DS.gold}55`}`,
                      animation:`rankIn .3s ${i*.06}s both` }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ width:26,height:26,borderRadius:"50%",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          background: isFirst
                            ? `linear-gradient(135deg,${DS.cyan},${DS.goldD})`
                            : `${DS.bg1}`,
                          border: isFirst ? "none" : `1px solid ${DS.gold}55`,
                          fontFamily:"'Bebas Neue','Black Han Sans',cursive",
                          fontSize:14,
                          color: isFirst ? DS.bg0 : DS.gold }}>
                          {i+1}
                        </div>
                        <span style={{ fontFamily:"'Barlow','Oswald',sans-serif",fontSize:13,fontWeight:600,
                          color: isFirst ? "#e8e6ff" : "#e8e6ffb0" }}>
                          {r.player_name}
                        </span>
                      </div>
                      <span style={{ fontFamily:"'Bebas Neue','Black Han Sans',cursive",fontSize:18,
                        letterSpacing:1,
                        color: isFirst ? DS.cyan : DS.gold }}>
                        {r.wins}V
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
