import React, { useEffect, useState } from "react";

/**
 * OrientationGate — força landscape no padrão de jogos comerciais (Brawl Stars, Clash Royale).
 *
 * Estratégia em duas camadas:
 *   1. Tenta travar a orientação via Screen Orientation API (funciona em PWA/Android instalado).
 *   2. Fallback universal: quando o lock não é suportado (iOS Safari, navegador mobile comum),
 *      e o dispositivo está em retrato + é touch, exibe um overlay bloqueante pedindo
 *      para girar o aparelho. Sem rotação CSS (que quebrava as unidades vw/vh) — o jogo
 *      só renderiza de fato em landscape.
 *
 * Desktop nunca é bloqueado: janelas verticais são válidas e não há como "girar".
 */
function getIsBlockingPortrait(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  // pointer:coarse + (sem hover) ≈ dispositivo touch / mobile real.
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches;
  return isPortrait && isTouch;
}

export default function OrientationGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState<boolean>(() => getIsBlockingPortrait());

  useEffect(() => {
    // 1) Tenta o lock nativo (PWA/Android). `lock` é experimental e não consta
    // no lib.dom padrão, por isso o cast estreito abaixo.
    const so = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    so?.lock?.("landscape").catch(() => {
      /* iOS Safari / desktop não suportam — fallback de overlay assume */
    });

    // 2) Observa mudanças de orientação para o fallback.
    const update = () => setBlocked(getIsBlockingPortrait());
    update();

    const mq = window.matchMedia("(orientation: portrait)");
    // addEventListener moderno; addListener legado p/ Safari antigo.
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return (
    <>
      {children}
      {blocked && <RotateOverlay />}
    </>
  );
}

function RotateOverlay() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gire o dispositivo para o modo paisagem"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "32px 24px",
        textAlign: "center",
        background:
          "radial-gradient(ellipse at 50% 30%, #1a0f4a 0%, #0a0820 55%, #050316 100%)",
        color: "#e8e6ff",
        // Cobre toda a tela mesmo com barras do navegador / notch.
        paddingTop: "max(32px, env(safe-area-inset-top))",
        paddingBottom: "max(32px, env(safe-area-inset-bottom))",
        animation: "rotGateFade 0.25s ease",
      }}
    >
      <style>{`
        @keyframes rotGateFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rotGateSpin {
          0%, 18%   { transform: rotate(0deg); }
          42%, 78%  { transform: rotate(-90deg); }
          100%      { transform: rotate(-90deg); }
        }
        @keyframes rotGateGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(183,148,255,0.45)); }
          50%      { filter: drop-shadow(0 0 26px rgba(56,225,255,0.65)); }
        }
        @keyframes rotGateDots {
          0%, 100% { opacity: .25; }
          50%      { opacity: 1; }
        }
      `}</style>

      {/* Telefone que gira de retrato para paisagem em loop */}
      <div
        style={{
          animation: "rotGateGlow 2.4s ease-in-out infinite",
        }}
      >
        <svg
          width="92"
          height="92"
          viewBox="0 0 64 64"
          fill="none"
          style={{
            animation: "rotGateSpin 3s cubic-bezier(0.65,0,0.35,1) infinite",
            transformOrigin: "50% 50%",
          }}
          aria-hidden="true"
        >
          <rect
            x="22"
            y="6"
            width="20"
            height="52"
            rx="5"
            stroke="#b794ff"
            strokeWidth="3"
            fill="rgba(124,58,237,0.18)"
          />
          <line
            x1="29"
            y1="51"
            x2="35"
            y2="51"
            stroke="#38e1ff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
            fontSize: 34,
            letterSpacing: 2,
            lineHeight: 1.05,
            color: "#b794ff",
            textShadow: "0 0 18px rgba(124,58,237,0.55)",
          }}
        >
          Gire o dispositivo
        </h2>
        <p
          style={{
            margin: "10px auto 0",
            maxWidth: 320,
            fontSize: 15,
            lineHeight: 1.5,
            color: "rgba(232,230,255,0.75)",
          }}
        >
          O <strong style={{ color: "#38e1ff" }}>Beast Arena</strong> foi feito para a
          tela na horizontal. Vire o aparelho para o modo paisagem para jogar.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8 }} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#38e1ff",
              animation: `rotGateDots 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
