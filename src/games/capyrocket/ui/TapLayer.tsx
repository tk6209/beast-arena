import { useRef } from "react";

interface TapLayerProps {
  onTap: () => void;
  onMove?: (dir: -1 | 0 | 1) => void;
  onCrouch?: (on: boolean) => void;
}

/**
 * Camada de toque:
 *  - Toque curto = pular.
 *  - Arrastar para cima = pular.
 *  - Arrastar para baixo (mantido) = agachar (solta ao tirar o dedo).
 *  - Arrastar para a esquerda / direita = recuar / acelerar (enquanto mantido).
 */
const SWIPE_THRESHOLD = 46;

export default function TapLayer({ onTap, onMove, onCrouch }: TapLayerProps) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const dirRef = useRef<-1 | 0 | 1>(0);
  const crouchRef = useRef(false);
  const movedRef = useRef(false);

  function setMove(dir: -1 | 0 | 1) {
    if (dirRef.current !== dir) {
      dirRef.current = dir;
      onMove?.(dir);
    }
  }
  function setCrouch(on: boolean) {
    if (crouchRef.current !== on) {
      crouchRef.current = on;
      onCrouch?.(on);
    }
  }

  return (
    <div
      className="capy-tap-layer"
      aria-hidden="true"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
        movedRef.current = false;
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
        movedRef.current = true;
        // Vertical domina se for claramente mais forte que horizontal.
        if (Math.abs(dy) > Math.abs(dx) * 1.1) {
          if (dy < -SWIPE_THRESHOLD) {
            setMove(0);
            setCrouch(false);
            onTap(); // pulo via swipe up
            start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
          } else {
            setMove(0);
            setCrouch(true);
          }
        } else {
          setCrouch(false);
          setMove(dx > 0 ? 1 : -1);
        }
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        setMove(0);
        setCrouch(false);
        if (!s) return;
        const dt = performance.now() - s.t;
        if (!movedRef.current && dt < 280) onTap();
      }}
      onPointerCancel={() => {
        start.current = null;
        setMove(0);
        setCrouch(false);
      }}
    />
  );
}
