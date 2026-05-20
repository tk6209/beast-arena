import React from "react";

interface EnergyBarProps {
  energia: number;
  max?: number;
  isMyTurn?: boolean;
}

export default function EnergyBar({ energia, max = 6, isMyTurn = true }: EnergyBarProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 8px",
      background: "rgba(0,229,255,.04)",
      borderRadius: 8,
      border: "1px solid rgba(0,229,255,.1)",
    }}>
      <span style={{
        fontFamily: "Oswald, sans-serif",
        fontSize: 9,
        color: "#8a95aa",
        letterSpacing: 1,
        minWidth: 54,
      }}>
        ⚡ ENERGIA
      </span>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < energia;
          return (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: filled
                  ? isMyTurn
                    ? "linear-gradient(135deg, #00e5ff, #7eb8ff)"
                    : "rgba(0,229,255,.3)"
                  : "rgba(255,255,255,.06)",
                border: `1px solid ${filled ? "rgba(0,229,255,.5)" : "rgba(255,255,255,.08)"}`,
                boxShadow: filled && isMyTurn ? "0 0 6px rgba(0,229,255,.4)" : "none",
                transition: "all .2s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {filled && isMyTurn && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, rgba(255,255,255,.3) 0%, transparent 60%)",
                  borderRadius: 3,
                }} />
              )}
            </div>
          );
        })}
      </div>

      <span style={{
        fontFamily: "Bangers, cursive",
        fontSize: 12,
        color: isMyTurn ? "#00e5ff" : "#8a95aa",
        letterSpacing: 1,
        minWidth: 20,
        textAlign: "right",
      }}>
        {energia}/{max}
      </span>
    </div>
  );
}
