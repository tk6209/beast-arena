import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import { MONSTROS } from "@/game/data";
import { DS } from "@/game/styles";
import { falar } from "@/game/voice";

export interface MonsterUnlockEventDetail { monstroId: string }

export function triggerMonsterUnlock(monstroId: string) {
  window.dispatchEvent(
    new CustomEvent<MonsterUnlockEventDetail>("beast:monster-unlocked", { detail: { monstroId } })
  );
}

export default function MonsterUnlockOverlay() {
  const [monstroId, setMonstroId] = useState<string | null>(null);

  useEffect(() => {
    const onUnlock = (e: Event) => {
      const detail = (e as CustomEvent<MonsterUnlockEventDetail>).detail;
      if (!detail?.monstroId || !MONSTROS[detail.monstroId]) return;
      setMonstroId(detail.monstroId);
      try { falar(`Novo monstro desbloqueado: ${MONSTROS[detail.monstroId].nome}!`, true); } catch {}
    };
    window.addEventListener("beast:monster-unlocked", onUnlock as EventListener);
    return () => window.removeEventListener("beast:monster-unlocked", onUnlock as EventListener);
  }, []);

  useEffect(() => {
    if (!monstroId) return;
    const t = setTimeout(() => setMonstroId(null), 4800);
    return () => clearTimeout(t);
  }, [monstroId]);

  if (!monstroId) return null;
  const m = MONSTROS[monstroId];
  const glow = m.glow || DS.gold;

  // Confetti pieces
  const confetti = Array.from({ length: 28 });

  const ui = (
    <div
      onClick={() => setMonstroId(null)}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "radial-gradient(ellipse at center, rgba(0,0,0,.72), rgba(0,0,0,.94))",
        backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "unlockFade .35s ease-out forwards",
        overflow: "hidden",
        padding: 24,
      }}
    >
      {/* Rotating golden rays */}
      <div style={{
        position: "absolute", width: 800, height: 800,
        background: `conic-gradient(from 0deg, transparent 0deg, ${glow}22 18deg, transparent 36deg, ${glow}22 54deg, transparent 72deg, ${glow}22 90deg, transparent 108deg, ${glow}22 126deg, transparent 144deg, ${glow}22 162deg, transparent 180deg)`,
        animation: "unlockRays 8s linear infinite",
        opacity: .55, pointerEvents: "none",
      }} />

      {/* Confetti */}
      {confetti.map((_, i) => {
        const left = (i * 137.5) % 100;
        const delay = (i % 10) * 0.08;
        const dur = 1.6 + ((i * 13) % 14) / 10;
        const colors = [DS.gold, DS.cyan, DS.ember, DS.violet, DS.green];
        const c = colors[i % colors.length];
        return (
          <div key={i} style={{
            position: "absolute", top: -20, left: `${left}%`,
            width: 8, height: 14, background: c, borderRadius: 2,
            opacity: .9, transform: `rotate(${i * 23}deg)`,
            animation: `unlockFall ${dur}s linear ${delay}s infinite`,
            boxShadow: `0 0 6px ${c}`,
          }} />
        );
      })}

      <div style={{
        position: "relative", textAlign: "center",
        animation: "unlockPop .6s cubic-bezier(.34,1.56,.64,1) forwards",
      }}>
        <div style={{
          fontFamily: DS.fontDisplay, fontSize: 14, letterSpacing: 6,
          color: glow, marginBottom: 6, textShadow: `0 0 14px ${glow}`,
          animation: "unlockShine 1.6s ease-in-out infinite",
        }}>
          ✦ DESBLOQUEADO ✦
        </div>
        <div style={{
          fontFamily: DS.fontDisplay, fontSize: 34, letterSpacing: 3,
          color: "#fff", lineHeight: 1, marginBottom: 18,
          textShadow: `0 0 24px ${glow}, 0 2px 0 rgba(0,0,0,.6)`,
        }}>
          NOVO MONSTRO!
        </div>

        <div style={{
          position: "relative", width: 200, height: 200, margin: "0 auto 20px",
        }}>
          {/* Halo pulse */}
          <div style={{
            position: "absolute", inset: -20, borderRadius: "50%",
            background: `radial-gradient(circle, ${glow}66, transparent 65%)`,
            animation: "unlockHalo 1.8s ease-in-out infinite",
          }} />
          <div style={{
            position: "relative", width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "unlockFloat 2.4s ease-in-out infinite",
          }}>
            <MonsterAvatar monstroId={m.id} size={170} glow={glow} />
            <div style={{
              position: "absolute", bottom: -2, right: 6,
              fontSize: 52, filter: `drop-shadow(0 0 12px ${glow})`,
            }}>
              {m.emoji}
            </div>
          </div>
        </div>

        <div style={{
          fontFamily: DS.fontDisplay, fontSize: 30, letterSpacing: 4,
          color: glow, lineHeight: 1,
          textShadow: `0 0 18px ${glow}, 0 2px 0 rgba(0,0,0,.7)`,
        }}>
          {m.nome.toUpperCase()}
        </div>
        {m.hab && (
          <div style={{
            fontFamily: DS.fontUI, fontSize: 12, color: "#cfc4b4",
            letterSpacing: 1.5, marginTop: 10, textTransform: "uppercase",
          }}>
            {m.hab}
          </div>
        )}

        <div style={{
          marginTop: 22, fontFamily: DS.fontUI, fontSize: 11,
          color: "#8a7d6a", letterSpacing: 2,
        }}>
          TOQUE PARA CONTINUAR
        </div>
      </div>

      <style>{`
        @keyframes unlockFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes unlockPop {
          0% { transform: scale(.5) rotate(-8deg); opacity: 0 }
          60% { transform: scale(1.08) rotate(2deg); opacity: 1 }
          100% { transform: scale(1) rotate(0); opacity: 1 }
        }
        @keyframes unlockRays { to { transform: rotate(360deg) } }
        @keyframes unlockHalo { 0%,100% { transform: scale(.9); opacity: .55 } 50% { transform: scale(1.15); opacity: 1 } }
        @keyframes unlockFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes unlockShine { 0%,100% { opacity: .7 } 50% { opacity: 1 } }
        @keyframes unlockFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0 }
          10% { opacity: 1 }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0 }
        }
      `}</style>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(ui, document.body) : ui;
}