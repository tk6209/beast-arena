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
  readonly state: InputState = { jumpQueued: false, moveX: 0, crouch: false };
  private cb: InputCallbacks | null = null;
  private left = false;
  private right = false;

  private recomputeMoveX(): void {
    this.state.moveX = this.right && !this.left ? 1 : this.left && !this.right ? -1 : 0;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case "Space":
      case "ArrowUp":
      case "KeyW":
        if (e.repeat) return;
        e.preventDefault();
        this.cb?.onJump();
        break;
      case "ArrowLeft":
      case "KeyA":
        e.preventDefault();
        this.left = true;
        this.recomputeMoveX();
        break;
      case "ArrowRight":
      case "KeyD":
        e.preventDefault();
        this.right = true;
        this.recomputeMoveX();
        break;
      case "ArrowDown":
      case "KeyS":
        e.preventDefault();
        this.state.crouch = true;
        break;
      case "Enter":
      case "KeyR":
        if (e.repeat) return;
        this.cb?.onRestart();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        this.left = false;
        this.recomputeMoveX();
        break;
      case "ArrowRight":
      case "KeyD":
        this.right = false;
        this.recomputeMoveX();
        break;
      case "ArrowDown":
      case "KeyS":
        this.state.crouch = false;
        break;
    }
  };

  attach(cb: InputCallbacks): void {
    this.cb = cb;
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.left = false;
    this.right = false;
    this.state.moveX = 0;
    this.state.crouch = false;
    this.cb = null;
  }
}
