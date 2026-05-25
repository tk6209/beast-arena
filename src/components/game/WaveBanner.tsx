import { useEffect, useState } from "react";
import { useWaveAtiva } from "@/hooks/useWaveAtiva";
import { useUserRole } from "@/hooks/useUserRole";

function diasAte(dateIso: string) {
  const target = new Date(dateIso + "T00:00:00");
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Banner exibido na tela principal quando há uma onda em pré-lançamento.
 * Oculto para admin (não precisa ver hype). Visível a jogadores comuns e VIP.
 */
export default function WaveBanner() {
  const { proximaOnda } = useWaveAtiva();
  const { isAdmin } = useUserRole();
  const [, force] = useState(0);

  // Recalcula countdown a cada 1h
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  if (isAdmin || !proximaOnda) return null;
  const dias = diasAte(proximaOnda.release_date);
  const label = dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;

  return (
    <div
      className="relative mx-auto my-3 max-w-xl rounded-xl border px-4 py-2 text-center"
      style={{
        background:
          "linear-gradient(90deg, rgba(0,229,255,0.08), rgba(0,229,255,0.18), rgba(0,229,255,0.08))",
        borderColor: "rgba(0,229,255,0.6)",
        boxShadow: "0 0 24px rgba(0,229,255,0.35)",
        color: "#bff7ff",
        fontFamily: "Bangers, system-ui, sans-serif",
        letterSpacing: 1,
        animation: "waveBannerPulse 2.4s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes waveBannerPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(0,229,255,0.25); }
          50%      { box-shadow: 0 0 32px rgba(0,229,255,0.55); }
        }
      `}</style>
      <span style={{ fontSize: 18 }}>
        🔥 Nova onda chegando {label}: <strong>{proximaOnda.nome}</strong>
      </span>
      {proximaOnda.tema && (
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
          Tema: {proximaOnda.tema}
        </div>
      )}
    </div>
  );
}