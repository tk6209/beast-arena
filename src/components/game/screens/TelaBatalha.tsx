import React, { useState, useEffect, useRef, useCallback } from "react";
import { MONSTROS, PODERES, type CartaData } from "@/game/data";
import BattleIntro from "@/components/game/BattleIntro";
import {
  criarJ,
  type Jogador, type LogEntry,
} from "@/game/engine";
import {
  criarSessao, ouvirSessao, fecharCanal,
  type GameSession,
} from "@/game/multiplayer";
import { initGame, choosePower, playCard, passTurn } from "@/game/serverApi";
import { falar, markGesture, criarFalaGesture } from "@/game/voice";
import { sfxAtaque, sfxDefesa, sfxEvolucao, sfxSwarm, sfxCura, sfxExplode, sfxTap, sfxPassar, sfxPoder, sfxVitoria, sfxDerrota } from "@/game/sfx";
import { pageBg } from "@/game/styles";
import { startBattleMusic, stopBattleMusic } from "@/game/battleMusic";
import { isMuted, toggleMuted } from "@/game/audioState";
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticError, hapticExplosion } from "@/game/haptic";
import Carta from "@/components/game/Carta";
import HpBar from "@/components/game/HpBar";
import GameLog from "@/components/game/GameLog";
import BtnMain from "@/components/game/BtnMain";
import ModalPoder from "@/components/game/ModalPoder";
import ChromeNoise from "@/components/game/ChromeNoise";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import CombatParticles from "@/components/game/CombatParticles";
import BuffIndicators from "@/components/game/BuffIndicators";
import TutorialOverlay from "@/components/game/TutorialOverlay";

interface ServerState {
  players: any[];
  turno: number;
  fase: string;
  log: LogEntry[];
  currentTurn: number;
  vencedor: number | null;
  modo: string;
  lastPlayedCard?: CartaData | null;
  lastPlayedBy?: number | null;
}

type MonsterActionState = { type: string; active: boolean; who: "player" | "enemy" | "both" };

interface TelaBatalhaProps {
  modo: string;
  monstroP1: string;
  nomeJogador?: string;
  salaId?: string | null;
  slotLocal?: number;
  onFim: (vencedor: Jogador | null) => void;
  dificuldade?: string;
  aiMonstroId?: string;
  skipPowerSelect?: boolean;
  lastPowerId?: string;
  onPowerChosen?: (powerId: string) => void;
}

const TURN_TIMER_SECONDS = 30;

