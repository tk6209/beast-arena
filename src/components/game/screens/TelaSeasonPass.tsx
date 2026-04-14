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

const SEASON_TIERS = [
  { tier: 1, xp: 100, reward: "50 💰", emoji: "💰", premium: false },
  { tier: 2, xp: 250, reward: "Pack Comum", emoji: "📦", premium: false },
  { tier: 3, xp: 450, reward: "100 💰", emoji: "💰", premium: false },
  { tier: 4, xp: 700, reward: "Skin Rara", emoji: "🎨", premium: true },
  { tier: 5, xp: 1000, reward: "Pack Raro", emoji: "📦", premium: false },
  { tier: 6, xp: 1400, reward: "200 💰", emoji: "💰", premium: false },
  { tier: 7, xp: 1900, reward: "Swarm Épico", emoji: "🐾", premium: false },
  { tier: 8, xp: 2500, reward: "Skin Lendária", emoji: "👑", premium: true },
  { tier: 9, xp: 3200, reward: "Pack Lendário", emoji: "📦", premium: false },
  { tier: 10, xp: 4000, reward: "500 💰 + Título", emoji: "🏆", premium: false },
];

export default function TelaSeasonPass({ user, onVoltar }: Props) {
  const [pass, setPass] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPass();
  }, [user.id]);

  async function loadPass() {
    const { data } = await supabase.from("season_pass")
      .select("*").eq("user_id", user.id).single();
    if (data) setPass(data);
    setLoading(false);
  }

  async function claimTier(tier: number) {
    if (!pass) return;
    const claimed = [...(pass.claimed_tiers || []), tier];
    await supabase.from("season_pass").update({ claimed_tiers: claimed }).eq("user_id", user.id);
    setPass({ ...pass, claimed_tiers: claimed });
  }

  const currentXp = pass?.xp || 0;
  const currentTier = pass?.tier || 0;
  const claimedTiers = new Set(pass?.claimed_tiers || []);

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
              🏆 SEASON PASS
            </div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#8a95aa", marginTop: 4 }}>
              Temporada {pass?.season || 1} — {currentXp} XP
            </div>
            {/* Overall progress */}
            <div style={{
              height: 6, borderRadius: 3, background: "rgba(255,255,255,.1)", marginTop: 8, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${Math.min(100, (currentXp / 4000) * 100)}%`,
                background: "linear-gradient(90deg, #ffd54f, #ff9800)",
                transition: "width .5s ease",
              }} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>Carregando...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SEASON_TIERS.map(t => {
                const unlocked = currentXp >= t.xp;
                const claimed = claimedTiers.has(t.tier);
                const canClaim = unlocked && !claimed && (!t.premium || pass?.premium);

                return (
                  <div key={t.tier} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: claimed ? "rgba(105,240,174,.05)" : unlocked ? "rgba(255,213,79,.05)" : "rgba(255,255,255,.02)",
                    border: `1px solid ${claimed ? "rgba(105,240,174,.2)" : unlocked ? "rgba(255,213,79,.2)" : "rgba(255,255,255,.05)"}`,
                    borderRadius: 10, padding: "10px 14px",
                    opacity: unlocked ? 1 : 0.5,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: t.premium ? "linear-gradient(135deg, #ffd54f22, #ff980022)" : "rgba(255,255,255,.04)",
                      border: `1px solid ${t.premium ? "rgba(255,213,79,.3)" : "rgba(255,255,255,.08)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {t.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontFamily: "Bangers, cursive", fontSize: 13, letterSpacing: 1,
                          color: claimed ? "#69f0ae" : unlocked ? "#ffd54f" : "#8a95aa",
                        }}>
                          TIER {t.tier}
                        </span>
                        {t.premium && <span style={{ fontSize: 8, color: "#ffd54f", fontFamily: "Oswald, sans-serif" }}>👑 PREMIUM</span>}
                      </div>
                      <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8a95aa" }}>
                        {t.reward} — {t.xp} XP
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {claimed ? (
                        <span style={{ fontSize: 12, color: "#69f0ae" }}>✅</span>
                      ) : canClaim ? (
                        <button onClick={() => claimTier(t.tier)} style={{
                          background: "linear-gradient(135deg, #ffd54f, #ff9800)",
                          border: "none", borderRadius: 6, padding: "4px 10px",
                          fontFamily: "Bangers, cursive", fontSize: 10, color: "#1a1a2e",
                          cursor: "pointer", letterSpacing: 1,
                        }}>
                          COLETAR
                        </button>
                      ) : unlocked && t.premium && !pass?.premium ? (
                        <span style={{ fontSize: 8, color: "#ffd54f", fontFamily: "Oswald, sans-serif" }}>🔒</span>
                      ) : (
                        <span style={{ fontSize: 8, color: "#8a95aa", fontFamily: "Oswald, sans-serif" }}>🔒</span>
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
