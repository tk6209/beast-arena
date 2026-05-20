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
      background: "rgba(240,180,41,.04)",
      borderRadius: 8,
      border: "1px solid rgba(240,180,41,.15)",
    }}>
      <span style={{
        fontFamily: "'Rajdhani','Barlow Condensed',sans-serif",
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
                    ? "linear-gradient(135deg, #f0b429, #ff8c00)"
                    : "rgba(240,180,41,.3)"
                  : "rgba(255,255,255,.06)",
                border: `1px solid ${filled ? "rgba(0,229,255,.5)" : "rgba(255,255,255,.08)"}`,
                boxShadow: filled && isMyTurn ? "0 0 8px rgba(240,180,41,.5)" : "none",
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
        fontFamily: "'Bebas Neue','Barlow Condensed',cursive",
        fontSize: 12,
        color: isMyTurn ? "#f0b429" : "#5a4a3a",
        letterSpacing: 1,
        minWidth: 20,
        textAlign: "right",
      }}>
        {energia}/{max}
      </span>
    </div>
  );
}
