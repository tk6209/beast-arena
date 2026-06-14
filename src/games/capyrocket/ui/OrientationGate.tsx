import React, { useEffect, useState } from "react";

/**
 * Gate de landscape — cópia mínima e vendorizada do gate do Beast Arena, com
 * copy própria do CapiRocket Dash. Tenta travar a orientação (PWA/Android) e,
 * no fallback (iOS/navegador mobile em retrato + touch), exibe um overlay.
 * Desktop nunca é bloqueado.
 */
function isBlockingPortrait(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches;
  return isPortrait && isTouch;
}

export default function OrientationGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState<boolean>(() => isBlockingPortrait());

  useEffect(() => {
    const so = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    so?.lock?.("landscape").catch(() => {
      /* não suportado — fallback de overlay assume */
    });

    const update = () => setBlocked(isBlockingPortrait());
    update();
    const mq = window.matchMedia("(orientation: portrait)");
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
        gap: 24,
        padding: "max(32px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom))",
        textAlign: "center",
        background: "radial-gradient(ellipse at 50% 30%, #1b2436 0%, #0a0e18 60%, #05070e 100%)",
        color: "#e8eefc",
        animation: "rotGateFade 0.25s ease",
      }}
    >
      <style>{`
        @keyframes rotGateFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rotGateSpin {
          0%, 18% { transform: rotate(0deg); }
          42%, 78% { transform: rotate(-90deg); }
          100% { transform: rotate(-90deg); }
        }
        @keyframes rotGateGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(255,209,102,0.4)); }
          50% { filter: drop-shadow(0 0 26px rgba(255,179,71,0.6)); }
        }
      `}</style>
      <div style={{ animation: "rotGateGlow 2.4s ease-in-out infinite" }}>
        <svg
          width="92"
          height="92"
          viewBox="0 0 64 64"
          fill="none"
          style={{ animation: "rotGateSpin 3s cubic-bezier(0.65,0,0.35,1) infinite", transformOrigin: "50% 50%" }}
          aria-hidden="true"
        >
          <rect x="22" y="6" width="20" height="52" rx="5" stroke="#ffd166" strokeWidth="3" fill="rgba(255,194,60,0.15)" />
          <line x1="29" y1="51" x2="35" y2="51" stroke="#ffb347" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <h2
          style={{
            margin: 0,
            fontFamily: "'Black Han Sans', 'Bangers', sans-serif",
            fontSize: 34,
            letterSpacing: 1,
            color: "#ffd166",
            textShadow: "0 0 18px rgba(255,194,60,0.5)",
          }}
        >
          Gire o dispositivo
        </h2>
        <p style={{ margin: "10px auto 0", maxWidth: 320, fontSize: 15, lineHeight: 1.5, color: "rgba(232,238,252,0.75)" }}>
          O <strong style={{ color: "#ffb347" }}>CapiRocket Dash</strong> foi feito para a
          tela na horizontal. Vire o aparelho para o modo paisagem para jogar.
        </p>
      </div>
    </div>
  );
}
