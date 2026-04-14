import React, { useEffect, useState } from "react";
import { pageBg } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  onVoltar: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requirement_type: string;
  requirement_value: number;
  rarity: string;
}

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  comum: { bg: "rgba(255,255,255,.04)", border: "rgba(255,255,255,.1)", text: "#8a95aa" },
  raro: { bg: "rgba(0,229,255,.06)", border: "rgba(0,229,255,.2)", text: "#00e5ff" },
  epico: { bg: "rgba(179,136,255,.06)", border: "rgba(179,136,255,.2)", text: "#b388ff" },
  lendario: { bg: "rgba(255,213,79,.06)", border: "rgba(255,213,79,.2)", text: "#ffd54f" },
};

export default function TelaConquistas({ user, onVoltar }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from("achievements").select("*"),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
    ]);
    if (all) setAchievements(all);
    if (mine) setUnlocked(new Set(mine.map(m => m.achievement_id)));
    setLoading(false);
  }

  const sorted = [...achievements].sort((a, b) => {
    const order = ["comum", "raro", "epico", "lendario"];
    return order.indexOf(a.rarity) - order.indexOf(b.rarity);
  });

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes badgeGlow { 0%,100%{box-shadow:0 0 8px rgba(255,213,79,.2)} 50%{box-shadow:0 0 20px rgba(255,213,79,.4)} }
      `}</style>
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "16px 16px 24px", position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp .5s ease forwards" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 28, color: "#ffd54f", letterSpacing: 3 }}>
              🏅 CONQUISTAS
            </div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8a95aa", marginTop: 4 }}>
              {unlocked.size}/{achievements.length} desbloqueadas
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>Carregando...</div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
            }}>
              {sorted.map((ach, i) => {
                const isUnlocked = unlocked.has(ach.id);
                const rc = RARITY_COLORS[ach.rarity] || RARITY_COLORS.comum;
                return (
                  <div key={ach.id} style={{
                    background: isUnlocked ? rc.bg : "rgba(255,255,255,.015)",
                    border: `1px solid ${isUnlocked ? rc.border : "rgba(255,255,255,.04)"}`,
                    borderRadius: 14, padding: 12, textAlign: "center",
                    opacity: isUnlocked ? 1 : 0.4,
                    animation: isUnlocked ? "badgeGlow 3s ease-in-out infinite" : "none",
                  }}>
                    <div style={{
                      fontSize: 28, marginBottom: 4,
                      filter: isUnlocked ? "none" : "grayscale(1)",
                    }}>
                      {ach.emoji}
                    </div>
                    <div style={{
                      fontFamily: "Bangers, cursive", fontSize: 12, color: isUnlocked ? rc.text : "#555",
                      letterSpacing: 1, marginBottom: 2,
                    }}>
                      {ach.title}
                    </div>
                    <div style={{
                      fontFamily: "Nunito, sans-serif", fontSize: 9, color: "#8a95aa",
                      lineHeight: 1.3,
                    }}>
                      {ach.description}
                    </div>
                    <div style={{
                      fontFamily: "Oswald, sans-serif", fontSize: 8, marginTop: 4,
                      color: rc.text, letterSpacing: 1, textTransform: "uppercase",
                    }}>
                      {ach.rarity}
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
