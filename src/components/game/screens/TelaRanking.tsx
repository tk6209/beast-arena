import React, { useEffect, useState } from "react";
import { pageBg, glassPanel } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId?: string;
  onVoltar: () => void;
}

const LEAGUE_INFO: Record<string, { emoji: string; color: string; label: string; minRating: number }> = {
  bronze: { emoji: "🥉", color: "#cd7f32", label: "BRONZE", minRating: 0 },
  silver: { emoji: "🥈", color: "#c0c0c0", label: "PRATA", minRating: 1200 },
  gold: { emoji: "🥇", color: "#ffd54f", label: "OURO", minRating: 1500 },
  diamond: { emoji: "💎", color: "#b388ff", label: "DIAMANTE", minRating: 1800 },
  master: { emoji: "👑", color: "#ff5252", label: "MESTRE", minRating: 2100 },
};

interface LeaderEntry {
  user_id: string;
  league: string;
  rating: number;
  season_wins: number;
  season_losses: number;
  display_name?: string;
}

export default function TelaRanking({ userId, onVoltar }: Props) {
  const [tab, setTab] = useState<"global" | "liga">("global");
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, [tab]);

  async function loadRanking() {
    setLoading(true);
    const { data } = await supabase
      .from("player_leagues")
      .select("user_id, league, rating, season_wins, season_losses")
      .order("rating", { ascending: false })
      .limit(50);

    if (data) {
      // Load display names
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
      setLeaders(data.map(d => ({ ...d, display_name: nameMap.get(d.user_id) || "Jogador" })));
    }
    setLoading(false);
  }

  const myRank = leaders.findIndex(l => l.user_id === userId) + 1;

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "16px 16px 24px", position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp .5s ease forwards" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 28, color: "#ffd54f", letterSpacing: 3 }}>
              🏆 RANKING GLOBAL
            </div>
            {myRank > 0 && (
              <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#8a95aa", marginTop: 4 }}>
                Sua posição: #{myRank}
              </div>
            )}
          </div>

          {/* Leagues overview */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12, justifyContent: "center" }}>
            {Object.entries(LEAGUE_INFO).map(([key, info]) => (
              <div key={key} style={{
                background: `${info.color}10`, border: `1px solid ${info.color}33`,
                borderRadius: 6, padding: "4px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 16 }}>{info.emoji}</div>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 7, color: info.color, letterSpacing: 1 }}>
                  {info.label}
                </div>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 7, color: "#8a95aa" }}>
                  {info.minRating}+
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>Carregando...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {leaders.map((l, i) => {
                const info = LEAGUE_INFO[l.league] || LEAGUE_INFO.bronze;
                const isMe = l.user_id === userId;
                return (
                  <div key={l.user_id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: isMe ? "rgba(0,229,255,.08)" : "rgba(255,255,255,.02)",
                    border: `1px solid ${isMe ? "rgba(0,229,255,.2)" : "rgba(255,255,255,.05)"}`,
                    borderRadius: 8, padding: "8px 12px",
                  }}>
                    <span style={{
                      fontFamily: "Oswald, sans-serif", fontSize: 14, minWidth: 24,
                      color: i === 0 ? "#ffd54f" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#8a95aa",
                      textAlign: "center",
                    }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </span>
                    <span style={{ fontSize: 14 }}>{info.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Bangers, cursive", fontSize: 13, color: "#e8f0ff", letterSpacing: 1 }}>
                        {l.display_name}
                      </div>
                      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#8a95aa" }}>
                        {l.season_wins}V / {l.season_losses}D
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "Oswald, sans-serif", fontSize: 14, color: info.color,
                      textShadow: `0 0 10px ${info.color}44`,
                    }}>
                      {l.rating}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
          </div>
        </div>
      </div>
    </div>
  );
}
