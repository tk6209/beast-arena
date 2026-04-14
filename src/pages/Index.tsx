import React, { useState, useCallback, useEffect } from "react";
import TelaHome from "@/components/game/screens/TelaHome";
import TelaNome from "@/components/game/screens/TelaNome";
import TelaMonstro from "@/components/game/screens/TelaMonstro";
import TelaLobby from "@/components/game/screens/TelaLobby";
import TelaLobbyPrincipal from "@/components/game/screens/TelaLobbyPrincipal";
import TelaEntrar from "@/components/game/screens/TelaEntrar";
import TelaBatalha from "@/components/game/screens/TelaBatalha";
import TelaResultado from "@/components/game/screens/TelaResultado";
import TelaAuth from "@/components/game/screens/TelaAuth";
import TelaPerfil from "@/components/game/screens/TelaPerfil";
import TelaLoja from "@/components/game/screens/TelaLoja";
import TelaDailyReward from "@/components/game/screens/TelaDailyReward";
import TelaRanking from "@/components/game/screens/TelaRanking";
import TelaMatchmaking from "@/components/game/screens/TelaMatchmaking";
import TelaSeasonPass from "@/components/game/screens/TelaSeasonPass";
import TelaMissoes from "@/components/game/screens/TelaMissoes";
import TelaConquistas from "@/components/game/screens/TelaConquistas";
import TelaAmigos from "@/components/game/screens/TelaAmigos";
import GameInviteNotification from "@/components/game/GameInviteNotification";
import { MONSTROS } from "@/game/data";
import { supabase } from "@/integrations/supabase/client";
import { loadPrefsFromDB } from "@/game/audioPreferences";
import type { Jogador } from "@/game/engine";
import type { BattleStats } from "@/components/game/screens/TelaBatalha";
import type { User } from "@supabase/supabase-js";

type Tela = "home" | "auth" | "lobby_principal" | "perfil" | "loja" | "ranking" | "season_pass" | "missoes" | "conquistas" | "amigos" | "nome" | "monstro" | "lobby" | "entrar" | "batalha" | "resultado" | "matchmaking" | "matchmaking_select";
export type Dificuldade = "facil" | "medio" | "avancado";

const ALL_MONSTERS = Object.keys(MONSTROS);

