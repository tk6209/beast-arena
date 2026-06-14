import type { InputState } from "./types";

interface InputCallbacks {
  onJump: () => void;
  onRestart: () => void;
}

/**
 * Gerencia o ÚNICO controle do jogo: pular. Teclado (Space/↑/W) e toque (via
 * Game.queueJump) escrevem na mesma ação. Enter/R reiniciam no game-over.
 */
export class InputManager {
  readonly state: InputState = { jumpQueued: false };
  private cb: InputCallbacks | null = null;
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    switch (e.code) {
      case "Space":
      case "ArrowUp":
      case "KeyW":
        e.preventDefault();
        this.cb?.onJump();
        break;
      case "Enter":
      case "KeyR":
        this.cb?.onRestart();
        break;
    }
  };

  attach(cb: InputCallbacks): void {
    this.cb = cb;
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    this.cb = null;
  }
}
