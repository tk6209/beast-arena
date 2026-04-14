import React, { useEffect, useState, useRef } from "react";
import { pageBg } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import { supabase } from "@/integrations/supabase/client";
import { MONSTROS } from "@/game/data";
import { MONSTER_IMAGES } from "@/game/monsterImages";

interface Props {
  userId?: string;
  onVoltar: () => void;
}

const LEAGUE_INFO: Record<string, { emoji: string; color: string; label: string; bg1: string; bg2: string }> = {
  bronze: { emoji: "🥉", color: "#cd7f32", label: "BRONZE", bg1: "#3d2200", bg2: "#cd7f32" },
  silver: { emoji: "🥈", color: "#c0c0c0", label: "PRATA", bg1: "#2a2a3a", bg2: "#c0c0c0" },
  gold: { emoji: "🥇", color: "#ffd54f", label: "OURO", bg1: "#3a2d00", bg2: "#ffd54f" },
  diamond: { emoji: "💎", color: "#b388ff", label: "DIAMANTE", bg1: "#1a0033", bg2: "#b388ff" },
  master: { emoji: "👑", color: "#ff5252", label: "MESTRE", bg1: "#3a0a0a", bg2: "#ff5252" },
};

interface LeaderEntry {
  user_id: string;
  league: string;
  rating: number;
  season_wins: number;
  season_losses: number;
  display_name?: string;
  favorite_monster?: string;
}

interface WeeklyEntry {
  user_id: string;
  wins: number;
  losses: number;
  rating_gained: number;
  display_name: string;
}

