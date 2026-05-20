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
  @keyframes tapBeat  { 0%,100%{opacity:.45;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
  @keyframes heroIn   { 0%{opacity:0;transform:translateY(40px) scale(.92)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes btnIn    { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes rankRow  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes glowOrb  { 0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.8;transform:translate(-50%,-50%) scale(1.25)} }
  @keyframes logoGlow { 0%,100%{filter:drop-shadow(0 0 10px rgba(240,180,41,.35))} 50%{filter:drop-shadow(0 0 26px rgba(240,180,41,.8))} }
  @keyframes bgMon    { 0%{opacity:0;transform:translateX(-50%) scale(.94)} 15%{opacity:.13} 80%{opacity:.13} 100%{opacity:0;transform:translateX(-50%) scale(1.04)} }
  @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
`;

/* ── Full-screen tap gate — perfectly centered ── */
function TapGate({ onReady }: { onReady: () => void }) {
  return (
    <div
      onClick={onReady}
      onTouchStart={onReady}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        background: DS.bg0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        cursor: "pointer",
        userSelect: "none",
      }}>
      <style>{CSS}</style>

      {/* Subtle orb behind logo */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle, ${DS.gold}14, transparent 65%)`,
        transform: "translate(-50%, -50%)",
        animation: "glowOrb 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: DS.fontDisplay,
          fontSize: "clamp(72px, 20vw, 96px)",
          lineHeight: 0.85,
          letterSpacing: 6,
          color: DS.gold,                          /* solid color — no CSS vars inline */
          animation: "logoGlow 3s ease-in-out infinite",
          textShadow: `0 0 40px ${DS.gold}44`,
        }}>
          BEAST
        </div>
        <div style={{
          fontFamily: DS.fontDisplay,
          fontSize: "clamp(44px, 12vw, 60px)",
          letterSpacing: 14,
          lineHeight: 1,
          color: "#c0955a",
          marginTop: -4,
        }}>
          ARENA
        </div>
        {/* Gold rule */}
        <div style={{
          height: 2, marginTop: 10,
          background: `linear-gradient(90deg, transparent, ${DS.gold}, transparent)`,
        }} />
        <div style={{
          fontFamily: DS.fontUI, fontSize: 10, letterSpacing: 4,
          color: `${DS.gold}66`, marginTop: 6, fontWeight: 600,
          textTransform: "uppercase",
        }}>
          CARD BATTLE GAME
        </div>
      </div>

      {/* Tap hint */}
      <div style={{
        position: "relative", zIndex: 1,
        fontFamily: DS.fontUI, fontSize: 14, fontWeight: 700,
        color: DS.gold, letterSpacing: 5,
        textTransform: "uppercase",
        animation: "tapBeat 1.5s ease-in-out infinite",
      }}>
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
    supabase.from("rankings").select("player_name,wins")
      .order("wins", { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setRankings(data); });
    const t = setInterval(() => setBgIdx(i => (i + 1) % monsterKeys.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, [ready]);

  if (!ready) return <TapGate onReady={() => setReady(true)} />;

  const m   = MONSTROS[monsterKeys[bgIdx]];
  const img = MONSTER_IMAGES[monsterKeys[bgIdx]];

  return (
    <div style={{
      /* Exact viewport — no scroll, no overflow */
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: `radial-gradient(ellipse at 50% 65%, ${m?.glow || DS.ember}12 0%, #0e0806 45%, ${DS.bg0} 100%)`,
      transition: "background 1.8s ease",
      overflow: "hidden",
    }}>
      <style>{CSS}</style>

      {/* Scan line */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 1, zIndex: 2,
        background: `linear-gradient(90deg,transparent,${DS.gold}30,transparent)`,
        animation: "scanLine 6s linear infinite", pointerEvents: "none",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${DS.bg3}14 1px,transparent 1px),linear-gradient(90deg,${DS.bg3}14 1px,transparent 1px)`,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,rgba(0,0,0,.5),transparent)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,rgba(0,0,0,.5),transparent)",
      }} />

      {/* Monster silhouette */}
      {img && (
        <div key={bgIdx} style={{
          position: "absolute", bottom: 0, left: "50%",
          width: "min(360px, 92vw)", height: "58vh",
          pointerEvents: "none", zIndex: 1,
          animation: "bgMon 4s ease forwards",
        }}>
          <img src={img} alt="" style={{
            width: "100%", height: "100%",
            objectFit: "contain", objectPosition: "bottom",
            filter: "grayscale(1) brightness(.2) sepia(.8)",
            maskImage: "linear-gradient(to top,rgba(0,0,0,.6) 0%,rgba(0,0,0,.15) 50%,transparent 85%)",
            WebkitMaskImage: "linear-gradient(to top,rgba(0,0,0,.6) 0%,rgba(0,0,0,.15) 50%,transparent 85%)",
          }} />
        </div>
      )}

      {/* Gold ambient orb */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        width: 300, height: 300, borderRadius: "50%",
        background: `radial-gradient(circle, ${DS.gold}0e, transparent 65%)`,
        transform: "translate(-50%,-50%)",
        animation: "glowOrb 5s ease-in-out infinite",
        pointerEvents: "none", zIndex: 1,
      }} />

      {/* ── MAIN CONTENT — uses safe-area via padding, centered with flex ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        /* Safe areas as padding — keeps content inside notch/home-bar */
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        paddingLeft: "max(env(safe-area-inset-left), 20px)",
        paddingRight: "max(env(safe-area-inset-right), 20px)",
        gap: 0,
      }}>

        {/* User pill — absolute so it doesn't affect centering */}
        {user && show && (
          <div onClick={onPerfil} style={{
            position: "absolute",
            top: "max(env(safe-area-inset-top), 12px)",
            right: "max(env(safe-area-inset-right), 16px)",
            display: "flex", alignItems: "center", gap: 7,
            background: `${DS.bg2}ee`, border: `1px solid ${DS.bg3}`,
            borderRadius: 20, padding: "6px 12px",
            cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.5)",
            animation: "fadeIn .4s .4s both",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: DS.green, boxShadow: `0 0 6px ${DS.green}` }} />
            <span style={{ fontFamily: DS.fontUI, fontSize: 12, color: "#c8b89a", fontWeight: 600 }}>
              {user.email?.split("@")[0]}
            </span>
          </div>
        )}

        {/* Logo block */}
        <div style={{
          textAlign: "center", marginBottom: 28,
          animation: show ? "heroIn .65s cubic-bezier(.22,1,.36,1) both" : "none",
        }}>
          <div style={{
            fontFamily: DS.fontDisplay,
            fontSize: "clamp(68px, 19vw, 92px)",
            lineHeight: 0.88, letterSpacing: 5,
            color: DS.gold,
            animation: "logoGlow 3s ease-in-out infinite",
            textShadow: `0 0 40px ${DS.gold}33`,
          }}>
            BEAST
          </div>
          <div style={{
            fontFamily: DS.fontDisplay,
            fontSize: "clamp(42px, 11.5vw, 58px)",
            letterSpacing: 13, lineHeight: 1,
            color: "#bf9060",
            marginTop: -2,
          }}>
            ARENA
          </div>
          <div style={{
            height: 2, marginTop: 10, marginBottom: 8,
            background: `linear-gradient(90deg,transparent,${DS.gold},transparent)`,
          }} />
          <div style={{
            fontFamily: DS.fontUI, fontSize: 10, letterSpacing: 5,
            color: `${DS.gold}55`, fontWeight: 600, textTransform: "uppercase",
          }}>
            {monsterKeys.length} MONSTROS · CARD BATTLE
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          width: "100%", maxWidth: 320,
          display: "flex", flexDirection: "column", gap: 10,
          animation: show ? "btnIn .5s .2s both" : "none",
          opacity: show ? 1 : 0,
        }}>
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

        {/* Ranking */}
        {rankings.length > 0 && show && (
          <div style={{
            width: "100%", maxWidth: 320, marginTop: 18,
            background: `${DS.bg2}d0`, border: `1px solid ${DS.bg3}`,
            borderRadius: 12, overflow: "hidden",
            animation: "btnIn .5s .4s both",
          }}>
            <div style={{
              padding: "8px 14px", borderBottom: `1px solid ${DS.bg3}`,
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontFamily: DS.fontDisplay, fontSize: 14, color: DS.gold, letterSpacing: 2 }}>
                RANKING
              </span>
            </div>
            {rankings.map((r, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "7px 14px",
                borderBottom: i < rankings.length - 1 ? `1px solid ${DS.bg3}18` : "none",
                animation: `rankRow .3s ${i * .06}s both`,
              }}>
                <span style={{
                  fontFamily: DS.fontUI, fontSize: 12, fontWeight: 600,
                  color: i===0 ? DS.gold : i===1 ? "#c0c0c0" : i===2 ? "#cd7f32" : "#6a5a4a",
                }}>
                  {["🥇","🥈","🥉"][i] || `${i+1}.`} {r.player_name}
                </span>
                <span style={{ fontFamily: DS.fontUI, fontSize: 12, color: "#4a3a2a", fontWeight: 600 }}>
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
