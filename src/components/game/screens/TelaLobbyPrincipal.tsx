import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import type { Dificuldade } from "@/pages/Index";
import { toast } from "@/hooks/use-toast";
import {
  Swords, Store, BookOpen, Users, User as UserIcon, LogOut,
  Trophy, Medal, Zap, Award,
} from "lucide-react";

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

export default function TelaLobbyPrincipal({
  user, onIniciar, onPerfil, onLoja, onMulti, onMatchmaking,
  onRanking, onSeasonPass, onMissoes, onConquistas, onAmigos, onColecao, onEvoluir, onLogout,
}: Props) {
  const [profile, setProfile]           = useState<any>(null);
  const [stats, setStats]               = useState<any>(null);
  const [league, setLeague]             = useState<any>(null);
  const [seasonInfo, setSeasonInfo]     = useState<{ level: number; pct: number }>({ level: 1, pct: 0 });
  const [missoes, setMissoes]           = useState<Array<{ id:string; title:string; current:number; target:number; claimable:boolean }>>([]);
  const [hasClaimable, setHasClaimable] = useState(false);

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

      // Season pass progress
      const { data: sp } = await supabase.from("season_pass")
        .select("current_level,current_xp,xp_to_next")
        .eq("user_id", user.id).maybeSingle();
      if (sp) {
        const need = (sp as any).xp_to_next || 100;
        const cur  = (sp as any).current_xp || 0;
        setSeasonInfo({ level: (sp as any).current_level || 1, pct: Math.min(100, (cur / need) * 100) });
      }

      // Daily missions snapshot (top 2)
      const today = new Date().toISOString().split("T")[0];
      const { data: ms } = await supabase
        .from("user_missions")
        .select("id,current_value,completed,claimed,daily_missions(title,target_value)")
        .eq("user_id", user.id).eq("assigned_date", today)
        .limit(2);
      if (ms) {
        const mapped = (ms as any[]).map(m => ({
          id: m.id,
          title: m.daily_missions?.title || "Missão",
          current: m.current_value || 0,
          target: m.daily_missions?.target_value || 1,
          claimable: m.completed && !m.claimed,
        }));
        setMissoes(mapped);
        setHasClaimable(mapped.some(m => m.claimable));
      }
    })();
  }, [user]);

  const li    = LEAGUE_INFO[league?.league || "bronze"];
  const lvl   = profile?.level || 1;
  const xp    = profile?.xp || 0;
  const xpMax = lvl * 100;
  const xpPct = Math.min(100, (xp / xpMax) * 100);
  const wins  = stats?.total_wins || 0;
  const favMonster = stats?.favorite_monster || "panther";

  return (
    <div className="fixed inset-0 w-full h-full bg-[#05020a] flex items-center justify-center p-3 sm:p-4 overflow-hidden select-none font-['Nunito']">
      {/* Main Landscape Container */}
      <div className="relative w-full h-full max-w-[1280px] max-h-[720px] flex gap-3 sm:gap-4 p-3 sm:p-4 text-white bg-[#0d071b] rounded-[28px] sm:rounded-[40px] border-2 sm:border-4 border-[#1a1438] shadow-[0_0_100px_rgba(0,0,0,0.8)]">

        {/* Decorative dot grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-[24px] sm:rounded-[36px]">
          <div className="absolute inset-0" style={{ backgroundImage:"radial-gradient(circle at 2px 2px, #38e1ff 1px, transparent 0)", backgroundSize:"40px 40px" }} />
        </div>

        {/* ═══ LEFT RAIL — Command Center ═══ */}
        <aside className="w-14 sm:w-20 flex flex-col items-center py-4 sm:py-6 gap-3 sm:gap-4 bg-[#110c26]/80 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl z-10 shrink-0">
          <RailIcon active onClick={() => onIniciar("duel")} tooltip="BATALHA">
            <Swords className="w-5 h-5 sm:w-7 sm:h-7" />
          </RailIcon>
          <div className="flex flex-col gap-2 sm:gap-4 mt-1 sm:mt-2">
            <RailIcon onClick={onLoja} tooltip="LOJA"><Store className="w-5 h-5 sm:w-6 sm:h-6" /></RailIcon>
            <RailIcon onClick={onColecao} tooltip="COLEÇÃO"><BookOpen className="w-5 h-5 sm:w-6 sm:h-6" /></RailIcon>
            <RailIcon onClick={onAmigos} tooltip="AMIGOS"><Users className="w-5 h-5 sm:w-6 sm:h-6" /></RailIcon>
            <RailIcon onClick={onPerfil} tooltip="PERFIL"><UserIcon className="w-5 h-5 sm:w-6 sm:h-6" /></RailIcon>
          </div>
          <div className="mt-auto">
            <RailIcon onClick={onLogout} tooltip="SAIR" danger>
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </RailIcon>
          </div>
        </aside>

        {/* ═══ MAIN DASHBOARD ═══ */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">

          {/* ── HEADER ── */}
          <header className="flex justify-between items-center h-12 sm:h-14 px-1 sm:px-2 shrink-0">
            <div onClick={onPerfil} className="flex items-center gap-2 sm:gap-4 group cursor-pointer min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-[#38e1ff] bg-[#1a1438] p-0.5 overflow-hidden rotate-3 group-hover:rotate-0 transition-transform flex items-center justify-center">
                  <MonsterAvatar monstroId={favMonster} size={36} glow={li.color} />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#ff3b7a] text-[9px] sm:text-[10px] font-black min-w-[20px] h-5 px-1 flex items-center justify-center rounded-lg border-2 border-[#0d071b] shadow-lg">
                  {lvl}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-xs sm:text-sm font-['Bangers'] tracking-[0.1em] text-[#38e1ff] drop-shadow-[0_0_8px_rgba(56,225,255,0.4)] truncate max-w-[120px] sm:max-w-[200px]">
                  {profile?.display_name || "JOGADOR"}
                </div>
                <div className="w-24 sm:w-32 h-1.5 sm:h-2 bg-black/50 rounded-full border border-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#38e1ff] to-[#b794ff] shadow-[0_0_10px_rgba(56,225,255,0.5)] transition-all duration-700" style={{ width:`${xpPct}%` }} />
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold text-white/40 mt-0.5">{xp}/{xpMax} XP</div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 shrink-0">
              <button onClick={onLoja} className="bg-[#110c26]/60 backdrop-blur border border-white/10 rounded-xl sm:rounded-2xl pl-1.5 pr-3 sm:pl-2 sm:pr-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 hover:border-yellow-400/40 transition-colors">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)] flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 border-2 border-yellow-600 rounded-full" />
                </div>
                <span className="text-xs sm:text-sm font-black text-yellow-100">{(profile?.coins || 0).toLocaleString()}</span>
              </button>
              <button onClick={onLoja} className="bg-[#110c26]/60 backdrop-blur border border-white/10 rounded-xl sm:rounded-2xl pl-1.5 pr-3 sm:pl-2 sm:pr-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 hover:border-cyan-400/40 transition-colors">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#38e1ff] shadow-[0_0_10px_rgba(56,225,255,0.4)] rotate-45 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#0a0518] -rotate-45" />
                </div>
                <span className="text-xs sm:text-sm font-black text-cyan-100">{(profile?.gems || 0).toLocaleString()}</span>
              </button>
            </div>
          </header>

          {/* ── BODY ── */}
          <div className="flex-1 flex gap-3 sm:gap-4 min-h-0">

            {/* === GAME MODES === */}
            <main className="flex-[1.8] flex flex-col gap-3 sm:gap-4 min-w-0">

              {/* VS IA Hero Banner */}
              <button
                onClick={() => onIniciar("duel")}
                className="relative group flex-1 bg-[#1a1438] border-2 border-[#38e1ff]/20 rounded-[24px] sm:rounded-[32px] overflow-hidden cursor-pointer hover:border-[#38e1ff]/60 transition-all shadow-2xl text-left"
              >
                {/* Character art overlay */}
                <div className="absolute right-0 top-0 w-3/4 h-full pointer-events-none flex items-center justify-center opacity-50 group-hover:scale-105 transition-transform duration-700">
                  <MonsterAvatar monstroId={favMonster} size={220} glow="#38e1ff" />
                </div>
                {/* Gradient mask */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d071b] via-[#0d071b]/80 to-transparent" />

                <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-10 gap-1 sm:gap-2">
                  <span className="text-[#38e1ff] text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase opacity-60">Treinamento</span>
                  <h2 className="text-4xl sm:text-6xl md:text-7xl font-['Bangers'] text-white italic leading-tight tracking-wider drop-shadow-[4px_4px_0px_#ff3b7a]">VS IA</h2>
                  <p className="hidden sm:block text-xs sm:text-sm font-bold text-[#b794ff] max-w-[200px] leading-tight">APERFEIÇOE SUAS HABILIDADES EM COMBATE REAL.</p>
                  <span className="mt-2 sm:mt-4 w-fit px-6 sm:px-12 py-2 sm:py-3 bg-[#38e1ff] text-[#0a0518] font-black rounded-xl sm:rounded-2xl text-sm sm:text-lg uppercase tracking-widest group-hover:bg-white group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-all">
                    Jogar
                  </span>
                </div>
              </button>

              {/* Secondary modes */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 h-16 sm:h-24 shrink-0">
                <ModeTile color="#38e1ff" title="ONLINE"   sub="MULTIJOGADOR" onClick={onMatchmaking} />
                <ModeTile color="#b794ff" title="SALA QR"  sub="JOGO LOCAL"   onClick={onMulti} />
                <ModeTile color="#ff3b7a" title="BLUETOOTH" sub="EM BREVE" disabled onClick={() => {
                  toast({ title:"📡 Bluetooth em breve", description:"Use SALA QR para jogar com amigos perto." });
                }} />
              </div>
            </main>

            {/* === PROGRESSION SIDEBAR === */}
            <aside className="hidden md:flex flex-1 flex-col gap-3 sm:gap-4 min-w-[220px] max-w-[300px]">

              {/* Season pass card */}
              <button
                onClick={onSeasonPass}
                className="bg-gradient-to-br from-[#16112a] to-[#0a0518] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl text-left hover:border-[#b794ff]/40 transition-colors"
              >
                <div className="flex justify-between items-end mb-2 sm:mb-3">
                  <div className="flex flex-col">
                    <span className="font-['Bangers'] text-base sm:text-lg tracking-widest text-[#b794ff]">SEASON 01</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase">Passe de Batalha</span>
                  </div>
                  <span className="text-lg sm:text-xl font-['Bangers'] text-white drop-shadow-[0_0_5px_#ff3b7a]">LVL {seasonInfo.level}</span>
                </div>
                <div className="relative w-full h-2.5 sm:h-3 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff3b7a] via-[#b794ff] to-[#38e1ff] shadow-[0_0_15px_rgba(183,148,255,0.6)] transition-all duration-700" style={{ width:`${seasonInfo.pct}%` }} />
                </div>
              </button>

              {/* Missions panel */}
              <div className="flex-1 bg-[#110c26]/60 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0">
                  <h3 className="text-[10px] sm:text-xs font-black text-[#38e1ff] uppercase tracking-widest">Missões Diárias</h3>
                  <div className="flex gap-1.5">
                    <ChipMini onClick={onRanking} title="RANKING"><Trophy className="w-3 h-3" /></ChipMini>
                    <ChipMini onClick={onConquistas} title="CONQUISTAS"><Medal className="w-3 h-3" /></ChipMini>
                    <ChipMini onClick={onEvoluir} title="EVOLUIR"><Zap className="w-3 h-3" /></ChipMini>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto min-h-0">
                  {missoes.length === 0 ? (
                    <div className="text-center text-white/30 text-[10px] py-4">Carregando missões…</div>
                  ) : missoes.map(m => (
                    <div key={m.id} className="group p-2.5 sm:p-3 bg-black/40 border border-white/5 rounded-xl sm:rounded-2xl hover:border-[#38e1ff]/30 transition-colors">
                      <div className="text-[11px] sm:text-xs font-bold text-white/90 truncate">{m.title}</div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                        <div className="flex-1 h-1 sm:h-1.5 bg-black/60 rounded-full overflow-hidden">
                          <div className="h-full bg-[#38e1ff]" style={{ width:`${Math.min(100,(m.current/m.target)*100)}%` }} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black text-[#38e1ff]">{m.current}/{m.target}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 sm:mt-4 pt-2 shrink-0">
                  <button
                    onClick={onMissoes}
                    className={`w-full rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center justify-between cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,59,122,0.3)] ${hasClaimable ? "bg-[#ff3b7a] animate-pulse" : "bg-[#ff3b7a]/70"}`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] sm:text-[9px] font-black text-[#0a0518] leading-none uppercase">
                        {hasClaimable ? "Disponível" : "Acompanhar"}
                      </span>
                      <span className="text-xs sm:text-sm font-['Bangers'] text-white leading-none mt-0.5 tracking-widest">
                        {hasClaimable ? "RESGATAR" : "MISSÕES"}
                      </span>
                    </div>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Award className="w-4 h-4 text-yellow-300" />
                    </div>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function RailIcon({ children, onClick, active, danger, tooltip }: {
  children: React.ReactNode; onClick: () => void; active?: boolean; danger?: boolean; tooltip?: string;
}) {
  return (
    <button onClick={onClick} className="group relative">
      <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl cursor-pointer transition-all hover:scale-110 active:scale-95 ${
        active
          ? "bg-gradient-to-br from-[#38e1ff] via-[#38e1ff] to-[#b794ff] text-[#0a0518] shadow-[0_0_20px_rgba(56,225,255,0.5)]"
          : danger
            ? "text-[#ff3b7a] hover:bg-[#ff3b7a]/10"
            : "text-[#b794ff]/60 hover:text-[#38e1ff] hover:bg-[#38e1ff]/10"
      }`}>
        {children}
      </div>
      {tooltip && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#38e1ff] text-[#0a0518] text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {tooltip}
        </div>
      )}
    </button>
  );
}

function ModeTile({ color, title, sub, onClick, disabled }: {
  color: string; title: string; sub: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative bg-[#110c26] border border-white/5 rounded-xl sm:rounded-3xl flex flex-col items-center justify-center transition-all px-2 ${
        disabled ? "opacity-40" : "hover:bg-white/5 cursor-pointer"
      }`}
      style={!disabled ? { borderColor:`${color}26` } : undefined}
    >
      <div className="text-sm sm:text-lg font-['Bangers'] tracking-widest" style={{ color }}>{title}</div>
      <div className="text-[7px] sm:text-[9px] font-bold text-white/30 tracking-tighter uppercase">{sub}</div>
      {disabled && (
        <div className="absolute top-1 right-2 text-[7px] sm:text-[8px] font-black px-1.5 rounded" style={{ background:`${color}33`, color }}>
          BREVE
        </div>
      )}
    </button>
  );
}

function ChipMini({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="w-6 h-6 rounded-md bg-black/40 border border-white/10 text-white/60 hover:text-[#38e1ff] hover:border-[#38e1ff]/40 flex items-center justify-center transition-colors">
      {children}
    </button>
  );
}
