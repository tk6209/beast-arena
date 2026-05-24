import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ChromeNoise from "@/components/game/ChromeNoise";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import { MONSTROS } from "@/game/data";
import { DS } from "@/game/styles";
import type { Dificuldade } from "@/pages/Index";
import { toast } from "@/hooks/use-toast";

const MONSTER_KEYS = Object.keys(MONSTROS);

const LEAGUE_INFO: Record<string, { emoji: string; color: string; label: string }> = {
  bronze:   { emoji: "🥉", color: "#cd7f32", label: "Bronze"   },
  silver:   { emoji: "🥈", color: "#a8a8b3", label: "Prata"    },
  gold:     { emoji: "🥇", color: "#ffd54f", label: "Ouro"     },
  platinum: { emoji: "💎", color: "#67e8f9", label: "Platina"  },
  diamond:  { emoji: "💠", color: "#818cf8", label: "Diamante" },
  master:   { emoji: "👑", color: "#f59e0b", label: "Mestre"   },
};

interface Props {
  user: any;
  onIniciar: (modo: string, diff?: Dificuldade) => void;
  onPerfil: () => void;
  onLoja: () => void;
  onMulti: () => void;
  onMatchmaking: () => void;
  onRanking: () => void;
  onSeasonPass: () => void;
  onMissoes: () => void;
  onConquistas: () => void;
  onAmigos: () => void;
  onColecao: () => void;
  onEvoluir: () => void;
  onLogout: () => void;
}

const CSS = `
  @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse{ 0%,100%{opacity:.45} 50%{opacity:1} }
  @keyframes badgePop { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes shimBar  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes heroShine{ 0%{transform:translateX(-100%) skewX(-12deg)} 100%{transform:translateX(250%) skewX(-12deg)} }
`;

