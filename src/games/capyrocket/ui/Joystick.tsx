import { useRef, useState } from "react";

interface JoystickProps {
  side: "left" | "right";
  color: string;
  label: string;
  onVector: (x: number, y: number) => void; // -1..1 (y para baixo = +)
}

const RADIUS = 54;

/** Joystick de toque (base fixa + manopla), multi-touch (um por dedo). */
export default function Joystick({ side, color, label, onVector }: JoystickProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function track(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    onVector(dx / RADIUS, dy / RADIUS);
  }

  function release() {
    pid.current = null;
    setKnob({ x: 0, y: 0 });
    onVector(0, 0);
  }

  return (
    <div
      ref={ref}
      className={`capy-stick capy-stick--${side}`}
      style={{ borderColor: color }}
      onPointerDown={(e) => {
        e.preventDefault();
        pid.current = e.pointerId;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        track(e);
      }}
      onPointerMove={(e) => {
        if (pid.current === e.pointerId) track(e);
      }}
      onPointerUp={(e) => {
        if (pid.current === e.pointerId) release();
      }}
      onPointerCancel={(e) => {
        if (pid.current === e.pointerId) release();
      }}
    >
      <div className="capy-stick__label">{label}</div>
      <div className="capy-stick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)`, background: color }} />
    </div>
  );
}
