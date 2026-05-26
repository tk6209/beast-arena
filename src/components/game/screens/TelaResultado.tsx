import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { falar } from "@/game/voice";
import { pageBg, DS } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { sfxVitoria, sfxDerrota } from "@/game/sfx";
import { supabase } from "@/integrations/supabase/client";
import { MONSTER_IMAGES } from "@/game/monsterImages";
import { recordBattleResult } from "@/game/serverApi";
import { MONSTROS } from "@/game/data";
import type { Jogador } from "@/game/engine";

interface BattleStats {
  cardsPlayed?: number; healsUsed?: number; evolutions?: number;
  damageDealt?: number; defenseCards?: number;
}
interface TelaResultadoProps {
  vencedor: Jogador | null; nomeJogador?: string;
  onRecomecar: () => void; onSair: () => void; onContinuar?: () => void;
  campaignFinished?: boolean; campaignWins?: number; campaignTotal?: number;
  campaignIndex?: number; userId?: string; dificuldade?: string; battleStats?: BattleStats;
}

function Counter({ target, duration = 1100, color = "#ffd54f" }:
  { target: number; duration?: number; color?: string }) {
  const [val, setVal] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <span style={{ color }}>{val.toLocaleString()}</span>;
}

function XpBar({ from, to, max, color = "#00e5ff" }:
  { from: number; to: number; max: number; color?: string }) {
  const [pct, setPct] = useState((from / max) * 100);
  useEffect(() => {
    const t = setTimeout(() => setPct(Math.min(100, (to / max) * 100)), 300);
    return () => clearTimeout(t);
  }, [to, max]);
  return (
    <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 99, height: 8, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})`,
        borderRadius: 99, transition: "width 1.1s cubic-bezier(.25,.46,.45,.94)", boxShadow: `0 0 8px ${color}` }} />
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i, x: (Math.random() - 0.5) * 340, y: -(90 + Math.random() * 280),
    rot: Math.random() * 720 - 360, delay: Math.random() * 0.5,
    color: ["#ffd54f","#00e5ff","#69f0ae","#ff8a80","#ce93d8","#ffab40"][i % 6],
    w: 5 + Math.random() * 6, h: 3 + Math.random() * 4,
  }));
  return (
    <div style={{ position:"fixed",top:"40%",left:"50%",pointerEvents:"none",zIndex:80 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:"absolute", width:p.w, height:p.h, background:p.color, borderRadius:1,
          "--tx":`${p.x}px`, "--ty":`${p.y}px`, "--rot":`${p.rot}deg`,
          animation:`confettiFly ${1.1+Math.random()*.9}s ease ${p.delay}s both`,
        } as any} />
      ))}
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  const fire = streak >= 5 ? "🔥🔥🔥" : streak >= 3 ? "🔥🔥" : "🔥";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,
      background:"rgba(255,100,0,.12)",border:"1.5px solid rgba(255,140,0,.35)",
      borderRadius:12,padding:"6px 14px",animation:"slideUp .4s both" }}>
      <span style={{ fontSize:20 }}>{fire}</span>
      <div>
        <div style={{ fontFamily:"Bangers,cursive",fontSize:15,color:"#ff9800",letterSpacing:1.5 }}>
          {streak}x SEQUÊNCIA!
        </div>
        <div style={{ fontFamily:"Nunito,sans-serif",fontSize:9,color:"rgba(255,152,0,.6)" }}>
          Bônus por vitórias consecutivas
        </div>
      </div>
    </div>
  );
}

function LevelUpBanner({ to }: { to: number }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,pointerEvents:"none",
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}>
      <div style={{ textAlign:"center",animation:"levelUpIn .6s cubic-bezier(.34,1.56,.64,1) forwards" }}>
        <div style={{ fontSize:64,filter:"drop-shadow(0 0 28px #ffd54f)" }}>⭐</div>
        <div style={{ fontFamily:"Bangers,cursive",fontSize:48,color:"#ffd54f",letterSpacing:3,
          textShadow:"0 0 40px #ffd54f, 0 0 80px #ffd54f44",lineHeight:1 }}>
          LEVEL UP!
        </div>
        <div style={{ fontFamily:"Oswald,sans-serif",fontSize:20,color:"#fff",letterSpacing:2,marginTop:6 }}>
          Nível {to} alcançado!
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @keyframes popIn       { 0%{opacity:0;transform:scale(.4) translateY(30px)} 65%{transform:scale(1.07) translateY(-4px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes slideUp     { 0%{opacity:0;transform:translateY(22px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes victoryBounce { 0%{opacity:0;transform:scale(.3) rotate(-10deg)} 55%{transform:scale(1.14) rotate(3deg)} 80%{transform:scale(.97)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes defeatFall  { 0%{opacity:0;transform:translateY(-40px)} 60%{opacity:1;transform:translateY(6px)} 100%{opacity:.65;transform:translateY(0)} }
  @keyframes victoryGlow { 0%,100%{filter:drop-shadow(0 0 18px rgba(0,229,255,.3))} 50%{filter:drop-shadow(0 0 48px rgba(255,213,79,.7)) drop-shadow(0 0 80px rgba(0,229,255,.4))} }
  @keyframes shimmer     { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
  @keyframes confettiFly { 0%{opacity:1;transform:translate(0,0) rotate(0)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(var(--rot))} }
  @keyframes levelUpIn   { 0%{opacity:0;transform:scale(.2)} 55%{opacity:1;transform:scale(1.12)} 80%{transform:scale(.97)} 100%{transform:scale(1)} }
  @keyframes rewardRow   { 0%{opacity:0;transform:translateX(-18px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes pulseGlow   { 0%,100%{opacity:.4} 50%{opacity:.9} }
  @keyframes coinPop     { 0%{transform:scale(1) rotate(0)} 50%{transform:scale(1.3) rotate(-12deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes statIn      { 0%{opacity:0;transform:scale(.6) translateY(10px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
`;

