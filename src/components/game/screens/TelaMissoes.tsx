import React, { useEffect, useState } from "react";
import { pageBg } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import { supabase } from "@/integrations/supabase/client";
import { claimMissionReward } from "@/game/serverApi";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  onVoltar: () => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  mission_type: string;
  target_value: number;
  reward_coins: number;
  reward_xp: number;
}

interface UserMission {
  id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export default function TelaMissoes({ user, onVoltar }: Props) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMissions(); }, []);

  async function loadMissions() {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [{ data: allMissions }, { data: myMissions }] = await Promise.all([
      supabase.from("daily_missions").select("*").eq("active", true),
      supabase.from("user_missions").select("*").eq("user_id", user.id).eq("assigned_date", today),
    ]);

    if (allMissions) setMissions(allMissions);

    if (myMissions && myMissions.length > 0) {
      setUserMissions(myMissions);
    }
    setLoading(false);
  }

  async function claimReward(um: UserMission) {
    const mission = missions.find(m => m.id === um.mission_id);
    if (!mission || um.claimed) return;

    try {
      await claimMissionReward({ userId: user.id, userMissionId: um.id });
      setUserMissions(prev => prev.map(u => u.id === um.id ? { ...u, claimed: true } : u));
    } catch {
      // server-authoritative path unavailable
    }
  }

  const todayMissions = userMissions.map(um => {
    const def = missions.find(m => m.id === um.mission_id);
    return def ? { ...um, def } : null;
  }).filter(Boolean) as (UserMission & { def: Mission })[];

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "16px 16px 24px", position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp .5s ease forwards" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 28, color: "#00e5ff", letterSpacing: 3 }}>
              🎯 MISSÕES DIÁRIAS
            </div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8a95aa", marginTop: 4 }}>
              Complete missões para ganhar recompensas!
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>Carregando...</div>
          ) : todayMissions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>Nenhuma missão disponível hoje.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todayMissions.map((tm, i) => {
                const pct = Math.min(100, (tm.progress / tm.def.target_value) * 100);
                const done = tm.completed;
                const claimed = tm.claimed;
                return (
                  <div key={tm.id} style={{
                    background: done
                      ? "linear-gradient(135deg, rgba(0,229,255,.08), rgba(105,240,174,.06))"
                      : "rgba(255,255,255,.03)",
                    border: `1px solid ${done ? "rgba(105,240,174,.3)" : "rgba(255,255,255,.08)"}`,
                    borderRadius: 14, padding: 14,
                    animation: `fadeUp ${0.3 + i * 0.15}s ease forwards`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: done ? "rgba(105,240,174,.15)" : "rgba(0,229,255,.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>
                        {tm.def.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#e8f0ff", letterSpacing: 1 }}>
                          {tm.def.title}
                        </div>
                        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8a95aa" }}>
                          {tm.def.description}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                      width: "100%", height: 6, borderRadius: 3,
                      background: "rgba(255,255,255,.06)", overflow: "hidden", marginBottom: 8,
                    }}>
                      <div style={{
                        height: "100%", width: `${pct}%`, borderRadius: 3,
                        background: done
                          ? "linear-gradient(90deg, #69f0ae, #00e5ff)"
                          : "linear-gradient(90deg, #00e5ff, #7eb8ff)",
                        transition: "width .5s ease",
                      }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 10, color: "#8a95aa" }}>
                        {tm.progress}/{tm.def.target_value}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 10 }}>💰{tm.def.reward_coins}</span>
                        <span style={{ fontSize: 10, color: "#7eb8ff" }}>✨{tm.def.reward_xp}XP</span>
                      </div>
                      {done && !claimed && (
                        <button onClick={() => claimReward(tm)} style={{
                          background: "linear-gradient(135deg, #69f0ae, #00e5ff)",
                          border: "none", borderRadius: 8, padding: "4px 12px",
                          fontFamily: "Bangers, cursive", fontSize: 11, color: "#0a1628",
                          cursor: "pointer", letterSpacing: 1,
                        }}>
                          COLETAR
                        </button>
                      )}
                      {claimed && (
                        <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 10, color: "#69f0ae" }}>✅ COLETADO</span>
                      )}
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
