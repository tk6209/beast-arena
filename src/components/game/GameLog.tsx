import React, { useState, useEffect, useRef } from "react";
import type { LogEntry } from "@/game/engine";

const LOG_COLORS: Record<string, string> = {
  dano: "#ff8a80",
  cura: "#69f0ae",
  efeito: "#ffd54f",
  sistema: "#90a4ae",
  combo: "#f48fb1",
  grande: "#ffab40",
};

interface FloatingEntry {
  key: number;
  entry: LogEntry;
  opacity: number;
}

interface LogProps {
  ents: LogEntry[];
}

let _keyCounter = 0;

export default function GameLog({ ents }: LogProps) {
  const [visible, setVisible] = useState<FloatingEntry[]>([]);
  const prevLen = useRef(0);

  useEffect(() => {
    if (ents.length > prevLen.current) {
      const newEntries = ents.slice(prevLen.current);
      const floats: FloatingEntry[] = newEntries.map((e) => ({
        key: ++_keyCounter,
        entry: e,
        opacity: 1,
      }));
      setVisible((prev) => [...prev, ...floats].slice(-3));

      // Auto dismiss — critical events last longer (Norman: important feedback visible longer)
      floats.forEach(f => {
        const duration = ["dano", "grande", "combo", "evolucao"].includes(f.entry.t) ? 4000 : 2500;
        setTimeout(() => {
          setVisible((prev) => prev.filter((v) => v.key !== f.key));
        }, duration);
      });
    }
    prevLen.current = ents.length;
  }, [ents]);

  if (visible.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        pointerEvents: "none",
        width: "90%",
        maxWidth: 360,
      }}
    >
      {visible.map((f) => (
        <div
          key={f.key}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: ["dano", "grande", "combo"].includes(f.entry.t) ? 13 : 11,
            fontWeight: ["dano", "grande", "combo"].includes(f.entry.t) ? 700 : 400,
            color: LOG_COLORS[f.entry.t] || "#e2e8f0",
            background: f.entry.t === "dano" ? "rgba(30,10,10,.92)" : f.entry.t === "cura" ? "rgba(10,25,18,.92)" : "rgba(10,17,34,.88)",
            border: `1px solid ${(LOG_COLORS[f.entry.t] || "#ffffff")}22`,
            borderRadius: 10,
            padding: ["dano", "grande", "combo"].includes(f.entry.t) ? "8px 14px" : "6px 12px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,.4)",
            textAlign: "center",
            animation: "floatIn .3s ease",
          }}
        >
          {f.entry.msg}
        </div>
      ))}
      <style>{`
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
