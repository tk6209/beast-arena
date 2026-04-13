import React, { useEffect } from "react";
import { lerSala, salvarSala } from "@/game/engine";
import { falar } from "@/game/voice";
import { pageBg } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";

interface TelaEntrarProps {
  salaId: string;
  monstroConv: string;
  onEntrar: (salaId: string, slot: number) => void;
}

export default function TelaEntrar({ salaId, monstroConv, onEntrar }: TelaEntrarProps) {
  useEffect(() => {
    const sala = lerSala(salaId);
    if (!sala) {
      alert("Sala não encontrada. Verifique o código.");
      return;
    }
    const atualizado = {
      ...sala,
      slots: [...(sala.slots || []), { slot: 1, monstro: monstroConv, nome: "Convidado" }],
      status: "pronto",
    };
    salvarSala(salaId, atualizado);
    falar(`Você entrou na sala ${salaId.split("").join(" ")}. Prepare-se para a batalha.`, true);
    const t = setTimeout(() => onEntrar(salaId, 1), 1200);
    return () => clearTimeout(t);
  }, [salaId, monstroConv, onEntrar]);

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 24,
            color: "#00e5ff",
            textAlign: "center",
            letterSpacing: 2,
          }}
        >
          ⚡ Conectando à sala {salaId}...
        </div>
      </div>
    </div>
  );
}
