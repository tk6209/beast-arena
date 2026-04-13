import React from "react";
import { actionBtn } from "@/game/styles";

interface BtnMainProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const VARIANT_MAP: Record<string, [string, string, string]> = {
  blue: ["#1044a7", "#1e88e5", "#00e5ff"],
  green: ["#14532d", "#2e7d32", "#69f0ae"],
  purple: ["#4a148c", "#7b1fa2", "#ce93d8"],
  gold: ["#6b4a00", "#d97706", "#ffd54f"],
  red: ["#5a0b0b", "#d32f2f", "#ff8a80"],
  dark: ["#10131a", "#151921", "#3a4354"],
};

export default function BtnMain({ children, onClick, variant = "blue", disabled = false, style = {} }: BtnMainProps) {
  const [c1, c2, border] = VARIANT_MAP[variant] || VARIANT_MAP.blue;

  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        ...actionBtn(c1, c2, border, disabled),
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
