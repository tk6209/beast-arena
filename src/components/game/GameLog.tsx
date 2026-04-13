import React, { useRef, useEffect } from "react";
import { glassPanel } from "@/game/styles";
import type { LogEntry } from "@/game/engine";

interface LogProps {
  ents: LogEntry[];
}

const LOG_COLORS: Record<string, string> = {
  dano: "#ff8a80",
  cura: "#69f0ae",
  efeito: "#ffd54f",
  sistema: "#90a4ae",
  combo: "#f48fb1",
  grande: "#ffab40",
};

export default function Log({ ents }: LogProps) {
  const r = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (r.current) r.current.scrollTop = r.current.scrollHeight;
  }, [ents]);

  return (
    <div
      ref={r}
      style={{
        height: 92,
        overflowY: "auto",
        ...glassPanel("#1e2b46", {
          borderRadius: 14,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }),
      }}
    >
      {ents.slice(-14).map((e, i) => (
        <div
          key={i}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: 10.6,
            color: LOG_COLORS[e.t] || "#e2e8f0",
            lineHeight: 1.32,
          }}
        >
          {e.msg}
        </div>
      ))}
    </div>
  );
}
