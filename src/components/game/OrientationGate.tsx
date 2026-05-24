import React, { useEffect, useState } from "react";

/**
 * OrientationGate — força modo paisagem.
 * Se o aparelho estiver em portrait + for mobile, mostra overlay pedindo para girar.
 */
export default function OrientationGate({ children }: { children: React.ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Considera mobile se menor lado < 600 (tablets pequenos / phones)
      const isSmall = Math.min(w, h) < 600;
      setIsPortrait(isSmall && h > w);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // Tenta travar a orientação via Screen Orientation API (Android/Chrome PWA)
  useEffect(() => {
    const so: any = (screen as any).orientation;
    if (so?.lock) {
      so.lock("landscape").catch(() => { /* iOS Safari não suporta — usamos overlay */ });
    }
  }, []);

  if (!isPortrait) return <>{children}</>;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "radial-gradient(ellipse at center, #1a0f4a 0%, #0a0820 60%, #050316 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center",
      fontFamily: "'Bebas Neue', sans-serif",
      color: "#e8e6ff",
    }}>
      <div style={{
        fontSize: 88, marginBottom: 20,
        animation: "rotateHint 2s ease-in-out infinite",
        filter: "drop-shadow(0 0 24px #38e1ff)",
      }}>📱</div>
      <div style={{
        fontSize: 42, letterSpacing: 3, color: "#38e1ff",
        textShadow: "0 0 18px rgba(56,225,255,.7)", marginBottom: 12,
      }}>GIRE O CELULAR</div>
      <div style={{
        fontFamily: "'Barlow', sans-serif",
        fontSize: 16, color: "#a8a6cf", maxWidth: 320, lineHeight: 1.45,
      }}>
        Beast Arena é jogado em <b style={{ color: "#b794ff" }}>modo paisagem</b>.
        Vire o aparelho para começar a batalha.
      </div>
      <style>{`
        @keyframes rotateHint {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(-90deg); }
        }
      `}</style>
    </div>
  );
}