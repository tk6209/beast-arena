import React from "react";
import { SWARM_RARITY_STYLES, type SwarmData } from "@/game/data";

interface SwarmBadgeProps {
  swarm?: SwarmData | null;
  empty?: boolean;
}

export default function SwarmBadge({ swarm, empty = false }: SwarmBadgeProps) {
  if (empty || !swarm) {
    return (
      <div
        style={{
          padding: "4px 8px",
          borderRadius: 999,
          background: "rgba(255,255,255,.03)",
          border: "1px dashed rgba(255,255,255,.12)",
          fontSize: 10,
          color: "#64748b",
        }}
      >
        + Swarm
      </div>
    );
  }

  const rs = SWARM_RARITY_STYLES[swarm.raridade] || SWARM_RARITY_STYLES.comum;
  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,.06)",
        border: `1px solid ${rs.border}`,
        fontSize: 10,
        color: "#dbe3ff",
        boxShadow: `0 0 10px ${rs.glow}`,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      title={swarm.desc}
    >
      <span>{swarm.emoji}</span>
      <span>{swarm.nome}</span>
    </div>
  );
}
