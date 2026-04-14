import React, { useEffect } from "react";
import { PODERES } from "@/game/data";
import { falar, markGesture } from "@/game/voice";
import { sfxTap, sfxPoder } from "@/game/sfx";
import { glassPanel } from "@/game/styles";

interface ModalPoderProps {
  onEscolha: (pid: string) => void;
}

export default function ModalPoder({ onEscolha }: ModalPoderProps) {
  useEffect(() => {
    falar("Escolha o poder do seu monstro. Esta decisão é permanente.", true);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          ...glassPanel("#00e5ff55", {
            padding: 20,
            maxWidth: 420,
            width: "92%",
            textAlign: "center" as const,
            position: "relative",
            overflow: "hidden",
          }),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at top, rgba(0,229,255,.12), transparent 34%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 11,
            letterSpacing: 3,
            color: "#00e5ff",
            marginBottom: 6,
          }}
        >
          MR BEAST LAB
        </div>

        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 24,
            color: "#ffd54f",
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          ⚗️ ESCOLHA SEU PODER
        </div>

        <div
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: 11,
            color: "#8b94a8",
            marginBottom: 16,
          }}
        >
          Isso define como seu monstro evolui durante a batalha.
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          {Object.values(PODERES).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                markGesture();
                sfxTap();
                falar(`Poder ${p.nome} selecionado. Ataque mais ${p.atkB}, defesa mais ${p.defB}, vida mais ${p.hpB}.`, true);
                onEscolha(p.id);
              }}
              style={{
                background: `linear-gradient(135deg, ${p.bg1}, ${p.bg2})`,
                border: `1px solid ${p.cor}`,
                borderRadius: 14,
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "center" as const,
                minWidth: 96,
                boxShadow: `0 0 18px ${p.cor}33`,
                color: "#fff",
              }}
            >
              <div style={{ fontSize: 24 }}>{p.emoji}</div>
              <div
                style={{
                  fontFamily: "Bangers, cursive",
                  fontSize: 15,
                  letterSpacing: 1,
                  marginTop: 2,
                }}
              >
                {p.nome}
              </div>
              <div
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: 9,
                  color: "rgba(255,255,255,.82)",
                  marginTop: 4,
                  lineHeight: 1.35,
                }}
              >
                ATK +{p.atkB}
                <br />
                DEF +{p.defB}
                <br />
                HP +{p.hpB}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
