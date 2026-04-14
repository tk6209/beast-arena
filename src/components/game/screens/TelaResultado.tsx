import React, { useEffect, useState } from "react";
import { falar } from "@/game/voice";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { sfxVitoria, sfxDerrota } from "@/game/sfx";
import { supabase } from "@/integrations/supabase/client";
import type { Jogador } from "@/game/engine";

interface BattleStats {
  cardsPlayed?: number;
  healsUsed?: number;
  evolutions?: number;
  damageDealt?: number;
  defenseCards?: number;
}

interface TelaResultadoProps {
  vencedor: Jogador | null;
  nomeJogador?: string;
  onRecomecar: () => void;
  onSair: () => void;
  onContinuar?: () => void;
  campaignFinished?: boolean;
  campaignWins?: number;
  campaignTotal?: number;
  campaignIndex?: number;
  userId?: string;
  dificuldade?: string;
  battleStats?: BattleStats;
}

export default function TelaResultado({
  vencedor, nomeJogador = "Jogador", onRecomecar, onSair, onContinuar,
  campaignFinished, campaignWins = 0, campaignTotal = 0, campaignIndex = 0,
  userId, dificuldade = "medio", battleStats,
}: TelaResultadoProps) {
  const g = !!vencedor;
  const [show, setShow] = useState(false);
  const canContinue = g && !campaignFinished && campaignIndex < campaignTotal - 1;

  useEffect(() => {
    if (g) sfxVitoria(); else sfxDerrota();

    if (campaignFinished && g) {
      falar("Incrível! Você derrotou todos os monstros. Seu nome será registrado no ranking.", true);
    } else if (g) {
      falar("Vitória! Prepare-se para o próximo adversário.", true);
    } else {
      falar("Que pena. Você foi derrotado. Tente novamente.", true);
    }

    setTimeout(() => setShow(true), 600);

    // Save to ranking only when campaign is finished (all beaten) or on loss
    if (campaignFinished && g) {
      saveRanking(nomeJogador, campaignWins, 0);
    } else if (!g) {
      saveRanking(nomeJogador, campaignWins, 1);
    }

    // Award XP and coins if logged in
    if (userId) {
      const coinReward = g ? (dificuldade === "facil" ? 10 : dificuldade === "avancado" ? 40 : 20) : 5;
      const xpReward = g ? 30 : 10;
      updateUserProgress(userId, g, coinReward, xpReward);
      updateMissionProgress(userId, g, battleStats);
      checkAchievements(userId);
    }
  }, [g]);

  async function updateUserProgress(uid: string, won: boolean, coins: number, xp: number) {
    try {
      // Update profile XP and coins
      const { data: profile } = await supabase.from("profiles").select("xp, coins, level").eq("user_id", uid).single();
      if (profile) {
        let newXp = profile.xp + xp;
        let newLevel = profile.level;
        const xpNeeded = newLevel * 100;
        if (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          newLevel++;
        }
        await supabase.from("profiles").update({
          xp: newXp, coins: profile.coins + coins, level: newLevel,
        }).eq("user_id", uid);
      }

      // Update user stats
      const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", uid).single();
      if (stats) {
        const newStreak = won ? stats.win_streak + 1 : 0;
        await supabase.from("user_stats").update({
          total_wins: stats.total_wins + (won ? 1 : 0),
          total_losses: stats.total_losses + (won ? 0 : 1),
          win_streak: newStreak,
          best_streak: Math.max(stats.best_streak, newStreak),
        }).eq("user_id", uid);
      }
    } catch (e) { console.error("Progress save error:", e); }
  }

  async function saveRanking(name: string, wins: number, losses: number) {
    try {
      const { data } = await supabase
        .from("rankings")
        .select("id, wins, losses")
        .eq("player_name", name)
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0];
        await supabase.from("rankings").update({
          wins: row.wins + wins,
          losses: row.losses + losses,
        }).eq("id", row.id);
      } else {
        await supabase.from("rankings").insert({
          player_name: name,
          wins,
          losses,
        });
      }
    } catch (e) { console.error("Ranking save error:", e); }
  }

  return (
    <div
      style={{
        ...pageBg(),
        background: g
          ? "radial-gradient(ellipse at center, #143a5a 0%, #09111f 52%, #020207 100%)"
          : "radial-gradient(ellipse at center, #4a1212 0%, #13090c 52%, #020207 100%)",
      }}
    >
      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(.7) translateY(30px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shimmer { 0%,100%{background-position:-200% center;} 50%{background-position:200% center;} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes particleFly {
          0% { opacity:1; transform:translate(0,0) scale(1); }
          100% { opacity:0; transform:translate(var(--px),var(--py)) scale(0); }
        }
      `}</style>
      <ChromeNoise />

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 20,
        fontFamily: "Nunito, sans-serif",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Particles */}
        {show && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 6, height: 6,
            borderRadius: "50%",
            background: g ? "#00e5ff" : "#ef4444",
            top: "45%", left: "50%",
            "--px": `${(Math.random() - 0.5) * 200}px`,
            "--py": `${(Math.random() - 0.5) * 200}px`,
            animation: `particleFly ${1 + Math.random()}s ease forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
          } as any} />
        ))}

        {/* Trophy / Skull */}
        <div style={{
          fontSize: 80,
          filter: `drop-shadow(0 0 40px ${g ? "#00e5ff" : "#ef4444"})`,
          animation: show ? "float 3s ease-in-out infinite" : "none",
        }}>
          {campaignFinished && g ? "👑" : g ? "🏆" : "💀"}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "Bangers, cursive",
          fontSize: 52,
          letterSpacing: 3,
          color: g ? "#ffd54f" : "#ff6b6b",
          textShadow: `0 0 30px ${g ? "#ffd54f88" : "#ff6b6b88"}`,
          animation: show ? "popIn .5s ease forwards" : "none",
          opacity: show ? 1 : 0,
        }}>
          {campaignFinished && g ? "CAMPEÃO!" : g ? "VITÓRIA!" : "DERROTA!"}
        </div>

        {/* Subtitle */}
        <div style={{ color: "#8a95aa", fontSize: 14, marginTop: 4, marginBottom: 8, textAlign: "center" }}>
          {campaignFinished && g
            ? `Você derrotou todos os ${campaignTotal} monstros!`
            : g
            ? `${vencedor?.nome || "Você"} venceu! (${campaignWins}/${campaignTotal})`
            : "Você foi derrotado. Tente novamente!"}
        </div>

        {/* Campaign progress */}
        {campaignTotal > 0 && (
          <div style={{
            display: "flex",
            gap: 4,
            marginBottom: 16,
            alignItems: "center",
          }}>
            {Array.from({ length: campaignTotal }).map((_, i) => (
              <div key={i} style={{
                width: 12, height: 12,
                borderRadius: "50%",
                background: i < campaignWins ? "#69f0ae" : i === campaignIndex && !g ? "#ef4444" : "rgba(255,255,255,.15)",
                border: i === campaignIndex ? "2px solid #fff" : "1px solid rgba(255,255,255,.1)",
                boxShadow: i < campaignWins ? "0 0 6px #69f0ae" : "none",
                transition: "all .3s",
              }} />
            ))}
          </div>
        )}

        {/* Popup card */}
        {show && (
          <div style={{
            background: "linear-gradient(145deg, #111827ee, #1f2937ee)",
            border: `1px solid ${g ? "#00e5ff44" : "#ef444444"}`,
            borderRadius: 16,
            padding: "24px 20px",
            width: "100%",
            maxWidth: 300,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            animation: "popIn .5s cubic-bezier(.34,1.56,.64,1) forwards",
            boxShadow: `0 0 40px ${g ? "#00e5ff22" : "#ef444422"}`,
          }}>
            {canContinue && onContinuar && (
              <BtnMain variant="gold" onClick={onContinuar}>
                ⚔️ PRÓXIMO ADVERSÁRIO
              </BtnMain>
            )}
            {campaignFinished && g && (
              <div style={{
                textAlign: "center",
                fontFamily: "Bangers, cursive",
                fontSize: 16,
                color: "#69f0ae",
                letterSpacing: 2,
                marginBottom: 4,
              }}>
                🏆 RANKING ATUALIZADO!
              </div>
            )}
            <BtnMain variant="blue" onClick={onRecomecar}>
              🔄 RECOMEÇAR
            </BtnMain>
            <BtnMain variant="dark" onClick={onSair}>
              🚪 SAIR
            </BtnMain>
          </div>
        )}
      </div>
    </div>
  );
}
