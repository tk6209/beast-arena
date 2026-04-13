import React, { useEffect } from "react";
import { falar } from "@/game/voice";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import type { Jogador } from "@/game/engine";

interface TelaResultadoProps {
  vencedor: Jogador | null;
  onRejogo: () => void;
}

export default function TelaResultado({ vencedor, onRejogo }: TelaResultadoProps) {
  const g = vencedor?.humano;

  useEffect(() => {
    falar(
      g
        ? "Parabéns. Você venceu a batalha. Seu monstro é o mais poderoso."
        : "Que pena. Você foi derrotado. Tente novamente.",
      true
    );
  }, [g]);

  return (
    <div
      style={{
        ...pageBg(),
        background: g
          ? "radial-gradient(ellipse at center, #143a5a 0%, #09111f 52%, #020207 100%)"
          : "radial-gradient(ellipse at center, #4a1212 0%, #13090c 52%, #020207 100%)",
      }}
    >
      <ChromeNoise />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 14,
          padding: 20,
          fontFamily: "Nunito, sans-serif",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 76,
            filter: `drop-shadow(0 0 30px ${g ? "#00e5ff" : "#ef4444"})`,
          }}
        >
          {g ? "🏆" : "💀"}
        </div>

        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 50,
            letterSpacing: 3,
            color: g ? "#ffd54f" : "#ff6b6b",
          }}
        >
          {g ? "VITÓRIA!" : "DERROTA!"}
        </div>

        <div style={{ color: "#8a95aa", fontSize: 13 }}>
          {vencedor?.nome} venceu a batalha!
        </div>

        <div style={{ width: "100%", maxWidth: 280 }}>
          <BtnMain variant="blue" onClick={onRejogo}>
            ↺ JOGAR NOVAMENTE
          </BtnMain>
        </div>
      </div>
    </div>
  );
}
