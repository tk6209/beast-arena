import React, { useState } from "react";
import { DS } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";

interface AccountPromptProps {
  onCriarConta: () => void;
  onAgora_Nao: () => void;
  wins?: number;
}

const CSS = `
  @keyframes promptIn  { 0%{opacity:0;transform:scale(.85) translateY(30px)} 65%{transform:scale(1.02) translateY(-4px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes trophySpin{ 0%{transform:rotate(-8deg) scale(.8);opacity:0} 60%{transform:rotate(4deg) scale(1.12)} 100%{transform:rotate(0) scale(1);opacity:1} }
  @keyframes fadeOverlay{from{opacity:0} to{opacity:1}}
`;

const PERKS = [
  { icon: "💾", text: "Salva seu progresso e conquistas" },
  { icon: "🏆", text: "Aparece no ranking global" },
  { icon: "🎴", text: "Guarda suas cartas colecionadas" },
  { icon: "⚔️", text: "Desafia amigos online" },
];

export default function AccountPrompt({ onCriarConta, onAgora_Nao, wins = 1 }: AccountPromptProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,.88)",
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
      animation: "fadeOverlay .3s ease",
    }}>
      <style>{CSS}</style>

      <div style={{
        width: "100%", maxWidth: 340,
        background: `linear-gradient(160deg,${DS.bg2},${DS.bg1})`,
        border: `1.5px solid ${DS.gold}44`,
        borderRadius: 20,
        overflow: "hidden",
        animation: "promptIn .55s cubic-bezier(.34,1.56,.64,1) both",
        boxShadow: `0 24px 80px rgba(0,0,0,.8),0 0 40px ${DS.gold}18`,
      }}>
        {/* Gold header bar */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg,transparent,${DS.gold},${DS.ember},${DS.gold},transparent)`,
        }} />

        <div style={{ padding: "24px 22px 20px" }}>
          {/* Trophy */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 52, animation: "trophySpin .7s .1s cubic-bezier(.34,1.56,.64,1) both" }}>
              🏆
            </div>
            <div style={{
              fontFamily: "'Black Han Sans','Bangers',cursive",
              fontSize: 26, color: DS.gold, letterSpacing: 2,
              textShadow: `0 0 20px ${DS.gold}66`,
              marginTop: 6, lineHeight: 1,
            }}>
              {wins === 1 ? "PRIMEIRA VITÓRIA!" : `${wins} VITÓRIAS!`}
            </div>
            <div style={{
              fontFamily: "'Oswald',sans-serif",
              fontSize: 13, color: "#8a7a6a",
              marginTop: 6, lineHeight: 1.4,
            }}>
              Você está indo muito bem!{"\n"}
              Crie uma conta para salvar seu progresso.
            </div>
          </div>

          {/* Perks list */}
          <div style={{
            background: `${DS.bg0}88`,
            border: `1px solid ${DS.bg3}`,
            borderRadius: 12, padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 9,
            marginBottom: 18,
          }}>
            {PERKS.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                <span style={{
                  fontFamily: "'Oswald',sans-serif",
                  fontSize: 12, color: "#c8b89a", fontWeight: 500,
                }}>
                  {p.text}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <BtnMain variant="gold" onClick={onCriarConta}>
              🎮 CRIAR CONTA GRÁTIS
            </BtnMain>
            <button
              onClick={onAgora_Nao}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Oswald',sans-serif",
                fontSize: 12, color: "#4a3a2a",
                padding: "8px", letterSpacing: 1,
                textDecoration: "underline",
              }}>
              Continuar sem conta por enquanto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
