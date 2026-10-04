import React, { useEffect, useState } from "react";

type OrientationState = {
  blocked: boolean;
  ready: boolean;
};

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void> | void;
};

/**
 * OrientationGate — força landscape no padrão de jogos comerciais (Brawl Stars, Clash Royale).
 *
 * Regras:
 *   1. Em mobile/touch + portrait, mostra o overlay e NÃO monta o runtime do jogo.
 *      Isso evita inicializar canvas/layout com dimensões de retrato no Android.
 *   2. Assim que landscape é detectado, o runtime monta uma única vez.
 *   3. Se o usuário voltar a portrait durante a partida, o overlay reaparece sem
 *      desmontar o jogo, preservando a sessão.
 *   4. Screen Orientation API é apenas melhoria progressiva; falhas de lock nunca
 *      podem impedir o bootstrap.
 */
function isLikelyMobileTouch(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const touchPoints = navigator.maxTouchPoints ?? 0;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // pointer: coarse cobre Android/iOS modernos. O fallback de UA + touchPoints
  // atende WebViews que reportam media queries de ponteiro de forma inconsistente.
  return coarsePointer || (touchPoints > 0 && mobileUserAgent);
}

function isPortraitViewport(): boolean {
  if (typeof window === "undefined") return false;

  // No Android, matchMedia("(orientation)") pode ficar momentaneamente stale
  // durante orientationchange. As dimensões reais do viewport são a fonte
  // primária; o media query fica apenas como fallback para viewport quadrado/zero.
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (width > 0 && height > 0 && width !== height) {
    return height > width;
  }

  return window.matchMedia?.("(orientation: portrait)").matches ?? false;
}

function getIsBlockingPortrait(): boolean {
  return isLikelyMobileTouch() && isPortraitViewport();
}

export default function OrientationGate({ children }: { children: React.ReactNode }) {
  const [orientationState, setOrientationState] = useState<OrientationState>(() => {
    const blocked = getIsBlockingPortrait();
    return { blocked, ready: !blocked };
  });

  useEffect(() => {
    // Tenta o lock nativo quando disponível (principalmente PWA Android).
    // Alguns WebViews antigos expõem lock() mas retornam void ou lançam
    // sincronamente; ambos os casos são tratados sem quebrar o app.
    const orientation = window.screen?.orientation as LockableScreenOrientation | undefined;
    try {
      const lockResult = orientation?.lock?.("landscape");
      if (lockResult && typeof (lockResult as Promise<void>).catch === "function") {
        (lockResult as Promise<void>).catch(() => {
          /* lock não permitido/suportado — overlay + rotação manual assumem */
        });
      }
    } catch {
      /* implementação parcial da Screen Orientation API — fallback assume */
    }

    let settleTimer: number | undefined;

    const refresh = () => {
      const blocked = getIsBlockingPortrait();
      setOrientationState((previous) => ({
        blocked,
        ready: previous.ready || !blocked,
      }));
    };

    const update = () => {
      // Atualização imediata para browsers que já atualizaram innerWidth/innerHeight.
      refresh();

      // orientationchange pode chegar antes do novo viewport no Android.
      // Revalida após o settle sem depender de um segundo evento.
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(refresh, 250);
    };

    update();

    const portraitQuery = window.matchMedia?.("(orientation: portrait)");
    if (portraitQuery?.addEventListener) portraitQuery.addEventListener("change", update);
    else portraitQuery?.addListener?.(update);

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    orientation?.addEventListener?.("change", update);

    return () => {
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      if (portraitQuery?.removeEventListener) portraitQuery.removeEventListener("change", update);
      else portraitQuery?.removeListener?.(update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      orientation?.removeEventListener?.("change", update);
    };
  }, []);

  return (
    <>
      {orientationState.ready && children}
      {orientationState.blocked && <RotateOverlay />}
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
