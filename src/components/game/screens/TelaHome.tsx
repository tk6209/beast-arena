import React, { useEffect, useState, useCallback } from "react";
import { pageBg } from "@/game/styles";
import { falar, markGesture } from "@/game/voice";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { MONSTER_IMAGES } from "@/game/monsterImages";
import { MONSTROS } from "@/game/data";
import { supabase } from "@/integrations/supabase/client";

import type { Dificuldade } from "@/pages/Index";

interface TelaHomeProps {
  onIniciar: (modo: string, diff?: Dificuldade) => void;
  user?: any;
  onLogin?: () => void;
  onPerfil?: () => void;
  onLoja?: () => void;
}

const monsterKeys = Object.keys(MONSTROS);

/* ── Intro SFX via Web Audio ── */
function playIntroSFX() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    const playTone = (freq: number, type: OscillatorType, start: number, dur: number, vol: number, endFreq?: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + start + dur);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Deep rumble
    playTone(50, "sawtooth", 0, 1.5, 0.12, 30);
    // Rising sweep
    playTone(200, "sine", 0.3, 1.2, 0.08, 1200);
    // Impact hit
    playTone(80, "square", 1.0, 0.3, 0.2);
    // Chord reveal: C5-E5-G5
    playTone(523, "sine", 1.1, 1.0, 0.12);
    playTone(659, "sine", 1.15, 1.0, 0.1);
    playTone(784, "sine", 1.2, 1.0, 0.1);
    // High sparkle
    playTone(1568, "sine", 1.5, 0.6, 0.06);
    playTone(2093, "sine", 1.7, 0.5, 0.04);
    // Sub boom
    playTone(40, "sine", 1.0, 0.5, 0.15);

    // Noise burst for impact
    const bufSize = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.15, ctx.currentTime + 1.0);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.15);
    src.connect(ng).connect(ctx.destination);
    src.start(ctx.currentTime + 1.0);
    src.stop(ctx.currentTime + 1.2);
  } catch {}
}

/* ── Tap-to-Start Gate ── */
function TapGate({ onReady }: { onReady: () => void }) {
  return (
    <div
      onClick={onReady}
      onTouchStart={onReady}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "#030810",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16, cursor: "pointer",
      }}
    >
      <style>{`
        @keyframes tapPulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
      `}</style>
      <div style={{
        fontFamily: "Bangers, cursive", fontSize: 42,
        background: "linear-gradient(180deg, #fff, #00e5ff)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>BEAST ARENA</div>
      <div style={{
        fontFamily: "Nunito, sans-serif", fontSize: 14, color: "#00e5ff",
        animation: "tapPulse 1.5s ease-in-out infinite",
        letterSpacing: 2,
      }}>
        ▶ TOQUE PARA INICIAR
      </div>
    </div>
  );
}

