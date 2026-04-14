import React, { useEffect, useState } from "react";
import { pageBg } from "@/game/styles";
import { falar } from "@/game/voice";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { MONSTER_IMAGES } from "@/game/monsterImages";
import { MONSTROS } from "@/game/data";

interface TelaHomeProps {
  onIniciar: (modo: string) => void;
}

const monsterKeys = Object.keys(MONSTROS);

export default function TelaHome({ onIniciar }: TelaHomeProps) {
  const [bgIdx, setBgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      falar("Bem-vindo ao Beast Arena. Escolha seu modo de batalha.", true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Cycle background monsters
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setBgIdx((i) => (i + 1) % monsterKeys.length);
        setFade(true);
      }, 800);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
      `}</style>

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
        {/* Scan line effect */}
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
              animation: "titleReveal .8s ease forwards",
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

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <BtnMain variant="blue" onClick={() => onIniciar("duel")}>
              ⚔️ DUELO vs IA
            </BtnMain>
            <BtnMain variant="green" onClick={() => onIniciar("multi")}>
              🌐 MULTIJOGADOR
            </BtnMain>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 28,
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