export default function TelaLobbyPrincipal({
  user, onIniciar, onPerfil, onLoja, onMulti, onMatchmaking,
  onRanking, onSeasonPass, onMissoes, onConquistas, onAmigos, onColecao, onEvoluir, onLogout,
}: Props) {
  const [profile, setProfile]           = useState<any>(null);
  const [stats, setStats]               = useState<any>(null);
  const [league, setLeague]             = useState<any>(null);
  const [bgMonsterIdx, setBgMonsterIdx] = useState(0);
  const [missaoClaimable, setMissaoClaimable] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: s }, { data: l }] = await Promise.all([
        supabase.from("profiles").select("display_name,level,xp,coins,gems,avatar_url").eq("user_id", user.id).single(),
        supabase.from("user_stats").select("total_wins,total_losses,win_streak,best_streak,favorite_monster").eq("user_id", user.id).single(),
        supabase.from("player_leagues").select("*").eq("user_id", user.id).single(),
      ]);
      if (p) setProfile(p);
      if (s) setStats(s);
      if (l) setLeague(l);
      const today = new Date().toISOString().split("T")[0];
      const { data: cl } = await supabase.from("user_missions").select("id")
        .eq("user_id", user.id).eq("assigned_date", today)
        .eq("completed", true).eq("claimed", false).limit(1);
      setMissaoClaimable((cl?.length || 0) > 0);
    })();
    const t = setInterval(() => setBgMonsterIdx(i => (i + 1) % MONSTER_KEYS.length), 5000);
    return () => clearInterval(t);
  }, [user]);

  const li    = LEAGUE_INFO[league?.league || "bronze"];
  const lvl   = profile?.level || 1;
  const xp    = profile?.xp || 0;
  const xpMax = lvl * 100;
  const xpPct = Math.min(100, (xp / xpMax) * 100);
  const wins  = stats?.total_wins || 0;
  const total = wins + (stats?.total_losses || 0);
  const wr    = total > 0 ? Math.round((wins / total) * 100) : 0;
  const bgM   = MONSTER_KEYS[bgMonsterIdx % MONSTER_KEYS.length];
  const bgColor = MONSTROS[bgM]?.glow || "#00e5ff";

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0,
      background:"linear-gradient(160deg,#0c0804 0%,#100a06 50%,#080503 100%)",
      overflow:"hidden", fontFamily:`${DS.fontUI}` }}>
      <style>{CSS}</style>
      <ChromeNoise />

      {/* Ambient background glow — changes with monster */}
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",transition:"all 2s ease" }}>
        <div style={{ position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",
          width:500,height:500,borderRadius:"50%",
          background:`radial-gradient(circle,${bgColor}12,transparent 65%)`,
          transition:"background 2s ease",animation:"glowPulse 5s ease-in-out infinite" }} />
        <div style={{ position:"absolute",bottom:-80,right:-60,width:300,height:300,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(30,136,229,.08),transparent 70%)" }} />
      </div>

      <div style={{ position:"absolute", inset:0, zIndex:1,
        display:"flex", flexDirection:"column",
        overflowY:"auto", overflowX:"hidden",
        WebkitOverflowScrolling:"touch" as any,
        paddingTop:"max(env(safe-area-inset-top),12px)",
        paddingBottom:"calc(max(env(safe-area-inset-bottom),0px) + 72px)" }}>

        {/* ══ HEADER ══ */}
        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px 10px" }}>

          {/* Avatar circle */}
          <div onClick={onPerfil} style={{ position:"relative",flexShrink:0,cursor:"pointer" }}>
            <div style={{ width:50,height:50,borderRadius:"50%",
              border:`2.5px solid ${li.color}`,
              background:"rgba(255,255,255,.05)",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 0 16px ${li.color}44,0 0 32px ${li.color}22` }}>
              <MonsterAvatar monstroId={stats?.favorite_monster || "panther"} size={36} glow={li.color} />
            </div>
            <div style={{ position:"absolute",bottom:-1,right:-1,
              background:"#060b14",borderRadius:"50%",padding:2,lineHeight:1 }}>
              <span style={{ fontSize:13 }}>{li.emoji}</span>
            </div>
          </div>

          {/* Name + XP */}
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
              <span style={{ fontFamily:"Bangers,cursive",fontSize:17,color:"#f0f4ff",
                letterSpacing:.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:140 }}>
                {profile?.display_name || "Jogador"}
              </span>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:9,color:li.color,
                background:`${li.color}1a`,border:`1px solid ${li.color}40`,
                borderRadius:5,padding:"1px 6px",flexShrink:0,letterSpacing:.5 }}>
                NÍV {lvl}
              </span>
              {(stats?.win_streak || 0) >= 2 && (
                <span style={{ fontSize:12,background:"rgba(255,100,0,.15)",
                  border:"1px solid rgba(255,140,0,.3)",borderRadius:5,
                  padding:"1px 5px",flexShrink:0,animation:"badgePop .4s both" }}>
                  {"🔥".repeat(Math.min(stats.win_streak,3))}
                </span>
              )}
            </div>
            <div style={{ background:"rgba(255,255,255,.06)",borderRadius:99,height:5,overflow:"hidden",marginBottom:3 }}>
              <div style={{ height:"100%",width:`${xpPct}%`,borderRadius:99,
                background:`linear-gradient(90deg,${li.color}88,${li.color})`,
                transition:"width 1.2s ease",
                backgroundSize:"200%",animation:"shimBar 3s linear infinite" }} />
            </div>
            <div style={{ display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color:"#3a4458",letterSpacing:.5 }}>
                {xp}/{xpMax} XP
              </span>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color:"#3a4458",letterSpacing:.5 }}>
                {wr}% WR · {wins}V
              </span>
            </div>
          </div>

          {/* Coins + Gems */}
          <div style={{ display:"flex",flexDirection:"column",gap:4,flexShrink:0 }}>
            <div onClick={onLoja} style={{ cursor:"pointer",
              display:"flex",alignItems:"center",gap:4,
              background:"rgba(255,213,79,.07)",border:"1.5px solid rgba(255,213,79,.2)",
              borderRadius:10,padding:"3px 8px" }}>
              <span style={{ fontSize:12 }}>💰</span>
              <span style={{ fontFamily:"Bangers,cursive",fontSize:13,color:"#ffd54f" }}>
                {(profile?.coins || 0).toLocaleString()}
              </span>
            </div>
            <div onClick={onLoja} style={{ cursor:"pointer",
              display:"flex",alignItems:"center",gap:4,
              background:"rgba(0,229,255,.08)",border:"1.5px solid rgba(0,229,255,.25)",
              borderRadius:10,padding:"3px 8px",
              boxShadow:"0 0 10px rgba(0,229,255,.15)" }}>
              <span style={{ fontSize:12 }}>💎</span>
              <span style={{ fontFamily:"Bangers,cursive",fontSize:13,color:"#00e5ff" }}>
                {(profile?.gems || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ══ HERO: VS IA ══ */}
        <div style={{ padding:"8px 16px 10px" }}>
          <HeroBattleBtn onClick={() => onIniciar("duel")} />
        </div>

        {/* ══ VS HUMANO ══ */}
        <div style={{ padding:"4px 16px 0" }}>
          <div style={{ fontFamily:"Oswald,sans-serif",fontSize:9,color:"#2a3448",
            letterSpacing:2,marginBottom:8 }}>VS HUMANO</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
            <ModeCard emoji="🌐" title="ONLINE" sub="Servidor" color="#ffd54f" onClick={onMatchmaking} delay={0} />
            <ModeCard emoji="📱" title="QR/SALA" sub="Amigo perto" color="#69f0ae" onClick={onMulti} delay={1} />
            <ModeCard emoji="📡" title="BLUETOOTH" sub="Em breve" color="#7a8599" onClick={() => {
              toast({ title:"📡 Bluetooth em breve", description:"Disponível apenas no app nativo. Use QR/Sala para jogar perto." });
            }} delay={2} disabled />
          </div>
        </div>

        {/* ══ EXTRAS ══ */}
        <div style={{ padding:"14px 16px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <ModeCard emoji="🏆" title="RANKING" sub="Top jogadores" color="#b388ff" onClick={onRanking} delay={3} />
          <ModeCard emoji="🏪" title="LOJA" sub="Cartas e monstros" color="#ff8a65" onClick={onLoja} delay={4} />
        </div>

        {/* ══ DAILY CHIPS ══ */}
        <div style={{ padding:"12px 16px 0" }}>
          <div style={{ fontFamily:"Oswald,sans-serif",fontSize:9,color:"#2a3448",
            letterSpacing:2,marginBottom:8 }}>DIÁRIO</div>
          <div style={{ display:"flex",gap:8 }}>
            <DailyChip emoji="🎯" label="MISSÕES"    color="#69f0ae" badge={missaoClaimable} onClick={onMissoes} />
            <DailyChip emoji="🏅" label="CONQUISTAS" color="#ffd54f" onClick={onConquistas} />
            <DailyChip emoji="⚡" label="EVOLUIR"    color="#b794ff" onClick={onEvoluir} />
            <DailyChip emoji="🌟" label="SEASON"     color="#ce93d8" onClick={onSeasonPass} />
            <DailyChip emoji="🃏" label="COLEÇÃO"   color="#f0b429" onClick={onColecao} />
            <DailyChip emoji="👾" label="AMIGOS"     color="#4fc3f7" onClick={onAmigos} />
          </div>
        </div>
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:20,
        background:"linear-gradient(0deg,rgba(5,8,16,.99) 70%,transparent)",
        borderTop:"1px solid rgba(255,255,255,.04)",
        display:"flex",justifyContent:"space-around",alignItems:"center",
        padding:`8px 8px calc(env(safe-area-inset-bottom,0px) + 6px)` }}>
        {[
          { icon:"⚔️",  label:"BATALHA", fn:() => onIniciar("duel"), active:true },
          { icon:"🏪",  label:"LOJA",    fn:onLoja },
          { icon:"🏆",  label:"TOP",     fn:onRanking },
          { icon:"👤",  label:"PERFIL",  fn:onPerfil },
          { icon:"🚪",  label:"SAIR",    fn:onLogout },
        ].map(b => (
          <button key={b.label} onClick={b.fn} style={{
            display:"flex",flexDirection:"column",alignItems:"center",gap:2,
            minWidth:44,minHeight:44,justifyContent:"center",
            background:"none",border:"none",cursor:"pointer",
            opacity:b.active?1:0.45,transition:"opacity .15s, transform .1s",
          }}>
            <span style={{ fontSize:20 }}>{b.icon}</span>
            <span style={{ fontFamily:"Oswald,sans-serif",fontSize:7,letterSpacing:1,
              color:b.active?"#00e5ff":"#8a95aa" }}>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HeroBattleBtn({ onClick }: { onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width:"100%", minHeight:96, borderRadius:20, border:"none", cursor:"pointer",
        position:"relative", overflow:"hidden",
        background: pressed
          ? "linear-gradient(135deg,#0d3080,#1560c0)"
          : "linear-gradient(135deg,#1044c8,#1e88e5,#00b0d4)",
        transform: pressed ? "scale(0.97) translateY(1px)" : "scale(1)",
        transition:"transform .1s ease",
        boxShadow: pressed
          ? "0 4px 16px rgba(0,160,255,.2)"
          : "0 10px 40px rgba(0,160,255,.38),0 0 0 1px rgba(255,255,255,.08) inset,0 1px 0 rgba(255,255,255,.2) inset",
        animation:"fadeUp .35s both",
      }}>
      {/* Animated shine */}
      <div style={{ position:"absolute",top:0,bottom:0,width:60,
        background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",
        animation:"heroShine 3s ease-in-out 1s infinite",pointerEvents:"none" }} />
      {/* Content */}
      <div style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",
        justifyContent:"center",gap:14,padding:"0 24px",height:"100%" }}>
        <span style={{ fontSize:48,filter:"drop-shadow(0 4px 12px rgba(0,0,0,.3))" }}>⚔️</span>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontFamily:"Bangers,cursive",fontSize:36,color:"#fff",
            letterSpacing:2,lineHeight:1,textShadow:"0 2px 12px rgba(0,0,0,.4)" }}>
            VS IA
          </div>
          <div style={{ fontFamily:"Nunito,sans-serif",fontSize:12,
            color:"rgba(255,255,255,.65)",marginTop:3,letterSpacing:.3 }}>
            Jogar contra a Inteligência Artificial
          </div>
        </div>
        <span style={{ marginLeft:"auto",fontSize:26,color:"rgba(255,255,255,.6)" }}>›</span>
      </div>
    </button>
  );
}

function ModeCard({ emoji, title, sub, color, onClick, delay, disabled }:
  { emoji:string;title:string;sub:string;color:string;onClick:()=>void;delay:number;disabled?:boolean }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick}
      onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
      style={{ background:p?`${color}18`:`${color}0b`,border:`1.5px solid ${color}${p?"55":"22"}`,
        borderRadius:16,padding:"14px",cursor:"pointer",textAlign:"left",minHeight:76,
        transform:p?"scale(0.95)":"scale(1)",transition:"transform .1s ease, border-color .1s",
        boxShadow:p?`0 0 20px ${color}22`:"none",animation:`fadeUp .4s ${delay*0.07}s both`,
        opacity: disabled ? 0.6 : 1 }}>
      <div style={{ fontSize:26,marginBottom:6 }}>{emoji}</div>
      <div style={{ fontFamily:"Bangers,cursive",fontSize:15,color,letterSpacing:1.5,lineHeight:1 }}>{title}</div>
      <div style={{ fontFamily:"Nunito,sans-serif",fontSize:9,color:"#8a95aa",marginTop:3 }}>{sub}</div>
    </button>
  );
}

function DailyChip({ emoji, label, color, badge, onClick }:
  { emoji:string;label:string;color:string;badge?:boolean;onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ flex:1,background:`${color}09`,
      border:`1px solid ${color}1e`,borderRadius:12,padding:"10px 6px",
      cursor:"pointer",position:"relative",transition:"all .15s" }}>
      <div style={{ fontSize:22,marginBottom:3 }}>{emoji}</div>
      <div style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color,letterSpacing:1 }}>{label}</div>
      {badge && <div style={{ position:"absolute",top:5,right:5,width:8,height:8,
        borderRadius:"50%",background:"#ffd54f",boxShadow:"0 0 6px #ffd54f",
        animation:"glowPulse 1s ease-in-out infinite" }} />}
    </button>
  );
}