/* ── Intro Overlay ── */
function IntroOverlay({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    playIntroSFX();

    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => onDone(), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#030810",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: phase === 4 ? 0 : 1,
        transition: "opacity .6s ease",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes introSweep {
          0% { transform: scaleX(0); opacity: 1; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        @keyframes introLogoIn {
          0% { opacity: 0; transform: scale(0.3) rotateY(90deg); filter: blur(20px); }
          60% { opacity: 1; transform: scale(1.1) rotateY(-5deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotateY(0); filter: blur(0); }
        }
        @keyframes introFlash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes introMonsterFly {
          0% { opacity: 0; transform: translateY(60px) scale(0.5); }
          100% { opacity: 0.2; transform: translateY(0) scale(1); }
        }
        @keyframes introRing {
          0% { transform: translate(-50%,-50%) scale(0); opacity: .8; }
          100% { transform: translate(-50%,-50%) scale(3); opacity: 0; }
        }
        @keyframes introParticle {
          0% { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
        }
        @keyframes introPulseText {
          0%, 100% { text-shadow: 0 0 20px rgba(0,229,255,.4); }
          50% { text-shadow: 0 0 40px rgba(0,229,255,.8), 0 0 80px rgba(0,229,255,.3); }
        }
      `}</style>

      {/* Horizontal sweep line */}
      {phase >= 1 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, #00e5ff, transparent)",
            transformOrigin: "left",
            animation: "introSweep .8s ease forwards",
          }}
        />
      )}

      {/* Expanding ring on impact */}
      {phase >= 2 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 80,
            height: 80,
            borderRadius: 999,
            border: "2px solid rgba(0,229,255,.6)",
            animation: "introRing .8s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}

      {/* White flash */}
      {phase >= 2 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            animation: "introFlash .4s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Logo */}
      {phase >= 1 && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            perspective: "600px",
          }}
        >
          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: 56,
              lineHeight: 0.9,
              margin: 0,
              background: "linear-gradient(180deg, #fff 0%, #7eb8ff 40%, #00e5ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: `introLogoIn .8s cubic-bezier(.17,.67,.35,1.2) forwards${phase >= 2 ? ", introPulseText 2s ease-in-out infinite" : ""}`,
            }}
          >
            BEAST
            <br />
            ARENA
          </h1>
          <div
            style={{
              fontFamily: "Oswald, sans-serif",
              fontSize: 12,
              color: "#00e5ff",
              letterSpacing: 6,
              marginTop: 8,
              opacity: phase >= 2 ? 1 : 0,
              transition: "opacity .4s ease",
            }}
          >
            CARD BATTLE SYSTEM
          </div>
        </div>
      )}

      {/* Particles on impact */}
      {phase >= 2 &&
        Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const dist = 80 + Math.random() * 60;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 3 + Math.random() * 3,
                height: 3 + Math.random() * 3,
                borderRadius: 999,
                background: i % 3 === 0 ? "#00e5ff" : i % 3 === 1 ? "#7eb8ff" : "#ffd54f",
                boxShadow: `0 0 6px currentColor`,
                // @ts-ignore
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist}px`,
                animation: `introParticle ${0.5 + Math.random() * 0.4}s ease-out forwards`,
                pointerEvents: "none",
              } as React.CSSProperties}
            />
          );
        })}

      {/* Monster silhouettes fanning out */}
      {phase >= 3 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "45%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 0,
            pointerEvents: "none",
          }}
        >
          {monsterKeys.map((key, i) => {
            const m = MONSTROS[key];
            const offset = (i - 2) * 22;
            const rotation = (i - 2) * 4;
            return (
              <img
                key={key}
                src={MONSTER_IMAGES[key]}
                alt=""
                style={{
                  width: 100,
                  height: "auto",
                  objectFit: "contain",
                  filter: `brightness(0.4) saturate(0.3) drop-shadow(0 0 12px ${m.glow}66)`,
                  animation: `introMonsterFly .6s ${i * 0.08}s ease-out both`,
                  transform: `translateX(${offset}px) rotate(${rotation}deg)`,
                  marginBottom: -10,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Home Screen ── */
export default function TelaHome({ onIniciar, user, onLogin, onPerfil, onLoja }: TelaHomeProps) {
  const [tapReady, setTapReady] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem("beast_intro_seen"));
  const [showDiffSelect, setShowDiffSelect] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [rankings, setRankings] = useState<any[]>([]);

  const handleTap = useCallback(() => {
    setTapReady(true);
  }, []);

  // Load rankings
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("rankings")
          .select("player_name, wins, losses")
          .order("wins", { ascending: false })
          .limit(5);
        if (data) setRankings(data);
      } catch {}
    })();
  }, []);

  const handleIntroDone = useCallback(() => {
    setShowIntro(false);
    setContentReady(true);
    localStorage.setItem("beast_intro_seen", "1");
  }, []);

  useEffect(() => {
    if (contentReady) {
      const t = setTimeout(() => {
        falar("Bem-vindo ao Beast Arena. Escolha seu modo de batalha.", true);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [contentReady]);

  // Cycle background monsters
  useEffect(() => {
    if (!contentReady) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setBgIdx((i) => (i + 1) % monsterKeys.length);
        setFade(true);
      }, 800);
    }, 4000);
    return () => clearInterval(interval);
  }, [contentReady]);

  const currentMonster = MONSTROS[monsterKeys[bgIdx]];
  const currentImg = MONSTER_IMAGES[monsterKeys[bgIdx]];

  return (
    <div
      style={{
        ...pageBg(),
        background: `radial-gradient(ellipse at 50% 60%, ${currentMonster.bg2}18, transparent 55%), radial-gradient(ellipse at 50% 100%, ${currentMonster.glow}08, transparent 50%), linear-gradient(180deg, #060a14 0%, #0a1628 40%, #0d1b2e 100%)`,
        transition: "background 1.2s ease",
      }}
    >
      <style>{`
        @keyframes heroGlow {
          0%, 100% { opacity: .15; transform: scale(1); }
          50% { opacity: .3; transform: scale(1.05); }
        }
        @keyframes gridScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes fadeMonster {
          0% { opacity: 0; transform: scale(1.05) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes titleReveal {
          0% { opacity: 0; transform: translateY(20px); letter-spacing: 8px; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 3px; }
        }
        @keyframes contentFadeIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Tap to start gate */}
      {!tapReady && <TapGate onReady={handleTap} />}

      {/* Intro overlay */}
      {tapReady && showIntro && <IntroOverlay onDone={handleIntroDone} />}

      <ChromeNoise />

      {/* Tech grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(0,229,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          animation: "gridScroll 8s linear infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Background monster silhouette */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(360px, 90vw)",
          height: "55vh",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <img
          key={bgIdx}
          src={currentImg}
          alt=""
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "100%",
            objectFit: "contain",
            objectPosition: "bottom",
            opacity: fade ? 0.12 : 0,
            filter: `brightness(0.6) saturate(0.4) drop-shadow(0 0 40px ${currentMonster.glow}44)`,
            transition: "opacity .8s ease",
            animation: fade ? "fadeMonster .8s ease forwards" : "none",
            maskImage: "linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,.15) 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,.15) 60%, transparent 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${currentMonster.glow}33, transparent)`,
            animation: "scanLine 3s linear infinite",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Hero glow orb */}
      <div
        style={{
          position: "fixed",
          top: "25%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 200,
          height: 200,
          borderRadius: 999,
          background: `radial-gradient(circle, ${currentMonster.glow}15, transparent 70%)`,
          animation: "heroGlow 4s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
          transition: "background 1.2s ease",
        }}
      />

      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          position: "relative",
          zIndex: 2,
          opacity: contentReady ? 1 : 0,
          animation: contentReady ? "contentFadeIn .8s ease forwards" : "none",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          {/* Minimal tech badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(0,229,255,.06)",
              border: "1px solid rgba(0,229,255,.15)",
              borderRadius: 4,
              padding: "4px 14px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#00e5ff",
                boxShadow: "0 0 8px #00e5ff",
              }}
            />
            <span
              style={{
                fontFamily: "Oswald, sans-serif",
                fontSize: 10,
                color: "#00e5ff",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              ONLINE
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: 48,
              margin: "0 0 4px",
              lineHeight: 0.92,
              animation: contentReady ? "titleReveal .8s ease forwards" : "none",
              background: "linear-gradient(180deg, #e8f0ff 0%, #7eb8ff 50%, #3d7dd4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            BEAST
            <br />
            ARENA
          </h1>

          <div
            style={{
              fontFamily: "Oswald, sans-serif",
              color: "rgba(0,229,255,.5)",
              fontSize: 11,
              letterSpacing: 4,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            CARD BATTLE SYSTEM
          </div>

          {/* Monster name indicator */}
          <div
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: 10,
              color: currentMonster.glow,
              opacity: 0.5,
              letterSpacing: 2,
              marginBottom: 28,
              transition: "color .8s ease",
              textTransform: "uppercase",
            }}
          >
            ▸ {currentMonster.nome}
          </div>

          {/* Shop button */}
          {user && (
            <div
              onClick={onLoja}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "rgba(255,213,79,.06)", border: "1px solid rgba(255,213,79,.15)",
                borderRadius: 6, padding: "8px 12px", cursor: "pointer", marginBottom: 12,
                fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#ffd54f",
              }}
            >
              🏪 LOJA
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!showDiffSelect ? (
              <>
                <BtnMain variant="blue" onClick={() => setShowDiffSelect(true)}>
                  ⚔️ DUELO vs IA
                </BtnMain>
                <BtnMain variant="green" onClick={() => onIniciar("multi")}>
                  🌐 MULTIJOGADOR
                </BtnMain>
              </>
            ) : (
              <>
                <div style={{
                  fontFamily: "Bangers, cursive",
                  fontSize: 18,
                  color: "#00e5ff",
                  letterSpacing: 2,
                  marginBottom: 4,
                }}>
                  DIFICULDADE
                </div>
                <BtnMain variant="green" onClick={() => onIniciar("duel", "facil")}>
                  😊 FÁCIL
                </BtnMain>
                <BtnMain variant="blue" onClick={() => onIniciar("duel", "medio")}>
                  ⚔️ MÉDIO
                </BtnMain>
                <BtnMain variant="gold" onClick={() => onIniciar("duel", "avancado")}>
                  💀 AVANÇADO
                </BtnMain>
                <BtnMain variant="dark" onClick={() => setShowDiffSelect(false)}>
                  ← VOLTAR
                </BtnMain>
              </>
            )}
          </div>

          {/* Ranking */}
          {rankings.length > 0 && (
            <div style={{
              marginTop: 12,
              background: "rgba(0,229,255,.04)",
              border: "1px solid rgba(0,229,255,.1)",
              borderRadius: 8,
              padding: "10px 14px",
              textAlign: "left",
            }}>
              <div style={{
                fontFamily: "Bangers, cursive",
                fontSize: 14,
                color: "#00e5ff",
                letterSpacing: 2,
                marginBottom: 6,
                textAlign: "center",
              }}>🏆 RANKING</div>
              {rankings.map((r, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "3px 0",
                  borderBottom: i < rankings.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                }}>
                  <span style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: 11,
                    color: i === 0 ? "#ffd54f" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#8a95aa",
                  }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {r.player_name}
                  </span>
                  <span style={{
                    fontFamily: "Oswald, sans-serif",
                    fontSize: 10,
                    color: "#69f0ae",
                    letterSpacing: 1,
                  }}>
                    {r.wins}W / {r.losses}L
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Auth buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {user ? (
              <div
                onClick={onPerfil}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "rgba(0,229,255,.06)",
                  border: "1px solid rgba(0,229,255,.15)",
                  borderRadius: 6, padding: "8px 12px", cursor: "pointer",
                  fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#00e5ff",
                }}
              >
                👤 {user.email?.split("@")[0] || "Perfil"}
              </div>
            ) : (
              <div
                onClick={onLogin}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "rgba(0,229,255,.06)",
                  border: "1px solid rgba(0,229,255,.15)",
                  borderRadius: 6, padding: "8px 12px", cursor: "pointer",
                  fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#00e5ff",
                }}
              >
                🔑 LOGIN / CADASTRO
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 16,
              fontFamily: "Oswald, sans-serif",
              color: "rgba(255,255,255,.15)",
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            EVOLUÇÃO • SWARMS • NARRAÇÃO PT-BR
          </div>
        </div>
      </div>
    </div>
  );
}
