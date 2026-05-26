import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { claimDailyReward } from "@/game/serverApi";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  onClose: () => void;
}

const STREAK_REWARDS = [10, 15, 20, 30, 40, 50, 75]; // coins per streak day

export default function TelaDailyReward({ user, onClose }: Props) {
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState(0);
  const [streak, setStreak] = useState(1);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndClaim();
  }, []);

  async function checkAndClaim() {
    try {
      const { data } = await claimDailyReward({ userId: user.id });
      if (data?.alreadyClaimed) {
        setAlreadyClaimed(true);
      } else {
        setClaimed(true);
      }
      setReward(data?.coins ?? 0);
      setStreak(data?.streak ?? 1);
    } catch {
      const { data } = await supabase
        .from("daily_rewards")
        .select("last_claim_date, streak")
        .eq("user_id", user.id)
        .single();
      const today = new Date().toISOString().split("T")[0];
      if (data?.last_claim_date === today) {
        setAlreadyClaimed(true);
      }
      setStreak(data?.streak ?? 1);
    } finally {
      setLoading(false);
    }
  }


  if (loading) return null;

  const ui = (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,.7)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes rewardBounce {
          0% { opacity:0; transform:scale(0.3); }
          60% { opacity:1; transform:scale(1.15); }
          100% { transform:scale(1); }
        }
        @keyframes coinSpin { 0% { transform:rotateY(0); } 100% { transform:rotateY(360deg); } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(300px, 85vw)", borderRadius: 20,
          background: "linear-gradient(180deg, rgba(18,20,40,.98), rgba(8,9,18,.99))",
          border: "2px solid rgba(255,213,79,.3)", padding: "28px 24px", textAlign: "center",
          animation: "rewardBounce .5s ease forwards",
        }}
      >
        {alreadyClaimed ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 22, color: "#ffd54f", letterSpacing: 2 }}>
              JÁ COLETADO HOJE!
            </div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#8a95aa", marginTop: 8 }}>
              Volte amanhã para manter sua sequência de {streak} dias! 🔥
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 8, animation: "coinSpin 1s ease" }}>💰</div>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 22, color: "#ffd54f", letterSpacing: 2 }}>
              RECOMPENSA DIÁRIA!
            </div>
            <div style={{
              fontFamily: "Oswald, sans-serif", fontSize: 36, color: "#ffd54f",
              marginTop: 8, textShadow: "0 0 20px rgba(255,213,79,.4)",
            }}>
              +{reward} 💰
            </div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#8a95aa", marginTop: 8 }}>
              🔥 Sequência: {streak} {streak === 1 ? "dia" : "dias"}
            </div>
            <div style={{
              display: "flex", justifyContent: "center", gap: 4, marginTop: 12,
            }}>
              {STREAK_REWARDS.map((r, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: i < streak ? "rgba(255,213,79,.2)" : "rgba(255,255,255,.05)",
                  border: `1px solid ${i < streak ? "rgba(255,213,79,.4)" : "rgba(255,255,255,.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Oswald, sans-serif", fontSize: 8,
                  color: i < streak ? "#ffd54f" : "#8a95aa",
                }}>
                  {r}
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 20, padding: "10px 32px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #00e5ff, #7eb8ff)", cursor: "pointer",
            fontFamily: "Bangers, cursive", fontSize: 16, color: "#0d1b2e", letterSpacing: 2,
          }}
        >
          FECHAR
        </button>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(ui, document.body) : ui;
}
