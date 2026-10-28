import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import { MONSTROS } from "@/game/data";
import type { Dificuldade } from "@/pages/Index";
import {
  Swords, Store, BookOpen, Users, UserRound, LogOut,
  Trophy, Award, Wifi, QrCode, Sparkles, ArrowRightLeft, ChevronDown,
  Medal, Star, Zap, Play, Coins, Gem,
} from "lucide-react";

interface Props {
  user: { id: string } | null;
  onIniciar: (modo: string, diff?: Dificuldade) => void;
  onPerfil: () => void; onLoja: () => void; onMulti: () => void; onMatchmaking: () => void;
  onRanking: () => void; onSeasonPass: () => void; onMissoes: () => void;
  onConquistas: () => void; onAmigos: () => void; onColecao: () => void;
  onEvoluir: () => void; onTrocar: () => void; onLogout: () => void;
}
const LEAGUE_INFO: Record<string,{label:string;color:string}> = {
  bronze:{label:"Bronze",color:"#d19a66"},silver:{label:"Prata",color:"#cbd5e1"},
  gold:{label:"Ouro",color:"#ffd54f"},platinum:{label:"Platina",color:"#67e8f9"},
  diamond:{label:"Diamante",color:"#a5b4fc"},master:{label:"Mestre",color:"#f59e0b"},
};
type Mode = "solo" | "online" | "friends";
const MODES:{id:Mode;title:string;sub:string}[] = [
  {id:"solo",title:"Arena Solo IA",sub:"Treine sua estratégia"},
  {id:"online",title:"Arena Online",sub:"Enfrente outros jogadores"},
  {id:"friends",title:"Sala com amigos",sub:"Convite e QR Code"},
];
function SmallAction({label,onClick,children}:{
  label:string;onClick:()=>void;children:React.ReactNode;
}){
  return <button type="button" onClick={onClick} aria-label={label}
    className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:border-yellow-300/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300">
    {children}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
  </button>;
}
export default function TelaLobbyPrincipal({
  user,onIniciar,onPerfil,onLoja,onMulti,onMatchmaking,onRanking,
  onSeasonPass,onMissoes,onConquistas,onAmigos,onColecao,onEvoluir,onTrocar,onLogout,
}:Props) {
  const [profile,setProfile]=useState<any>(null);
  const [stats,setStats]=useState<any>(null);
  const [league,setLeague]=useState<any>(null);
  const [season,setSeason]=useState<any>(null);
  const [monsterProgress,setMonsterProgress]=useState<any>(null);
  const [claimable,setClaimable]=useState(0);
  const [loading,setLoading]=useState(true);
  const [mode,setMode]=useState<Mode>("solo");
  const [modeOpen,setModeOpen]=useState(false);

  useEffect(()=>{
    if(!user){setLoading(false);return;}
    let active=true;
    async function load(){
      setLoading(true);
      const [p,s,l,sp,m]=await Promise.all([
        supabase.from("profiles").select("display_name,level,xp,coins,gems").eq("user_id",user!.id).maybeSingle(),
        supabase.from("user_stats").select("favorite_monster,total_wins").eq("user_id",user!.id).maybeSingle(),
        supabase.from("player_leagues").select("*").eq("user_id",user!.id).maybeSingle(),
        supabase.from("season_pass").select("tier,xp").eq("user_id",user!.id).maybeSingle(),
        supabase.from("user_missions").select("id,claimed,completed").eq("user_id",user!.id)
          .eq("assigned_date",new Date().toISOString().slice(0,10)).limit(30),
      ]);
      if(!active)return;
      setProfile(p.data);setStats(s.data);setLeague(l.data);setSeason(sp.data);
      setClaimable((m.data||[]).filter(r=>r.completed&&!r.claimed).length);
      const monsterId=s.data?.favorite_monster || "panther";
      const {data:mp}=await supabase.from("user_monsters").select("power_level,shards")
        .eq("user_id",user!.id).eq("monster_id",monsterId).maybeSingle();
      if(active){setMonsterProgress(mp);setLoading(false);}
    }
    load().catch(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[user]);

  const favId=MONSTROS[stats?.favorite_monster] ? stats.favorite_monster : "panther";
  const fav=MONSTROS[favId];
  const level=Math.max(1,Number(profile?.level)||1);
  const xp=Math.max(0,Number(profile?.xp)||0);
  const xpPct=Math.min(100,Math.round((xp/(level*100))*100));
  const leagueInfo=LEAGUE_INFO[String(league?.league||"bronze").toLowerCase()]||LEAGUE_INFO.bronze;
  const selected=MODES.find(x=>x.id===mode)||MODES[0];
  const play=()=>{
    if(mode==="online")onMatchmaking();
    else if(mode==="friends")onMulti();
    else onIniciar("duel");
  };
  const nav=[
    {name:"Loja",icon:Store,action:onLoja},
    {name:"Cartas",icon:BookOpen,action:onColecao},
    {name:"Amigos",icon:Users,action:onAmigos},
    {name:"Ranking",icon:Trophy,action:onRanking},
    {name:"Perfil",icon:UserRound,action:onPerfil},
  ];
  return <div className="fixed inset-0 overflow-y-auto bg-[#070a13] text-white font-['Barlow']">
    <div className="pointer-events-none fixed inset-0 opacity-40"
      style={{background:"radial-gradient(ellipse at 55% 45%,#24336c 0%,transparent 50%),linear-gradient(180deg,#0b1020,#070a13)"}}/>
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col pb-[calc(env(safe-area-inset-bottom)+82px)] lg:pb-4">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#080b17]/95 px-3 py-3 backdrop-blur-xl sm:px-6">
        <button type="button" onClick={onPerfil} className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2.5 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-300 font-black text-black">{level}</div>
          <div className="min-w-0">
            <div className="max-w-32 truncate text-sm font-bold">{profile?.display_name || (loading?"Carregando":"Jogador")}</div>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-yellow-300" style={{width:xpPct+"%"}}/></div>
          </div>
        </button>
        <button type="button" onClick={onRanking} className="flex min-h-11 items-center gap-2 rounded-xl border px-3"
          style={{borderColor:leagueInfo.color+"70",background:leagueInfo.color+"16"}}>
          <Trophy size={18} style={{color:leagueInfo.color}}/>
          <span className="text-left"><span className="block text-xs font-black uppercase">{leagueInfo.label}</span>
            <span className="block text-[10px] text-white/60">{Number(league?.trophies||0).toLocaleString()} troféus</span></span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onLoja} className="flex min-h-11 items-center gap-2 rounded-xl border border-yellow-300/30 bg-yellow-300/10 px-3">
            <Coins size={18} className="text-yellow-300"/><b>{Number(profile?.coins||0).toLocaleString()}</b>
          </button>
          <button onClick={onLoja} className="flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3">
            <Gem size={18} className="text-cyan-300"/><b>{Number(profile?.gems||0).toLocaleString()}</b>
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <nav aria-label="Navegação principal" className="hidden w-24 flex-col gap-3 border-r border-white/10 p-3 lg:flex">
          {nav.map(({name,icon:Icon,action})=><SmallAction key={name} label={name} onClick={action}><Icon size={21}/></SmallAction>)}
          <div className="mt-auto"><SmallAction label="Sair" onClick={onLogout}><LogOut size={20}/></SmallAction></div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col lg:flex-row">
          <section aria-label="Monstro ativo" className="relative flex min-h-[400px] flex-1 flex-col items-center justify-center px-3 py-5 sm:min-h-[500px] lg:min-h-0">
            <div className="pointer-events-none absolute left-1/2 top-[42%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{background:(fav?.glow||"#ffd54f")+"24"}}/>
            <p className="z-10 text-xs font-bold uppercase tracking-[.3em] text-yellow-300/80">Seu monstro</p>
            <div className="relative z-10 flex min-h-[235px] w-full items-center justify-center sm:min-h-[300px]">
              <div className="motion-safe:animate-[float_4s_ease-in-out_infinite]">
                <MonsterAvatar monstroId={favId} size={240} glow={fav?.glow||"#ffd54f"}/>
              </div>
            </div>
            <div className="z-10 w-full max-w-sm rounded-[26px] border border-white/15 bg-[#12192d]/95 p-4 text-center shadow-2xl">
              <h1 className="font-['Bebas_Neue'] text-4xl uppercase tracking-wide">{fav?.nome||"Panther"}</h1>
              <div className="mb-3 flex items-center justify-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-yellow-300"><Zap size={16}/> Poder {monsterProgress?.power_level||1}</span>
                <span className="text-white/60">{monsterProgress?.shards||0} fragmentos</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onTrocar} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 font-bold hover:bg-white/20">
                  <ArrowRightLeft size={18}/> Trocar
                </button>
                <button onClick={onEvoluir} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-yellow-300 font-black text-[#101528] hover:bg-yellow-200">
                  <Sparkles size={18}/> Evoluir
                </button>
              </div>
            </div>
          </section>

          <aside className="grid grid-cols-3 gap-2 px-3 pb-4 sm:gap-3 lg:w-[270px] lg:grid-cols-1 lg:content-start lg:py-5 lg:pr-5">
            <button onClick={onSeasonPass} className="min-h-24 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/10 p-3 text-left hover:bg-fuchsia-300/15">
              <Star size={20} className="mb-1 text-fuchsia-300"/>
              <span className="block text-xs font-black">TEMPORADA</span>
              <span className="block text-xs text-white/70">Tier {season?.tier||0}</span>
            </button>
            <button onClick={onMissoes} className="min-h-24 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-3 text-left hover:bg-yellow-300/15">
              <Award size={20} className="mb-1 text-yellow-300"/>
              <span className="block text-xs font-black">MISSÕES</span>
              <span className="block text-xs text-white/70">{claimable} para resgatar</span>
            </button>
            <button onClick={onConquistas} className="min-h-24 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-left hover:bg-cyan-300/15">
              <Medal size={20} className="mb-1 text-cyan-300"/>
              <span className="block text-xs font-black">CONQUISTAS</span>
              <span className="block text-xs text-white/70">{Number(stats?.total_wins||0)} vitórias</span>
            </button>
          </aside>
        </main>
      </div>

      <section aria-label="Iniciar partida" className="mx-3 mb-3 flex flex-col gap-2 rounded-[24px] border border-white/15 bg-[#12192d] p-3 shadow-2xl sm:mx-6 sm:flex-row sm:items-center lg:ml-28">
        <div className="relative min-w-0 flex-1">
          <button type="button" aria-expanded={modeOpen} aria-controls="game-mode-picker" onClick={()=>setModeOpen(!modeOpen)}
            className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 text-left hover:bg-white/10">
            {mode==="solo"?<Swords size={22}/>:mode==="online"?<Wifi size={22}/>:<QrCode size={22}/>}
            <span className="flex-1"><span className="block font-black">{selected.title}</span><span className="block text-xs text-white/60">{selected.sub}</span></span>
            <ChevronDown size={18}/>
          </button>
          {modeOpen&&<div id="game-mode-picker" role="group" aria-label="Escolher modo de jogo"
            className="absolute bottom-full z-30 mb-2 w-full rounded-2xl border border-white/20 bg-[#18223d] p-2 shadow-2xl">
            {MODES.map(m=><button key={m.id} onClick={()=>{setMode(m.id);setModeOpen(false);}}
              className={"block min-h-14 w-full rounded-xl px-3 text-left hover:bg-white/10 "+(mode===m.id?"bg-yellow-300/10":"")}>
              <span className="block font-bold">{m.title}</span><span className="text-xs text-white/60">{m.sub}</span>
            </button>)}
          </div>}
        </div>
        <button type="button" onClick={play} className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-[#ff6b2b] px-10 font-['Bebas_Neue'] text-3xl tracking-widest text-white shadow-[0_5px_0_#963511] transition active:translate-y-1 active:shadow-none sm:min-w-52">
          <Play size={24} fill="currentColor"/> JOGAR
        </button>
      </section>
      <nav aria-label="Navegação mobile" className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-white/15 bg-[#101728]/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden">
        {nav.map(({name,icon:Icon,action})=><SmallAction key={name} label={name} onClick={action}><Icon size={19}/></SmallAction>)}
      </nav>
    </div>
  </div>;
}
