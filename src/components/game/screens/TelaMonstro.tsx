import React, { useState } from "react";
import { MONSTROS } from "@/game/data";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";

interface TelaMonstroProps {
  onConfirmar: (monstroId: string) => void;
  titulo?: string;
}

export default function TelaMonstro({ onConfirmar, titulo = "ESCOLHA SEU MONSTRO" }: TelaMonstroProps) {
  const [pick, setPick] = useState<string | null>(null);

  return (
    <div style={pageBg()}>
      <ChromeNoise />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          padding: "22px 14px 28px",
          fontFamily: "Nunito, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: 24,
              color: "#00e5ff",
              letterSpacing: 2,
            }}
          >
            ⚗️ {titulo}
          </div>
          <div style={{ fontSize: 11, color: "#8a95aa" }}>
            Cada monstro possui uma habilidade única
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          {Object.values(MONSTROS).map((m) => {
            const s = pick === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setPick(m.id)}
                style={{
                  width: 145,
                  borderRadius: 18,
                  overflow: "hidden",
                  border: `1px solid ${s ? "#ffd54f" : "rgba(255,255,255,.08)"}`,
                  background: "linear-gradient(180deg, rgba(18,20,40,.92), rgba(8,9,18,.96))",
                  cursor: "pointer",
                  boxShadow: s
                    ? `0 0 0 1px #ffd54f, 0 0 28px ${m.glow}55`
                    : "0 10px 24px rgba(0,0,0,.28)",
                  transition: "all .2s ease",
                  transform: s ? "translateY(-6px) scale(1.03)" : "none",
                }}
              >
                <div
                  style={{
                    background: `linear-gradient(135deg, ${m.bg1}, ${m.bg2})`,
                    padding: "8px 10px 5px",
                    borderBottom: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Bangers, cursive",
                      fontSize: 16,
                      color: "#fff",
                      letterSpacing: 1,
                    }}
                  >
                    {m.nome}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.78)" }}>HP {m.hp}</div>
                </div>

                <div
                  style={{
                    background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,.12), transparent 32%), linear-gradient(160deg, ${m.bg2}66, rgba(2,6,15,.85))`,
                    height: 72,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                    position: "relative",
                  }}
                >
                  <span style={{ filter: `drop-shadow(0 0 10px ${m.glow})` }}>{m.emoji}</span>
                </div>

                <div style={{ padding: "8px 9px 10px" }}>
                  <div style={{ fontSize: 9.4, color: "#c8d0e2", lineHeight: 1.65 }}>
                    <div>
                      ⚔️ {m.atk} &nbsp; 🛡️ {m.def} &nbsp; ❤️ {m.hp}
                    </div>
                    <div style={{ color: "#ffd54f", fontStyle: "italic" }}>{m.hab}</div>
                    <div style={{ color: "#7e879a", fontSize: 8.2 }}>{m.habD}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 26, maxWidth: 320, marginInline: "auto" }}>
          <BtnMain
            variant={pick ? "blue" : "dark"}
            disabled={!pick}
            onClick={() => pick && onConfirmar(pick)}
          >
            {pick ? "✅ CONFIRMAR" : "Selecione um monstro"}
          </BtnMain>
        </div>
      </div>
    </div>
  );
}
