import React, { useState, useEffect, useRef, useCallback } from "react";
import { MONSTROS, PODERES, type CartaData } from "@/game/data";
import BattleIntro from "@/components/game/BattleIntro";
import { criarJ, type Jogador, type LogEntry } from "@/game/engine";
import { criarSessao, ouvirSessao, fecharCanal, type GameSession } from "@/game/multiplayer";
import { initGame, choosePower, playCard, passTurn, comboCards, saveCardDrop } from "@/game/serverApi";
import { falar, markGesture } from "@/game/voice";
import { sfxAtaque, sfxDefesa, sfxEvolucao, sfxSwarm, sfxCura, sfxExplode, sfxTap, sfxPassar, sfxPoder, sfxVitoria, sfxDerrota } from "@/game/sfx";
import { pageBg, DS } from "@/game/styles";
import { startBattleMusic, stopBattleMusic } from "@/game/battleMusic";
import { isMuted, toggleMuted } from "@/game/audioState";
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticError, hapticExplosion } from "@/game/haptic";
import { setBattleId, clearBattle, battleTimeout, ifBattleActive } from "@/game/battleContext";
import Carta from "@/components/game/Carta";
import HpBar from "@/components/game/HpBar";
import BtnMain from "@/components/game/BtnMain";
import ModalPoder from "@/components/game/ModalPoder";
import ChromeNoise from "@/components/game/ChromeNoise";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import CombatParticles from "@/components/game/CombatParticles";
import InteractiveTutorial from "@/components/game/InteractiveTutorial";
import BattleChat from "@/components/game/BattleChat";
import EnergyBar from "@/components/game/EnergyBar";

/* ─── Types ─── */
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

export interface BattleStats {
  cardsPlayed: number; healsUsed: number; evolutions: number;
  damageDealt: number; defenseCards: number;
}

interface TelaBatalhaProps {
  modo: string; monstroP1: string; nomeJogador?: string;
  salaId?: string | null; slotLocal?: number;
  onFim: (vencedor: Jogador | null, stats: BattleStats) => void;
  dificuldade?: string; aiMonstroId?: string;
  skipPowerSelect?: boolean; lastPowerId?: string;
  onPowerChosen?: (powerId: string) => void; userId?: string;
}

interface ActionEvt {
  who: "player" | "enemy"; type: string;
  card?: CartaData; dmg?: number; label?: string;
}

/* ─── Animation CSS ─── */
const CSS = `
  @keyframes idleFloat      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes enemyIdleFloat { 0%,100%{transform:scaleX(-1) translateY(0)} 50%{transform:scaleX(-1) translateY(-6px)} }

  @keyframes playerAtk  { 0%{transform:translateX(0)} 20%{transform:translateX(12px) scale(1.12)} 45%{transform:translateX(38px) scale(1.18)} 65%{transform:translateX(12px) scale(1.08)} 100%{transform:translateX(0)} }
  @keyframes playerDef  { 0%{filter:brightness(1)} 40%{filter:brightness(1.6) drop-shadow(0 0 20px #3b82f6)} 100%{filter:brightness(1)} }
  @keyframes playerHeal { 0%{filter:brightness(1) saturate(1)} 50%{filter:brightness(1.7) saturate(1.4) drop-shadow(0 0 24px #34d399)} 100%{filter:brightness(1) saturate(1)} }
  @keyframes playerEvo  { 0%{transform:scale(1) rotate(0)} 25%{transform:scale(0.85) rotate(-4deg)} 55%{transform:scale(1.42) rotate(4deg);filter:brightness(2.4) drop-shadow(0 0 36px #ffd54f)} 80%{transform:scale(1.12) rotate(-1deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes playerSwarm{ 0%{transform:scale(1)} 35%{transform:scale(1.16) translateY(-12px)} 70%{transform:scale(1.08) translateY(-6px)} 100%{transform:scale(1)} }

  @keyframes enemyAtk  { 0%{transform:scaleX(-1) translateX(0)} 20%{transform:scaleX(-1) translateX(-12px) scale(1.12)} 45%{transform:scaleX(-1) translateX(-38px) scale(1.18)} 65%{transform:scaleX(-1) translateX(-12px) scale(1.08)} 100%{transform:scaleX(-1) translateX(0)} }
  @keyframes enemyDef  { 0%{transform:scaleX(-1);filter:brightness(1)} 40%{transform:scaleX(-1);filter:brightness(1.6) drop-shadow(0 0 20px #3b82f6)} 100%{transform:scaleX(-1);filter:brightness(1)} }
  @keyframes enemyHeal { 0%{transform:scaleX(-1);filter:brightness(1)} 50%{transform:scaleX(-1);filter:brightness(1.7) drop-shadow(0 0 24px #34d399)} 100%{transform:scaleX(-1);filter:brightness(1)} }
  @keyframes enemyEvo  { 0%{transform:scaleX(-1) scale(1)} 25%{transform:scaleX(-1) scale(0.85)} 55%{transform:scaleX(-1) scale(1.42);filter:brightness(2.4) drop-shadow(0 0 36px #ffd54f)} 80%{transform:scaleX(-1) scale(1.12)} 100%{transform:scaleX(-1) scale(1)} }
  @keyframes enemySwarm{ 0%{transform:scaleX(-1)} 35%{transform:scaleX(-1) scale(1.16) translateY(-12px)} 70%{transform:scaleX(-1) scale(1.08) translateY(-6px)} 100%{transform:scaleX(-1)} }

  @keyframes hitShake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-9px)} 50%{transform:translateX(9px)} 80%{transform:translateX(-5px)} }
  @keyframes flashBg    { 0%{opacity:0.6} 100%{opacity:0} }

  @keyframes cardFlyUp  { 0%{opacity:0;transform:translateX(-50%) translateY(60px) scale(0.6)} 60%{opacity:1;transform:translateX(-50%) translateY(-8px) scale(1.04)} 100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
  @keyframes cardFlyDn  { 0%{opacity:0;transform:translateX(-50%) translateY(-60px) scale(0.6)} 60%{opacity:1;transform:translateX(-50%) translateY(8px) scale(1.04)} 100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
  @keyframes cardFadeOut{ 0%{opacity:1;transform:translateX(-50%) scale(1)} 100%{opacity:0;transform:translateX(-50%) scale(0.7) translateY(-20px)} }

  @keyframes dmgFloat   { 0%{opacity:1;transform:translateY(0) scale(1)} 70%{opacity:1;transform:translateY(-32px) scale(1.3)} 100%{opacity:0;transform:translateY(-52px) scale(0.8)} }
  @keyframes labelPop   { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)} 55%{transform:translate(-50%,-50%) scale(1.12)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1)} }
  @keyframes labelFade  { 0%,55%{opacity:1} 100%{opacity:0} }

  @keyframes thinkDot   { 0%,80%,100%{opacity:0;transform:scale(0)} 40%{opacity:1;transform:scale(1)} }
  @keyframes arenaGlow  { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
  @keyframes vsGlow     { 0%,100%{text-shadow:0 0 8px rgba(255,213,79,.4)} 50%{text-shadow:0 0 24px rgba(255,213,79,.9),0 0 48px rgba(255,213,79,.3)} }
  @keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes cardIn     { 0%{opacity:0;transform:translateY(16px) scale(0.88)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes spin       { to{transform:rotate(360deg)} }

  @keyframes enemyTurn  { 0%{opacity:0;transform:translateY(-4px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes dropIn     { 0%{opacity:0;transform:translateX(-50%) scale(0.5) translateY(20px)} 65%{transform:translateX(-50%) scale(1.06) translateY(-4px)} 100%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)} }
  @keyframes victoryIn  { 0%{opacity:0;transform:scale(0.3) rotate(-10deg)} 55%{transform:scale(1.14) rotate(3deg)} 80%{transform:scale(0.97) rotate(-1deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes newCardIn  { 0%{opacity:0;transform:scale(0.6) rotate(-8deg) translateY(20px)} 70%{transform:scale(1.04) rotate(1deg)} 100%{opacity:1;transform:scale(1) rotate(0) translateY(0)} }
`;

