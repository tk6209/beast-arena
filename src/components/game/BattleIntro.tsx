import React, { useState, useEffect } from "react";
import { MONSTROS } from "@/game/data";
import { MONSTER_IMAGES } from "@/game/monsterImages";

interface Props {
  monstroP1: string;
  monstroP2: string;
  nomeP1: string;
  nomeP2: string;
  onDone: () => void;
}

export default function BattleIntro({ monstroP1, monstroP2, nomeP1, nomeP2, onDone }: Props) {
  const [phase, setPhase] = useState(0);

  const m1 = MONSTROS[monstroP1] || MONSTROS.panther;
  const m2 = MONSTROS[monstroP2] || MONSTROS.panther;
  const img1 = MONSTER_IMAGES[monstroP1] || MONSTER_IMAGES.panther;
  const img2 = MONSTER_IMAGES[monstroP2] || MONSTER_IMAGES.panther;

  useEffect(() => {
    // Play dramatic intro SFX
    playIntroSfx();

    const timers = [
      setTimeout(() => setPhase(1), 100),   // left monster slides in
      setTimeout(() => setPhase(2), 800),   // right monster slides in
      setTimeout(() => setPhase(3), 1500),  // VS flash
      setTimeout(() => setPhase(4), 2200),  // names + stats appear
      setTimeout(() => setPhase(5), 3500),  // flash out
      setTimeout(() => onDone(), 4200),     // done
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#030810", overflow: "hidden",
      opacity: phase === 5 ? 0 : 1,
      transition: "opacity .7s ease",
    }}>
      <style>{`
        @keyframes introSlideLeft {
          0% { opacity: 0; transform: translateX(-120%) scale(0.6) rotate(-15deg); }
          60% { opacity: 1; transform: translateX(10%) scale(1.05) rotate(2deg); }
          100% { opacity: 1; transform: translateX(0) scale(1) rotate(0deg); }
        }
        @keyframes introSlideRight {
          0% { opacity: 0; transform: translateX(120%) scale(0.6) rotate(15deg) scaleX(-1); }
          60% { opacity: 1; transform: translateX(-10%) scale(1.05) rotate(-2deg) scaleX(-1); }
          100% { opacity: 1; transform: translateX(0) scale(1) rotate(0deg) scaleX(-1); }
        }
        @keyframes vsExplode {
          0% { opacity: 0; transform: scale(0); }
          40% { opacity: 1; transform: scale(1.8); }
          60% { transform: scale(0.9); }
          80% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes vsRing {
          0% { transform: translate(-50%,-50%) scale(0); opacity: .8; border-width: 4px; }
          100% { transform: translate(-50%,-50%) scale(4); opacity: 0; border-width: 1px; }
        }
        @keyframes introPulseGlow {
          0%, 100% { opacity: .4; }
          50% { opacity: .8; }
        }
        @keyframes introNameReveal {
          0% { opacity: 0; transform: translateY(20px); letter-spacing: 12px; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 3px; }
        }
        @keyframes introStatBar {
          0% { width: 0%; }
          100% { width: var(--stat-pct); }
        }
        @keyframes introSpark {
          0% { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0); }
        }
        @keyframes introDiagonalSlash {
          0% { transform: rotate(45deg) scaleX(0); opacity: 1; }
          50% { transform: rotate(45deg) scaleX(1); opacity: 1; }
          100% { transform: rotate(45deg) scaleX(1); opacity: 0; }
        }
        @keyframes introFlash {
          0% { opacity: 0; }
          15% { opacity: .8; }
          100% { opacity: 0; }
        }
        @keyframes introMonsterIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes introMonsterIdleMirror {
          0%, 100% { transform: translateY(0) scaleX(-1); }
          50% { transform: translateY(-8px) scaleX(-1); }
        }
      `}</style>

      {/* Dark gradient BG with color blend */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse at 25% 50%, ${m1.glow}15, transparent 50%),
          radial-gradient(ellipse at 75% 50%, ${m2.glow}15, transparent 50%),
          linear-gradient(180deg, #030810 0%, #0a1628 50%, #030810 100%)
        `,
      }} />

      {/* Diagonal slash across screen */}
      {phase >= 3 && (
        <div style={{
          position: "absolute", top: "50%", left: "-20%",
          width: "140%", height: 3,
          background: `linear-gradient(90deg, transparent, #ffd54f, #fff, #ffd54f, transparent)`,
          animation: "introDiagonalSlash .6s ease-out forwards",
          transformOrigin: "left center",
          boxShadow: "0 0 20px #ffd54f, 0 0 60px #ffd54f44",
        }} />
      )}

      {/* Flash on VS */}
      {phase >= 3 && (
        <div style={{
          position: "absolute", inset: 0,
          background: "white",
          animation: "introFlash .5s ease-out forwards",
          pointerEvents: "none",
        }} />
      )}

      {/* Expanding rings from center */}
      {phase >= 3 && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          width: 60, height: 60, borderRadius: "50%",
          border: `2px solid ${i === 0 ? "#ffd54f" : i === 1 ? "#00e5ff" : "#ff5252"}`,
          animation: `vsRing ${0.8 + i * 0.2}s ${i * 0.15}s ease-out forwards`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Sparks on VS impact */}
      {phase >= 3 && Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 60 + Math.random() * 80;
        return (
          <div key={`spark-${i}`} style={{
            position: "absolute", top: "50%", left: "50%",
            width: 3 + Math.random() * 4, height: 3 + Math.random() * 4,
            borderRadius: "50%",
            background: i % 3 === 0 ? "#ffd54f" : i % 3 === 1 ? "#ff5252" : "#00e5ff",
            boxShadow: `0 0 6px currentColor`,
            "--sx": `${Math.cos(angle) * dist}px`,
            "--sy": `${Math.sin(angle) * dist}px`,
            animation: `introSpark ${0.5 + Math.random() * 0.3}s ease-out forwards`,
            pointerEvents: "none",
          } as React.CSSProperties} />
        );
      })}

      {/* Left monster (player) */}
      <div style={{
        position: "absolute", left: "5%", top: "50%",
        transform: "translateY(-50%)",
        width: "40%", maxWidth: 200,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* Glow orb behind monster */}
        <div style={{
          position: "absolute", width: "120%", height: "120%",
          borderRadius: "50%", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${m1.glow}25, transparent 60%)`,
          animation: phase >= 1 ? "introPulseGlow 2s ease-in-out infinite" : "none",
          opacity: phase >= 1 ? 1 : 0,
        }} />

        <img
          src={img1} alt={m1.nome}
          style={{
            width: "100%", maxHeight: 180, objectFit: "contain",
            filter: `drop-shadow(0 0 30px ${m1.glow}66)`,
            animation: phase >= 1
              ? (phase >= 4 ? "introMonsterIdle 2s ease-in-out infinite" : "introSlideLeft .7s cubic-bezier(.17,.67,.35,1.2) forwards")
              : "none",
            opacity: phase >= 1 ? 1 : 0,
          }}
        />

        {/* Name + stats */}
        {phase >= 4 && (
          <div style={{
            textAlign: "center", marginTop: 8,
            animation: "introNameReveal .5s ease forwards",
          }}>
            <div style={{
              fontFamily: "Bangers, cursive", fontSize: 18,
              color: m1.glow, letterSpacing: 3,
              textShadow: `0 0 20px ${m1.glow}66`,
            }}>
              {m1.nome}
            </div>
            <div style={{
              fontFamily: "Oswald, sans-serif", fontSize: 9,
              color: "#8a95aa", letterSpacing: 2,
            }}>
              {nomeP1}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
              <StatPill label="ATK" value={m1.atk} max={50} color="#ef4444" />
              <StatPill label="DEF" value={m1.def} max={50} color="#3b82f6" />
              <StatPill label="HP" value={m1.hp} max={120} color="#69f0ae" />
            </div>
          </div>
        )}
      </div>

      {/* Right monster (enemy) */}
      <div style={{
        position: "absolute", right: "5%", top: "50%",
        transform: "translateY(-50%)",
        width: "40%", maxWidth: 200,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          position: "absolute", width: "120%", height: "120%",
          borderRadius: "50%", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${m2.glow}25, transparent 60%)`,
          animation: phase >= 2 ? "introPulseGlow 2s ease-in-out infinite" : "none",
          opacity: phase >= 2 ? 1 : 0,
        }} />

        <img
          src={img2} alt={m2.nome}
          style={{
            width: "100%", maxHeight: 180, objectFit: "contain",
            filter: `drop-shadow(0 0 30px ${m2.glow}66)`,
            animation: phase >= 2
              ? (phase >= 4 ? "introMonsterIdleMirror 2s ease-in-out infinite" : "introSlideRight .7s cubic-bezier(.17,.67,.35,1.2) forwards")
              : "none",
            opacity: phase >= 2 ? 1 : 0,
          }}
        />

        {phase >= 4 && (
          <div style={{
            textAlign: "center", marginTop: 8,
            animation: "introNameReveal .5s ease forwards",
          }}>
            <div style={{
              fontFamily: "Bangers, cursive", fontSize: 18,
              color: m2.glow, letterSpacing: 3,
              textShadow: `0 0 20px ${m2.glow}66`,
            }}>
              {m2.nome}
            </div>
            <div style={{
              fontFamily: "Oswald, sans-serif", fontSize: 9,
              color: "#8a95aa", letterSpacing: 2,
            }}>
              {nomeP2}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
              <StatPill label="ATK" value={m2.atk} max={50} color="#ef4444" />
              <StatPill label="DEF" value={m2.def} max={50} color="#3b82f6" />
              <StatPill label="HP" value={m2.hp} max={120} color="#69f0ae" />
            </div>
          </div>
        )}
      </div>

      {/* VS badge center */}
      {phase >= 3 && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          animation: "vsExplode .6s cubic-bezier(.17,.67,.35,1.2) forwards",
        }}>
          <div style={{
            fontFamily: "Bangers, cursive", fontSize: 64,
            background: "linear-gradient(180deg, #fff 0%, #ffd54f 50%, #ff9800 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0 0 20px rgba(255,213,79,.6)) drop-shadow(0 0 40px rgba(255,152,0,.3))",
            lineHeight: 1,
          }}>
            VS
          </div>
        </div>
      )}

      {/* "PREPARE-SE" text */}
      {phase >= 4 && (
        <div style={{
          position: "absolute", bottom: "12%", left: "50%",
          transform: "translateX(-50%)",
          animation: "introNameReveal .5s ease forwards",
        }}>
          <div style={{
            fontFamily: "Bangers, cursive", fontSize: 16,
            color: "#00e5ff", letterSpacing: 6,
            textShadow: "0 0 15px rgba(0,229,255,.5)",
          }}>
            ⚔️ PREPARE-SE PARA A BATALHA ⚔️
          </div>
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={onDone}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 20,
          background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 6, padding: "4px 12px",
          fontFamily: "Oswald, sans-serif", fontSize: 10, color: "#8a95aa",
          cursor: "pointer", letterSpacing: 2,
        }}
      >
        PULAR ▸
      </button>
    </div>
  );
}

