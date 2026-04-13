import React from "react";
import { MONSTER_IMAGES } from "@/game/monsterImages";

interface MonsterAvatarProps {
  monstroId: string;
  size?: number;
  glow?: string;
  style?: React.CSSProperties;
}

export default function MonsterAvatar({ monstroId, size = 48, glow, style }: MonsterAvatarProps) {
  const src = MONSTER_IMAGES[monstroId];

  if (!src) return <span style={{ fontSize: size * 0.6, ...style }}>❓</span>;

  return (
    <img
      src={src}
      alt={monstroId}
      loading="lazy"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        filter: glow ? `drop-shadow(0 0 6px ${glow})` : undefined,
        ...style,
      }}
    />
  );
}