export default function TelaResultado({
  vencedor, nomeJogador = "Jogador", onRecomecar, onSair, onContinuar,
  campaignFinished, campaignWins = 0, campaignTotal = 0,
  campaignIndex = 0, userId, dificuldade = "medio", battleStats,
}: TelaResultadoProps) {
  const g = !!vencedor;
  const monstroId = vencedor?.monstro?.id;
  const monsterImg = monstroId ? MONSTER_IMAGES[monstroId] : null;
  const monsterGlow = monstroId && MONSTROS[monstroId] ? MONSTROS[monstroId].glow || "#00e5ff" : "#00e5ff";
  const canContinue = g && !campaignFinished && campaignIndex < campaignTotal - 1;

  const coinBase = g ? (dificuldade === "facil" ? 10 : dificuldade === "avancado" ? 40 : 20) : 3;
  const xpGain   = g ? (dificuldade === "facil" ? 20 : dificuldade === "avancado" ? 50 : 30) : 8;

  const [phase, setPhase]             = useState(0);
  const [streak, setStreak]           = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [oldLevel, setOldLevel]       = useState(1);
  const [newLevel, setNewLevel]       = useState(1);
  const [oldXp, setOldXp]             = useState(0);
  const [newXp, setNewXp]             = useState(0);
  const [xpMax, setXpMax]             = useState(100);
  const [showLvlUp, setShowLvlUp]     = useState(false);

  const perfLabel = g
    ? (battleStats?.damageDealt || 0) > 120 ? "DEVASTADOR 💥"
    : (battleStats?.evolutions || 0) > 0    ? "EVOLUÍDO ⭐"
    : (battleStats?.healsUsed || 0) > 1     ? "SOBREVIVENTE 💚"
    : "VITORIOSO ⚔️"
    : "CONTINUE TENTANDO 💪";

  useEffect(() => {
    if (g) sfxVitoria(); else sfxDerrota();
    if (g) falar("Vitória! Veja suas recompensas.", true);
    else falar("Derrota. Não desista!", true);

    // Staggered reveal — each phase triggers emotion
    const ts = [
      setTimeout(() => setPhase(1), 300),   // monster
      setTimeout(() => setPhase(2), 900),   // title
      setTimeout(() => setPhase(3), 1500),  // stats
      setTimeout(() => setPhase(4), 2100),  // rewards
      setTimeout(() => setPhase(5), 3000),  // xp bar
      setTimeout(() => setPhase(6), 3800),  // buttons
    ];
    if (userId) saveProgress(userId);
    return () => ts.forEach(clearTimeout);
  }, []);

  async function saveProgress(uid: string) {
    try {
      const [{ data: prof }, { data: stats }] = await Promise.all([
        supabase.from("profiles").select("xp,coins,level").eq("user_id", uid).single(),
        supabase.from("user_stats").select("win_streak,best_streak,total_wins,total_losses").eq("user_id", uid).single(),
      ]);

      const curLvl = prof?.level || 1;
      const curXp  = prof?.xp || 0;
      const curStreak = g ? ((stats?.win_streak || 0) + 1) : 0;
      const sb = g && curStreak >= 2 ? Math.round(coinBase * 0.25 * (curStreak - 1)) : 0;

      setOldLevel(curLvl); setOldXp(curXp); setXpMax(curLvl * 100);
      if (g) { setStreak(curStreak); setStreakBonus(sb); }

      let lvl = curLvl, xp = curXp + xpGain;
      if (xp >= curLvl * 100) { xp -= curLvl * 100; lvl++; setTimeout(() => { setShowLvlUp(true); setTimeout(() => setShowLvlUp(false), 2400); }, 2800); }
      setNewLevel(lvl); setNewXp(xp);

      try {
        await recordBattleResult({
          userId: uid,
          won: g,
          dificuldade,
          coinBase,
          xpGain,
          battleStats,
        });
      } catch (err) {
        console.warn("record_battle_result unavailable", err);
        toast("⚠️ Progresso não sincronizado. Tente novamente em instantes.", { duration: 3500 });
      }
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, bottom:0,
      background: g
        ? `radial-gradient(ellipse at 50% -10%,#1a2a0e 0%,#0a1408 55%,${DS.bg0} 100%)`
        : `radial-gradient(ellipse at 50% -10%,#2a0e0a 0%,#140806 55%,${DS.bg0} 100%)`,
      overflowY:"auto",
    }}>
      <style>{CSS}</style>
      <ChromeNoise />
      {g && phase >= 2 && <Confetti />}
      {showLvlUp && <LevelUpBanner to={newLevel} />}

      <div style={{ minHeight:"100%",display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",
        padding:"max(env(safe-area-inset-top),24px) 16px max(env(safe-area-inset-bottom),24px)",
        gap:0,position:"relative",zIndex:1 }}>

        {/* Monster */}
        {phase >= 1 && (
          <div style={{ position:"relative",marginBottom:6,animation:"popIn .7s cubic-bezier(.34,1.56,.64,1) both" }}>
            {g && <div style={{ position:"absolute",inset:-32,borderRadius:"50%",
              background:`radial-gradient(circle,${monsterGlow}35,transparent 65%)`,
              animation:"pulseGlow 2s ease-in-out infinite" }} />}
            {monsterImg
              ? <img src={monsterImg} alt="" style={{ width:130,height:130,objectFit:"contain",position:"relative",zIndex:1,
                  animation: g
                    ? "victoryBounce .8s cubic-bezier(.34,1.56,.64,1) forwards, victoryGlow 2s ease-in-out 1.2s infinite"
                    : "defeatFall 1s ease forwards" }} />
              : <div style={{ fontSize:72,animation:"float 3s ease-in-out infinite" }}>
                  {campaignFinished && g ? "👑" : g ? "🏆" : "💀"}
                </div>
            }
          </div>
        )}

        {/* Title */}
        {phase >= 2 && (
          <div style={{ textAlign:"center",marginBottom:8,animation:"popIn .5s both" }}>
            <div style={{
              fontFamily:"Bangers,cursive",fontSize:54,letterSpacing:3,lineHeight:1,
              background: g
                ? "linear-gradient(180deg,#fff9c4,#ffd54f,#f59e0b)"
                : "linear-gradient(180deg,#fca5a5,#ef4444,#b91c1c)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              backgroundSize:"200%",
              animation:`popIn .5s both${g?", shimmer 3s 1s ease-in-out infinite":""}`,
            }}>
              {campaignFinished && g ? "CAMPEÃO!" : g ? "VITÓRIA!" : "DERROTA!"}
            </div>
            <div style={{ fontFamily:"Oswald,sans-serif",fontSize:10,letterSpacing:3,
              color: g ? "#69f0ae" : "#8a95aa",opacity:.8,marginTop:2 }}>
              {perfLabel}
            </div>
          </div>
        )}

        {/* Battle stats */}
        {phase >= 3 && battleStats && (
          <div style={{ display:"flex",gap:8,marginBottom:12 }}>
            {[
              { e:"⚔️", v:battleStats.damageDealt||0, l:"DANO",   c:"#ef4444",  d:0   },
              { e:"🃏", v:battleStats.cardsPlayed||0, l:"CARTAS", c:"#00e5ff",  d:80  },
              { e:"⭐", v:battleStats.evolutions||0,  l:"EVOLS",  c:"#ffd54f",  d:160 },
              { e:"💚", v:battleStats.healsUsed||0,   l:"CURAS",  c:"#69f0ae",  d:240 },
            ].map(s => (
              <div key={s.l} style={{ textAlign:"center",
                background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",
                borderRadius:10,padding:"8px 10px",minWidth:56,
                animation:`statIn .35s ${s.d}ms cubic-bezier(.34,1.56,.64,1) both` }}>
                <div style={{ fontSize:16,marginBottom:2 }}>{s.e}</div>
                <div style={{ fontFamily:"Bangers,cursive",fontSize:20,color:s.c,letterSpacing:.5,lineHeight:1 }}>
                  <Counter target={s.v} color={s.c} />
                </div>
                <div style={{ fontFamily:"Oswald,sans-serif",fontSize:7,color:"#4a5568",letterSpacing:1,marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Rewards */}
        {phase >= 4 && (
          <div style={{ width:"100%",maxWidth:298,display:"flex",flexDirection:"column",gap:8 }}>
            {g && streak >= 2 && <StreakBadge streak={streak} />}
            <div style={{ display:"flex",gap:8 }}>
              <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,
                background:"rgba(255,213,79,.08)",border:"1.5px solid rgba(255,213,79,.28)",
                borderRadius:12,padding:"10px 12px",animation:"rewardRow .35s .05s both" }}>
                <span style={{ fontSize:24,animation:"coinPop .5s .3s ease both" }}>💰</span>
                <div>
                  <div style={{ fontFamily:"Bangers,cursive",fontSize:24,color:"#ffd54f",letterSpacing:1,lineHeight:1 }}>
                    +<Counter target={coinBase + streakBonus} color="#ffd54f" />
                  </div>
                  <div style={{ fontFamily:"Nunito,sans-serif",fontSize:9,color:"rgba(255,213,79,.6)" }}>
                    MOEDAS{streakBonus > 0 ? ` (+${streakBonus})` : ""}
                  </div>
                </div>
              </div>
              <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,
                background:"rgba(0,229,255,.08)",border:"1.5px solid rgba(0,229,255,.28)",
                borderRadius:12,padding:"10px 12px",animation:"rewardRow .35s .15s both" }}>
                <span style={{ fontSize:24 }}>✨</span>
                <div>
                  <div style={{ fontFamily:"Bangers,cursive",fontSize:24,color:"#00e5ff",letterSpacing:1,lineHeight:1 }}>
                    +<Counter target={xpGain} color="#00e5ff" />
                  </div>
                  <div style={{ fontFamily:"Nunito,sans-serif",fontSize:9,color:"rgba(0,229,255,.6)" }}>XP</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* XP Bar */}
        {phase >= 5 && oldXp > 0 && (
          <div style={{ width:"100%",maxWidth:298,animation:"slideUp .3s both",marginTop:8 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:9,color:"#8a95aa",letterSpacing:1 }}>
                NÍV {oldLevel}
              </span>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:9,color:"#00e5ff" }}>
                {newXp} / {xpMax} XP
              </span>
            </div>
            <XpBar from={oldXp} to={newXp} max={xpMax} />
            {campaignTotal > 0 && (
              <div style={{ display:"flex",justifyContent:"center",gap:5,marginTop:10 }}>
                {Array.from({ length: campaignTotal }).map((_,i) => (
                  <div key={i} style={{ width:11,height:11,borderRadius:"50%",transition:"all .4s",
                    background: i < campaignWins ? "#69f0ae" : i === campaignIndex && !g ? "#ef4444" : "rgba(255,255,255,.12)",
                    border: i === campaignIndex ? "2px solid rgba(255,255,255,.5)" : "1px solid rgba(255,255,255,.08)",
                    boxShadow: i < campaignWins ? "0 0 6px #69f0ae" : "none",
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        {phase >= 6 && (
          <div style={{ width:"100%",maxWidth:298,display:"flex",flexDirection:"column",
            gap:8,marginTop:16,animation:"slideUp .35s both" }}>
            {campaignFinished && g && (
              <div style={{ textAlign:"center",fontFamily:"Bangers,cursive",fontSize:14,
                color:"#69f0ae",letterSpacing:2,marginBottom:4 }}>
                🏆 CAMPANHA CONCLUÍDA!
              </div>
            )}
            {canContinue && onContinuar && (
              <BtnMain variant="gold" onClick={onContinuar}>⚔️ PRÓXIMO ADVERSÁRIO</BtnMain>
            )}
            <BtnMain variant={g ? "blue" : "gold"} onClick={onRecomecar}>🔄 JOGAR DE NOVO</BtnMain>
            <BtnMain variant="dark" onClick={onSair}>🏠 VOLTAR AO INÍCIO</BtnMain>
          </div>
        )}
      </div>
    </div>
  );
}