/* Stat mini bar */
function StatPill({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 7, color, letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{
        width: 36, height: 3, borderRadius: 2,
        background: "rgba(255,255,255,.1)", overflow: "hidden",
        marginTop: 2,
      }}>
        <div style={{
          height: "100%", borderRadius: 2, background: color,
          "--stat-pct": `${pct}%`,
          animation: "introStatBar .6s ease forwards",
          width: 0,
        } as React.CSSProperties} />
      </div>
      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#e8f0ff", marginTop: 1 }}>
        {value}
      </div>
    </div>
  );
}

/* Dramatic intro SFX */
function playIntroSfx() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    const tone = (freq: number, type: OscillatorType, start: number, dur: number, vol: number, endFreq?: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + start + dur);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Monster 1 entrance — low rumble + swoosh
    tone(60, "sawtooth", 0, 0.8, 0.1, 40);
    tone(300, "sine", 0.1, 0.5, 0.06, 800);

    // Monster 2 entrance — mirrored swoosh
    tone(60, "sawtooth", 0.7, 0.8, 0.1, 40);
    tone(800, "sine", 0.8, 0.5, 0.06, 300);

    // VS Impact — big hit
    tone(40, "sine", 1.4, 0.5, 0.15);
    tone(80, "square", 1.4, 0.2, 0.12);
    // Rising chord
    tone(523, "sine", 1.5, 0.8, 0.08);
    tone(659, "sine", 1.55, 0.8, 0.06);
    tone(784, "sine", 1.6, 0.8, 0.06);
    // Sparkle
    tone(1568, "sine", 1.8, 0.4, 0.04);
    tone(2093, "sine", 1.9, 0.3, 0.03);

    // Noise burst for impact
    const bufSize = ctx.sampleRate * 0.12;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.12, ctx.currentTime + 1.4);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.52);
    src.connect(ng).connect(ctx.destination);
    src.start(ctx.currentTime + 1.4);
    src.stop(ctx.currentTime + 1.55);
  } catch {}
}
