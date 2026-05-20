import React, { useState, useEffect, useRef, useCallback } from "react";
import { MONSTROS, PODERES, type CartaData } from "@/game/data";
import BattleIntro from "@/components/game/BattleIntro";
import { criarJ, type Jogador, type LogEntry } from "@/game/engine";
import { criarSessao, ouvirSessao, fecharCanal, type GameSession } from "@/game/multiplayer";
import { initGame, choosePower, playCard, passTurn, comboCards, saveCardDrop } from "@/game/serverApi";
import { falar, markGesture, criarFalaGesture } from "@/game/voice";
import { sfxAtaque, sfxDefesa, sfxEvolucao, sfxSwarm, sfxCura, sfxExplode, sfxTap, sfxPassar, sfxPoder, sfxVitoria, sfxDerrota } from "@/game/sfx";
import { pageBg } from "@/game/styles";
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
  cardsPlayed: number;
  healsUsed: number;
  evolutions: number;
  damageDealt: number;
  defenseCards: number;
}

interface TelaBatalhaProps {
  modo: string;
  monstroP1: string;
  nomeJogador?: string;
  salaId?: string | null;
  slotLocal?: number;
  onFim: (vencedor: Jogador | null, stats: BattleStats) => void;
  dificuldade?: string;
  aiMonstroId?: string;
  skipPowerSelect?: boolean;
  lastPowerId?: string;
  onPowerChosen?: (powerId: string) => void;
  userId?: string;
}

/* ─── Action event for sequenced animation ─── */
interface ActionEvent {
  who: "player" | "enemy";
  type: string;
  card?: CartaData;
  dmg?: number;
  label?: string;
}

const TURN_TIMER = 30;

