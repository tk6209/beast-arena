import React, { useEffect } from "react";

/**
 * OrientationGate — pede landscape ao SO via Screen Orientation API (PWA/Android).
 * Sem overlay, sem rotação CSS (que quebrava o sistema de unidades vw/vh).
 * Os componentes renderizam diretamente, responsivos ao viewport real,
 * em qualquer orientação ou tamanho.
 */
export default function OrientationGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const so: any = (screen as any).orientation;
    if (so?.lock) {
      so.lock("landscape").catch(() => { /* iOS Safari / desktop não suportam — segue normal */ });
    }
  }, []);

  return <>{children}</>;
}