export default function Index() {
  const [tela, setTela] = useState<Tela>("home");
  const [modo, setModo] = useState<string>("duel");
  const [nomeJogador, setNomeJogador] = useState<string>("Jogador");
  const [monstroP1, setMonstroP1] = useState<string>("");
  const [salaId, setSalaId] = useState<string | null>(null);
  const [slotLocal, setSlotLocal] = useState<number>(0);
  const [vencedor, setVencedor] = useState<Jogador | null>(null);
  const [dificuldade, setDificuldade] = useState<Dificuldade>("medio");
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [forceReplayTutorial, setForceReplayTutorial] = useState(false);

  // Campaign state
  const [campaignQueue, setCampaignQueue] = useState<string[]>([]);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [campaignWins, setCampaignWins] = useState(0);
  const [campaignFinished, setCampaignFinished] = useState(false);
  const [lastPowerId, setLastPowerId] = useState<string | null>(null);
  const [isCampaignContinue, setIsCampaignContinue] = useState(false);
  const [lastBattleStats, setLastBattleStats] = useState<BattleStats | undefined>(undefined);

  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyChecked, setDailyChecked] = useState(false);

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setAuthChecked(true);
      if (u) {
        // Invalidate other sessions (prevent simultaneous logins)
        try { await supabase.auth.signOut({ scope: 'others' }); } catch (_) {}
        setTela("lobby_principal");
        loadPrefsFromDB(u.id);
        // Cache display name so we can skip TelaNome
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", u.id).single();
        if (profile?.display_name) {
          setNomeJogador(profile.display_name);
          localStorage.setItem("beast_arena_nome", profile.display_name);
        }
      }
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setAuthChecked(true);
      if (u) {
        try { await supabase.auth.signOut({ scope: 'others' }); } catch (_) {}
        setTela("lobby_principal");
        loadPrefsFromDB(u.id);
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", u.id).single();
        if (profile?.display_name) {
          setNomeJogador(profile.display_name);
          localStorage.setItem("beast_arena_nome", profile.display_name);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Daily reward check on login
  useEffect(() => {
    if (user && !dailyChecked) {
      setDailyChecked(true);
      (async () => {
        const { data } = await supabase
          .from("daily_rewards")
          .select("last_claim_date")
          .eq("user_id", user.id)
          .single();
        const today = new Date().toISOString().split("T")[0];
        if (!data || data.last_claim_date !== today) {
          setShowDailyReward(true);
        }
      })();
    }
  }, [user, dailyChecked]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sala = params.get("sala");
    if (sala) {
      setJoinCode(sala);
      setModo("multi");
      setTela("nome");
    }
  }, []);

  const handleIniciar = (m: string, diff?: Dificuldade) => {
    setModo(m);
    if (diff) setDificuldade(diff);
    // Skip name screen for logged-in users who already have a display name
    if (user && nomeJogador && nomeJogador !== "Jogador") {
      setTela("monstro");
    } else {
      setTela("nome");
    }
  };

  const handleNomeConfirm = (nome: string) => {
    setNomeJogador(nome);
    if (user) {
      supabase.from("profiles").update({ display_name: nome }).eq("user_id", user.id).then(() => {});
    }
    setTela("monstro");
  };

  const handleMonstroConfirm = (mId: string) => {
    setMonstroP1(mId);
    const opponents = ALL_MONSTERS.filter(k => k !== mId).sort(() => Math.random() - 0.5);
    setCampaignQueue(opponents);
    setCampaignIndex(0);
    setCampaignWins(0);
    setCampaignFinished(false);

    if (joinCode) {
      setSalaId(joinCode);
      setSlotLocal(1);
      setTela("entrar");
    } else if (modo === "multi") {
      setTela("lobby");
    } else if (modo === "matchmaking") {
      setTela("matchmaking");
    } else {
      setTela("batalha");
    }
  };

  const handleBatalha = (sid: string, slot: number) => {
    setSalaId(sid);
    setSlotLocal(slot);
    setTela("batalha");
  };

  const handleEntrar = useCallback((sid: string, slot: number) => {
    setSalaId(sid);
    setSlotLocal(slot);
    setTela("batalha");
  }, []);

  const handleFim = (v: Jogador | null, stats?: BattleStats) => {
    setVencedor(v);
    setLastBattleStats(stats);
    if (v) {
      setCampaignWins(w => w + 1);
      const nextIdx = campaignIndex + 1;
      if (nextIdx >= campaignQueue.length) {
        setCampaignFinished(true);
      }
    }
    setTela("resultado");
  };

  const handleContinuar = () => {
    const nextIdx = campaignIndex + 1;
    setCampaignIndex(nextIdx);
    setSalaId(null);
    setIsCampaignContinue(true);
    setTela("batalha");
  };

  const resetAll = () => {
    window.history.replaceState({}, "", window.location.pathname);
    setSalaId(null);
    setJoinCode(null);
    setSlotLocal(0);
    setVencedor(null);
    setMonstroP1("");
    setCampaignQueue([]);
    setCampaignIndex(0);
    setCampaignWins(0);
    setCampaignFinished(false);
    setLastPowerId(null);
    setIsCampaignContinue(false);
  };

  const handleRecomecar = () => { resetAll(); setTela("monstro"); };
  const handleSair = () => { resetAll(); setTela(user ? "lobby_principal" : "home"); };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDailyChecked(false);
    setTela("home");
  };

  const handleReplayTutorial = () => {
    localStorage.removeItem("beast_tutorial_done");
    setForceReplayTutorial(true);
    // Go start a battle to show the tutorial
    setTela("lobby_principal");
  };

  const handleInviteAccept = (sessionId: string) => {
    setSalaId(sessionId);
    setSlotLocal(1);
    setTela("entrar");
  };

  const handleConvidarAmigo = async (friendUserId: string) => {
    if (!user) return;
    try {
      // Create a game session via edge function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/game-engine`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ action: "init_game", monstroP1: monstroP1 || "panther", monstroP2: "panther", nomeP1: nomeJogador, nomeP2: "Convidado" }),
        }
      );
      const data = await res.json();
      const sessionId = data?.sessionId;
      if (!sessionId) return;

      // Insert game invite
      await supabase.from("game_invites").insert({
        inviter_id: user.id,
        invitee_id: friendUserId,
        session_id: sessionId,
      });

      // Navigate inviter to lobby to wait
      setSalaId(sessionId);
      setSlotLocal(0);
      setModo("multi");
      setTela("lobby");
    } catch (e) {
      console.error("Invite error:", e);
    }
  };

  const currentOpponent = campaignQueue[campaignIndex] || undefined;

  // Daily reward overlay
  const dailyOverlay = showDailyReward && user ? (
    <TelaDailyReward user={user} onClose={() => setShowDailyReward(false)} />
  ) : null;

  // Game invite notification (shown on lobby)
  const inviteNotification = user ? (
    <GameInviteNotification userId={user.id} onAccept={handleInviteAccept} />
  ) : null;

  switch (tela) {
    case "auth":
      return <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "lobby_principal":
      return user ? (
        <>
          {dailyOverlay}
          {inviteNotification}
          <TelaLobbyPrincipal
            user={user}
            onIniciar={handleIniciar}
            onPerfil={() => setTela("perfil")}
            onLoja={() => setTela("loja")}
            onMulti={() => { setModo("multi"); setTela("nome"); }}
            onMatchmaking={() => { setModo("matchmaking"); setTela("nome"); }}
            onRanking={() => setTela("ranking")}
            onSeasonPass={() => setTela("season_pass")}
            onMissoes={() => setTela("missoes")}
            onConquistas={() => setTela("conquistas")}
            onAmigos={() => setTela("amigos")}
            onLogout={handleLogout}
          />
        </>
      ) : <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "perfil":
      return user ? (
        <TelaPerfil user={user} onVoltar={() => setTela(user ? "lobby_principal" : "home")} onLogout={handleLogout} onReplayTutorial={handleReplayTutorial} />
      ) : <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "loja":
      return user ? (
        <TelaLoja user={user} onVoltar={() => setTela("lobby_principal")} />
      ) : <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "ranking":
      return <TelaRanking userId={user?.id} onVoltar={() => setTela(user ? "lobby_principal" : "home")} />;

    case "season_pass":
      return user ? (
        <TelaSeasonPass user={user} onVoltar={() => setTela("lobby_principal")} />
      ) : <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "missoes":
      return user ? (
        <TelaMissoes user={user} onVoltar={() => setTela("lobby_principal")} />
      ) : <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "conquistas":
      return user ? (
        <TelaConquistas user={user} onVoltar={() => setTela("lobby_principal")} />
      ) : <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "amigos":
      return user ? (
        <TelaAmigos user={user} onVoltar={() => setTela("lobby_principal")} onConvidar={handleConvidarAmigo} />
      ) : <TelaAuth onAuth={() => setTela("lobby_principal")} onSkip={() => setTela("home")} />;

    case "home":
      return (
        <>
          {dailyOverlay}
          <TelaHome
            onIniciar={handleIniciar}
            user={user}
            onLogin={() => setTela("auth")}
            onPerfil={() => setTela("perfil")}
            onLoja={() => setTela("loja")}
          />
        </>
      );

    case "nome":
      return <TelaNome onConfirmar={handleNomeConfirm} />;
    case "monstro":
      return <TelaMonstro onConfirmar={handleMonstroConfirm} userId={user?.id} />;
    case "lobby":
      return <TelaLobby monstroHost={monstroP1} onBatalha={handleBatalha} />;
    case "entrar":
      return salaId ? <TelaEntrar salaId={salaId} monstroConv={monstroP1} onEntrar={handleEntrar} /> : null;

    case "matchmaking":
      return user ? (
        <TelaMatchmaking
          user={user}
          monstroId={monstroP1}
          nomeJogador={nomeJogador}
          onMatch={handleBatalha}
          onVoltar={() => setTela("lobby_principal")}
        />
      ) : null;

    case "batalha":
      return (
        <TelaBatalha
          key={`battle-${campaignIndex}`}
          modo={modo}
          monstroP1={monstroP1}
          nomeJogador={nomeJogador}
          salaId={salaId}
          slotLocal={slotLocal}
          onFim={(v, stats) => { handleFim(v, stats); setIsCampaignContinue(false); }}
          dificuldade={dificuldade}
          aiMonstroId={currentOpponent}
          skipPowerSelect={isCampaignContinue && !!lastPowerId}
          lastPowerId={lastPowerId || undefined}
          onPowerChosen={(pid) => setLastPowerId(pid)}
        />
      );

    case "resultado":
      return (
        <TelaResultado
          vencedor={vencedor}
          nomeJogador={nomeJogador}
          onRecomecar={handleRecomecar}
          onSair={handleSair}
          onContinuar={handleContinuar}
          campaignFinished={campaignFinished}
          campaignWins={campaignWins}
          campaignTotal={campaignQueue.length}
          campaignIndex={campaignIndex}
          userId={user?.id}
          dificuldade={dificuldade}
          battleStats={lastBattleStats}
        />
      );

    default:
      return (
        <TelaHome
          onIniciar={handleIniciar}
          user={user}
          onLogin={() => setTela("auth")}
          onPerfil={() => setTela("perfil")}
          onLoja={() => setTela("loja")}
        />
      );
  }
}
