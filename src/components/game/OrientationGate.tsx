import React, { useEffect, useState } from "react";

/**
 * OrientationGate — força landscape SEMPRE.
 * 1) Tenta travar via Screen Orientation API (Android/PWA).
 * 2) Se o viewport estiver em portrait (iOS Safari, browsers desktop estreitos),
 *    rotaciona o app 90° via CSS e troca w/h, de modo que o jogo sempre
 *    renderize em paisagem — sem overlay, sem checagem de sensor.
 */
export default function OrientationGate({ children }: { children: React.ReactNode }) {
  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);

  useEffect(() => {
    const so: any = (screen as any).orientation;
    if (so?.lock) {
      so.lock("landscape").catch(() => { /* sem suporte — usamos rotação CSS */ });
    }
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const isPortrait = vh > vw;

  if (!isPortrait) return <>{children}</>;

  // Rotaciona o app: trata altura como largura e vice-versa.
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: vh,
        height: vw,
        transform: `rotate(90deg) translateY(-${vw}px)`,
        transformOrigin: "top left",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}