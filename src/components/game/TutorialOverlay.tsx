import React, { useState } from "react";
import { createPortal } from "react-dom";
import BtnMain from "./BtnMain";

interface TutorialStep {
  title: string;
  text: string;
  emoji: string;
  highlight?: string; // CSS selector hint
}

const STEPS: TutorialStep[] = [
  {
    title: "BEM-VINDO À ARENA!",
    text: "Beast Arena é um jogo de cartas onde você controla um monstro e luta contra adversários. Cada turno você tem 30 segundos para agir!",
    emoji: "🏟️",
  },
  {
    title: "ESCOLHA SEU PODER",
    text: "No início da batalha, escolha um Poder Elemental. Ele define o estilo do seu monstro: Fogo para ataque, Gelo para defesa, Raio para velocidade...",
    emoji: "🔥",
  },
  {
    title: "JOGUE CARTAS",
    text: "Toque em uma carta da mão para selecioná-la, depois toque em JOGAR. Cada carta tem um efeito: ataque, defesa, cura ou evolução!",
    emoji: "🃏",
  },
  {
    title: "SWARMS E EVOLUÇÃO",
    text: "Capture Swarms para ganhar bônus passivos. Evolua seu monstro para ficar mais forte! Cartas de evolução aumentam HP e ataque.",
    emoji: "🐾",
  },
  {
    title: "VENÇA A BATALHA!",
    text: "Reduza o HP do adversário a zero para vencer. Fique atento aos buffs e debuffs — eles aparecem acima da barra de vida. Boa sorte!",
    emoji: "🏆",
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const ui = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(3,8,16,.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <style>{`
        @keyframes tutorialSlideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tutorialEmoji {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-5deg); }
          75% { transform: scale(1.2) rotate(5deg); }
        }
      `}</style>
      <div
        key={step}
        style={{
          maxWidth: 320, width: "100%",
          background: "linear-gradient(180deg, rgba(15,25,45,.95), rgba(5,10,25,.98))",
          border: "1px solid rgba(0,229,255,.2)",
          borderRadius: 20, padding: 28,
          textAlign: "center",
          animation: "tutorialSlideIn .4s ease forwards",
          boxShadow: "0 20px 60px rgba(0,0,0,.5), 0 0 40px rgba(0,229,255,.08)",
        }}
      >
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 4, borderRadius: 2,
              background: i === step ? "#00e5ff" : i < step ? "rgba(0,229,255,.4)" : "rgba(255,255,255,.1)",
              transition: "all .3s ease",
            }} />
          ))}
        </div>

        {/* Emoji */}
        <div style={{
          fontSize: 56, marginBottom: 12,
          animation: "tutorialEmoji 1.5s ease-in-out infinite",
        }}>
          {current.emoji}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "Bangers, cursive", fontSize: 22, color: "#00e5ff",
          letterSpacing: 2, marginBottom: 10,
          textShadow: "0 0 12px rgba(0,229,255,.4)",
        }}>
          {current.title}
        </div>

        {/* Text */}
        <div style={{
          fontFamily: "Nunito, sans-serif", fontSize: 13, color: "#94a3b8",
          lineHeight: 1.6, marginBottom: 20,
        }}>
          {current.text}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 && (
            <BtnMain variant="dark" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>
              ← VOLTAR
            </BtnMain>
          )}
          <BtnMain
            variant={isLast ? "gold" : "blue"}
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            style={{ flex: 1 }}
          >
            {isLast ? "⚔️ BATALHAR!" : "PRÓXIMO →"}
          </BtnMain>
        </div>

        {/* Skip */}
        <button
          onClick={onComplete}
          style={{
            marginTop: 12, background: "none", border: "none",
            color: "#4a5568", fontSize: 11, cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
          }}
        >
          Pular tutorial
        </button>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(ui, document.body) : ui;
}
