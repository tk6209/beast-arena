import React, { useState, useEffect } from "react";
import { MONSTROS } from "@/game/data";
import { salvarSala, lerSala } from "@/game/engine";
import { falar } from "@/game/voice";
import { pageBg, glassPanel } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import QRCode from "@/components/game/QRCode";

interface TelaLobbyProps {
  monstroHost: string;
  onBatalha: (salaId: string, slot: number) => void;
}

export default function TelaLobby({ monstroHost, onBatalha }: TelaLobbyProps) {
  const [salaId] = useState(() => Math.random().toString(36).slice(2, 7).toUpperCase());
  const [pronto, setPronto] = useState(false);
  const [sala, setSala] = useState<any>(null);

  const base = window.location.href.split("?")[0];
  const urlConvidado = `${base}?sala=${salaId}&slot=1`;

  useEffect(() => {
    const s = {
      id: salaId,
      status: "aguardando",
      slots: [{ slot: 0, monstro: monstroHost, nome: "Anfitrião" }],
      ts: Date.now(),
    };
    salvarSala(salaId, s);
    setSala(s);

    falar(
      `Sala criada. Código ${salaId.split("").join(" ")}. Mostre o QR Code para o adversário.`,
      true
    );

    const bc = new BroadcastChannel(`bac_${salaId}`);
    bc.onmessage = () => {
      const at = lerSala(salaId);
      setSala(at);
      if (at?.status === "pronto") {
        setPronto(true);
        falar("Adversário conectado. Pronto para batalhar.", true);
      }
    };

    return () => bc.close();
  }, [salaId, monstroHost]);

  return (
    <div style={pageBg()}>
      <ChromeNoise />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "Nunito, sans-serif",
          gap: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 26,
            color: "#00e5ff",
            letterSpacing: 2,
          }}
        >
          🎱 SALA MULTIJOGADOR
        </div>

        <div
          style={{
            ...glassPanel("#00e5ff55", {
              padding: 18,
              textAlign: "center" as const,
              boxShadow: "0 0 32px rgba(0,229,255,.16), 0 18px 44px rgba(0,0,0,.35)",
            }),
          }}
        >
          <div style={{ fontSize: 11, color: "#8fa0bc", marginBottom: 8, letterSpacing: 1 }}>
            ESCANEIE PARA ENTRAR
          </div>
          <QRCode valor={urlConvidado} tam={190} />
          <div
            style={{
              marginTop: 12,
              fontFamily: "Bangers, cursive",
              fontSize: 24,
              color: "#ffd54f",
              letterSpacing: 5,
            }}
          >
            {salaId}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#6d7a92",
              marginTop: 6,
              wordBreak: "break-all" as const,
              maxWidth: 240,
            }}
          >
            Ou acesse: <span style={{ color: "#8ddfff" }}>{urlConvidado}</span>
          </div>
        </div>

        <div
          style={{
            ...glassPanel(pronto ? "#00e67655" : "#2d3646", {
              padding: "12px 18px",
              textAlign: "center" as const,
              minWidth: 240,
            }),
          }}
        >
          {!pronto ? (
            <div
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: 12,
                color: "#94a0b5",
                animation: "pulseOpacity 1.5s infinite",
              }}
            >
              ⏳ Aguardando adversário...
            </div>
          ) : (
            <div
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: 16,
                color: "#00e676",
                letterSpacing: 1,
              }}
            >
              ✅ Adversário conectado!
            </div>
          )}

          {sala?.slots?.map((j: any) => (
            <div key={j.slot} style={{ fontSize: 11, color: "#8190a9", marginTop: 5 }}>
              Slot {j.slot + 1}:{" "}
              {j.monstro
                ? `${MONSTROS[j.monstro]?.nome} ${MONSTROS[j.monstro]?.emoji}`
                : "aguardando"}
            </div>
          ))}
        </div>

        <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 10 }}>
          {pronto && (
            <BtnMain variant="blue" onClick={() => onBatalha(salaId, 0)}>
              ⚔️ INICIAR BATALHA
            </BtnMain>
          )}
          <BtnMain variant="dark" onClick={() => window.location.reload()}>
            ← VOLTAR
          </BtnMain>
        </div>
      </div>
    </div>
  );
}
