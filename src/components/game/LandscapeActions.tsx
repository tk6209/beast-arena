import { useEffect, useState } from "react";
import { canLockOrientation, enterLandscape, isPhysicallyLandscape } from "@/lib/landscape";

/**
 * Ações do aviso "Gire o dispositivo", compartilhadas pelos jogos em paisagem:
 * - botão que entra em tela cheia e trava em paisagem (gira mesmo com a rotação
 *   automática do Android desligada);
 * - aviso destacado quando o sensor mostra o aparelho deitado mas a tela não girou.
 */
export default function LandscapeActions({ accent, text = "#0a0820" }: { accent: string; text?: string }) {
  const [tilted, setTilted] = useState(false);
  const [failed, setFailed] = useState(false);
  const lockable = canLockOrientation();

  useEffect(() => {
    let since = 0;
    const onTilt = (e: DeviceOrientationEvent) => {
      const flat = isPhysicallyLandscape(e.beta, e.gamma);
      if (!flat) {
        since = 0;
        setTilted(false);
        return;
      }
      if (!since) since = e.timeStamp || performance.now();
      // ~0,8 s deitado e a tela ainda em retrato: a rotação automática está desligada
      if ((e.timeStamp || performance.now()) - since > 800) setTilted(true);
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 320 }}>
      {lockable && (
        <button
          type="button"
          onClick={async () => setFailed(!(await enterLandscape()))}
          style={{
            minHeight: 48,
            padding: "0 22px",
            borderRadius: 14,
            border: "none",
            background: accent,
            color: text,
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: 0.3,
            boxShadow: `0 8px 26px ${accent}55`,
            cursor: "pointer",
          }}
        >
          Jogar em tela cheia na horizontal
        </button>
      )}
      <p
        role={tilted || failed ? "alert" : undefined}
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: tilted || failed ? "#ffe08a" : "rgba(232,230,255,0.6)",
          fontWeight: tilted || failed ? 700 : 500,
        }}
      >
        {tilted
          ? "Seu aparelho já está deitado, mas a tela não girou: a Rotação automática está desligada. Toque no botão acima ou ative a Rotação automática no painel rápido (deslize de cima para baixo)."
          : "Se a tela não girar, ative a Rotação automática no painel rápido do celular."}
      </p>
    </div>
  );
}
