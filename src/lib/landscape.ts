/**
 * Paisagem no celular.
 *
 * `screen.orientation.lock("landscape")` só funciona no Chrome/Samsung Internet do
 * Android quando a página está em TELA CHEIA e a chamada vem de um toque do jogador.
 * Chamado sozinho, ao abrir a página, ele sempre falha. Com tela cheia + trava, o
 * Android gira o jogo mesmo com a "Rotação automática" desligada (padrão na Samsung).
 */

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null };
type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };

/** Deve ser chamado num handler de toque/clique. true se a tela travou em paisagem. */
export async function enterLandscape(): Promise<boolean> {
  const doc = document as FsDocument;
  const el = document.documentElement as FsElement;
  try {
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else await el.webkitRequestFullscreen?.();
    }
  } catch {
    /* tela cheia negada/indisponível (iOS Safari): tenta só a trava */
  }
  try {
    const so = screen.orientation as LockableOrientation | undefined;
    if (!so?.lock) return false;
    await so.lock("landscape");
    return true;
  } catch {
    return false;
  }
}

/** Navegador expõe a trava de orientação (Android). No iOS não existe: só girando o aparelho. */
export function canLockOrientation(): boolean {
  const so = typeof screen !== "undefined" ? (screen.orientation as LockableOrientation | undefined) : undefined;
  return typeof so?.lock === "function";
}

/**
 * O aparelho está fisicamente deitado? Usa a inclinação lateral (gamma) do sensor:
 * perto de ±90° e com pouca inclinação frente/trás (beta). Serve para perceber
 * quando o jogador já virou o celular mas a tela não girou (rotação automática off).
 */
export function isPhysicallyLandscape(beta: number | null, gamma: number | null): boolean {
  if (beta === null || gamma === null) return false;
  return Math.abs(gamma) > 60 && Math.abs(beta) < 35;
}