/* ══════════════════════════════════════════════════════════
   TELA BATALHA — Perfect Card Game UX
   Design principle: every action has a clear visual sequence:
   1. Card flies to arena  →  2. Monster reacts  →  3. Damage/effect shows  →  4. Turn resolves
══════════════════════════════════════════════════════════ */
export default function TelaBatalha({
  modo, monstroP1, nomeJogador = "Você", salaId, slotLocal = 0,
  onFim, dificuldade = "medio", aiMonstroId, skipPowerSelect,
  lastPowerId, onPowerChosen, userId,
}: TelaBatalhaProps) {
  const [mostraPoder, setMostraPoder] = useState(!skipPowerSelect);
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [cartaSel, setCartaSel] = useState<CartaData | null>(null);
  const [comboSel, setComboSel] = useState<CartaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const [turnTimer, setTurnTimer] = useState(TURN_TIMER);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBattleIntro, setShowBattleIntro] = useState(true);
  const [bStats, setBStats] = useState<BattleStats>({ cardsPlayed: 0, healsUsed: 0, evolutions: 0, damageDealt: 0, defenseCards: 0 });
  const [cardDropped, setCardDropped] = useState<any | null>(null);

  // Visual state
  const [screenFlash, setScreenFlash] = useState<string | null>(null);     // color flash overlay
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particleType, setParticleType] = useState("ataque");
  const [playerAnim, setPlayerAnim] = useState("");                          // CSS animation name
  const [enemyAnim, setEnemyAnim] = useState("");
  const [flyCard, setFlyCard] = useState<CartaData | null>(null);           // card flying to arena
  const [flyWho, setFlyWho] = useState<"player" | "enemy">("player");
  const [actionLabel, setActionLabel] = useState<{text: string; color: string; who: "player" | "enemy"} | null>(null);
  const [dmgPopup, setDmgPopup] = useState<{val: number; who: "player" | "enemy"} | null>(null);
  const [hitPlayer, setHitPlayer] = useState(false);
  const [hitEnemy, setHitEnemy] = useState(false);
  const [enemyThinking, setEnemyThinking] = useState(false);               // "..." indicator

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(salaId || null);
  const battleIdRef = useRef<string>("");
  const animQueueRef = useRef<ActionEvent[]>([]);
  const animBusyRef = useRef(false);

  /* ── Init ── */
  useEffect(() => {
    const bid = `battle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
          { slot: slotLocal, nome: nomeJogador, monstroId: monstroP1 },
        ], dificuldade, aiMonstroId);
        if (!sid && result.sessionId) sid = result.sessionId;
        sessionIdRef.current = sid!;
        setServerState(result.state);
        if (skipPowerSelect && lastPowerId) {
          const pr = await choosePower(sid!, slotLocal, lastPowerId);
          setServerState(pr.state);
          sfxPoder();
          startBattleMusic();
        }
      } catch (err) { console.error("Init error:", err); }
    }
    init();
  }, []);

  useEffect(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const channel = ouvirSessao(sid, (session: GameSession) => {
      if (session.state_json && typeof session.state_json === "object") {
        const ns = session.state_json as unknown as ServerState;
        setServerState(ns);
        if (ns.lastPlayedCard && ns.lastPlayedBy !== slotLocal) {
          playActionSequence([{ who: "enemy", type: ns.lastPlayedCard.tipo || "ataque", card: ns.lastPlayedCard }]);
        }
      }
    });
    return () => fecharCanal(channel);
  }, [sessionIdRef.current]);

  /* ── Turn timer ── */
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!serverState || serverState.fase !== "acao" || mostraPoder) { setTurnTimer(TURN_TIMER); return; }
    setTurnTimer(TURN_TIMER);
    timerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); handlePassar(); return TURN_TIMER; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [serverState?.fase, serverState?.turno, mostraPoder]);

  /* ── Sequenced action animation system ── */
  function playActionSequence(events: ActionEvent[]) {
    animQueueRef.current = [...animQueueRef.current, ...events];
    if (!animBusyRef.current) drainQueue();
  }

  function drainQueue() {
    if (animQueueRef.current.length === 0) { animBusyRef.current = false; return; }
    animBusyRef.current = true;
    const evt = animQueueRef.current.shift()!;
    playOneAction(evt, () => {
      setTimeout(() => drainQueue(), 120);
    });
  }

  function playOneAction(evt: ActionEvent, done: () => void) {
    const bid = battleIdRef.current;
    const isEnemy = evt.who === "enemy";

    // 1. Show card flying to arena
    if (evt.card) {
      setFlyCard(evt.card);
      setFlyWho(evt.who);
    }

    // 2. After card lands (300ms) — monster animation + label + flash
    setTimeout(() => {
      setFlyCard(null);

      const animMap: Record<string, string> = {
        ataque: isEnemy ? "enemyAttack" : "monsterAttack",
        defesa: isEnemy ? "enemyDefend" : "monsterDefend",
        cura: isEnemy ? "enemyHeal" : "monsterHeal",
        evolucao: isEnemy ? "enemyEvolve" : "monsterEvolve",
        swarm: isEnemy ? "enemySwarm" : "monsterSwarm",
      };
      const anim = animMap[evt.type] || (isEnemy ? "enemyAttack" : "monsterAttack");
      if (isEnemy) setEnemyAnim(anim); else setPlayerAnim(anim);

      // Action label
      const labelMap: Record<string, {text: string; color: string}> = {
        ataque: { text: "⚔️ ATAQUE!", color: "#ef4444" },
        defesa: { text: "🛡️ DEFESA!", color: "#3b82f6" },
        cura:   { text: "💚 CURA!",   color: "#34d399" },
        evolucao: { text: "⭐ EVOLUÇÃO!", color: "#ffd54f" },
        swarm:  { text: "🐾 SWARM!",  color: "#a78bfa" },
        desafio:{ text: "⚡ ESPECIAL!",color: "#ffd54f" },
      };
      const lbl = labelMap[evt.type];
      if (lbl) setActionLabel({ ...lbl, who: evt.who });

      // Screen flash
      const flashMap: Record<string, string> = {
        ataque: "#ef444430", defesa: "#3b82f630",
        cura: "#34d39930",   evolucao: "#ffd54f30",
      };
      if (flashMap[evt.type]) {
        setScreenFlash(flashMap[evt.type]);
        battleTimeout(() => ifBattleActive(bid, () => setScreenFlash(null)), 500, bid);
      }

      // Particles
      setParticleType(evt.type === "cura" ? "cura" : evt.type === "defesa" ? "defesa" : evt.type === "evolucao" ? "evolucao" : "ataque");
      setParticleTrigger(t => t + 1);

      // Damage popup + screen shake
      if (evt.dmg && evt.dmg > 0) {
        setDmgPopup({ val: evt.dmg, who: evt.who === "enemy" ? "player" : "enemy" });
        if (evt.who === "enemy") setHitPlayer(true); else setHitEnemy(true);
        battleTimeout(() => ifBattleActive(bid, () => {
          setDmgPopup(null);
          setHitPlayer(false);
          setHitEnemy(false);
        }), 700, bid);
      }

      // SFX
      if (evt.type === "ataque") {
        if (evt.card?.esp === "explode") { sfxExplode(); hapticExplosion(); }
        else { sfxAtaque(); hapticHeavy(); }
      }
      else if (evt.type === "defesa") { sfxDefesa(); hapticMedium(); }
      else if (evt.type === "cura")   { sfxCura(); hapticLight(); }
      else if (evt.type === "evolucao") { sfxEvolucao(); hapticSuccess(); }
      else if (evt.type === "swarm")  { sfxSwarm(); hapticLight(); }

    }, evt.card ? 300 : 0);

    // 3. Clear animations after action
    const totalDuration = (evt.card ? 300 : 0) + 1200;
    battleTimeout(() => ifBattleActive(bid, () => {
      if (isEnemy) setEnemyAnim(""); else setPlayerAnim("");
      setActionLabel(null);
      done();
    }), totalDuration, bid);
  }

  const sid = sessionIdRef.current;

  /* ── Power select ── */
  async function escolherPoder(pid: string) {
    if (!sid) return;
    markGesture();
    const bid = battleIdRef.current;
    const speak = criarFalaGesture(bid);
    setMostraPoder(false);
    setLoading(true);
    try {
      const result = await choosePower(sid, slotLocal, pid);
      setServerState(result.state);
      sfxPoder();
      startBattleMusic();
      speak(`Poder ${PODERES[pid].nome} escolhido. Que comece a batalha.`);
      onPowerChosen?.(pid);
    } catch (err) { console.error("Power error:", err); }
    setLoading(false);
  }

  /* ── Card select ── */
  function selCarta(carta: CartaData) {
    if (serverState?.fase !== "acao" || loading) return;
    const inCombo = comboSel.find(c => c.id === carta.id);
    if (inCombo) {
      setComboSel(comboSel.filter(c => c.id !== carta.id));
      if (comboSel.length === 1) setCartaSel(null);
      sfxTap();
      return;
    }
    const comboTypes = ["ataque", "defesa", "cura"];
    const isSpecial = (c: CartaData) => Boolean(c.esp) || !["ataque","defesa","cura"].includes(c.tipo);
    if (cartaSel && cartaSel.id !== carta.id && cartaSel.tipo === carta.tipo &&
        comboTypes.includes(carta.tipo) && !isSpecial(cartaSel) && !isSpecial(carta)) {
      setComboSel([cartaSel, carta]);
      setCartaSel(null);
      sfxTap(); hapticLight();
      falar(`Combo! ${cartaSel.nome} mais ${carta.nome}`, false, battleIdRef.current);
      return;
    }
    const deselect = cartaSel?.id === carta.id;
    setCartaSel(deselect ? null : carta);
    setComboSel([]);
    if (!deselect) { sfxTap(); hapticLight(); }
  }

  /* ── Process AI events into animation queue ── */
  function processAIEvents(events: any[], mySlot: number) {
    const bid = battleIdRef.current;
    for (const evt of events) {
      if (evt.type === "ai_played" && evt.carta) {
        setEnemyThinking(false);
        const dmgEntry = (serverState?.log || []).slice(-3).find((l: any) => l.t === "dano" && l.dmg);
        playActionSequence([{
          who: "enemy",
          type: evt.tipo || evt.carta.tipo || "ataque",
          card: evt.carta,
          dmg: dmgEntry?.dmg,
        }]);
      }
    }
  }

  /* ── Play card ── */
  async function jogarCarta() {
    if (!cartaSel || !sid || loading) return;
    const energyNeeded = cartaSel.custo || 1;
    const myPlayer = serverState?.players?.[slotLocal];
    if ((myPlayer?.energia ?? 0) < energyNeeded) return;

    markGesture();
    const bid = battleIdRef.current;
    const speak = criarFalaGesture(bid);
    const cardCopy = { ...cartaSel };
    setLoading(true);

    // Immediate player animation — don't wait for server
    playActionSequence([{ who: "player", type: cardCopy.tipo || "ataque", card: cardCopy }]);

    setBStats(s => ({
      ...s,
      cardsPlayed: s.cardsPlayed + 1,
      healsUsed: s.healsUsed + (cardCopy.tipo === "cura" ? 1 : 0),
      evolutions: s.evolutions + (cardCopy.tipo === "evolucao" ? 1 : 0),
      defenseCards: s.defenseCards + (cardCopy.tipo === "defesa" ? 1 : 0),
    }));
    setCartaSel(null);
    setComboSel([]);

    try {
      const result = await playCard(sid, slotLocal, cardCopy.id);
      setServerState(result.state);

      // Extract damage from log
      const logs = result.state.log || [];
      const dmgLog = logs.slice(-6).find((l: any) => l.t === "dano" && l.dmg);
      if (dmgLog) {
        setBStats(s => ({ ...s, damageDealt: s.damageDealt + (dmgLog.dmg || 0) }));
        setHitEnemy(true);
        battleTimeout(() => ifBattleActive(bid, () => setHitEnemy(false)), 600, bid);
        setDmgPopup({ val: dmgLog.dmg, who: "enemy" });
        battleTimeout(() => ifBattleActive(bid, () => setDmgPopup(null)), 700, bid);
      }

      // Enemy actions — show thinking then action
      const aiPlayed = result.events?.find((e: any) => e.type === "ai_played");
      if (aiPlayed) {
        setTimeout(() => {
          setEnemyThinking(true);
          setTimeout(() => {
            setEnemyThinking(false);
            const aiDmgLog = (result.state.log || []).slice(-4).find((l: any) => l.t === "dano" && l.dmg);
            playActionSequence([{
              who: "enemy",
              type: aiPlayed.tipo || aiPlayed.carta?.tipo || "ataque",
              card: aiPlayed.carta,
              dmg: aiDmgLog?.dmg,
            }]);
            if (aiDmgLog) {
              setHitPlayer(true);
              setDmgPopup({ val: aiDmgLog.dmg, who: "player" });
              battleTimeout(() => ifBattleActive(bid, () => { setHitPlayer(false); setDmgPopup(null); }), 700, bid);
            }
          }, 600);
        }, 800);
      }

      // Card drop
      for (const evt of (result.events || [])) {
        if (evt.type === "card_drop" && evt.card && evt.slot === slotLocal) {
          setCardDropped(evt.card);
          if (userId) saveCardDrop(userId, evt.card).catch(console.error);
        }
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          setTimeout(() => ifBattleActive(bid, () => {
            if (winner === slotLocal) { sfxVitoria(); hapticSuccess(); }
            else { sfxDerrota(); hapticError(); }
          }), 1200);
          stopBattleMusic();
          setTimeout(() => onFim(winner === slotLocal ? { id: "p1" } as any : null, bStats), 1600);
        }
      }

      speak(`${cardCopy.nome}. ${aiPlayed ? `Adversário jogou ${aiPlayed.carta?.nome || "carta"}.` : ""}`);
    } catch (err) { console.error("Play error:", err); }
    setLoading(false);
  }

  /* ── Combo ── */
  async function jogarCombo() {
    if (comboSel.length !== 2 || !sid || loading) return;
    markGesture();
    const bid = battleIdRef.current;
    const speak = criarFalaGesture(bid);
    const [c1, c2] = comboSel;
    setLoading(true);
    playActionSequence([{ who: "player", type: c1.tipo || "ataque", card: c1 }]);
    setComboSel([]); setCartaSel(null);
    setBStats(s => ({ ...s, cardsPlayed: s.cardsPlayed + 2 }));
    try {
      const result = await comboCards(sid, slotLocal, c1.id, c2.id);
      setServerState(result.state);
      const dmgLog = (result.state.log || []).slice(-6).find((l: any) => l.t === "dano" && l.dmg);
      if (dmgLog) {
        setBStats(s => ({ ...s, damageDealt: s.damageDealt + dmgLog.dmg }));
        setDmgPopup({ val: dmgLog.dmg, who: "enemy" });
        setHitEnemy(true);
        battleTimeout(() => ifBattleActive(bid, () => { setDmgPopup(null); setHitEnemy(false); }), 700, bid);
      }
      const aiPlayed = result.events?.find((e: any) => e.type === "ai_played");
      if (aiPlayed) {
        setTimeout(() => {
          setEnemyThinking(true);
          setTimeout(() => {
            setEnemyThinking(false);
            const aiDmg = (result.state.log || []).slice(-4).find((l: any) => l.t === "dano" && l.dmg);
            playActionSequence([{ who: "enemy", type: aiPlayed.tipo || "ataque", card: aiPlayed.carta, dmg: aiDmg?.dmg }]);
            if (aiDmg) { setHitPlayer(true); setDmgPopup({ val: aiDmg.dmg, who: "player" }); battleTimeout(() => ifBattleActive(bid, () => { setHitPlayer(false); setDmgPopup(null); }), 700, bid); }
          }, 600);
        }, 800);
      }
      for (const evt of (result.events || [])) {
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          setTimeout(() => ifBattleActive(bid, () => { if (winner === slotLocal) sfxVitoria(); else sfxDerrota(); }), 1200);
          stopBattleMusic();
          setTimeout(() => onFim(winner === slotLocal ? { id: "p1" } as any : null, bStats), 1600);
        }
      }
      speak(`COMBO! ${c1.nome} mais ${c2.nome}!`);
    } catch (err) { console.error("Combo err:", err); setComboSel([]); }
    setLoading(false);
  }

  /* ── Pass ── */
  async function handlePassar() {
    if (!sid || loading) return;
    markGesture();
    const bid = battleIdRef.current;
    const speak = criarFalaGesture(bid);
    setLoading(true);
    setCartaSel(null);
    sfxPassar();
    try {
      const result = await passTurn(sid, slotLocal);
      setServerState(result.state);
      const aiPlayed = result.events?.find((e: any) => e.type === "ai_played");
      if (aiPlayed) {
        setTimeout(() => {
          setEnemyThinking(true);
          setTimeout(() => {
            setEnemyThinking(false);
            const aiDmg = (result.state.log || []).slice(-4).find((l: any) => l.t === "dano" && l.dmg);
            playActionSequence([{ who: "enemy", type: aiPlayed.tipo || "ataque", card: aiPlayed.carta, dmg: aiDmg?.dmg }]);
            if (aiDmg) { setHitPlayer(true); setDmgPopup({ val: aiDmg.dmg, who: "player" }); battleTimeout(() => ifBattleActive(bid, () => { setHitPlayer(false); setDmgPopup(null); }), 700, bid); }
          }, 600);
        }, 300);
      }
      for (const evt of (result.events || [])) {
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          setTimeout(() => ifBattleActive(bid, () => { if (winner === slotLocal) sfxVitoria(); else sfxDerrota(); }), 1200);
          stopBattleMusic();
          setTimeout(() => onFim(winner === slotLocal ? { id: "p1" } as any : null, bStats), 1600);
        }
      }
      speak(`Turno ${(result.state.turno || 0) + 1}.`);
    } catch (err) { console.error("Pass error:", err); }
    setLoading(false);
  }

  const handleIntroDone = useCallback(() => setShowBattleIntro(false), []);

  /* ─── Loading ─── */
  if (!serverState) {
    return (
      <div style={{ ...pageBg(), display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <ChromeNoise />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, border: "3px solid rgba(0,229,255,.2)", borderTopColor: "#00e5ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontFamily: "Bangers, cursive", fontSize: 18, color: "#00e5ff", letterSpacing: 2 }}>CARREGANDO...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
      id: raw.id || fallbackId, nome: raw.nome || fallbackNome, humano,
      monstro: { ...raw.monstro, bg1: raw.monstro?.bg1 || md.bg1, bg2: raw.monstro?.bg2 || md.bg2, glow: raw.monstro?.glow || md.glow, habD: raw.monstro?.habD || md.habD },
      hp: raw.hp || 0, maxHp: raw.maxHp || 100,
      mao: raw.mao || [], defAtiva: raw.defAtiva || 0,
      imune: raw.imune || false, dobra: raw.dobra || false, dodgeOnce: raw.dodgeOnce || false,
      swarms: raw.swarms || [null, null],
    };
  };

  const p1Display = buildJog(myPlayer, "p1", "Você", true);
  const enemyDisplay = buildJog(opponent, "p2", "Adversário", false);
  const enemyMonstroId = opponent?.monstro?.id || aiMonstroId || "panther";
  const handCards: CartaData[] = myPlayer?.mao || [];
  const isMyTurn = serverState.fase === "acao";
  const gameOver = serverState.fase === "resultado";
  const myEnergia = myPlayer?.energia ?? 3;
  const canPlay = !cartaSel || myEnergia >= (cartaSel.custo || 1);

  if (showBattleIntro && !skipPowerSelect) {
    return <BattleIntro monstroP1={monstroP1} monstroP2={enemyMonstroId} nomeP1={nomeJogador} nomeP2={enemyDisplay.nome} onDone={handleIntroDone} />;
  }

  /* ─── Render ─── */
  return (
    <div style={pageBg()}>
      {/* ── CSS animations ── */}
      <style>{`
        @keyframes monsterAttack  { 0%{transform:scale(1) translateY(0)} 25%{transform:scale(1.18) translateY(-12px) translateX(18px)} 55%{transform:scale(1.22) translateX(-14px) translateY(-8px)} 80%{transform:scale(1.1) translateY(-6px)} 100%{transform:scale(1) translateY(0)} }
        @keyframes monsterDefend  { 0%{transform:scale(1);filter:brightness(1)} 30%{transform:scale(1.08);filter:brightness(1.5) drop-shadow(0 0 24px #3b82f6)} 70%{transform:scale(1.08);filter:brightness(1.5) drop-shadow(0 0 24px #3b82f6)} 100%{transform:scale(1);filter:brightness(1)} }
        @keyframes monsterHeal    { 0%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.12);filter:brightness(1.6) drop-shadow(0 0 28px #34d399)} 100%{transform:scale(1);filter:brightness(1)} }
        @keyframes monsterEvolve  { 0%{transform:scale(1) rotate(0deg);filter:brightness(1)} 30%{transform:scale(0.88) rotate(-6deg);filter:brightness(0.7)} 60%{transform:scale(1.35) rotate(6deg);filter:brightness(2) drop-shadow(0 0 32px #ffd54f)} 80%{transform:scale(1.15) rotate(-2deg);filter:brightness(1.4)} 100%{transform:scale(1) rotate(0deg);filter:brightness(1)} }
        @keyframes monsterSwarm   { 0%{transform:scale(1)} 30%{transform:scale(1.14) translateY(-10px)} 60%{transform:scale(1.07) translateY(-5px)} 100%{transform:scale(1) translateY(0)} }
        @keyframes enemyAttack    { 0%{transform:scaleX(-1) scale(1) translateY(0)} 25%{transform:scaleX(-1) scale(1.18) translateY(-12px) translateX(18px)} 55%{transform:scaleX(-1) scale(1.22) translateX(-14px) translateY(-8px)} 80%{transform:scaleX(-1) scale(1.1) translateY(-6px)} 100%{transform:scaleX(-1) scale(1) translateY(0)} }
        @keyframes enemyDefend    { 0%{transform:scaleX(-1) scale(1);filter:brightness(1)} 30%{transform:scaleX(-1) scale(1.08);filter:brightness(1.5) drop-shadow(0 0 24px #3b82f6)} 70%{transform:scaleX(-1) scale(1.08);filter:brightness(1.5) drop-shadow(0 0 24px #3b82f6)} 100%{transform:scaleX(-1) scale(1);filter:brightness(1)} }
        @keyframes enemyHeal      { 0%{transform:scaleX(-1) scale(1);filter:brightness(1)} 50%{transform:scaleX(-1) scale(1.12);filter:brightness(1.6) drop-shadow(0 0 28px #34d399)} 100%{transform:scaleX(-1) scale(1);filter:brightness(1)} }
        @keyframes enemyEvolve    { 0%{transform:scaleX(-1) scale(1) rotate(0deg);filter:brightness(1)} 30%{transform:scaleX(-1) scale(0.88) rotate(6deg);filter:brightness(0.7)} 60%{transform:scaleX(-1) scale(1.35) rotate(-6deg);filter:brightness(2) drop-shadow(0 0 32px #ffd54f)} 80%{transform:scaleX(-1) scale(1.15) rotate(2deg);filter:brightness(1.4)} 100%{transform:scaleX(-1) scale(1) rotate(0deg);filter:brightness(1)} }
        @keyframes enemySwarm     { 0%{transform:scaleX(-1) scale(1)} 30%{transform:scaleX(-1) scale(1.14) translateY(-10px)} 60%{transform:scaleX(-1) scale(1.07) translateY(-5px)} 100%{transform:scaleX(-1) scale(1) translateY(0)} }
        @keyframes monsterIdle    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes enemyIdle      { 0%,100%{transform:scaleX(-1) translateY(0)} 50%{transform:scaleX(-1) translateY(-5px)} }
        @keyframes shakeX         { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 50%{transform:translateX(10px)} 80%{transform:translateX(-6px)} }
        @keyframes flyFromBottom  { 0%{opacity:0;transform:translateY(60px) scale(0.7)} 60%{opacity:1;transform:translateY(-8px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes flyFromTop     { 0%{opacity:0;transform:translateY(-60px) scale(0.7)} 60%{opacity:1;transform:translateY(8px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes flyOut         { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0.5) translateY(-30px)} }
        @keyframes dmgPop         { 0%{opacity:1;transform:translateY(0) scale(1)} 60%{opacity:1;transform:translateY(-24px) scale(1.2)} 100%{opacity:0;transform:translateY(-40px) scale(0.9)} }
        @keyframes labelPop       { 0%{opacity:0;transform:scale(0.5)} 40%{opacity:1;transform:scale(1.15)} 70%{transform:scale(0.95)} 100%{opacity:1;transform:scale(1)} }
        @keyframes labelFade      { 0%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
        @keyframes thinkDot       { 0%,80%,100%{transform:scale(0);opacity:0} 40%{transform:scale(1);opacity:1} }
        @keyframes arenaGlow      { 0%,100%{box-shadow:inset 0 0 30px rgba(0,229,255,.06)} 50%{box-shadow:inset 0 0 60px rgba(0,229,255,.12)} }
        @keyframes vsFlash        { 0%,100%{text-shadow:0 0 8px rgba(255,213,79,.4)} 50%{text-shadow:0 0 22px rgba(255,213,79,.9),0 0 44px rgba(255,213,79,.4)} }
        @keyframes timerPulse     { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes cardIn         { from{opacity:0;transform:translateY(18px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes flashOverlay   { 0%{opacity:0.7} 100%{opacity:0} }
        @keyframes cardDropIn     { 0%{opacity:0;transform:translateX(-50%) scale(0.6) translateY(20px)} 60%{transform:translateX(-50%) scale(1.06) translateY(-4px)} 100%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)} }
      `}</style>

      {/* ── Screen flash overlay ── */}
      {screenFlash && (
        <div key={Date.now()} style={{ position: "fixed", inset: 0, zIndex: 90, pointerEvents: "none", background: screenFlash, animation: "flashOverlay .55s ease forwards" }} />
      )}

      <ChromeNoise />
      <CombatParticles type={particleType} trigger={particleTrigger} />

      <div style={{ position: "relative", zIndex: 1, height: "100dvh", display: "flex", flexDirection: "column", padding: "8px 10px 6px", fontFamily: "Nunito, sans-serif", overflow: "hidden", boxSizing: "border-box" }}>

        {/* ══ TOP: Mute + Turn status ══ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "Bangers, cursive", fontSize: 11, color: "#00e5ff", letterSpacing: 2 }}>
              TURNO {(serverState.turno || 0) + 1}
            </span>
            {!gameOver && (
              <span style={{
                fontFamily: "Oswald, sans-serif", fontSize: 9, letterSpacing: 1.5, padding: "2px 7px", borderRadius: 20,
                background: isMyTurn ? "rgba(105,240,174,.12)" : "rgba(255,213,79,.1)",
                border: `1px solid ${isMyTurn ? "rgba(105,240,174,.3)" : "rgba(255,213,79,.3)"}`,
                color: isMyTurn ? "#69f0ae" : "#ffd54f",
                animation: !isMyTurn ? "timerPulse 1.2s infinite" : "none",
              }}>
                {isMyTurn ? "SUA VEZ" : "ADVERSÁRIO..."}
              </span>
            )}
            {loading && <span style={{ width: 12, height: 12, border: "2px solid rgba(255,152,0,.3)", borderTopColor: "#ff9800", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />}
          </div>
          <button onClick={() => { const m = toggleMuted(); setMuted(m); if (m) stopBattleMusic(); else startBattleMusic(); }}
            style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* ══ ENEMY HP ══ */}
        <div style={{ flexShrink: 0, animation: hitEnemy ? "shakeX .4s ease" : "none", marginBottom: 2 }}>
          <HpBar jog={enemyDisplay} inimigo hit={hitEnemy} />
        </div>

        {/* ══ ARENA ══ */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, overflow: "visible" }}>

          {/* Arena octagon */}
          <div style={{
            position: "absolute",
            width: "min(260px, 76vw)", height: "min(260px, 76vw)",
            clipPath: "polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)",
            background: "linear-gradient(180deg, rgba(0,229,255,.02),rgba(0,0,0,.25),rgba(0,229,255,.02))",
            animation: "arenaGlow 3s ease-in-out infinite",
          }} />

          {/* Damage popup */}
          {dmgPopup && (
            <div style={{
              position: "absolute",
              top: dmgPopup.who === "enemy" ? "20%" : "60%",
              left: dmgPopup.who === "enemy" ? "65%" : "30%",
              zIndex: 50, pointerEvents: "none",
              fontFamily: "Bangers, cursive",
              fontSize: 28,
              color: dmgPopup.who === "enemy" ? "#ef4444" : "#ff8a80",
              textShadow: `0 0 12px ${dmgPopup.who === "enemy" ? "#ef4444" : "#ff4444"}`,
              animation: "dmgPop .7s ease forwards",
              letterSpacing: 1,
            }}>
              -{dmgPopup.val}
            </div>
          )}

          {/* Action label — centered floating */}
          {actionLabel && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 40, pointerEvents: "none",
              fontFamily: "Bangers, cursive", fontSize: 16, letterSpacing: 2,
              color: actionLabel.color,
              textShadow: `0 0 16px ${actionLabel.color}`,
              background: `${actionLabel.color}18`,
              border: `1px solid ${actionLabel.color}40`,
              borderRadius: 10, padding: "4px 14px",
              animation: "labelPop .35s cubic-bezier(.34,1.56,.64,1) forwards, labelFade 1.2s ease .3s forwards",
              whiteSpace: "nowrap",
            }}>
              {actionLabel.text}
            </div>
          )}

          {/* Flying card — player plays */}
          {flyCard && flyWho === "player" && (
            <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 35, animation: "flyFromBottom .35s cubic-bezier(.34,1.2,.64,1) forwards" }}>
              <div style={{ opacity: 0.85, transform: "scale(0.8)" }}>
                <Carta carta={flyCard} sel={false} disabled />
              </div>
            </div>
          )}

          {/* Flying card — enemy plays */}
          {flyCard && flyWho === "enemy" && (
            <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 35, animation: "flyFromTop .35s cubic-bezier(.34,1.2,.64,1) forwards" }}>
              <div style={{ opacity: 0.85, transform: "scale(0.8) scaleX(-1)" }}>
                <Carta carta={flyCard} sel={false} disabled />
              </div>
            </div>
          )}

          {/* Monsters */}
          <div style={{ position: "relative", zIndex: 5, width: "min(260px, 76vw)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }}>

            {/* Player monster */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ animation: playerAnim ? `${playerAnim} 1.2s ease forwards` : "monsterIdle 3s ease-in-out infinite" }}>
                <MonsterAvatar monstroId={monstroP1} size={84} glow={p1Display.monstro.glow} />
              </div>
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#69f0ae", letterSpacing: 1, opacity: 0.8 }}>
                {p1Display.nome}
              </span>
            </div>

            {/* VS + enemy thinking */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{ fontFamily: "Bangers, cursive", fontSize: 18, color: "#ffd54f", animation: "vsFlash 2.2s ease-in-out infinite", textShadow: "0 0 10px rgba(255,213,79,.5)" }}>VS</div>
              {enemyThinking && (
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[0, 150, 300].map(delay => (
                    <div key={delay} style={{ width: 5, height: 5, borderRadius: "50%", background: "#ffd54f", animation: `thinkDot 1s ${delay}ms ease infinite` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Enemy monster */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ animation: enemyAnim ? `${enemyAnim} 1.2s ease forwards` : "enemyIdle 3s ease-in-out infinite 0.6s" }}>
                <MonsterAvatar monstroId={enemyMonstroId} size={84} glow={enemyDisplay.monstro?.glow || "#ff4444"} />
              </div>
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#ff8a80", letterSpacing: 1, opacity: 0.8 }}>
                {enemyDisplay.nome}
              </span>
            </div>
          </div>

          {/* Empty hand hint */}
          {handCards.length === 0 && !gameOver && isMyTurn && (
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", fontFamily: "Bangers, cursive", fontSize: 13, color: "#4a5568", letterSpacing: 2, whiteSpace: "nowrap" }}>
              PASSE O TURNO ⏭
            </div>
          )}
        </div>

        {/* ══ TIMER ══ */}
        {isMyTurn && !gameOver && !mostraPoder && (
          <div style={{ display: "flex", justifyContent: "center", flexShrink: 0, marginBottom: 3 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: turnTimer <= 10 ? "rgba(239,68,68,.1)" : "rgba(0,229,255,.05)",
              border: `1.5px solid ${turnTimer <= 10 ? "rgba(239,68,68,.4)" : "rgba(0,229,255,.2)"}`,
              borderRadius: 20, padding: "3px 12px",
              animation: turnTimer <= 5 ? "timerPulse .5s infinite" : "none",
            }}>
              <div style={{ position: "relative", width: 14, height: 14 }}>
                <svg viewBox="0 0 20 20" width={14} height={14} style={{ position: "absolute", top: 0, left: 0 }}>
                  <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="2.5" />
                  <circle cx="10" cy="10" r="8" fill="none" stroke={turnTimer <= 10 ? "#ef4444" : "#00e5ff"} strokeWidth="2.5"
                    strokeDasharray={50.3} strokeDashoffset={50.3 - (turnTimer / TURN_TIMER) * 50.3}
                    strokeLinecap="round" transform="rotate(-90 10 10)" style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
              </div>
              <span style={{ fontFamily: "'Courier New',monospace", fontSize: 16, fontWeight: 900, letterSpacing: 2, color: turnTimer <= 10 ? "#ef4444" : "#00e5ff", textShadow: turnTimer <= 10 ? "0 0 8px #ef4444" : "none", minWidth: 28, textAlign: "center" }}>
                {String(turnTimer).padStart(2, "0")}
              </span>
            </div>
          </div>
        )}

        {/* ══ ACTION BUTTONS ══ */}
        {!gameOver && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginBottom: 5 }}>
            {comboSel.length === 2 ? (
              <BtnMain variant="gold" disabled={!isMyTurn || loading} onClick={jogarCombo} style={{ flex: 2 }}>
                ⚡ COMBO! ({(comboSel[0].custo || 1) + (comboSel[1].custo || 1)}⚡)
              </BtnMain>
            ) : (
              <BtnMain
                variant={cartaSel && canPlay ? "gold" : "dark"}
                disabled={!cartaSel || !isMyTurn || loading || !canPlay}
                onClick={jogarCarta}
                style={{ flex: 2 }}
              >
                {cartaSel
                  ? canPlay ? `JOGAR (${cartaSel.custo || 1}⚡)` : `SEM ENERGIA (${cartaSel.custo || 1}⚡)`
                  : isMyTurn ? "↓ ESCOLHA UMA CARTA" : "AGUARDANDO..."}
              </BtnMain>
            )}
            <BtnMain variant="dark" disabled={!isMyTurn || loading} onClick={handlePassar} style={{ flex: 1 }}>
              ⏭
            </BtnMain>
          </div>
        )}

        {/* ══ GAME OVER ══ */}
        {gameOver && (
          <div style={{ textAlign: "center", padding: "10px 0", flexShrink: 0 }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 30, color: serverState.vencedor === slotLocal ? "#69f0ae" : "#ef5350", textShadow: "0 0 20px currentColor", animation: "labelPop .5s cubic-bezier(.34,1.56,.64,1) forwards" }}>
              {serverState.vencedor === slotLocal ? "🏆 VITÓRIA!" : "💀 DERROTA!"}
            </div>
            <BtnMain variant="gold" onClick={() => onFim(serverState.vencedor === slotLocal ? p1Display : null, bStats)} style={{ marginTop: 10 }}>
              CONTINUAR →
            </BtnMain>
          </div>
        )}

        {/* ══ HAND ══ */}
        {!gameOver && (
          <div style={{ display: "flex", gap: 5, overflowX: "auto", overflowY: "hidden", padding: "2px 2px 4px", flexShrink: 0, justifyContent: handCards.length <= 4 ? "center" : "flex-start", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {handCards.map((c: any, i: number) => (
              <div key={c.id} style={{ animation: `cardIn .25s ${i * 40}ms ease both`, flexShrink: 0 }}>
                <Carta
                  carta={c}
                  sel={cartaSel?.id === c.id || comboSel.some(cs => cs.id === c.id)}
                  onClick={() => selCarta(c)}
                  disabled={!isMyTurn || loading}
                  mini
                />
              </div>
            ))}
          </div>
        )}

        {/* ══ PLAYER HP + ENERGY ══ */}
        <div style={{ flexShrink: 0, animation: hitPlayer ? "shakeX .4s ease" : "none" }}>
          <HpBar jog={p1Display} />
        </div>
        <div style={{ flexShrink: 0, marginTop: 3 }}>
          <EnergyBar energia={myEnergia} max={6} isMyTurn={isMyTurn} />
        </div>
      </div>

      {/* ══ CARD DROP TOAST ══ */}
      {cardDropped && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%",
          zIndex: 300, animation: "cardDropIn .5s cubic-bezier(.34,1.56,.64,1) forwards",
          background: "linear-gradient(135deg, #1a1a3e, #0d0d1f)",
          border: "2px solid rgba(255,213,79,.5)", borderRadius: 16,
          padding: "12px 20px", textAlign: "center", minWidth: 160,
          boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 0 24px rgba(255,213,79,.2)",
        }}>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: 10, color: "#ffd54f", letterSpacing: 2, marginBottom: 5 }}>🎴 CARTA CONQUISTADA!</div>
          <div style={{ fontSize: 26 }}>{cardDropped.emoji}</div>
          <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#e8f0ff", marginTop: 4, fontWeight: 700 }}>{cardDropped.nome}</div>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#ffd54f", marginTop: 2, letterSpacing: 1 }}>{(cardDropped.raridade || "COMUM").toUpperCase()}</div>
        </div>
      )}

      {mostraPoder && <ModalPoder onEscolha={escolherPoder} />}
      {showTutorial && (
        <InteractiveTutorial onComplete={() => { setShowTutorial(false); localStorage.setItem("beast_tutorial_done", "1"); }} />
      )}
      {modo === "multi" && sid && <BattleChat sessionId={sid} slotLocal={slotLocal} />}
    </div>
  );
}
