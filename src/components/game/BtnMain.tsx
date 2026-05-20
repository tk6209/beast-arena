import React, { useState } from "react";
import { actionBtn } from "@/game/styles";

interface BtnMainProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
}

const VARIANT_MAP: Record<string, [string, string, string]> = {
  blue:   ["#1044a7", "#1e88e5", "#00e5ff"],
  green:  ["#14532d", "#2e7d32", "#69f0ae"],
  purple: ["#4a148c", "#7b1fa2", "#ce93d8"],
  gold:   ["#6b4a00", "#d97706", "#ffd54f"],
  red:    ["#5a0b0b", "#d32f2f", "#ff8a80"],
  dark:   ["#10131a", "#151921", "#3a4354"],
};

export default function BtnMain({ children, onClick, variant = "blue", disabled = false, style = {}, title }: BtnMainProps) {
  const [pressed, setPressed] = useState(false);
  const [c1, c2, border] = VARIANT_MAP[variant] || VARIANT_MAP.blue;

  return (
    <button
      disabled={disabled}
      title={title}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...actionBtn(c1, c2, border, disabled),
        width: "100%",
        // Norman: immediate visual feedback on press (affordance)
        transform: pressed && !disabled ? "scale(0.97) translateY(1px)" : undefined,
        boxShadow: pressed && !disabled
          ? `0 2px 8px ${border}33`
          : disabled ? "none" : `0 8px 24px ${border}33, inset 0 1px 0 rgba(255,255,255,.14)`,
        transition: "transform .1s ease, box-shadow .1s ease, opacity .18s ease",
        // Minimum touch target 44px (Norman/Apple HIG)
        minHeight: 44,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
