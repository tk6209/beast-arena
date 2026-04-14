import React from "react";

interface BuffIndicatorsProps {
  defAtiva: number;
  imune: boolean;
  dobra: boolean;
  dodgeOnce: boolean;
  swarms: (any | null)[];
  compact?: boolean;
}

const BUFF_ITEMS = [
  { key: "shield", test: (p: BuffIndicatorsProps) => p.defAtiva > 0, emoji: "🛡️", label: (p: BuffIndicatorsProps) => `+${p.defAtiva}`, color: "#3b82f6" },
  { key: "immune", test: (p: BuffIndicatorsProps) => p.imune, emoji: "✨", label: () => "IMUNE", color: "#ffd54f" },
  { key: "double", test: (p: BuffIndicatorsProps) => p.dobra, emoji: "⚡", label: () => "2x", color: "#f59e0b" },
  { key: "dodge", test: (p: BuffIndicatorsProps) => p.dodgeOnce, emoji: "💨", label: () => "ESQUIVA", color: "#a78bfa" },
];

export default function BuffIndicators(props: BuffIndicatorsProps) {
  const activeBuffs = BUFF_ITEMS.filter(b => b.test(props));
  const activeSwarms = props.swarms.filter(Boolean);

  if (activeBuffs.length === 0 && activeSwarms.length === 0) return null;

  return (
    <div style={{
      display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center",
      padding: "2px 0",
    }}>
      {activeBuffs.map(b => (
        <div key={b.key} style={{
          display: "flex", alignItems: "center", gap: 2,
          background: `${b.color}18`, border: `1px solid ${b.color}44`,
          borderRadius: 6, padding: "1px 5px",
          fontSize: 9, color: b.color,
          fontFamily: "Bangers, cursive", letterSpacing: 0.5,
          animation: "buffPulse 2s ease-in-out infinite",
        }}>
          <span>{b.emoji}</span>
          <span>{b.label(props)}</span>
        </div>
      ))}
      {activeSwarms.map((s: any, i: number) => (
        <div key={`sw-${i}`} style={{
          display: "flex", alignItems: "center", gap: 2,
          background: "rgba(167,139,250,.12)", border: "1px solid rgba(167,139,250,.3)",
          borderRadius: 6, padding: "1px 5px",
          fontSize: 9, color: "#c4b5fd",
          fontFamily: "Nunito, sans-serif",
        }}>
          <span>{s.emoji}</span>
          <span style={{ maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {s.nome}
          </span>
        </div>
      ))}
      <style>{`
        @keyframes buffPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
