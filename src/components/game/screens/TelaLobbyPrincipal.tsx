import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import type { Dificuldade } from "@/pages/Index";
import { toast } from "@/hooks/use-toast";
import {
  Swords, Store, BookOpen, Users, User as UserIcon, LogOut,
  Trophy, Medal, Zap, Award, Wifi, QrCode, Bluetooth,
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
    <div className="fixed inset-0 w-full h-full bg-[#0a0a0a] flex items-center justify-center p-2 sm:p-3 overflow-hidden select-none font-['Barlow']">
      <h1 className="sr-only">Beast Arena Lobby</h1>
      {/* Landscape container */}
      <div className="relative w-full h-full max-w-[1280px] max-h-[720px] bg-[#0a0a0a] border-[6px] sm:border-8 border-black rounded-[24px] sm:rounded-[40px] overflow-hidden flex shadow-[0_0_50px_rgba(0,0,0,0.6)]">

        {/* === LEFT NAVIGATION RAIL === */}
        <nav className="w-[60px] sm:w-[88px] bg-white border-r-4 border-black flex flex-col items-center py-3 sm:py-5 gap-2 sm:gap-4 z-20 shrink-0">
          <RailIcon active onClick={() => onIniciar("duel")} tooltip="BATALHA">
            <Swords className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
          </RailIcon>
          <RailIcon onClick={onLoja} tooltip="LOJA"><Store className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /></RailIcon>
          <RailIcon onClick={onColecao} tooltip="COLEÇÃO"><BookOpen className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /></RailIcon>
          <RailIcon onClick={onAmigos} tooltip="AMIGOS"><Users className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /></RailIcon>
          <RailIcon onClick={onPerfil} tooltip="PERFIL"><UserIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /></RailIcon>
          <RailIcon className="mt-auto" onClick={onLogout} tooltip="SAIR" danger>
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          </RailIcon>
        </nav>

        {/* === MAIN INTERFACE === */}
        <div className="flex-1 flex flex-col relative min-w-0">

          {/* Glow overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffeb3b]/10 blur-[100px] pointer-events-none" />

          {/* === HEADER === */}
          <header className="h-[52px] sm:h-[68px] px-3 sm:px-6 flex items-center justify-between z-10 gap-2 shrink-0">
            {/* Level + XP */}
            <button
              onClick={onPerfil}
              className="flex items-center bg-black border-[3px] border-white rounded-full px-2 py-1 gap-2 sm:gap-3 shadow-[3px_3px_0px_0px_#ffeb3b] hover:shadow-[5px_5px_0px_0px_#ffeb3b] transition-shadow min-w-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#ffeb3b] rounded-full border-2 border-black flex items-center justify-center text-black font-black text-[10px] sm:text-xs shrink-0">
                {lvl}
              </div>
              <span className="text-white font-['Bebas_Neue'] text-base sm:text-xl tracking-wider leading-none truncate max-w-[80px] sm:max-w-[140px]">
                {profile?.display_name || "JOGADOR"}
              </span>
              <div className="w-16 sm:w-24 h-2 bg-white/10 rounded-full overflow-hidden border border-white/20 shrink-0">
                <div className="h-full bg-[#ffeb3b] transition-all duration-700" style={{ width: `${xpPct}%` }} />
              </div>
            </button>

            {/* Currencies */}
            <div className="flex gap-2 sm:gap-3 shrink-0">
              <button onClick={onLoja} className="flex items-center bg-black border-[3px] border-white rounded-xl pl-1.5 pr-2 sm:pl-2 sm:pr-4 py-1 gap-1.5 sm:gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:border-[#ffeb3b] transition-colors">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#ffeb3b] border-2 border-black rotate-45 shrink-0" />
                <span className="text-white font-['Bebas_Neue'] text-sm sm:text-xl tracking-widest">{(profile?.coins || 0).toLocaleString()}</span>
              </button>
              <button onClick={onLoja} className="flex items-center bg-black border-[3px] border-white rounded-xl pl-1.5 pr-2 sm:pl-2 sm:pr-4 py-1 gap-1.5 sm:gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:border-[#ff5722] transition-colors">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#ff5722] border-2 border-black rounded-full shrink-0" />
                <span className="text-white font-['Bebas_Neue'] text-sm sm:text-xl tracking-widest">{(profile?.gems || 0).toLocaleString()}</span>
              </button>
            </div>
          </header>

          {/* === BENTO LAYOUT === */}
          <main className="flex-1 grid grid-cols-12 grid-rows-6 gap-2 sm:gap-3 p-3 sm:p-4 pt-1 min-h-0">

            {/* VS IA HERO */}
            <button
              onClick={() => onIniciar("duel")}
              className="col-span-8 row-span-4 bg-white border-4 border-black rounded-2xl sm:rounded-3xl shadow-[4px_4px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] relative overflow-hidden group cursor-pointer text-left"
            >
              <div className="absolute inset-0 bg-[#f8f8f8]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#ffeb3b_0%,transparent_60%)] opacity-40" />

              <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-10">
                <div className="bg-black text-white px-2 py-0.5 sm:px-3 sm:py-1 font-['Bebas_Neue'] text-xs sm:text-lg skew-x-[-10deg] inline-block mb-1">MAIN EVENT</div>
                <h2 className="font-['Bebas_Neue'] text-4xl sm:text-6xl text-black leading-[0.85] tracking-tight">VERSUS<br/>ARENA</h2>
                <div className="mt-2 sm:mt-4 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#ff5722] rounded-full animate-ping" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">VS IA · TREINAMENTO</span>
                </div>
              </div>

              {/* Monster art */}
              <div className="absolute right-0 bottom-0 w-3/5 sm:w-3/4 h-full pointer-events-none flex items-end justify-end pr-2 pb-2 sm:pr-6 sm:pb-6">
                <div className="transform group-hover:scale-110 transition-transform duration-700 ease-out">
                  <MonsterAvatar monstroId={favMonster} size={180} glow={li.color} />
                </div>
              </div>
            </button>

            {/* SECONDARY TILES */}
            <div className="col-span-8 row-span-2 grid grid-cols-3 gap-2 sm:gap-3">
              <ModeTile icon={<Wifi className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />} title="ONLINE" onClick={onMatchmaking} />
              <ModeTile icon={<QrCode className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />} title="SALA QR" onClick={onMulti} />
              <ModeTile icon={<Bluetooth className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />} title="LOCAL" disabled onClick={() => {
                toast({ title:"📡 Bluetooth em breve", description:"Use SALA QR para jogar com amigos perto." });
              }} />
            </div>

            {/* RIGHT SIDEBAR: SEASON + PLAY */}
            <div className="col-span-4 row-span-6 flex flex-col gap-2 sm:gap-3 min-w-0">
              {/* Season Pass */}
              <button
                onClick={onSeasonPass}
                className="flex-1 bg-black border-4 border-white rounded-2xl sm:rounded-[2rem] p-2.5 sm:p-4 flex flex-col shadow-[4px_4px_0px_0px_#ff5722] sm:shadow-[6px_6px_0px_0px_#ff5722] rotate-[1.5deg] text-left hover:rotate-0 transition-transform"
              >
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="font-['Bebas_Neue'] text-base sm:text-2xl text-[#ffeb3b] italic tracking-tighter leading-none">SEASON {String(seasonInfo.level).padStart(2,'0')}</h3>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] text-white font-bold">PRO</span>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/10 flex flex-col justify-center min-h-0">
                  <p className="text-[9px] sm:text-[11px] text-white font-bold uppercase tracking-widest mb-1">Progressão</p>
                  <div className="w-full h-2 sm:h-3 bg-white/10 rounded-full mb-2 sm:mb-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#ff5722] to-[#ffeb3b] transition-all duration-700" style={{ width: `${seasonInfo.pct}%` }} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 overflow-hidden">
                    {missoes.length === 0 ? (
                      <div className="text-[9px] text-white/40 italic">Carregando missões…</div>
                    ) : missoes.slice(0,2).map((m, i) => (
                      <div key={m.id} className={`flex items-center gap-2 sm:gap-3 ${m.claimable ? "" : i === 1 ? "opacity-60" : ""}`}>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${m.claimable ? "bg-[#ffeb3b] shadow-[2px_2px_0px_0px_#fff]" : "bg-[#ff5722]"}`}>
                          {m.claimable ? <Award className="w-3 h-3 sm:w-4 sm:h-4 text-black" /> : <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[9px] sm:text-[10px] text-gray-200 font-bold leading-tight truncate uppercase">{m.title}</span>
                          <span className="block text-[8px] sm:text-[9px] text-gray-400 leading-tight">{m.current}/{m.target}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </button>

              {/* Quick chips */}
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <QuickChip onClick={onRanking} icon={<Trophy className="w-3 h-3 sm:w-4 sm:h-4" />} label="RANK" />
                <QuickChip onClick={onConquistas} icon={<Medal className="w-3 h-3 sm:w-4 sm:h-4" />} label="MEDAL" />
                <QuickChip onClick={onMissoes} icon={<Award className="w-3 h-3 sm:w-4 sm:h-4" />} label={hasClaimable ? "!" : "ALVO"} hot={hasClaimable} />
              </div>

              {/* PLAY BUTTON */}
              <button
                onClick={() => onIniciar("duel")}
                className="h-[72px] sm:h-[110px] bg-[#ff5722] border-4 border-black rounded-2xl sm:rounded-[2rem] shadow-[6px_6px_0px_0px_#000] sm:shadow-[10px_10px_0px_0px_#000] flex flex-col items-center justify-center group relative overflow-hidden active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer shrink-0"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/20 -translate-y-6 translate-x-6 rotate-45" />
                <span className="font-['Bebas_Neue'] text-3xl sm:text-5xl text-white tracking-widest drop-shadow-[3px_3px_0px_#000] italic group-hover:scale-110 transition-transform leading-none">BATTLE</span>
                <span className="font-['Bebas_Neue'] text-[10px] sm:text-sm text-black tracking-[0.3em] mt-0.5 sm:mt-1">SELECT BEAST</span>
              </button>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function RailIcon({ children, onClick, active, danger, tooltip, className = "" }: {
  children: React.ReactNode; onClick: () => void; active?: boolean; danger?: boolean; tooltip?: string; className?: string;
}) {
  const base = "w-9 h-9 sm:w-11 sm:h-11 border-[3px] border-black rounded-lg sm:rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] cursor-pointer transition-all hover:-translate-y-0.5 hover:rotate-0 active:translate-y-0 active:shadow-[1px_1px_0px_0px_#000]";
  const variant = active
    ? "bg-[#ff5722] text-white rotate-[-3deg] hover:bg-[#ff5722]"
    : danger
      ? "bg-white text-[#ff5722] hover:bg-red-50"
      : "bg-white text-black hover:bg-[#ffeb3b]";
  return (
    <button onClick={onClick} aria-label={tooltip} className={`group relative ${className}`}>
      <div className={`${base} ${variant}`}>{children}</div>
      {tooltip && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-[#ffeb3b] text-[10px] font-['Bebas_Neue'] tracking-widest rounded border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {tooltip}
        </div>
      )}
    </button>
  );
}

function ModeTile({ icon, title, onClick, disabled }: {
  icon: React.ReactNode; title: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white border-4 border-black rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all relative ${
        disabled ? "opacity-50" : "hover:-translate-y-1 hover:bg-[#ffeb3b] active:translate-y-0 cursor-pointer"
      }`}
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#0a0a0a] rounded-md sm:rounded-lg flex items-center justify-center text-[#ffeb3b]">
        {icon}
      </div>
      <span className="font-['Bebas_Neue'] text-sm sm:text-lg leading-none">{title}</span>
      {disabled && (
        <div className="absolute top-1 right-1 text-[7px] sm:text-[8px] font-black px-1 rounded bg-[#ff5722] text-white border border-black">BREVE</div>
      )}
    </button>
  );
}

function QuickChip({ onClick, icon, label, hot }: {
  onClick: () => void; icon: React.ReactNode; label: string; hot?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-7 sm:h-9 border-2 border-black rounded-md sm:rounded-lg flex items-center justify-center gap-1 font-['Bebas_Neue'] text-[10px] sm:text-xs tracking-widest shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 transition-transform ${
        hot ? "bg-[#ffeb3b] text-black animate-pulse" : "bg-white text-black hover:bg-[#ffeb3b]"
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );
}
