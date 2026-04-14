import React, { useEffect, useState, useRef } from "react";
import { pageBg } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import { supabase } from "@/integrations/supabase/client";
import { MONSTROS } from "@/game/data";
import { MONSTER_IMAGES } from "@/game/monsterImages";
import { criarSessao, entrarComoJogador } from "@/game/multiplayer";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  monstroId: string;
  nomeJogador: string;
  onMatch: (sessionId: string, slot: number) => void;
  onVoltar: () => void;
}

export default function TelaMatchmaking({ user, monstroId, nomeJogador, onMatch, onVoltar }: Props) {
  const [searching, setSearching] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState("");
  const channelRef = useRef<any>(null);
  const queueIdRef = useRef<string | null>(null);

  useEffect(() => {
    joinQueue();
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 500);
    return () => {
      clearInterval(timer);
      clearInterval(dotTimer);
      leaveQueue();
    };
  }, []);

  async function joinQueue() {
    // Get league info
    const { data: league } = await supabase.from("player_leagues")
      .select("league, rating").eq("user_id", user.id).single();

    // Insert into queue
    const { data, error } = await supabase.from("matchmaking_queue").insert({
      user_id: user.id,
      monster_id: monstroId,
      player_name: nomeJogador,
      league: league?.league || "bronze",
      rating: league?.rating || 1000,
      status: "waiting",
    }).select().single();

    if (error || !data) {
      console.error("Queue error:", error);
      return;
    }
    queueIdRef.current = data.id;

    // Listen for match via realtime
    const channel = supabase
      .channel(`matchmaking-${data.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matchmaking_queue", filter: `id=eq.${data.id}` },
        async (payload: any) => {
          if (payload.new.status === "matched" && payload.new.matched_session_id) {
            setSearching(false);
            onMatch(payload.new.matched_session_id, 1);
          }
        }
      )
      .subscribe();
    channelRef.current = channel;

    // Also poll for another waiting player to match with
    pollForMatch(data.id, league?.rating || 1000);
  }

  async function pollForMatch(myQueueId: string, myRating: number) {
    const ratingRange = 300;
    const { data: others } = await supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("status", "waiting")
      .neq("id", myQueueId)
      .gte("rating", myRating - ratingRange)
      .lte("rating", myRating + ratingRange)
      .order("created_at", { ascending: true })
      .limit(1);

    if (others && others.length > 0) {
      const opponent = others[0];
      // Create game session
      const session = await criarSessao();
      const m = MONSTROS[monstroId];
      const mOpp = MONSTROS[opponent.monster_id];

      // Join both players
      await entrarComoJogador(session.id, 0, monstroId, nomeJogador, m.hp, m.hp);
      await entrarComoJogador(session.id, 1, opponent.monster_id, opponent.player_name, mOpp.hp, mOpp.hp);

      // Update both queue entries
      await supabase.from("matchmaking_queue").update({
        status: "matched", matched_session_id: session.id,
      }).eq("id", myQueueId);
      await supabase.from("matchmaking_queue").update({
        status: "matched", matched_session_id: session.id,
      }).eq("id", opponent.id);

      setSearching(false);
      onMatch(session.id, 0);
    } else {
      // Retry after 3 seconds
      setTimeout(() => {
        if (queueIdRef.current) pollForMatch(myQueueId, myRating);
      }, 3000);
    }
  }

  async function leaveQueue() {
    if (queueIdRef.current) {
      await supabase.from("matchmaking_queue").delete().eq("id", queueIdRef.current);
      queueIdRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }

  const m = MONSTROS[monstroId];
  const img = MONSTER_IMAGES[monstroId];
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`
        @keyframes searchPulse { 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.5);opacity:0} }
        @keyframes monsterBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        position: "relative", zIndex: 1, padding: 24,
      }}>
        <div style={{ fontFamily: "Bangers, cursive", fontSize: 24, color: "#ffd54f", letterSpacing: 3 }}>
          🎯 RANQUEADA
        </div>

        {/* Monster with pulse ring */}
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `2px solid ${m.glow}44`,
            animation: "searchPulse 2s ease-in-out infinite",
          }} />
          <img src={img} alt={m.nome} style={{
            width: "100%", height: "100%", objectFit: "contain",
            filter: `drop-shadow(0 0 20px ${m.glow}55)`,
            animation: "monsterBob 2s ease-in-out infinite",
          }} />
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "Bangers, cursive", fontSize: 16, color: "#00e5ff",
            letterSpacing: 2,
          }}>
            BUSCANDO ADVERSÁRIO{dots}
          </div>
          <div style={{
            fontFamily: "Oswald, sans-serif", fontSize: 24, color: "#8a95aa",
            marginTop: 8, fontVariantNumeric: "tabular-nums",
          }}>
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
          <div style={{
            fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#6d7a92", marginTop: 4,
          }}>
            Procurando jogadores no seu nível...
          </div>
        </div>

        <BtnMain variant="dark" onClick={() => { leaveQueue(); onVoltar(); }}>
          ✖ CANCELAR
        </BtnMain>
      </div>
    </div>
  );
}
