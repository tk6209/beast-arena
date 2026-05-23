import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { PODERES } from "@/game/data";
import { falar, markGesture } from "@/game/voice";
import { sfxTap, sfxPoder } from "@/game/sfx";
import { glassPanel } from "@/game/styles";

interface ModalPoderProps {
  onEscolha: (pid: string) => void;
}

const poderes = Object.values(PODERES);

export default function ModalPoder({ onEscolha }: ModalPoderProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStart = useRef<number | null>(null);

  const p = poderes[idx];

  useEffect(() => {
    falar("Escolha o poder do seu monstro. Deslize para ver as opções.", true);
  }, []);

  useEffect(() => {
    if (dir) {
      setAnimating(true);
      const t = setTimeout(() => {
        setAnimating(false);
        setDir(null);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [dir, idx]);

  function goTo(newIdx: number) {
    if (animating) return;
    markGesture();
    sfxTap();
    setDir(newIdx > idx ? "left" : "right");
    setIdx(newIdx);
    const pw = poderes[newIdx];
    falar(`${pw.nome}. Ataque mais ${pw.atkB}, defesa mais ${pw.defB}, vida mais ${pw.hpB}.`);
  }

  function prev() {
    goTo(idx === 0 ? poderes.length - 1 : idx - 1);
  }
  function next() {
    goTo(idx === poderes.length - 1 ? 0 : idx + 1);
  }

  function handleChoose() {
    markGesture();
    sfxPoder();
    falar(`Poder ${p.nome} selecionado!`, true);
    onEscolha(p.id);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(diff) > 50) {
      if (diff < 0) next();
      else prev();
    }
  }

  const slideAnim =
    dir === "left"
      ? "poderSlideLeft .4s cubic-bezier(.22,1,.36,1) forwards"
      : dir === "right"
      ? "poderSlideRight .4s cubic-bezier(.22,1,.36,1) forwards"
      : "none";

  const ui = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 200,
        backdropFilter: "blur(10px)",
      }}
    >
      <style>{`
        @keyframes poderSlideLeft {
          0% { opacity: 0; transform: translateX(60px) scale(.8); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes poderSlideRight {
          0% { opacity: 0; transform: translateX(-60px) scale(.8); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes emojiFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }
        @keyframes orbGlow {
          0%, 100% { opacity: .3; transform: scale(1); }
          50% { opacity: .6; transform: scale(1.15); }
        }
      `}</style>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 16, flexShrink: 0 }}>
        <div style={{ fontFamily: "Bangers, cursive", fontSize: 22, color: "#ffd54f", letterSpacing: 2 }}>
          ⚡ ESCOLHA SEU PODER
        </div>
        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8b94a8", marginTop: 2 }}>
          Esta escolha define os bônus do seu monstro
        </div>
        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 9, color: "#4a5568", marginTop: 2 }}>
          ← Deslize para ver opções →
        </div>
      </div>

      {/* Carousel */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 400,
          padding: "0 12px",
          boxSizing: "border-box",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Left arrow */}
        <button
          onClick={prev}
          style={{
            position: "absolute",
            left: 8,
            zIndex: 10,
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 999,
            width: 34,
            height: 34,
            cursor: "pointer",
            color: "#fff",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          ‹
        </button>

        {/* Power card */}
        <div
          key={idx}
          style={{
            width: "min(260px, 70vw)",
            borderRadius: 20,
            overflow: "hidden",
            background: `linear-gradient(135deg, ${p.bg1}, ${p.bg2})`,
            border: `2px solid ${p.cor}88`,
            boxShadow: `0 0 40px ${p.cor}33, 0 12px 40px rgba(0,0,0,.5)`,
            animation: slideAnim,
            position: "relative",
          }}
        >
          {/* Orb glow background */}
          <div
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: 999,
              background: `radial-gradient(circle, ${p.cor}44, transparent 70%)`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "orbGlow 2.5s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          {/* Emoji */}
          <div
            style={{
              textAlign: "center",
              fontSize: 64,
              padding: "24px 0 8px",
              filter: `drop-shadow(0 0 16px ${p.cor})`,
              animation: "emojiFloat 3s ease-in-out infinite",
              position: "relative",
              zIndex: 1,
            }}
          >
            {p.emoji}
          </div>

          {/* Name */}
          <div
            style={{
              textAlign: "center",
              fontFamily: "Bangers, cursive",
              fontSize: 28,
              color: "#fff",
              letterSpacing: 2,
              textShadow: `0 0 12px ${p.cor}`,
              position: "relative",
              zIndex: 1,
            }}
          >
            {p.nome}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "space-around", padding: "16px 20px 20px", position: "relative", zIndex: 1 }}>
            <PoderStat label="ATK" value={`+${p.atkB}`} color="#ff7961" />
            <PoderStat label="DEF" value={`+${p.defB}`} color="#82b1ff" />
            <PoderStat label="HP" value={`+${p.hpB}`} color="#ef5350" />
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          style={{
            position: "absolute",
            right: 8,
            zIndex: 10,
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 999,
            width: 34,
            height: 34,
            cursor: "pointer",
            color: "#fff",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          ›
        </button>
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
        {poderes.map((pw, i) => (
          <button
            key={pw.id}
            onClick={() => i !== idx && goTo(i)}
            style={{
              width: i === idx ? 18 : 8,
              height: 8,
              borderRadius: 999,
              background: i === idx ? p.cor : "rgba(255,255,255,.15)",
              border: "none",
              cursor: "pointer",
              transition: "all .3s ease",
              boxShadow: i === idx ? `0 0 8px ${p.cor}` : "none",
            }}
          />
        ))}
      </div>

      {/* Choose button */}
      <div style={{ marginTop: 16, width: "min(260px, 70vw)", textAlign: "center" }}>
        <button
          onClick={handleChoose}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 14,
            border: `2px solid ${p.cor}`,
            background: `linear-gradient(135deg, ${p.bg1}dd, ${p.bg2}dd)`,
            color: "#fff",
            fontFamily: "Bangers, cursive",
            fontSize: 18,
            letterSpacing: 2,
            cursor: "pointer",
            boxShadow: `0 0 20px ${p.cor}33`,
            transition: "all .2s",
          }}
        >
          ⚡ ESCOLHER {p.nome.toUpperCase()}
        </button>
        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 9, color: "#4a5568", marginTop: 6 }}>
          Você pode trocar de poder em batalhas futuras
        </div>
      </div>
    </div>
  );
}

function PoderStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,.6)", fontFamily: "Oswald, sans-serif", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: "Bangers, cursive", color, letterSpacing: 1 }}>{value}</div>
    </div>
  );
}
