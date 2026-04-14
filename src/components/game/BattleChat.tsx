import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CHAT_PRESETS, CHAT_COOLDOWN_MS } from "@/game/chatPresets";

interface BattleChatProps {
  sessionId: string;
  slotLocal: number;
  opponentMuted?: boolean;
}

export default function BattleChat({ sessionId, slotLocal, opponentMuted = false }: BattleChatProps) {
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
        if (row.event_type === "chat" && row.player_slot !== slotLocal && !opponentMuted) {
          const msg = (row.payload_json as any)?.msg || "👀";
          setFloatingMsg(msg);
          if (floatTimer.current) clearTimeout(floatTimer.current);
          floatTimer.current = setTimeout(() => setFloatingMsg(null), 2500);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, slotLocal, opponentMuted]);

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
    setTimeout(() => setCooldown(false), CHAT_COOLDOWN_MS);
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
            padding: "8px 20px", fontSize: 22, textAlign: "center",
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

      {/* Emoji/phrase panel — 3x4 grid */}
      {open && (
        <div style={{
          position: "fixed", bottom: 120, right: 10, zIndex: 150,
          background: "rgba(15,23,42,.95)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(0,229,255,.2)", borderRadius: 12,
          padding: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4, width: 200,
        }}>
          {CHAT_PRESETS.map((m) => (
            <button
              key={m.key}
              onClick={() => send(`${m.emoji} ${m.text}`)}
              disabled={cooldown}
              style={{
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "6px 4px", cursor: cooldown ? "default" : "pointer",
                fontSize: 10, color: "#e8f0ff", fontFamily: "Nunito, sans-serif",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                opacity: cooldown ? 0.4 : 1,
                transition: "transform .1s",
              }}
            >
              <span style={{ fontSize: 16 }}>{m.emoji}</span>
              <span style={{ fontSize: 7, letterSpacing: 0.3, lineHeight: 1.2, textAlign: "center" }}>{m.text}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
