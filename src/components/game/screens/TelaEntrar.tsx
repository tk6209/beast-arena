import React, { useEffect, useState } from "react";
import { MONSTROS } from "@/game/data";
import { falar } from "@/game/voice";
import { pageBg } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import {
  buscarSessao,
  entrarComoJogador,
} from "@/game/multiplayer";

interface TelaEntrarProps {
  salaId: string;
  monstroConv: string;
  onEntrar: (salaId: string, slot: number) => void;
}

export default function TelaEntrar({ salaId, monstroConv, onEntrar }: TelaEntrarProps) {
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function entrar() {
      try {
        // salaId here is actually the join_code from the URL
        const sessao = await buscarSessao(salaId);
        if (!sessao) {
          setErro("Sala não encontrada. Verifique o código.");
          return;
        }
        if (cancelled) return;

        const m = MONSTROS[monstroConv];
        await entrarComoJogador(
          sessao.id,
          1,
          monstroConv,
          "Convidado",
          m?.hp || 100,
          m?.hp || 100
        );
        if (cancelled) return;

        falar(`Você entrou na sala ${salaId.split("").join(" ")}. Prepare-se para a batalha.`, true);

        // Small delay then proceed to battle using the actual session UUID
        setTimeout(() => {
          if (!cancelled) onEntrar(sessao.id, 1);
        }, 1200);
      } catch (err: any) {
        console.error("Erro ao entrar:", err);
        setErro(err.message || "Erro ao entrar na sala.");
      }
    }

    entrar();
    return () => { cancelled = true; };
  }, [salaId, monstroConv, onEntrar]);

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <div
        style={{
          minHeight: "100dvh",
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
            color: erro ? "#ff5252" : "#00e5ff",
            textAlign: "center",
            letterSpacing: 2,
            padding: 20,
          }}
        >
          {erro ? `❌ ${erro}` : `⚡ Conectando à sala ${salaId}...`}
        </div>
      </div>
    </div>
  );
}
