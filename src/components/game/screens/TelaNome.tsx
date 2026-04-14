import React, { useState } from "react";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";

interface TelaNomeProps {
  onConfirmar: (nome: string) => void;
}

export default function TelaNome({ onConfirmar }: TelaNomeProps) {
  const [nome, setNome] = useState("");

  const handleSubmit = () => {
    const trimmed = nome.trim().slice(0, 20) || "Jogador";
    onConfirmar(trimmed);
  };

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: "100%",
          maxWidth: 340,
          textAlign: "center",
          animation: "fadeUp .5s ease forwards",
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 12,
            filter: "drop-shadow(0 0 20px #00e5ff)",
          }}>⚔️</div>

          <h2 style={{
            fontFamily: "Bangers, cursive",
            fontSize: 32,
            color: "#e8f0ff",
            letterSpacing: 2,
            margin: "0 0 8px",
            background: "linear-gradient(180deg, #e8f0ff 0%, #7eb8ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            SEU NOME
          </h2>

          <div style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: 13,
            color: "#8a95aa",
            marginBottom: 24,
          }}>
            Digite seu apelido para o ranking
          </div>

          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value.slice(0, 20))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ex: DragonSlayer"
            maxLength={20}
            autoFocus
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 18,
              fontFamily: "Nunito, sans-serif",
              background: "rgba(0,229,255,.06)",
              border: "1px solid rgba(0,229,255,.25)",
              borderRadius: 10,
              color: "#e8f0ff",
              outline: "none",
              textAlign: "center",
              letterSpacing: 1,
              boxSizing: "border-box",
              marginBottom: 16,
            }}
          />

          <div style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: 10,
            color: "rgba(255,255,255,.3)",
            marginBottom: 16,
          }}>
            {nome.trim().length}/20 caracteres
          </div>

          <BtnMain variant="blue" onClick={handleSubmit}>
            CONTINUAR →
          </BtnMain>
        </div>
      </div>
    </div>
  );
}
