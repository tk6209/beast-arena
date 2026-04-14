import React, { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  lifetime: number;
  emoji?: string;
}

interface CombatParticlesProps {
  type: string; // "ataque" | "defesa" | "cura" | "evolucao" | "swarm" | "explode"
  trigger: number; // increment to trigger
  originX?: number; // % from left
  originY?: number; // % from top
}

const CONFIGS: Record<string, { count: number; colors: string[]; emojis?: string[]; speed: number; lifetime: number }> = {
  ataque: { count: 18, colors: ["#ef4444", "#ff8a65", "#ffd54f", "#fff"], emojis: ["⚔️", "💥"], speed: 5, lifetime: 800 },
  defesa: { count: 12, colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"], emojis: ["🛡️", "💎"], speed: 3, lifetime: 700 },
  cura: { count: 15, colors: ["#34d399", "#6ee7b7", "#a7f3d0", "#fff"], emojis: ["💚", "✨"], speed: 2.5, lifetime: 900 },
  evolucao: { count: 24, colors: ["#ffd54f", "#fbbf24", "#f59e0b", "#fff"], emojis: ["⭐", "✨", "🌟"], speed: 4, lifetime: 1200 },
  swarm: { count: 10, colors: ["#a78bfa", "#8b5cf6", "#c4b5fd"], emojis: ["🐾"], speed: 3, lifetime: 700 },
  explode: { count: 30, colors: ["#ef4444", "#fbbf24", "#ff6b35", "#fff"], emojis: ["💥", "🔥"], speed: 7, lifetime: 1000 },
};

let particleIdCounter = 0;

export default function CombatParticles({ type, trigger, originX = 50, originY = 50 }: CombatParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const config = CONFIGS[type] || CONFIGS.ataque;
    const newParticles: Particle[] = [];
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5;
      const speed = config.speed * (0.5 + Math.random());
      newParticles.push({
        id: ++particleIdCounter,
        x: originX,
        y: originY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        lifetime: config.lifetime * (0.7 + Math.random() * 0.6),
        emoji: config.emojis && Math.random() < 0.3 ? config.emojis[Math.floor(Math.random() * config.emojis.length)] : undefined,
      });
    }
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), Math.max(...newParticles.map(p => p.lifetime)) + 100);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.emoji ? undefined : p.size,
            height: p.emoji ? undefined : p.size,
            borderRadius: "50%",
            background: p.emoji ? "transparent" : p.color,
            boxShadow: p.emoji ? "none" : `0 0 ${p.size * 2}px ${p.color}`,
            fontSize: p.emoji ? p.size * 2.5 : undefined,
            animation: `particle-fly ${p.lifetime}ms ease-out forwards`,
            // @ts-ignore
            "--pdx": `${p.dx * 20}vw`,
            "--pdy": `${p.dy * 20}vh`,
          } as React.CSSProperties}
        >
          {p.emoji || ""}
        </div>
      ))}
      <style>{`
        @keyframes particle-fly {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          70% { opacity: 0.6; }
          100% { opacity: 0; transform: translate(var(--pdx), var(--pdy)) scale(0.2); }
        }
      `}</style>
    </div>
  );
}