export default function TelaBatalha({ modo, monstroP1, nomeJogador = "Você", salaId, slotLocal = 0, onFim, dificuldade = "medio", aiMonstroId, skipPowerSelect, lastPowerId, onPowerChosen }: TelaBatalhaProps) {
  const [mostraPoder, setMostraPoder] = useState(!skipPowerSelect);
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [cartaSel, setCartaSel] = useState<any | null>(null);
  const [hitCount, setHitCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [enemyCard, setEnemyCard] = useState<CartaData | null>(null);
  const [cardAnimState, setCardAnimState] = useState<"idle" | "entering" | "exiting">("idle");
  const [displayCard, setDisplayCard] = useState<CartaData | null>(null);
  const [screenFx, setScreenFx] = useState<string | null>(null);
  const [muted, setMuted] = useState(isMuted());
  const [turnTimer, setTurnTimer] = useState(TURN_TIMER_SECONDS);
  const [monsterAction, setMonsterAction] = useState<MonsterActionState>({ type: "", active: false, who: "player" });
  const [enemyAction, setEnemyAction] = useState<MonsterActionState>({ type: "", active: false, who: "enemy" });
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particleType, setParticleType] = useState("ataque");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBattleIntro, setShowBattleIntro] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(salaId || null);

  // Check if first battle ever — show tutorial
  useEffect(() => {
    const tutDone = localStorage.getItem("beast_tutorial_done");
    if (!tutDone && !skipPowerSelect) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        let sid = salaId;
        if (!sid) {
          const sess = await criarSessao();
          sid = sess.id;
          sessionIdRef.current = sid;
        } else {
          sessionIdRef.current = sid;
        }
        const result = await initGame(sid!, modo === "multi" ? "multi" : "ai", [
          { slot: slotLocal, nome: nomeJogador, monstroId: monstroP1 },
        ], dificuldade, aiMonstroId);
        setServerState(result.state);
        // Auto-select power if continuing campaign
        if (skipPowerSelect && lastPowerId) {
          const powerResult = await choosePower(sid!, slotLocal, lastPowerId);
          setServerState(powerResult.state);
          sfxPoder();
          startBattleMusic();
        }
      } catch (err) {
        console.error("Init error:", err);
      }
    }
    init();
    return () => { stopBattleMusic(); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const channel = ouvirSessao(sid, (session: GameSession) => {
      if (session.state_json && typeof session.state_json === "object") {
        const newState = session.state_json as unknown as ServerState;
        setServerState(newState);
        // Show enemy's last played card
        if (newState.lastPlayedCard && newState.lastPlayedBy !== slotLocal) {
          setEnemyCard(newState.lastPlayedCard);
          setTimeout(() => setEnemyCard(null), 2500);
        }
      }
    });
    return () => fecharCanal(channel);
  }, [sessionIdRef.current]);

  // Card selection animation logic
  useEffect(() => {
    if (cartaSel) {
      const card = handCards.find((c: any) => c.id === cartaSel.id) || cartaSel;
      setDisplayCard(card);
      setCardAnimState("entering");
    } else if (displayCard) {
      setCardAnimState("exiting");
      setTimeout(() => {
        setDisplayCard(null);
        setCardAnimState("idle");
      }, 200);
    }
  }, [cartaSel]);

  // Turn timer — resets when fase changes, auto-passes when expires
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!serverState || serverState.fase !== "acao" || mostraPoder) { setTurnTimer(TURN_TIMER_SECONDS); return; }
    setTurnTimer(TURN_TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-pass
          handlePassar();
          return TURN_TIMER_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [serverState?.fase, serverState?.turno, mostraPoder]);

  function triggerMonsterAction(type: string, who: "player" | "enemy" | "both" = "player") {
    if (who === "player" || who === "both") {
      setMonsterAction({ type, active: true, who: "player" });
      setTimeout(() => setMonsterAction({ type: "", active: false, who: "player" }), 1200);
    }
    if (who === "enemy" || who === "both") {
      setEnemyAction({ type, active: true, who: "enemy" });
      setTimeout(() => setEnemyAction({ type: "", active: false, who: "enemy" }), 1200);
    }
  }

  const sid = sessionIdRef.current;

  function triggerFx(type: string) {
    setScreenFx(type);
    setParticleType(type);
    setParticleTrigger(t => t + 1);
    setTimeout(() => setScreenFx(null), 600);
  }

  // Start battle music when power is chosen
  async function escolherPoder(pid: string) {
    if (!sid) return;
    markGesture();
    const speak = criarFalaGesture();
    setMostraPoder(false);
    setLoading(true);
    try {
      const result = await choosePower(sid, slotLocal, pid);
      setServerState(result.state);
      sfxPoder();
      startBattleMusic();
      const p = PODERES[pid];
      speak(`Poder ${p.nome} escolhido. ${MONSTROS[monstroP1].nome} evolui. Que comece a batalha.`);
      onPowerChosen?.(pid);
    } catch (err) {
      console.error("Power error:", err);
    }
    setLoading(false);
  }

  function selCarta(carta: any) {
    if (serverState?.fase !== "acao" || loading) return;
    const isDeselecting = cartaSel?.id === carta.id;
    setCartaSel(isDeselecting ? null : carta);
    if (!isDeselecting) {
      sfxTap();
      hapticLight();
      falar(`${carta.nome || carta.id}. ${carta.desc || ""}`, false);
    }
  }

  async function jogarCarta() {
    if (!cartaSel || !sid || loading) return;
    markGesture();
    const speak = criarFalaGesture();
    const cartaNome = cartaSel.nome || cartaSel.id;
    setLoading(true);
    try {
      const result = await playCard(sid, slotLocal, cartaSel.id);
      setServerState(result.state);

      // Trigger monster action animation based on card type
      const cardType = cartaSel.tipo || "ataque";
      triggerMonsterAction(cardType);
      hapticMedium();

      setCartaSel(null);

      // Narrate card played + results
      const logs = result.state.log || [];
      const recentLogs = logs.slice(-6);
      let narration = `Você jogou ${cartaNome}. `;

      for (const entry of recentLogs) {
        if (entry.t === "dano") {
          narration += `${entry.dmg || ""} de dano! `;
          if (cartaNome === "EXPLODE") { sfxExplode(); hapticExplosion(); } else { sfxAtaque(); hapticHeavy(); }
          triggerFx("ataque");
          setHitCount(c => c + 1);
        } else if (entry.t === "def" || entry.t === "efeito") {
          if (entry.msg?.includes("defende") || entry.msg?.includes("escudo") || entry.msg?.includes("esquiva")) {
            sfxDefesa();
            triggerFx("defesa");
          }
        } else if (entry.t === "evolucao") {
          narration += `Evolução para nível ${entry.nivel || ""}! `;
          sfxEvolucao();
          triggerFx("evolucao");
        } else if (entry.t === "swarm") {
          narration += `Swarm capturado! `;
          sfxSwarm();
        } else if (entry.t === "cura") {
          narration += `Curou ${entry.hp || ""} pontos de vida! `;
          sfxCura();
          triggerFx("cura");
        }
      }

      // Narrate AI played card
      for (const evt of (result.events || [])) {
        if (evt.type === "ai_played" && evt.carta) {
          const aiCardName = evt.carta.nome || evt.tipo;
          narration += `O adversário jogou ${aiCardName}. `;
          setEnemyCard(evt.carta);
          setTimeout(() => setEnemyCard(null), 2500);

          // SFX and effects for AI card
          if (evt.tipo === "ataque") { sfxAtaque(); triggerFx("ataque"); setHitCount(c => c + 1); triggerMonsterAction("ataque", "enemy"); }
          else if (evt.tipo === "defesa") { sfxDefesa(); triggerFx("defesa"); triggerMonsterAction("defesa", "enemy"); }
          else if (evt.tipo === "evolucao") { sfxEvolucao(); triggerFx("evolucao"); triggerMonsterAction("evolucao", "enemy"); }
          else if (evt.tipo === "cura") { sfxCura(); triggerFx("cura"); triggerMonsterAction("cura", "enemy"); }
          else if (evt.tipo === "swarm") { sfxSwarm(); triggerMonsterAction("swarm", "enemy"); }
        }
      }

      let gameEnded = false;
      for (const evt of (result.events || [])) {
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          narration += winner === slotLocal ? "Você venceu a batalha!" : "Você foi derrotado.";
          if (winner === slotLocal) { sfxVitoria(); hapticSuccess(); } else { sfxDerrota(); hapticError(); }
          gameEnded = true;
          stopBattleMusic();
          onFim(winner === slotLocal ? { id: "p1" } as any : null);
        }
      }

      speak(narration.trim());
    } catch (err) {
      console.error("Play error:", err);
    }
    setLoading(false);
  }

  async function handlePassar() {
    if (!sid || loading) return;
    markGesture();
    const speak = criarFalaGesture();
    setLoading(true);
    try {
      const result = await passTurn(sid, slotLocal);
      setServerState(result.state);
      setCartaSel(null);
      sfxPassar();

      let narration = `Turno ${(result.state.turno || 0) + 1}. Novas cartas distribuídas. `;

      // Narrate AI played card
      for (const evt of (result.events || [])) {
        if (evt.type === "ai_played" && evt.carta) {
          const aiCardName = evt.carta.nome || evt.tipo;
          narration += `O adversário jogou ${aiCardName}. `;
          setEnemyCard(evt.carta);
          setTimeout(() => setEnemyCard(null), 2500);

          if (evt.tipo === "ataque") { sfxAtaque(); triggerFx("ataque"); setHitCount(c => c + 1); triggerMonsterAction("ataque", "enemy"); }
          else if (evt.tipo === "defesa") { sfxDefesa(); triggerFx("defesa"); triggerMonsterAction("defesa", "enemy"); }
          else if (evt.tipo === "evolucao") { sfxEvolucao(); triggerFx("evolucao"); triggerMonsterAction("evolucao", "enemy"); }
          else if (evt.tipo === "cura") { sfxCura(); triggerFx("cura"); triggerMonsterAction("cura", "enemy"); }
          else if (evt.tipo === "swarm") { sfxSwarm(); triggerMonsterAction("swarm", "enemy"); }
        }
      }

      for (const evt of (result.events || [])) {
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          narration += winner === slotLocal ? "Você venceu a batalha!" : "Você foi derrotado.";
          if (winner === slotLocal) sfxVitoria(); else sfxDerrota();
          stopBattleMusic();
          onFim(winner === slotLocal ? { id: "p1" } as any : null);
        }
      }

      speak(narration.trim());
    } catch (err) {
      console.error("Pass error:", err);
    }
    setLoading(false);
  }

  // Loading state
  if (!serverState) {
    return (
      <div style={pageBg()}>
        <ChromeNoise />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#00e5ff", fontFamily: "Bangers, cursive", fontSize: 24 }}>
          Carregando...
        </div>
      </div>
    );
  }

  const myPlayer = serverState.players?.[slotLocal];
  const opSlot = slotLocal === 0 ? 1 : 0;
  const opponent = serverState.players?.[opSlot];

  const buildJog = (raw: any, fallbackId: string, fallbackNome: string, humano: boolean): Jogador => {
    if (!raw) return criarJ(fallbackId, fallbackNome, monstroP1, humano);
    const md = MONSTROS[raw.monstro?.id] || { bg1: "#000", bg2: "#000", glow: "#000", habD: "" } as any;
    return {
      id: raw.id || fallbackId,
      nome: raw.nome || fallbackNome,
      humano,
      monstro: {
        ...raw.monstro,
        bg1: raw.monstro?.bg1 || md.bg1 || "#000",
        bg2: raw.monstro?.bg2 || md.bg2 || "#000",
        glow: raw.monstro?.glow || md.glow || "#000",
        habD: raw.monstro?.habD || md.habD || "",
      },
      hp: raw.hp || 0,
      maxHp: raw.maxHp || 100,
      mao: raw.mao || [],
      defAtiva: raw.defAtiva || 0,
      imune: raw.imune || false,
      dobra: raw.dobra || false,
      dodgeOnce: raw.dodgeOnce || false,
      swarms: raw.swarms || [null, null],
    };
  };

  const p1Display = buildJog(myPlayer, "p1", "Você", true);
  const enemyDisplay = buildJog(opponent, "p2", "Adversário", false);

  const handCards: CartaData[] = myPlayer?.mao || [];
  const isMyTurn = serverState.fase === "acao";
  const gameOver = serverState.fase === "resultado";

  const cardAnimStyle: React.CSSProperties =
    cardAnimState === "entering"
      ? { animation: "cardEnter .3s cubic-bezier(.34,1.56,.64,1) forwards" }
      : cardAnimState === "exiting"
      ? { animation: "cardExit .2s ease forwards" }
      : {};

  return (
    <div style={pageBg()}>
      <style>{`
        @keyframes shakeHit {
          0%,100%{ transform: translateX(0); }
          25%{ transform: translateX(-8px); }
          75%{ transform: translateX(8px); }
        }
        @keyframes pulseOpacity {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: scale(0.7) translateY(30px); }
          to { opacity: 1; transform: scale(0.92) translateY(0); }
        }
        @keyframes cardExit {
          from { opacity: 1; transform: scale(0.92) translateY(0); }
          to { opacity: 0; transform: scale(0.6) translateY(20px); }
        }
        @keyframes enemyCardSlide {
          0% { opacity: 0; transform: translateY(-40px) scale(0.6); }
          20% { opacity: 1; transform: translateY(0) scale(0.75); }
          80% { opacity: 1; transform: translateY(0) scale(0.75); }
          100% { opacity: 0; transform: translateY(20px) scale(0.5); }
        }
        @keyframes fxFlash { 0%{opacity:.6;} 100%{opacity:0;} }
        @keyframes fxPulse { 0%{transform:scale(1);opacity:.5;} 100%{transform:scale(2.5);opacity:0;} }
        @keyframes monsterAttack {
          0% { transform: scale(1) translateY(0); }
          20% { transform: scale(1.15) translateY(-10px); }
          40% { transform: scale(1.2) translateX(20px) translateY(-5px); }
          60% { transform: scale(1.2) translateX(-20px) translateY(-5px); }
          80% { transform: scale(1.1) translateY(-8px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes monsterDefend {
          0% { transform: scale(1); filter: brightness(1); }
          30% { transform: scale(1.05); filter: brightness(1.3) drop-shadow(0 0 20px #3b82f6); }
          70% { transform: scale(1.05); filter: brightness(1.3) drop-shadow(0 0 20px #3b82f6); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes monsterHeal {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.4) drop-shadow(0 0 24px #34d399); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes monsterEvolve {
          0% { transform: scale(1) rotate(0deg); filter: brightness(1); }
          25% { transform: scale(0.9) rotate(-5deg); filter: brightness(0.8); }
          50% { transform: scale(1.3) rotate(5deg); filter: brightness(1.8) drop-shadow(0 0 30px #ffd54f); }
          75% { transform: scale(1.15) rotate(-2deg); filter: brightness(1.3); }
          100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
        }
        @keyframes monsterSwarm {
          0% { transform: scale(1); }
          30% { transform: scale(1.1) translateY(-8px); }
          60% { transform: scale(1.05) translateY(-4px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes monsterIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes arenaGlow {
          0%, 100% { box-shadow: inset 0 0 30px rgba(0,229,255,.08), 0 0 20px rgba(0,229,255,.05); }
          50% { box-shadow: inset 0 0 50px rgba(0,229,255,.12), 0 0 40px rgba(0,229,255,.08); }
        }
        @keyframes vsFlash {
          0%, 100% { text-shadow: 0 0 8px rgba(255,213,79,.4); }
          50% { text-shadow: 0 0 20px rgba(255,213,79,.8), 0 0 40px rgba(255,213,79,.3); }
        }
        @keyframes enemyAttack {
          0% { transform: scale(1) translateY(0) scaleX(-1); }
          20% { transform: scale(1.15) translateY(-10px) scaleX(-1); }
          40% { transform: scale(1.2) translateX(-20px) translateY(-5px) scaleX(-1); }
          60% { transform: scale(1.2) translateX(20px) translateY(-5px) scaleX(-1); }
          80% { transform: scale(1.1) translateY(-8px) scaleX(-1); }
          100% { transform: scale(1) translateY(0) scaleX(-1); }
        }
        @keyframes enemyDefend {
          0% { transform: scale(1) scaleX(-1); filter: brightness(1); }
          30% { transform: scale(1.05) scaleX(-1); filter: brightness(1.3) drop-shadow(0 0 20px #3b82f6); }
          70% { transform: scale(1.05) scaleX(-1); filter: brightness(1.3) drop-shadow(0 0 20px #3b82f6); }
          100% { transform: scale(1) scaleX(-1); filter: brightness(1); }
        }
        @keyframes enemyHeal {
          0% { transform: scale(1) scaleX(-1); filter: brightness(1); }
          50% { transform: scale(1.1) scaleX(-1); filter: brightness(1.4) drop-shadow(0 0 24px #34d399); }
          100% { transform: scale(1) scaleX(-1); filter: brightness(1); }
        }
        @keyframes enemyEvolve {
          0% { transform: scale(1) rotate(0deg) scaleX(-1); filter: brightness(1); }
          25% { transform: scale(0.9) rotate(5deg) scaleX(-1); filter: brightness(0.8); }
          50% { transform: scale(1.3) rotate(-5deg) scaleX(-1); filter: brightness(1.8) drop-shadow(0 0 30px #ffd54f); }
          75% { transform: scale(1.15) rotate(2deg) scaleX(-1); filter: brightness(1.3); }
          100% { transform: scale(1) rotate(0deg) scaleX(-1); filter: brightness(1); }
        }
        @keyframes enemySwarm {
          0% { transform: scale(1) scaleX(-1); }
          30% { transform: scale(1.1) translateY(-8px) scaleX(-1); }
          60% { transform: scale(1.05) translateY(-4px) scaleX(-1); }
          100% { transform: scale(1) translateY(0) scaleX(-1); }
        }
      `}</style>

      {/* Screen effect overlay */}
      {screenFx && (
        <div key={screenFx + Date.now()} style={{
          position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none",
          background:
            screenFx === "ataque" ? "radial-gradient(circle, #ef444466 0%, transparent 70%)" :
            screenFx === "defesa" ? "radial-gradient(circle, #3b82f666 0%, transparent 70%)" :
            screenFx === "evolucao" ? "radial-gradient(circle, #ffd54f66 0%, transparent 70%)" :
            screenFx === "cura" ? "radial-gradient(circle, #34d39966 0%, transparent 70%)" :
            "transparent",
          animation: "fxFlash .6s ease forwards",
        }} />
      )}
      <ChromeNoise />
      <GameLog ents={serverState.log || []} />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: "6px 8px",
          fontFamily: "Nunito, sans-serif",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Top: Turn label + Mute + Enemy HP */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ textAlign: "center", height: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ fontFamily: "Bangers, cursive", fontSize: 12, color: "#00e5ff", letterSpacing: 1.5 }}>
              ⚔️ TURNO {(serverState.turno || 0) + 1}
            </span>
            <span style={{
              fontSize: 10,
              color: isMyTurn ? "#69f0ae" : "#ffd54f",
              animation: !isMyTurn && !gameOver ? "pulseOpacity 1s infinite" : undefined,
            }}>
              {gameOver ? "FIM" : isMyTurn ? "SUA VEZ" : "AGUARDANDO..."}
            </span>
            {loading && <span style={{ fontSize: 10, color: "#ff9800" }}>⏳</span>}
            <button
              onClick={() => {
                const nowMuted = toggleMuted();
                setMuted(nowMuted);
                if (nowMuted) stopBattleMusic();
                else startBattleMusic();
              }}
              style={{
                position: "absolute", right: 12, top: 8,
                background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 6, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 14, zIndex: 10,
              }}
              aria-label={muted ? "Ativar som" : "Mutar som"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
          <div key={`shake-${hitCount}`} style={hitCount ? { animation: "shakeHit .3s ease" } : {}}>
            <HpBar jog={enemyDisplay} inimigo hit={hitCount > 0} />
          </div>
          <BuffIndicators
            defAtiva={enemyDisplay.defAtiva}
            imune={enemyDisplay.imune}
            dobra={enemyDisplay.dobra}
            dodgeOnce={enemyDisplay.dodgeOnce}
            swarms={enemyDisplay.swarms}
          />
        </div>

        {/* ═══ BEAST ARENA — Octagon center ═══ */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 0, padding: "4px 0", position: "relative", overflow: "hidden",
        }}>
          {/* Combat particles */}
          <CombatParticles type={particleType} trigger={particleTrigger} />

          {/* Octagon arena background */}
          <div style={{
            position: "absolute",
            width: "min(280px, 80vw)", height: "min(280px, 80vw)",
            clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            background: "linear-gradient(180deg, rgba(0,229,255,.03) 0%, rgba(0,0,0,.2) 50%, rgba(0,229,255,.03) 100%)",
            border: "none",
            animation: "arenaGlow 3s ease-in-out infinite",
          }}>
            {/* Inner octagon ring */}
            <div style={{
              position: "absolute", inset: 4,
              clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
              border: "1px solid rgba(0,229,255,.12)",
              background: "transparent",
            }} />
            {/* Arena cross lines */}
            <div style={{
              position: "absolute", inset: 0,
              background: `
                linear-gradient(0deg, transparent 48%, rgba(0,229,255,.06) 49%, rgba(0,229,255,.06) 51%, transparent 52%),
                linear-gradient(90deg, transparent 48%, rgba(0,229,255,.06) 49%, rgba(0,229,255,.06) 51%, transparent 52%)
              `,
            }} />
          </div>

          {/* Enemy played card overlay */}
          {enemyCard && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 20,
              animation: "enemyCardSlide 2.5s ease forwards",
            }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
                  fontFamily: "Bangers, cursive", fontSize: 12, color: "#ff8a80",
                  whiteSpace: "nowrap", textShadow: "0 0 8px rgba(255,0,0,.5)",
                }}>⚔️ INIMIGO JOGOU</div>
                <Carta carta={enemyCard} sel={false} disabled />
              </div>
            </div>
          )}

          {/* Selected card overlay */}
          {displayCard && (
            <div style={{
              position: "absolute", zIndex: 18,
              transformOrigin: "center", ...cardAnimStyle,
            }}>
              <Carta carta={displayCard} sel={true} disabled />
            </div>
          )}

          {/* Two monsters in the arena */}
          <div style={{
            position: "relative", zIndex: 5,
            width: "min(280px, 80vw)", height: "min(200px, 50vw)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 12px",
          }}>
            {/* Player monster — left side */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <div style={{
                animation: monsterAction.active
                  ? (monsterAction.type === "ataque" ? "monsterAttack 1.2s ease forwards" :
                     monsterAction.type === "defesa" ? "monsterDefend 1.2s ease forwards" :
                     monsterAction.type === "cura" ? "monsterHeal 1.2s ease forwards" :
                     monsterAction.type === "evolucao" ? "monsterEvolve 1.2s ease forwards" :
                     monsterAction.type === "swarm" ? "monsterSwarm 1.2s ease forwards" :
                     "monsterAttack 1.2s ease forwards")
                  : "monsterIdle 3s ease-in-out infinite",
              }}>
                <MonsterAvatar monstroId={monstroP1} size={80} glow={p1Display.monstro.glow} />
              </div>
              {monsterAction.active && (
                <div style={{
                  fontFamily: "Bangers, cursive", fontSize: 11, letterSpacing: 1,
                  color:
                    monsterAction.type === "ataque" ? "#ef4444" :
                    monsterAction.type === "defesa" ? "#3b82f6" :
                    monsterAction.type === "cura" ? "#34d399" :
                    monsterAction.type === "evolucao" ? "#ffd54f" :
                    "#a78bfa",
                  textShadow: "0 0 8px currentColor",
                }}>
                  {monsterAction.type === "ataque" ? "⚔️ ATK!" :
                   monsterAction.type === "defesa" ? "🛡️ DEF!" :
                   monsterAction.type === "cura" ? "💚 HEAL!" :
                   monsterAction.type === "evolucao" ? "⭐ EVO!" :
                   monsterAction.type === "swarm" ? "🐾 SWARM!" : "⚡"}
                </div>
              )}
              <div style={{
                fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#69f0ae",
                letterSpacing: 1, textTransform: "uppercase", opacity: 0.7,
              }}>
                {p1Display.nome}
              </div>
            </div>

            {/* VS badge */}
            <div style={{
              fontFamily: "Bangers, cursive", fontSize: 20, color: "#ffd54f",
              animation: "vsFlash 2s ease-in-out infinite",
              textShadow: "0 0 12px rgba(255,213,79,.5)",
              flexShrink: 0,
            }}>VS</div>

            {/* Enemy monster — right side (mirrored) */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <div style={{
                transform: enemyAction.active ? undefined : "scaleX(-1)",
                animation: enemyAction.active
                  ? (enemyAction.type === "ataque" ? "enemyAttack 1.2s ease forwards" :
                     enemyAction.type === "defesa" ? "enemyDefend 1.2s ease forwards" :
                     enemyAction.type === "cura" ? "enemyHeal 1.2s ease forwards" :
                     enemyAction.type === "evolucao" ? "enemyEvolve 1.2s ease forwards" :
                     enemyAction.type === "swarm" ? "enemySwarm 1.2s ease forwards" :
                     "enemyAttack 1.2s ease forwards")
                  : "monsterIdle 3s ease-in-out infinite 0.5s",
              }}>
                <MonsterAvatar
                  monstroId={enemyDisplay.monstro?.id || "panther"}
                  size={80}
                  glow={enemyDisplay.monstro?.glow || "#ff4444"}
                />
              </div>
              {enemyAction.active && (
                <div style={{
                  fontFamily: "Bangers, cursive", fontSize: 11, letterSpacing: 1,
                  color:
                    enemyAction.type === "ataque" ? "#ef4444" :
                    enemyAction.type === "defesa" ? "#3b82f6" :
                    enemyAction.type === "cura" ? "#34d399" :
                    enemyAction.type === "evolucao" ? "#ffd54f" :
                    "#a78bfa",
                  textShadow: "0 0 8px currentColor",
                }}>
                  {enemyAction.type === "ataque" ? "⚔️ ATK!" :
                   enemyAction.type === "defesa" ? "🛡️ DEF!" :
                   enemyAction.type === "cura" ? "💚 HEAL!" :
                   enemyAction.type === "evolucao" ? "⭐ EVO!" :
                   enemyAction.type === "swarm" ? "🐾 SWARM!" : "⚡"}
                </div>
              )}
              <div style={{
                fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#ff8a80",
                letterSpacing: 1, textTransform: "uppercase", opacity: 0.7,
              }}>
                {enemyDisplay.nome}
              </div>
            </div>
          </div>

          {/* Idle prompt */}
          {!displayCard && !monsterAction.active && !enemyAction.active && !enemyCard && !gameOver && (
            <div style={{
              position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
              color: "#4a5568", fontFamily: "Bangers, cursive", fontSize: 14,
              letterSpacing: 2, whiteSpace: "nowrap",
            }}>
              👆 TOQUE UMA CARTA
            </div>
          )}
        </div>

        {/* ═══ 8-BIT TIMER — Center bottom ═══ */}
        {isMyTurn && !gameOver && !mostraPoder && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, flexShrink: 0, marginBottom: 4,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: turnTimer <= 10 ? "rgba(239,68,68,.12)" : "rgba(0,229,255,.06)",
              border: `2px solid ${turnTimer <= 10 ? "rgba(239,68,68,.4)" : turnTimer <= 20 ? "rgba(255,213,79,.3)" : "rgba(0,229,255,.2)"}`,
              borderRadius: 8, padding: "4px 14px",
              animation: turnTimer <= 5 ? "timerPulse .5s infinite" : undefined,
              imageRendering: "pixelated",
            }}>
              {/* 8-bit clock icon */}
              <div style={{
                width: 18, height: 18, position: "relative",
                border: `2px solid ${turnTimer <= 10 ? "#ef4444" : "#00e5ff"}`,
                borderRadius: "50%", boxSizing: "border-box",
              }}>
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: 2, height: 6,
                  background: turnTimer <= 10 ? "#ef4444" : "#00e5ff",
                  transformOrigin: "bottom center",
                  transform: `translate(-50%, -100%) rotate(${(turnTimer / 30) * 360}deg)`,
                  transition: "transform 1s linear",
                }} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  width: 2, height: 4,
                  background: turnTimer <= 10 ? "#ff8a80" : "#7eb8ff",
                  transformOrigin: "bottom center",
                  transform: `translate(-50%, -100%) rotate(${(turnTimer / 30) * 360 * 2}deg)`,
                  transition: "transform 1s linear",
                }} />
              </div>
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 18, fontWeight: 900, letterSpacing: 2,
                color: turnTimer <= 10 ? "#ef4444" : turnTimer <= 20 ? "#ffd54f" : "#00e5ff",
                textShadow: turnTimer <= 10 ? "0 0 8px #ef4444" : "none",
                minWidth: 36, textAlign: "center",
              }}>
                {String(turnTimer).padStart(2, "0")}
              </span>
            </div>
          </div>
        )}
        {/* Action buttons */}
        {!gameOver && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0, marginBottom: 4 }}>
            <BtnMain
              variant={cartaSel ? "gold" : "dark"}
              disabled={!cartaSel || !isMyTurn || loading}
              onClick={jogarCarta}
              style={{ flex: 2 }}
            >
              {cartaSel ? `⚡ JOGAR` : "Selecione"}
            </BtnMain>
            <BtnMain
              variant="dark"
              disabled={!isMyTurn || loading}
              onClick={handlePassar}
              style={{ flex: 1 }}
            >
              ⏭ PASSAR
            </BtnMain>
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <div style={{ textAlign: "center", padding: 12, flexShrink: 0 }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 28, color: serverState.vencedor === slotLocal ? "#69f0ae" : "#ef5350", textShadow: "0 0 20px currentColor" }}>
              {serverState.vencedor === slotLocal ? "🏆 VITÓRIA!" : "💀 DERROTA!"}
            </div>
            <BtnMain variant="gold" onClick={() => onFim(serverState.vencedor === slotLocal ? p1Display : null)} style={{ marginTop: 12 }}>
              CONTINUAR
            </BtnMain>
          </div>
        )}

        {/* Card thumbnails — scrollable row */}
        {!gameOver && (
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              overflowY: "hidden",
              padding: "4px 0",
              flexShrink: 0,
              justifyContent: handCards.length <= 4 ? "center" : "flex-start",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {handCards.map((c: any) => (
              <Carta
                key={c.id}
                carta={c}
                sel={cartaSel?.id === c.id}
                onClick={() => selCarta(c)}
                disabled={!isMyTurn || loading}
                mini
              />
            ))}
          </div>
        )}

        {/* Player buff indicators + HP bar */}
        <BuffIndicators
          defAtiva={p1Display.defAtiva}
          imune={p1Display.imune}
          dobra={p1Display.dobra}
          dodgeOnce={p1Display.dodgeOnce}
          swarms={p1Display.swarms}
        />
        <div style={{ flexShrink: 0, paddingTop: 2, paddingBottom: 2 }}>
          <HpBar jog={p1Display} />
        </div>
      </div>

      {mostraPoder && <ModalPoder onEscolha={escolherPoder} />}
      {showTutorial && (
        <TutorialOverlay onComplete={() => {
          setShowTutorial(false);
          localStorage.setItem("beast_tutorial_done", "1");
        }} />
      )}
    </div>
  );
}
