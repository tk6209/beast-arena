import React, { useEffect, useState } from "react";
import { falar } from "@/game/voice";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { sfxVitoria, sfxDerrota } from "@/game/sfx";
import { supabase } from "@/integrations/supabase/client";
import type { Jogador } from "@/game/engine";

interface TelaResultadoProps {
  vencedor: Jogador | null;
  onRecomecar: () => void;
  onSair: () => void;
}

export default function TelaResultado({ vencedor, onRecomecar, onSair }: TelaResultadoProps) {
  const g = !!vencedor;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (g) sfxVitoria(); else sfxDerrota();
    falar(
      g
        ? "Parabéns. Você venceu a batalha. Seu monstro é o mais poderoso."
        : "Que pena. Você foi derrotado. Tente novamente.",
      true
    );
    setTimeout(() => setShow(true), 600);

    // Save to ranking
    const playerName = vencedor?.nome || "Jogador";
    (async () => {
      try {
        // Try to find existing ranking for this player name
        const { data } = await supabase
          .from("rankings")
          .select("id, wins, losses")
          .eq("player_name", g ? playerName : "Jogador")
          .limit(1);

        if (data && data.length > 0) {
          const row = data[0];
          await supabase.from("rankings").update({
            wins: g ? row.wins + 1 : row.wins,
            losses: g ? row.losses : row.losses + 1,
          }).eq("id", row.id);
        } else {
          await supabase.from("rankings").insert({
            player_name: g ? playerName : "Jogador",
            wins: g ? 1 : 0,
            losses: g ? 0 : 1,
          });
        }
      } catch (e) { console.error("Ranking save error:", e); }
    })();
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
      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(.7) translateY(30px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shimmer { 0%,100%{background-position:-200% center;} 50%{background-position:200% center;} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes particleFly {
          0% { opacity:1; transform:translate(0,0) scale(1); }
          100% { opacity:0; transform:translate(var(--px),var(--py)) scale(0); }
        }
      `}</style>
      <ChromeNoise />

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 20,
        fontFamily: "Nunito, sans-serif",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Particles */}
        {show && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 6, height: 6,
            borderRadius: "50%",
            background: g ? "#00e5ff" : "#ef4444",
            top: "45%", left: "50%",
            "--px": `${(Math.random() - 0.5) * 200}px`,
            "--py": `${(Math.random() - 0.5) * 200}px`,
            animation: `particleFly ${1 + Math.random()}s ease forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
          } as any} />
        ))}

        {/* Trophy / Skull */}
        <div style={{
          fontSize: 80,
          filter: `drop-shadow(0 0 40px ${g ? "#00e5ff" : "#ef4444"})`,
          animation: show ? "float 3s ease-in-out infinite" : "none",
        }}>
          {g ? "🏆" : "💀"}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "Bangers, cursive",
          fontSize: 52,
          letterSpacing: 3,
          color: g ? "#ffd54f" : "#ff6b6b",
          textShadow: `0 0 30px ${g ? "#ffd54f88" : "#ff6b6b88"}`,
          animation: show ? "popIn .5s ease forwards" : "none",
          opacity: show ? 1 : 0,
        }}>
          {g ? "VITÓRIA!" : "DERROTA!"}
        </div>

        <div style={{ color: "#8a95aa", fontSize: 14, marginTop: 4, marginBottom: 24 }}>
          {g ? `${vencedor?.nome || "Você"} venceu a batalha!` : "Você foi derrotado. Tente novamente!"}
        </div>

        {/* Popup card */}
        {show && (
          <div style={{
            background: "linear-gradient(145deg, #111827ee, #1f2937ee)",
            border: `1px solid ${g ? "#00e5ff44" : "#ef444444"}`,
            borderRadius: 16,
            padding: "24px 20px",
            width: "100%",
            maxWidth: 300,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            animation: "popIn .5s cubic-bezier(.34,1.56,.64,1) forwards",
            boxShadow: `0 0 40px ${g ? "#00e5ff22" : "#ef444422"}`,
          }}>
            <BtnMain variant="blue" onClick={onRecomecar}>
              🔄 RECOMEÇAR
            </BtnMain>
            <BtnMain variant="dark" onClick={onSair}>
              🚪 SAIR
            </BtnMain>
          </div>
        )}
      </div>
    </div>
  );
}