function getWeekKey() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum}`;
}

export default function TelaRanking({ userId, onVoltar }: Props) {
  const [tab, setTab] = useState<"global" | "semanal">("global");
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadRanking(); }, [tab]);

  async function loadRanking() {
    setLoading(true);
    if (tab === "global") {
      const { data } = await supabase
        .from("player_leagues")
        .select("user_id, league, rating, season_wins, season_losses")
        .order("rating", { ascending: false })
        .limit(50);

      if (data) {
        const userIds = data.map(d => d.user_id);
        const [{ data: profiles }, { data: stats }] = await Promise.all([
          supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
          supabase.from("user_stats").select("user_id, favorite_monster").in("user_id", userIds),
        ]);
        const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
        const monsterMap = new Map(stats?.map(s => [s.user_id, s.favorite_monster]) || []);
        setLeaders(data.map(d => ({
          ...d,
          display_name: nameMap.get(d.user_id) || "Jogador",
          favorite_monster: monsterMap.get(d.user_id) || undefined,
        })));
      }
    } else {
      const weekKey = getWeekKey();
      const { data } = await supabase
        .from("weekly_leaderboard")
        .select("*")
        .eq("week_key", weekKey)
        .order("wins", { ascending: false })
        .limit(50);
      if (data) setWeeklyLeaders(data);
    }
    setLoading(false);
    setCarouselIdx(0);
  }

  const topPlayers = tab === "global" ? leaders.slice(0, 10) : [];
  const monsterKeys = Object.keys(MONSTROS);

  const scrollTo = (dir: number) => {
    const max = topPlayers.length - 1;
    setCarouselIdx(i => Math.max(0, Math.min(max, i + dir)));
  };

  // Auto-scroll carousel
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTo({ left: carouselIdx * (el.clientWidth * 0.78), behavior: "smooth" });
    }
  }, [carouselIdx]);

  const myRank = leaders.findIndex(l => l.user_id === userId) + 1;

  return (
    <div style={{
      ...pageBg(),
      background: "linear-gradient(180deg, #060a14 0%, #0a1628 40%, #0d1b2e 100%)",
    }}>
      <ChromeNoise />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes crownPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      `}</style>
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        position: "relative", zIndex: 1, overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "16px 16px 8px" }}>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: 28, color: "#ffd54f", letterSpacing: 3 }}>
            🏆 RANKING
          </div>
          {myRank > 0 && tab === "global" && (
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8a95aa", marginTop: 2 }}>
              Sua posição: #{myRank}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12, padding: "0 16px" }}>
          {(["global", "semanal"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? "rgba(0,229,255,.15)" : "rgba(255,255,255,.03)",
              border: `1px solid ${tab === t ? "rgba(0,229,255,.3)" : "rgba(255,255,255,.06)"}`,
              borderRadius: 10, padding: "6px 18px", cursor: "pointer",
              fontFamily: "Bangers, cursive", fontSize: 13,
              color: tab === t ? "#00e5ff" : "#8a95aa", letterSpacing: 2,
            }}>
              {t === "global" ? "🌍 GLOBAL" : "📅 SEMANAL"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>Carregando...</div>
        ) : tab === "global" ? (
          <>
            {/* ═══ CAROUSEL — TOP PLAYERS ═══ */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <div
                ref={scrollRef}
                style={{
                  display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory",
                  padding: "8px 16px 12px", scrollbarWidth: "none",
                }}
              >
                {topPlayers.map((p, i) => {
                  const info = LEAGUE_INFO[p.league] || LEAGUE_INFO.bronze;
                  const mKey = p.favorite_monster && MONSTROS[p.favorite_monster] ? p.favorite_monster : monsterKeys[i % monsterKeys.length];
                  const monster = MONSTROS[mKey];
                  const mImg = MONSTER_IMAGES[mKey];
                  const isMe = p.user_id === userId;

                  return (
                    <div key={p.user_id} style={{
                      minWidth: "75%", maxWidth: "75%", scrollSnapAlign: "center",
                      background: `linear-gradient(160deg, ${info.bg1}cc, ${monster.bg2}22, rgba(10,22,40,.95))`,
                      border: `1.5px solid ${isMe ? "#00e5ff" : info.color}44`,
                      borderRadius: 18, padding: 16, position: "relative",
                      overflow: "hidden",
                      animation: i === 0 ? "cardFloat 3s ease-in-out infinite" : "none",
                    }}>
                      {/* Rank badge */}
                      <div style={{
                        position: "absolute", top: 10, left: 12,
                        fontFamily: "Bangers, cursive", fontSize: 24,
                        color: i === 0 ? "#ffd54f" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#8a95aa",
                        animation: i === 0 ? "crownPulse 2s ease-in-out infinite" : "none",
                      }}>
                        {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </div>

                      {/* League badge top-right */}
                      <div style={{
                        position: "absolute", top: 10, right: 12,
                        fontFamily: "Oswald, sans-serif", fontSize: 10, color: info.color,
                        background: `${info.color}15`, border: `1px solid ${info.color}33`,
                        borderRadius: 8, padding: "3px 8px", letterSpacing: 1,
                      }}>
                        {info.emoji} {info.label}
                      </div>

                      {/* Monster image */}
                      <div style={{
                        display: "flex", justifyContent: "center", margin: "24px 0 8px",
                      }}>
                        <img
                          src={mImg}
                          alt={monster.nome}
                          style={{
                            width: 90, height: 90, objectFit: "contain",
                            filter: `drop-shadow(0 0 20px ${monster.glow}44)`,
                          }}
                        />
                      </div>

                      {/* Player name */}
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontFamily: "Bangers, cursive", fontSize: 18, color: "#e8f0ff",
                          letterSpacing: 2, textShadow: `0 0 10px ${info.color}33`,
                        }}>
                          {p.display_name}
                        </div>
                        <div style={{
                          fontFamily: "Oswald, sans-serif", fontSize: 24, color: info.color,
                          textShadow: `0 0 15px ${info.color}44`, margin: "2px 0",
                        }}>
                          {p.rating} ELO
                        </div>
                        <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 11, color: "#8a95aa" }}>
                          {p.season_wins}V / {p.season_losses}D • WR {p.season_wins + p.season_losses > 0 ? Math.round(p.season_wins / (p.season_wins + p.season_losses) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Carousel dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
                {topPlayers.slice(0, 10).map((_, i) => (
                  <div key={i} onClick={() => setCarouselIdx(i)} style={{
                    width: i === carouselIdx ? 14 : 5, height: 5, borderRadius: 3,
                    background: i === carouselIdx ? "#ffd54f" : "rgba(255,255,255,.15)",
                    transition: "all .3s ease", cursor: "pointer",
                  }} />
                ))}
              </div>
            </div>

            {/* ═══ FULL LIST ═══ */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "0 16px",
              scrollbarWidth: "none",
            }}>
              {leaders.map((l, i) => {
                const info = LEAGUE_INFO[l.league] || LEAGUE_INFO.bronze;
                const isMe = l.user_id === userId;
                return (
                  <div key={l.user_id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: isMe ? "rgba(0,229,255,.08)" : "rgba(255,255,255,.02)",
                    border: `1px solid ${isMe ? "rgba(0,229,255,.2)" : "rgba(255,255,255,.04)"}`,
                    borderRadius: 10, padding: "8px 12px", marginBottom: 4,
                  }}>
                    <span style={{
                      fontFamily: "Oswald, sans-serif", fontSize: 13, minWidth: 22,
                      color: i === 0 ? "#ffd54f" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#8a95aa",
                      textAlign: "center",
                    }}>
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}`}
                    </span>
                    <span style={{ fontSize: 13 }}>{info.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Bangers, cursive", fontSize: 12, color: "#e8f0ff", letterSpacing: 1 }}>
                        {l.display_name}
                      </div>
                    </div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 13, color: info.color }}>
                      {l.rating}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ═══ WEEKLY TAB ═══ */
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 11, color: "#8a95aa" }}>
                Semana: {getWeekKey()} • Reseta toda segunda-feira
              </div>
            </div>
            {weeklyLeaders.length === 0 ? (
              <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>
                Nenhuma entrada esta semana ainda. Jogue para aparecer!
              </div>
            ) : weeklyLeaders.map((w, i) => (
              <div key={w.user_id} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: w.user_id === userId ? "rgba(0,229,255,.08)" : "rgba(255,255,255,.02)",
                border: `1px solid ${w.user_id === userId ? "rgba(0,229,255,.2)" : "rgba(255,255,255,.04)"}`,
                borderRadius: 10, padding: "8px 12px", marginBottom: 4,
              }}>
                <span style={{
                  fontFamily: "Oswald, sans-serif", fontSize: 13, minWidth: 22,
                  color: i === 0 ? "#ffd54f" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#8a95aa",
                  textAlign: "center",
                }}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}`}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Bangers, cursive", fontSize: 12, color: "#e8f0ff", letterSpacing: 1 }}>
                    {w.display_name}
                  </div>
                  <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#8a95aa" }}>
                    {w.wins}V / {w.losses}D
                  </div>
                </div>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, color: "#69f0ae" }}>
                  +{w.rating_gained}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "8px 16px 16px" }}>
          <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
        </div>
      </div>
    </div>
  );
}
