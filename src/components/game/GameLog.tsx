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

      // Auto dismiss after 3s
      const keys = floats.map((f) => f.key);
      setTimeout(() => {
        setVisible((prev) => prev.filter((f) => !keys.includes(f.key)));
      }, 3000);
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
            fontSize: 11,
            color: LOG_COLORS[f.entry.t] || "#e2e8f0",
            background: "rgba(10,17,34,.88)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 10,
            padding: "6px 12px",
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
