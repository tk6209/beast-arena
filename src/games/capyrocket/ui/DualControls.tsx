import { useRef } from "react";
import Joystick from "./Joystick";

interface DualControlsProps {
  onMove: (dir: -1 | 0 | 1) => void;
  onCrouch: (on: boolean) => void;
  onAim: (x: -1 | 0 | 1, y: -1 | 0 | 1) => void;
  onJump: () => void;
}

const DEAD = 0.4; // zona morta

/**
 * Controles duplos estilo Call of Duty Mobile:
 *  - Esquerda: MOVER (x = recuar/avançar, ↑ = pular, ↓ = agachar).
 *  - Direita: MIRA (direção do tiro em 8 sentidos; centro = atira pra frente).
 */
export default function DualControls({ onMove, onCrouch, onAim, onJump }: DualControlsProps) {
  const jumped = useRef(false);

  return (
    <div className="capy-controls">
      <Joystick
        side="left"
        color="#4ad6ff"
        label="MOVER"
        onVector={(x, y) => {
          onMove(x < -DEAD ? -1 : x > DEAD ? 1 : 0);
          onCrouch(y > 0.55);
          if (y < -0.55 && !jumped.current) {
            jumped.current = true;
            onJump();
          }
          if (y > -0.4) jumped.current = false;
        }}
      />
      <Joystick
        side="right"
        color="#ffcf4a"
        label="MIRA"
        onVector={(x, y) => {
          onAim(x < -DEAD ? -1 : x > DEAD ? 1 : 0, y < -DEAD ? -1 : y > DEAD ? 1 : 0);
        }}
      />
    </div>
  );
}