const ANIM_MAP: Record<string, { player: string; enemy: string; label: string; color: string; flash: string }> = {
  ataque:   { player:"playerAtk 1.1s ease forwards",  enemy:"enemyAtk 1.1s ease forwards",  label:"⚔️ ATAQUE!",   color:"#ef4444", flash:"#ef444430" },
  defesa:   { player:"playerDef 1.0s ease forwards",  enemy:"enemyDef 1.0s ease forwards",  label:"🛡️ DEFESA!",   color:"#3b82f6", flash:"#3b82f630" },
  cura:     { player:"playerHeal 0.9s ease forwards", enemy:"enemyHeal 0.9s ease forwards", label:"💚 CURA!",     color:"#34d399", flash:"#34d39930" },
  evolucao: { player:"playerEvo 1.3s ease forwards",  enemy:"enemyEvo 1.3s ease forwards",  label:"⭐ EVOLUÇÃO!", color:"#ffd54f", flash:"#ffd54f30" },
  swarm:    { player:"playerSwarm 1.0s ease forwards",enemy:"enemySwarm 1.0s ease forwards",label:"🐾 SWARM!",   color:"#a78bfa", flash:"#a78bfa30" },
  desafio:  { player:"playerAtk 1.1s ease forwards",  enemy:"enemyAtk 1.1s ease forwards",  label:"⚡ ESPECIAL!", color:"#ffd54f", flash:"#ffd54f30" },
  poderzinho:{ player:"playerDef 1.0s ease forwards", enemy:"enemyDef 1.0s ease forwards",  label:"✨ PODER!",    color:"#fbbf24", flash:"#fbbf2430" },
};

const TURN_TIMER = 30;

