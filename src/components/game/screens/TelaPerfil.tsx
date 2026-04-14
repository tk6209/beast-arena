import React, { useEffect, useState } from "react";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { supabase } from "@/integrations/supabase/client";
import { MONSTROS } from "@/game/data";
import type { User } from "@supabase/supabase-js";

interface TelaPefilProps {
  user: User;
  onVoltar: () => void;
  onLogout: () => void;
}

interface Profile {
  display_name: string;
  level: number;
  xp: number;
  coins: number;
}

interface Stats {
  total_wins: number;
  total_losses: number;
  win_streak: number;
  best_streak: number;
  favorite_monster: string | null;
}

export default function TelaPerfil({ user, onVoltar, onLogout }: TelaPefilProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("display_name, level, xp, coins").eq("user_id", user.id).single(),
        supabase.from("user_stats").select("total_wins, total_losses, win_streak, best_streak, favorite_monster").eq("user_id", user.id).single(),
      ]);
      if (p) setProfile(p);
      if (s) setStats(s);
      setLoading(false);
    })();
  }, [user.id]);

  const xpForNextLevel = (profile?.level || 1) * 100;
  const xpProgress = profile ? Math.min(100, (profile.xp / xpForNextLevel) * 100) : 0;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const favoriteMonster = stats?.favorite_monster ? MONSTROS[stats.favorite_monster] : null;

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: "100%",
          maxWidth: 340,
          animation: "fadeUp .5s ease forwards",
        }}>
          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #00e5ff33, #7eb8ff33)",
              border: "2px solid #00e5ff44",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, margin: "0 auto 8px",
            }}>
              {favoriteMonster?.emoji || "⚔️"}
            </div>
            <div style={{
              fontFamily: "Bangers, cursive", fontSize: 24,
              color: "#e8f0ff", letterSpacing: 2,
            }}>
              {profile?.display_name || "Jogador"}
            </div>
            <div style={{
              fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8a95aa",
            }}>
              {user.email}
            </div>
          </div>

          {/* Level + XP */}
          <div style={{
            background: "rgba(0,229,255,.04)",
            border: "1px solid rgba(0,229,255,.1)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontFamily: "Bangers, cursive", fontSize: 16, color: "#ffd54f", letterSpacing: 1 }}>
                LV {profile?.level || 1}
              </span>
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 11, color: "#8a95aa" }}>
                {profile?.xp || 0} / {xpForNextLevel} XP
              </span>
            </div>
            <div style={{
              height: 6, borderRadius: 3,
              background: "rgba(255,255,255,.1)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${xpProgress}%`,
                background: "linear-gradient(90deg, #00e5ff, #7eb8ff)",
                borderRadius: 3, transition: "width .5s ease",
              }} />
            </div>
          </div>

          {/* Coins */}
          <div style={{
            background: "rgba(255,213,79,.04)",
            border: "1px solid rgba(255,213,79,.15)",
            borderRadius: 10, padding: "10px 16px", marginBottom: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#ffd54f", letterSpacing: 1 }}>
              💰 MOEDAS
            </span>
            <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, color: "#ffd54f" }}>
              {profile?.coins || 0}
            </span>
          </div>

          {/* Stats */}
          <div style={{
            background: "rgba(0,229,255,.04)",
            border: "1px solid rgba(0,229,255,.1)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#00e5ff", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>
              📊 ESTATÍSTICAS
            </div>
            {loading ? (
              <div style={{ color: "#8a95aa", fontSize: 12, textAlign: "center" }}>Carregando...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Vitórias", value: stats?.total_wins || 0, color: "#69f0ae" },
                  { label: "Derrotas", value: stats?.total_losses || 0, color: "#ef4444" },
                  { label: "Sequência", value: stats?.win_streak || 0, color: "#ffd54f" },
                  { label: "Melhor", value: stats?.best_streak || 0, color: "#00e5ff" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 22, color: s.color }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8a95aa" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
            <BtnMain variant="dark" onClick={handleLogout}>🚪 SAIR DA CONTA</BtnMain>
          </div>
        </div>
      </div>
    </div>
  );
}
