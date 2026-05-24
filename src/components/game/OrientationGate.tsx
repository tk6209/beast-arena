import React, { useEffect } from "react";

/**
 * OrientationGate — tenta travar landscape via Screen Orientation API.
 * Não verifica sensor: sempre renderiza o jogo, sem overlay de "gire o celular".
 */
export default function OrientationGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const so: any = (screen as any).orientation;
    if (so?.lock) {
      so.lock("landscape").catch(() => { /* iOS Safari não suporta — segue normalmente */ });
    }
  }, []);

  return <>{children}</>;
}