export default function TelaBatalha({
  modo, monstroP1, nomeJogador = "Você", salaId, slotLocal = 0,
  onFim, dificuldade = "medio", aiMonstroId, skipPowerSelect,
  lastPowerId, onPowerChosen, userId,
}: TelaBatalhaProps) {

  /* ─── State ─── */
  const [serverState, setServerState]   = useState<ServerState | null>(null);
  const [mostraPoder, setMostraPoder]   = useState(!skipPowerSelect);
  const [showBattleIntro, setShowBattleIntro] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const [cartaSel, setCartaSel]         = useState<CartaData | null>(null);
  const [comboSel, setComboSel]         = useState<CartaData[]>([]);
  const [loading, setLoading]           = useState(false);
  const [muted, setMuted]               = useState(isMuted());
  const [turnTimer, setTurnTimer]       = useState(TURN_TIMER);

  // Animation states
  const [playerAnim, setPlayerAnim]     = useState("");
  const [enemyAnim, setEnemyAnim]       = useState("");
  const [screenFlash, setScreenFlash]   = useState<string | null>(null);
  const [actionLabel, setActionLabel]   = useState<{text:string;color:string} | null>(null);
  const [dmgPopup, setDmgPopup]         = useState<{val:number;who:"player"|"enemy"} | null>(null);
  const [hitPlayer, setHitPlayer]       = useState(false);
  const [hitEnemy, setHitEnemy]         = useState(false);
  const [particleType, setParticleType] = useState("ataque");
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [flyCard, setFlyCard]           = useState<CartaData | null>(null);
  const [flyWho, setFlyWho]             = useState<"player"|"enemy">("player");
  const [flyPhase, setFlyPhase]         = useState<"in"|"out">("in");
  const [enemyThinking, setEnemyThinking] = useState(false);

  // Enemy action reveal state — NEW: explicit "enemy played X" phase
  const [enemyReveal, setEnemyReveal]   = useState<{card: CartaData; label: string; color: string} | null>(null);
  const [newTurnFlash, setNewTurnFlash] = useState(false);
  const [cardDropped, setCardDropped]   = useState<any | null>(null);
  const [bStats, setBStats]             = useState<BattleStats>({ cardsPlayed:0, healsUsed:0, evolutions:0, damageDealt:0, defenseCards:0 });

  /* ─── Refs ─── */
  const sessionIdRef    = useRef<string | null>(salaId || null);
  const battleIdRef     = useRef<string>("");
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const animQueueRef    = useRef<ActionEvt[]>([]);
  const animBusyRef     = useRef(false);

  /* ─── Init ─── */
  useEffect(() => {
    const bid = `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    battleIdRef.current = bid;
    setBattleId(bid);
    return () => { clearBattle(); stopBattleMusic(); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("beast_tutorial_done") && !skipPowerSelect) setShowTutorial(true);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        let sid = salaId || null;
        const result = await initGame(sid, modo === "multi" ? "multi" : "ai", [
          { slot: slotLocal, nome: nomeJogador, monstroId: monstroP1 }
        ], dificuldade, aiMonstroId);
        if (!sid && result.sessionId) sid = result.sessionId;
        sessionIdRef.current = sid!;
        setServerState(result.state);
        if (skipPowerSelect && lastPowerId) {
          const pr = await choosePower(sid!, slotLocal, lastPowerId);
          setServerState(pr.state);
          sfxPoder(); startBattleMusic();
        }
      } catch (e) { console.error(e); }
    }
    init();
  }, []);

  useEffect(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const ch = ouvirSessao(sid, (session: GameSession) => {
      if (session.state_json && typeof session.state_json === "object") {
        const ns = session.state_json as unknown as ServerState;
        setServerState(ns);
      }
    });
    return () => fecharCanal(ch);
  }, [sessionIdRef.current]);

  /* ─── Turn timer ─── */
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!serverState || serverState.fase !== "acao" || mostraPoder) { setTurnTimer(TURN_TIMER); return; }
    setTurnTimer(TURN_TIMER);
    timerRef.current = setInterval(() => {
      setTurnTimer(p => {
        if (p <= 1) { if (timerRef.current) clearInterval(timerRef.current); handlePassar(); return TURN_TIMER; }
        return p - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [serverState?.fase, serverState?.turno, mostraPoder]);

  /* ─── Animation queue ─── */
  function enqueue(evt: ActionEvt) {
    animQueueRef.current.push(evt);
    if (!animBusyRef.current) drain();
  }

  function drain() {
    if (!animQueueRef.current.length) { animBusyRef.current = false; return; }
    animBusyRef.current = true;
    const evt = animQueueRef.current.shift()!;
    playEvt(evt, () => setTimeout(drain, 80));
  }

  function playEvt(evt: ActionEvt, done: () => void) {
    const bid = battleIdRef.current;
    const cfg = ANIM_MAP[evt.type] || ANIM_MAP.ataque;
    const isEnemy = evt.who === "enemy";
    const animDuration = evt.type === "evolucao" ? 1400 : 1100;

    // 1. Show card flying in
    if (evt.card) {
      setFlyCard(evt.card);
      setFlyWho(evt.who);
      setFlyPhase("in");
    }

    const afterCard = evt.card ? 380 : 0;

    setTimeout(() => {
      // 2. Card flies out, monster animates
      if (evt.card) {
        setFlyPhase("out");
        battleTimeout(() => ifBattleActive(bid, () => setFlyCard(null)), 200, bid);
      }

      // 3. Monster action animation
      if (isEnemy) setEnemyAnim(cfg.enemy); else setPlayerAnim(cfg.player);

      // 4. Screen flash
      setScreenFlash(cfg.flash);
      battleTimeout(() => ifBattleActive(bid, () => setScreenFlash(null)), 500, bid);

      // 5. Action label (center)
      setActionLabel({ text: cfg.label, color: cfg.color });

      // 6. Particles
      setParticleType(evt.type === "cura" ? "cura" : evt.type === "defesa" ? "defesa" : evt.type === "evolucao" ? "evolucao" : "ataque");
      setParticleTrigger(t => t + 1);

      // 7. Damage popup
      if (evt.dmg && evt.dmg > 0) {
        const who = isEnemy ? "player" : "enemy";
        setDmgPopup({ val: evt.dmg, who });
        if (who === "player") setHitPlayer(true); else setHitEnemy(true);
        battleTimeout(() => ifBattleActive(bid, () => {
          setDmgPopup(null); setHitPlayer(false); setHitEnemy(false);
        }), 850, bid);
      }

      // 8. Sound
      if (evt.type === "ataque") { evt.card?.esp === "explode" ? (sfxExplode(), hapticExplosion()) : (sfxAtaque(), hapticHeavy()); }
      else if (evt.type === "defesa") { sfxDefesa(); hapticMedium(); }
      else if (evt.type === "cura")   { sfxCura(); hapticLight(); }
      else if (evt.type === "evolucao") { sfxEvolucao(); hapticSuccess(); }
      else if (evt.type === "swarm")  { sfxSwarm(); hapticLight(); }

    }, afterCard);

    battleTimeout(() => ifBattleActive(bid, () => {
      setPlayerAnim(""); setEnemyAnim(""); setActionLabel(null);
      done();
    }), afterCard + animDuration, bid);
  }

  /* ─── Show enemy action with a clear reveal panel ─── */
  function showEnemyAction(evts: any[], state: any, bid: string) {
    const aiEvt = evts?.find((e: any) => e.type === "ai_played");
    if (!aiEvt || !aiEvt.carta) return;

    const tipo = aiEvt.tipo || aiEvt.carta?.tipo || "ataque";
    const cfg = ANIM_MAP[tipo] || ANIM_MAP.ataque;

    // Thinking dots first
    setTimeout(() => {
      setEnemyThinking(true);
      setTimeout(() => {
        setEnemyThinking(false);
        // Reveal what enemy played — big clear banner
        setEnemyReveal({ card: aiEvt.carta, label: cfg.label, color: cfg.color });
        // Hide after 2s
        battleTimeout(() => ifBattleActive(bid, () => setEnemyReveal(null)), 2200, bid);

        // Queue the animation
        const dmgEntry = (state.log || []).slice(-6).findLast((l: any) => l.t === "dano" && l.dmg > 0);
        enqueue({ who: "enemy", type: tipo, card: aiEvt.carta, dmg: dmgEntry?.dmg });
      }, 600);
    }, 400);
  }

  /* ─── New turn flash ─── */
  function showNewTurn() {
    setNewTurnFlash(true);
    setTimeout(() => setNewTurnFlash(false), 800);
  }

  /* ─── Game over handler ─── */
  function handleGameOver(evts: any[], bid: string) {
    for (const evt of (evts || [])) {
      if (evt.type === "card_drop" && evt.card && evt.slot === slotLocal) {
        setCardDropped(evt.card);
        if (userId) saveCardDrop(userId, evt.card).catch(console.error);
      }
      if (evt.type === "game_over") {
        const winner = evt.winner ?? evt.winner;
        setTimeout(() => ifBattleActive(bid, () => {
          if (winner === slotLocal) { sfxVitoria(); hapticSuccess(); } else { sfxDerrota(); hapticError(); }
        }), 1400);
        stopBattleMusic();
        setTimeout(() => onFim(winner === slotLocal ? { id: "p1" } as any : null, bStats), 2000);
      }
    }
  }

  const sid = sessionIdRef.current;

  /* ─── Actions ─── */
  async function escolherPoder(pid: string) {
    if (!sid) return;
    markGesture(); setMostraPoder(false); setLoading(true);
    try {
      const r = await choosePower(sid, slotLocal, pid);
      setServerState(r.state);
      sfxPoder(); startBattleMusic();
      onPowerChosen?.(pid);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function selCarta(carta: CartaData) {
    // Only block during active network request, not during animations
    if (serverState?.fase !== "acao") return;
    if (loading) return;

    // Deselect from combo
    if (comboSel.find(c => c.id === carta.id)) {
      const updated = comboSel.filter(c => c.id !== carta.id);
      setComboSel(updated);
      if (updated.length === 0) setCartaSel(null);
      sfxTap(); return;
    }

    const basic = ["ataque","defesa","cura"];
    const isSpec = (c: CartaData) => Boolean(c.esp) || !basic.includes(c.tipo);

    // Form combo: same basic type, both non-special
    if (cartaSel && cartaSel.id !== carta.id && cartaSel.tipo === carta.tipo
        && basic.includes(carta.tipo) && !isSpec(cartaSel) && !isSpec(carta)) {
      setComboSel([cartaSel, carta]); setCartaSel(null); sfxTap(); hapticLight(); return;
    }

    // Toggle selection
    const desel = cartaSel?.id === carta.id;
    setCartaSel(desel ? null : carta);
    setComboSel([]);
    if (!desel) { sfxTap(); hapticLight(); }
  }

  async function jogarCarta() {
    if (!cartaSel || !sid || loading) return;
    const myP = serverState?.players?.[slotLocal];
    if ((myP?.energia ?? 0) < (cartaSel.custo || 1)) return;
    markGesture();
    const bid = battleIdRef.current;
    const copy = { ...cartaSel };
    setCartaSel(null); setComboSel([]); setLoading(true);
    enqueue({ who: "player", type: copy.tipo, card: copy });
    setBStats(s => ({ ...s, cardsPlayed: s.cardsPlayed+1, healsUsed: s.healsUsed+(copy.tipo==="cura"?1:0), evolutions: s.evolutions+(copy.tipo==="evolucao"?1:0), defenseCards: s.defenseCards+(copy.tipo==="defesa"?1:0) }));
    try {
      const r = await playCard(sid, slotLocal, copy.id);
      setServerState(r.state);
      const dmg = (r.state.log||[]).slice(-6).findLast((l:any) => l.t==="dano" && l.dmg>0);
      if (dmg) setBStats(s => ({ ...s, damageDealt: s.damageDealt+dmg.dmg }));
      if (r.state.turno !== serverState?.turno) showNewTurn();
      showEnemyAction(r.events, r.state, bid);
      handleGameOver(r.events, bid);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function jogarCombo() {
    if (comboSel.length !== 2 || !sid || loading) return;
    markGesture();
    const bid = battleIdRef.current;
    const [c1,c2] = comboSel;
    setComboSel([]); setCartaSel(null); setLoading(true);
    enqueue({ who: "player", type: c1.tipo, card: c1 });
    setBStats(s => ({ ...s, cardsPlayed: s.cardsPlayed+2 }));
    try {
      const r = await comboCards(sid, slotLocal, c1.id, c2.id);
      setServerState(r.state);
      const dmg = (r.state.log||[]).slice(-8).findLast((l:any) => l.t==="dano" && l.dmg>0);
      if (dmg) setBStats(s => ({ ...s, damageDealt: s.damageDealt+dmg.dmg }));
      if (r.state.turno !== serverState?.turno) showNewTurn();
      showEnemyAction(r.events, r.state, bid);
      handleGameOver(r.events, bid);
      // Release lock quickly — enemy animation is visual only, doesn't block input
      setLoading(false);
    } catch (e) {
      console.error(e);
      setComboSel([]);
      setLoading(false);
    }
  }

  async function handlePassar() {
    if (!sid || loading) return;
    markGesture();
    const bid = battleIdRef.current;
    setLoading(true); setCartaSel(null); sfxPassar();
    try {
      const r = await passTurn(sid, slotLocal);
      setServerState(r.state);
      showNewTurn();
      showEnemyAction(r.events, r.state, bid);
      handleGameOver(r.events, bid);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const handleIntroDone = useCallback(() => setShowBattleIntro(false), []);

  /* ─── Derived ─── */
  if (!serverState) return (
    <div style={{ ...pageBg(), display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <ChromeNoise />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
        <div style={{ width:40,height:40,border:"3px solid rgba(0,229,255,.15)",borderTopColor:"#00e5ff",borderRadius:"50%",animation:"spin .8s linear infinite" }} />
        <span style={{ fontFamily:"Bangers,cursive",fontSize:18,color:"#00e5ff",letterSpacing:2 }}>CARREGANDO...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const myPlayer  = serverState.players?.[slotLocal];
  const opSlot    = slotLocal === 0 ? 1 : 0;
  const opponent  = serverState.players?.[opSlot];

  const buildJog = (raw: any, fId: string, fNome: string, humano: boolean): Jogador => {
    if (!raw) return criarJ(fId, fNome, monstroP1, humano);
    const md = MONSTROS[raw.monstro?.id] || {} as any;
    return { id:raw.id||fId, nome:raw.nome||fNome, humano, monstro:{...raw.monstro, bg1:raw.monstro?.bg1||md.bg1||"#000", bg2:raw.monstro?.bg2||md.bg2||"#000", glow:raw.monstro?.glow||md.glow||"#00e5ff", habD:raw.monstro?.habD||md.habD||""}, hp:raw.hp||0, maxHp:raw.maxHp||70, mao:raw.mao||[], defAtiva:raw.defAtiva||0, imune:raw.imune||false, dobra:raw.dobra||false, dodgeOnce:raw.dodgeOnce||false, swarms:raw.swarms||[null,null] };
  };

  const p1Display  = buildJog(myPlayer, "p1","Você",true);
  const enemyDisplay = buildJog(opponent,"p2","Adversário",false);
  const enemyId    = opponent?.monstro?.id || aiMonstroId || "panther";
  const handCards  = (myPlayer?.mao || []) as CartaData[];
  const isMyTurn   = serverState.fase === "acao";
  const gameOver   = serverState.fase === "resultado";
  const myEnergia  = myPlayer?.energia ?? 3;
  const canPlay    = cartaSel ? myEnergia >= (cartaSel.custo||1) : false;
  const comboEnergy= comboSel.reduce((a,c) => a+(c.custo||1), 0);
  const canCombo   = myEnergia >= comboEnergy;

  if (showBattleIntro && !skipPowerSelect) {
    return <BattleIntro monstroP1={monstroP1} monstroP2={enemyId} nomeP1={nomeJogador} nomeP2={enemyDisplay.nome} onDone={handleIntroDone} />;
  }

  /* ─── RENDER ─── */
  return (
    <div style={{
      minHeight:"100dvh",
      background:`radial-gradient(ellipse at 50% 0%,#1a0a06 0%,#0d0704 35%,${DS.bg0} 100%)`,
      position:"relative",
    }}>
      <style>{CSS}</style>

      {/* Screen flash overlay */}
      {screenFlash && <div key={`f${Date.now()}`} style={{ position:"fixed",inset:0,zIndex:90,pointerEvents:"none",background:screenFlash,animation:"flashBg .55s ease forwards" }} />}

      {/* New turn flash */}
      {newTurnFlash && <div style={{ position:"fixed",inset:0,zIndex:88,pointerEvents:"none",background:"rgba(0,229,255,.07)",animation:"flashBg .8s ease forwards" }} />}

      <ChromeNoise />
      <CombatParticles type={particleType} trigger={particleTrigger} />

      <div style={{ position:"relative",zIndex:1,height:"100dvh",display:"flex",flexDirection:"column",padding:"8px 10px 6px",overflow:"hidden",boxSizing:"border-box",fontFamily:DS.fontUI }}>

        {/* ══ TOP BAR ══ */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,marginBottom:5 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontFamily:DS.fontDisplay,fontSize:13,color:DS.gold,letterSpacing:3,
              background:`${DS.gold}18`,border:`1px solid ${DS.gold}30`,
              borderRadius:6,padding:"2px 10px" }}>
              TURNO {(serverState.turno||0)+1}
            </span>
            {!gameOver && (
              <span style={{
                fontFamily:DS.fontUI,fontSize:10,fontWeight:700,letterSpacing:1.5,
                padding:"2px 10px",borderRadius:6,
                background: isMyTurn ? "rgba(39,174,96,.12)" : `${DS.gold}0a`,
                border: `1px solid ${isMyTurn ? "rgba(39,174,96,.3)" : DS.gold+"22"}`,
                color: isMyTurn ? DS.green : DS.gold,
                animation: !isMyTurn && !loading ? "pulse 1.2s infinite" : "none",
              }}>
                {isMyTurn ? "SUA VEZ" : "ADVERSÁRIO..."}
              </span>
            )}
            {loading && <div style={{ width:10,height:10,border:`2px solid ${DS.ember}22`,borderTopColor:DS.ember,borderRadius:"50%",animation:"spin .7s linear infinite" }} />}
          </div>
          <button onClick={() => { const m = toggleMuted(); setMuted(m); m ? stopBattleMusic() : startBattleMusic(); }}
            style={{ background:`${DS.bg2}`,border:`1px solid ${DS.bg3}`,borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13,flexShrink:0 }}>
            {muted?"🔇":"🔊"}
          </button>
        </div>

        {/* ══ ENEMY HP ══ */}
        <div style={{ flexShrink:0, animation:hitEnemy?"hitShake .4s ease":"none", marginBottom:3 }}>
          <HpBar jog={enemyDisplay} inimigo hit={hitEnemy} />
        </div>

        {/* ══ ARENA ══ */}
        <div style={{ flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",minHeight:0,overflow:"visible" }}>

          {/* Octagon glow */}
          <div style={{ position:"absolute",width:"min(240px,72vw)",height:"min(240px,72vw)",clipPath:"polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)",background:"linear-gradient(160deg,rgba(0,229,255,.04),rgba(0,0,0,.18),rgba(0,229,255,.03))",animation:"arenaGlow 3s ease-in-out infinite" }} />

          {/* Damage number */}
          {dmgPopup && (
            <div style={{ position:"absolute",zIndex:55,pointerEvents:"none",fontFamily:"Bangers,cursive",fontSize:32,letterSpacing:1,
              top: dmgPopup.who==="enemy" ? "16%" : "55%",
              left: dmgPopup.who==="enemy" ? "64%" : "24%",
              color: dmgPopup.who==="enemy" ? "#ef4444" : "#ff8a80",
              textShadow:`0 0 16px ${dmgPopup.who==="enemy"?"#ef4444":"#ff4444"}`,
              animation:"dmgFloat .85s ease forwards",
            }}>
              -{dmgPopup.val}
            </div>
          )}

          {/* Action label — center of arena */}
          {actionLabel && (
            <div style={{ position:"absolute",top:"50%",left:"50%",zIndex:45,pointerEvents:"none",whiteSpace:"nowrap",
              fontFamily:"Bangers,cursive",fontSize:14,letterSpacing:2,
              color:actionLabel.color,textShadow:`0 0 12px ${actionLabel.color}`,
              background:`${actionLabel.color}18`,border:`1px solid ${actionLabel.color}40`,
              borderRadius:10,padding:"4px 14px",
              animation:"labelPop .35s cubic-bezier(.34,1.56,.64,1) forwards, labelFade 1.4s ease .2s forwards",
            }}>
              {actionLabel.text}
            </div>
          )}

          {/* ─── ENEMY REVEAL BANNER ─── The key UX improvement */}
          {enemyReveal && (
            <div style={{
              position:"absolute",
              top: "6%",
              left:"50%",
              zIndex:60,
              transform:"translateX(-50%)",
              animation:"enemyTurn .3s ease forwards",
              display:"flex", alignItems:"center", gap:10,
              background:"linear-gradient(135deg,rgba(15,10,30,.97),rgba(25,15,40,.97))",
              border:`2px solid ${enemyReveal.color}55`,
              borderRadius:16, padding:"10px 16px",
              boxShadow:`0 8px 32px rgba(0,0,0,.6), 0 0 24px ${enemyReveal.color}22`,
              backdropFilter:"blur(12px)",
              minWidth: 200, maxWidth: "80vw",
            }}>
              {/* Enemy monster mini */}
              <div style={{ flexShrink:0 }}>
                <MonsterAvatar monstroId={enemyId} size={36} glow={enemyReveal.color} />
              </div>
              {/* Card info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color:enemyReveal.color,letterSpacing:2,marginBottom:2 }}>
                  {enemyDisplay.nome.toUpperCase()} JOGOU
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:18 }}>{enemyReveal.card.emoji}</span>
                  <span style={{ fontFamily:"Bangers,cursive",fontSize:16,color:"#e8f0ff",letterSpacing:1 }}>
                    {enemyReveal.card.nome}
                  </span>
                </div>
                {enemyReveal.card.desc && (
                  <div style={{ fontFamily:"Nunito,sans-serif",fontSize:9,color:"#8a95aa",marginTop:2,lineHeight:1.3 }}>
                    {enemyReveal.card.desc}
                  </div>
                )}
              </div>
              {/* Action badge */}
              <div style={{ flexShrink:0,fontFamily:"Bangers,cursive",fontSize:10,color:enemyReveal.color,letterSpacing:1,background:`${enemyReveal.color}18`,border:`1px solid ${enemyReveal.color}40`,borderRadius:8,padding:"3px 8px" }}>
                {enemyReveal.label}
              </div>
            </div>
          )}

          {/* Thinking dots */}
          {enemyThinking && !enemyReveal && (
            <div style={{ position:"absolute",top:"14%",left:"50%",transform:"translateX(-50%)",zIndex:50,display:"flex",alignItems:"center",gap:5,background:"rgba(10,14,28,.88)",border:"1px solid rgba(255,213,79,.2)",borderRadius:20,padding:"6px 14px" }}>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color:"#ffd54f",letterSpacing:1 }}>PENSANDO</span>
              {[0,140,280].map(d => (
                <div key={d} style={{ width:5,height:5,borderRadius:"50%",background:"#ffd54f",animation:`thinkDot .9s ${d}ms ease infinite` }} />
              ))}
            </div>
          )}

          {/* Flying card — player (bottom → center) */}
          {flyCard && flyWho==="player" && (
            <div style={{ position:"absolute",bottom:"6%",left:"50%",zIndex:40,
              animation: flyPhase==="in" ? "cardFlyUp .38s cubic-bezier(.34,1.2,.64,1) forwards" : "cardFadeOut .22s ease forwards",
            }}>
              <div style={{ transform:"scale(0.78)" }}><Carta carta={flyCard} sel={false} disabled /></div>
            </div>
          )}
          {/* Flying card — enemy (top → center) */}
          {flyCard && flyWho==="enemy" && (
            <div style={{ position:"absolute",top:"6%",left:"50%",zIndex:40,
              animation: flyPhase==="in" ? "cardFlyDn .38s cubic-bezier(.34,1.2,.64,1) forwards" : "cardFadeOut .22s ease forwards",
            }}>
              <div style={{ transform:"scale(0.78) scaleX(-1)" }}><Carta carta={flyCard} sel={false} disabled /></div>
            </div>
          )}

          {/* ─── Monsters ─── */}
          <div style={{ position:"relative",zIndex:5,width:"min(240px,72vw)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 6px" }}>

            {/* Player monster */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
              <div style={{ animation: playerAnim ? playerAnim : "idleFloat 3.4s ease-in-out infinite" }}>
                <MonsterAvatar monstroId={monstroP1} size={88} glow={p1Display.monstro.glow} />
              </div>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color:"#69f0ae",letterSpacing:1,opacity:0.75 }}>
                {p1Display.nome}
              </span>
            </div>

            {/* VS */}
            <div style={{ fontFamily:"Bangers,cursive",fontSize:20,color:"#ffd54f",flexShrink:0,animation:"vsGlow 2.5s ease-in-out infinite",textShadow:"0 0 10px rgba(255,213,79,.5)" }}>
              VS
            </div>

            {/* Enemy monster */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
              <div style={{ animation: enemyAnim ? enemyAnim : "enemyIdleFloat 3.4s ease-in-out infinite 0.8s" }}>
                <MonsterAvatar monstroId={enemyId} size={88} glow={enemyDisplay.monstro?.glow||"#ff4444"} />
              </div>
              <span style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color:"#ff8a80",letterSpacing:1,opacity:0.75 }}>
                {enemyDisplay.nome}
              </span>
            </div>
          </div>

          {/* Combo hint */}
          {cartaSel && !comboSel.length && isMyTurn && !gameOver && (
            <div style={{ position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",fontFamily:"Nunito,sans-serif",fontSize:10,color:"rgba(255,213,79,.6)",letterSpacing:1,whiteSpace:"nowrap",textAlign:"center" }}>
              💡 Toque outra carta igual para COMBO
            </div>
          )}
          {handCards.length === 0 && isMyTurn && !gameOver && (
            <div style={{ position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",fontFamily:"Bangers,cursive",fontSize:12,color:"#4a5568",letterSpacing:2,whiteSpace:"nowrap" }}>
              PASSE O TURNO ⏭
            </div>
          )}
        </div>

        {/* ══ TIMER ══ */}
        {isMyTurn && !gameOver && !mostraPoder && (
          <div style={{ display:"flex",justifyContent:"center",flexShrink:0,marginBottom:4 }}>
            <div style={{ display:"flex",alignItems:"center",gap:7,
              background:turnTimer<=10?"rgba(239,68,68,.08)":"rgba(0,229,255,.04)",
              border:`1.5px solid ${turnTimer<=10?"rgba(239,68,68,.35)":"rgba(0,229,255,.18)"}`,
              borderRadius:20,padding:"3px 14px",
              animation:turnTimer<=5?"timerPulse .5s infinite":"none",
            }}>
              <svg viewBox="0 0 20 20" width={14} height={14}>
                <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="2.5"/>
                <circle cx="10" cy="10" r="8" fill="none" stroke={turnTimer<=10?"#ef4444":"#00e5ff"} strokeWidth="2.5"
                  strokeDasharray={50.3} strokeDashoffset={50.3-(turnTimer/TURN_TIMER)*50.3}
                  strokeLinecap="round" transform="rotate(-90 10 10)"
                  style={{ transition:"stroke-dashoffset 1s linear" }}/>
              </svg>
              <span style={{ fontFamily:"'Courier New',monospace",fontSize:17,fontWeight:900,letterSpacing:2,
                color:turnTimer<=10?"#ef4444":"#00e5ff",
                textShadow:turnTimer<=10?"0 0 8px #ef4444":"none",minWidth:26,textAlign:"center",
              }}>
                {String(turnTimer).padStart(2,"0")}
              </span>
            </div>
          </div>
        )}

        {/* ══ ACTION BUTTONS ══ */}
        {!gameOver && (
          <div style={{ display:"flex",gap:8,flexShrink:0,marginBottom:5 }}>
            {comboSel.length === 2 ? (
              <BtnMain variant="ember" disabled={!isMyTurn||loading||!canCombo} onClick={jogarCombo} style={{ flex:2,fontSize:18 }}>
                ⚡ COMBO! ({comboEnergy}⚡)
              </BtnMain>
            ) : (
              <BtnMain
                variant={cartaSel && canPlay ? "gold" : "dark"}
                disabled={!cartaSel||!isMyTurn||loading||!canPlay}
                onClick={jogarCarta}
                style={{ flex:2,fontSize:18 }}
              >
                {!isMyTurn         ? "AGUARDANDO..." :
                 !cartaSel         ? "ESCOLHA UMA CARTA" :
                 !canPlay          ? `SEM ENERGIA (${myEnergia}/${cartaSel.custo||1}⚡)` :
                                     `JOGAR (${cartaSel.custo||1}⚡)`}
              </BtnMain>
            )}
            <BtnMain variant="dark" disabled={!isMyTurn||loading} onClick={handlePassar} style={{ flex:1,fontSize:22 }} title="Encerra turno e compra 3 cartas">
              ⏭
            </BtnMain>
          </div>
        )}

        {/* ══ GAME OVER ══ */}
        {gameOver && (
          <div style={{ textAlign:"center",padding:"10px 0",flexShrink:0 }}>
            <div style={{ fontFamily:"Bangers,cursive",fontSize:32,letterSpacing:2,
              color:serverState.vencedor===slotLocal?"#69f0ae":"#ef5350",
              textShadow:"0 0 20px currentColor",
              animation:"victoryIn .65s cubic-bezier(.34,1.56,.64,1) forwards",
            }}>
              {serverState.vencedor===slotLocal ? "🏆  VITÓRIA!" : "💀  DERROTA!"}
            </div>
            <BtnMain variant="gold" onClick={() => onFim(serverState.vencedor===slotLocal?p1Display:null,bStats)} style={{ marginTop:10 }}>
              CONTINUAR →
            </BtnMain>
          </div>
        )}

        {/* ══ HAND ══ */}
        {!gameOver && (
          <div style={{ display:"flex",gap:5,overflowX:"auto",overflowY:"hidden",padding:"2px 2px 4px",flexShrink:0,
            justifyContent:handCards.length<=4?"center":"flex-start",
            WebkitOverflowScrolling:"touch",scrollbarWidth:"none" }}>
            {handCards.map((c: any, i: number) => (
              <div key={c.id} style={{ animation:`newCardIn .25s ${i*40}ms cubic-bezier(.34,1.56,.64,1) both`,flexShrink:0 }}>
                <Carta
                  carta={c}
                  sel={cartaSel?.id===c.id || comboSel.some(cs=>cs.id===c.id)}
                  onClick={() => selCarta(c)}
                  disabled={!isMyTurn||loading}
                  mini
                />
              </div>
            ))}
          </div>
        )}

        {/* ══ PLAYER HP + ENERGY ══ */}
        <div style={{ flexShrink:0,animation:hitPlayer?"hitShake .4s ease":"none",marginTop:2 }}>
          <HpBar jog={p1Display} />
        </div>
        <div style={{ flexShrink:0,marginTop:3 }}>
          <EnergyBar energia={myEnergia} max={6} isMyTurn={isMyTurn} />
        </div>
      </div>

      {/* ══ CARD DROP TOAST ══ */}
      {cardDropped && (
        <div style={{ position:"fixed",bottom:90,left:"50%",zIndex:300,animation:"dropIn .5s cubic-bezier(.34,1.56,.64,1) forwards",
          background:"linear-gradient(135deg,#1a1a3e,#0d0d1f)",
          border:"2px solid rgba(255,213,79,.5)",borderRadius:16,padding:"12px 20px",
          textAlign:"center",minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,.55),0 0 24px rgba(255,213,79,.2)",
        }}>
          <div style={{ fontFamily:"Bangers,cursive",fontSize:10,color:"#ffd54f",letterSpacing:2,marginBottom:5 }}>🎴 CARTA CONQUISTADA!</div>
          <div style={{ fontSize:28 }}>{cardDropped.emoji}</div>
          <div style={{ fontFamily:"Nunito,sans-serif",fontSize:12,color:"#e8f0ff",marginTop:4,fontWeight:700 }}>{cardDropped.nome}</div>
          <div style={{ fontFamily:"Oswald,sans-serif",fontSize:8,color:"#ffd54f",marginTop:2,letterSpacing:1 }}>{(cardDropped.raridade||"COMUM").toUpperCase()}</div>
        </div>
      )}

      {mostraPoder && <ModalPoder onEscolha={escolherPoder} />}
      {showTutorial && <InteractiveTutorial onComplete={() => { setShowTutorial(false); localStorage.setItem("beast_tutorial_done","1"); }} />}
      {modo === "multi" && sid && <BattleChat sessionId={sid} slotLocal={slotLocal} />}
    </div>
  );
}
