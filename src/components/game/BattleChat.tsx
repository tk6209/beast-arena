import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BattleChatProps {
  sessionId: string;
  slotLocal: number;
}

const QUICK_MSGS = [
  { emoji: "👏", text: "GG" },
  { emoji: "😮", text: "Wow" },
  { emoji: "🎯", text: "Boa jogada" },
  { emoji: "😂", text: "Haha" },
  { emoji: "😅", text: "Ops" },
  { emoji: "👀", text: "" },
];

export default function BattleChat({ sessionId, slotLocal }: BattleChatProps) {
  const [open, setOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [floatingMsg, setFloatingMsg] = useState<string | null>(null);
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "game_events",
        filter: `session_id=eq.${sessionId}`,
      }, (payload: any) => {
        const row = payload.new;
        if (row.event_type === "chat" && row.player_slot !== slotLocal) {
          const msg = (row.payload_json as any)?.msg || "👀";
          setFloatingMsg(msg);
          if (floatTimer.current) clearTimeout(floatTimer.current);
          floatTimer.current = setTimeout(() => setFloatingMsg(null), 2500);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, slotLocal]);

  async function send(msg: string) {
    if (cooldown) return;
    setCooldown(true);
    setOpen(false);
    await supabase.from("game_events").insert({
      session_id: sessionId,
      player_slot: slotLocal,
      event_type: "chat",
      payload_json: { msg },
    });
    setTimeout(() => setCooldown(false), 3000);
  }

  return (
    <>
      {/* Floating received message */}
      {floatingMsg && (
        <div style={{
          position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)",
          zIndex: 200, pointerEvents: "none",
          animation: "chatFloat 2.5s ease forwards",
        }}>
          <div style={{
            background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.2)", borderRadius: 16,
            padding: "8px 20px", fontSize: 28, textAlign: "center",
            boxShadow: "0 0 30px rgba(0,229,255,.2)",
          }}>
            {floatingMsg}
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatFloat {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(.6); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          75% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(.8); }
        }
      `}</style>

      {/* Chat toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 80, right: 10, zIndex: 150,
          width: 36, height: 36, borderRadius: "50%",
          background: open ? "rgba(0,229,255,.2)" : "rgba(255,255,255,.08)",
          border: `1px solid ${open ? "rgba(0,229,255,.4)" : "rgba(255,255,255,.15)"}`,
          fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: cooldown ? 0.4 : 1,
        }}
      >
        💬
      </button>

      {/* Emoji panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 120, right: 10, zIndex: 150,
          background: "rgba(15,23,42,.9)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(0,229,255,.2)", borderRadius: 12,
          padding: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4, width: 150,
        }}>
          {QUICK_MSGS.map((m, i) => (
            <button
              key={i}
              onClick={() => send(`${m.emoji} ${m.text}`.trim())}
              disabled={cooldown}
              style={{
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "6px 4px", cursor: "pointer",
                fontSize: 10, color: "#e8f0ff", fontFamily: "Nunito, sans-serif",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                opacity: cooldown ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: 18 }}>{m.emoji}</span>
              {m.text && <span style={{ fontSize: 7, letterSpacing: 0.5 }}>{m.text}</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
