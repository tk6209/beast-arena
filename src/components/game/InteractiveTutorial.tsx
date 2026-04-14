import React, { useState, useEffect, useRef } from "react";
import BtnMain from "./BtnMain";

interface TutorialStep {
  title: string;
  text: string;
  emoji: string;
  /** Data attribute to target on the battle screen */
  targetAttr?: string;
  /** Position hint for the spotlight */
  position?: "top" | "center" | "bottom";
}

const STEPS: TutorialStep[] = [
  {
    title: "BEM-VINDO À ARENA!",
    text: "Beast Arena é um jogo de cartas onde você controla um monstro e luta contra adversários!",
    emoji: "🏟️",
    position: "center",
  },
  {
    title: "BARRAS DE VIDA",
    text: "Cada monstro tem uma barra de HP. Reduza a do adversário a zero para vencer!",
    emoji: "💚",
    targetAttr: "data-tutorial-hp",
    position: "top",
  },
  {
    title: "SUA MÃO DE CARTAS",
    text: "Estas são suas cartas. Toque em uma para selecioná-la. Cada carta tem um efeito diferente!",
    emoji: "🃏",
    targetAttr: "data-tutorial-hand",
    position: "bottom",
  },
  {
    title: "TIPOS DE CARTA",
    text: "⚔️ Ataque causa dano. 🛡️ Defesa protege. 💖 Cura recupera HP. ✨ Evolução fortalece seu monstro!",
    emoji: "📋",
    position: "center",
  },
  {
    title: "JOGANDO UMA CARTA",
    text: "Selecione uma carta e toque em JOGAR. Você tem 30 segundos por turno!",
    emoji: "⚡",
    targetAttr: "data-tutorial-actions",
    position: "bottom",
  },
  {
    title: "TURNOS E ROUNDS",
    text: "A cada turno, novas cartas são distribuídas. O timer mostra o tempo restante.",
    emoji: "⏱️",
    targetAttr: "data-tutorial-timer",
    position: "center",
  },
  {
    title: "PODERES ESPECIAIS",
    text: "Escolha um Poder no início da batalha! 🔥 Fogo, ❄️ Gelo, ⚡ Raio — cada um muda seus atributos.",
    emoji: "🔮",
    position: "center",
  },
  {
    title: "VENÇA A BATALHA!",
    text: "Use estratégia! Combine ataques, defesas e curas. Capture Swarms para bônus. Boa sorte!",
    emoji: "🏆",
    position: "center",
  },
];

interface InteractiveTutorialProps {
  onComplete: () => void;
}

export default function InteractiveTutorial({ onComplete }: InteractiveTutorialProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Find and highlight target element
  useEffect(() => {
    if (!current.targetAttr) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[${current.targetAttr}]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [step, current.targetAttr]);

  const handleNext = () => {
    if (isLast) onComplete();
    else setStep(s => s + 1);
  };

  const spotlightPadding = 12;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
    }}>
      {/* Dark overlay with optional spotlight cutout */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <mask id="tutorial-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - spotlightPadding}
                y={targetRect.top - spotlightPadding}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(3,8,16,.88)"
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* Highlight border around target */}
      {targetRect && (
        <div style={{
          position: "absolute",
          left: targetRect.left - spotlightPadding,
          top: targetRect.top - spotlightPadding,
          width: targetRect.width + spotlightPadding * 2,
          height: targetRect.height + spotlightPadding * 2,
          border: "2px solid #00e5ff",
          borderRadius: 12,
          boxShadow: "0 0 20px rgba(0,229,255,.4), inset 0 0 20px rgba(0,229,255,.1)",
          pointerEvents: "none",
          animation: "tutorialPulse 1.5s ease-in-out infinite",
        }} />
      )}

      <style>{`
        @keyframes tutorialSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tutorialPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,229,255,.4), inset 0 0 20px rgba(0,229,255,.1); }
          50% { box-shadow: 0 0 30px rgba(0,229,255,.6), inset 0 0 30px rgba(0,229,255,.2); }
        }
        @keyframes tutorialEmoji {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      {/* Content card — positioned based on target */}
      <div
        key={step}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          ...(current.position === "top" ? { bottom: 40 } :
              current.position === "bottom" ? { top: 40 } :
              { top: "50%", transform: "translate(-50%, -50%)" }),
          maxWidth: 320, width: "calc(100% - 32px)",
          background: "linear-gradient(180deg, rgba(15,25,45,.97), rgba(5,10,25,.99))",
          border: "1px solid rgba(0,229,255,.25)",
          borderRadius: 16, padding: 24,
          textAlign: "center",
          animation: "tutorialSlideIn .35s ease forwards",
          boxShadow: "0 16px 48px rgba(0,0,0,.6), 0 0 30px rgba(0,229,255,.08)",
          zIndex: 10000,
        }}
      >
        {/* Step dots */}
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 12 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 6, height: 4, borderRadius: 2,
              background: i === step ? "#00e5ff" : i < step ? "rgba(0,229,255,.4)" : "rgba(255,255,255,.1)",
              transition: "all .3s ease",
            }} />
          ))}
        </div>

        {/* Emoji */}
        <div style={{
          fontSize: 44, marginBottom: 8,
          animation: "tutorialEmoji 2s ease-in-out infinite",
        }}>
          {current.emoji}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "Bangers, cursive", fontSize: 18, color: "#00e5ff",
          letterSpacing: 2, marginBottom: 8,
          textShadow: "0 0 10px rgba(0,229,255,.3)",
        }}>
          {current.title}
        </div>

        {/* Text */}
        <div style={{
          fontFamily: "Nunito, sans-serif", fontSize: 13, color: "#94a3b8",
          lineHeight: 1.6, marginBottom: 16,
        }}>
          {current.text}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 && (
            <BtnMain variant="dark" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>
              ←
            </BtnMain>
          )}
          <BtnMain
            variant={isLast ? "gold" : "blue"}
            onClick={handleNext}
            style={{ flex: 2 }}
          >
            {isLast ? "⚔️ COMEÇAR!" : "PRÓXIMO →"}
          </BtnMain>
        </div>

        {/* Skip */}
        <button
          onClick={onComplete}
          style={{
            marginTop: 10, background: "none", border: "none",
            color: "#4a5568", fontSize: 11, cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
          }}
        >
          Pular tutorial
        </button>
      </div>
    </div>
  );
}
