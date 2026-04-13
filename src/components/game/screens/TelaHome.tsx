import React, { useEffect } from "react";
import { pageBg } from "@/game/styles";
import { falar } from "@/game/voice";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";

interface TelaHomeProps {
  onIniciar: (modo: string) => void;
}

export default function TelaHome({ onIniciar }: TelaHomeProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      falar("Bem-vindo ao Beast Animation Cards. Escolha seu modo de batalha.", true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={pageBg()}>
      <style>{`
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0,229,255,.45)); }
          50% { filter: drop-shadow(0 0 26px rgba(0,229,255,.8)); }
        }
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseOpacity {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes shakeHit {
          0%,100%{ transform: translateX(0); }
          25%{ transform: translateX(-8px); }
          75%{ transform: translateX(8px); }
        }
      `}</style>

      <ChromeNoise />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(90deg, #12376f, #1777d8)",
              border: "1px solid #00e5ff",
              borderRadius: 999,
              padding: "5px 16px",
              marginBottom: 16,
              boxShadow: "0 0 24px rgba(0,229,255,.25)",
            }}
          >
            <span style={{ fontSize: 13 }}>⚗️</span>
            <span
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: 13,
                color: "#00e5ff",
                letterSpacing: 2,
              }}
            >
              MR BEAST LAB
            </span>
          </div>

          <div
            style={{
              fontSize: 66,
              marginBottom: 6,
              animation: "glowPulse 2.2s ease-in-out infinite, floatSoft 3.2s ease-in-out infinite",
            }}
          >
            🐯
          </div>

          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: 52,
              margin: "0 0 8px",
              letterSpacing: 2.4,
              lineHeight: 0.88,
              background: "linear-gradient(135deg, #ffd54f 0%, #ff8f00 48%, #ff5252 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            BEAST
            <br />
            ANIMATION
            <br />
            CARDS
          </h1>

          <div
            style={{
              fontFamily: "Nunito, sans-serif",
              color: "#9ec8ff",
              fontSize: 12,
              letterSpacing: 2,
              marginBottom: 28,
              textTransform: "uppercase",
            }}
          >
            Hyper Fusion Series
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <BtnMain variant="blue" onClick={() => onIniciar("duel")}>
              ⚔️ DUELO — vs IA
            </BtnMain>
            <BtnMain variant="green" onClick={() => onIniciar("multi")}>
              🌐 MULTIJOGADOR — QR Code
            </BtnMain>
          </div>

          <div
            style={{
              marginTop: 24,
              fontFamily: "Nunito, sans-serif",
              color: "#6a7488",
              fontSize: 10,
              letterSpacing: 1.2,
            }}
          >
            NARRADO EM PORTUGUÊS • EVOLUÇÃO ×3 • SWARMS AUXILIARES
          </div>
        </div>
      </div>
    </div>
  );
}
