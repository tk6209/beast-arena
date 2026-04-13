import React, { useState, useCallback, useEffect, useRef } from "react";
import { MONSTROS, PODERES, SWARMS, IA_PRESETS, novaMao, RND, FRASES_ATK, FRASES_DEF, FRASES_EVO, FRASES_DANO, type CartaData } from "@/game/data";
import {
  criarJ, evoluir, equiparSwarm, aplicarBonusSwarms,
  aplicarEfeitosInicioTurno, aplicarPoisonNoAlvo, iaJogar,
  alog,
  type Jogador, type LogEntry,
} from "@/game/engine";
import {
  criarSessao, emitirEvento, ouvirEventos, ouvirSessao, buscarJogadores, fecharCanal, atualizarSessao,
  type GameEvent, type GameSession,
} from "@/game/multiplayer";
import { initGame, choosePower, playCard, passTurn } from "@/game/serverApi";
import { falar } from "@/game/voice";
import { pageBg, glassPanel } from "@/game/styles";
import Carta from "@/components/game/Carta";
import MonstroDisplay from "@/components/game/MonstroDisplay";
import GameLog from "@/components/game/GameLog";
import BtnMain from "@/components/game/BtnMain";
import ModalPoder from "@/components/game/ModalPoder";
import ChromeNoise from "@/components/game/ChromeNoise";

interface ServerState {
  players: any[];
  turno: number;
  fase: string;
  log: LogEntry[];
  currentTurn: number;
  vencedor: number | null;
  modo: string;
}

interface TelaBatalhaProps {
  modo: string;
  monstroP1: string;
  salaId?: string | null;
  slotLocal?: number;
  onFim: (vencedor: Jogador | null) => void;
}

export default function TelaBatalha({ modo, monstroP1, salaId, slotLocal = 0, onFim }: TelaBatalhaProps) {
  const [mostraPoder, setMostraPoder] = useState(true);
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [cartaSel, setCartaSel] = useState<any | null>(null);
  const [shakeid, setShakeid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(salaId || null);

  // Initialize game on mount
  useEffect(() => {
    async function init() {
      try {
        let sid = salaId;
        if (!sid) {
          // Create a session for AI mode
          const sess = await criarSessao();
          sid = sess.id;
          sessionIdRef.current = sid;
        } else {
          sessionIdRef.current = sid;
        }

        const result = await initGame(sid!, modo === "multi" ? "multi" : "ai", [
          { slot: slotLocal, nome: "Você", monstroId: monstroP1 },
        ]);

        setServerState(result.state);
      } catch (err) {
        console.error("Init error:", err);
      }
    }
    init();
  }, []);

  // Listen for realtime updates on session state
  useEffect(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    const channel = ouvirSessao(sid, (session: GameSession) => {
      if (session.state_json && typeof session.state_json === "object") {
        setServerState(session.state_json as unknown as ServerState);
      }
    });

    return () => fecharCanal(channel);
  }, [sessionIdRef.current]);

  const sid = sessionIdRef.current;

  async function escolherPoder(pid: string) {
    if (!sid) return;
    setMostraPoder(false);
    setLoading(true);
    try {
      const result = await choosePower(sid, slotLocal, pid);
      setServerState(result.state);
      const p = PODERES[pid];
      falar(`Poder ${p.nome} escolhido. ${MONSTROS[monstroP1].nome} evolui. Que comece a batalha.`, true);
    } catch (err) {
      console.error("Power error:", err);
    }
    setLoading(false);
  }

  function selCarta(carta: any) {
    if (serverState?.fase !== "acao" || loading) return;
    setCartaSel((prev: any) => prev?.id === carta.id ? null : carta);
  }

  async function jogarCarta() {
    if (!cartaSel || !sid || loading) return;
    setLoading(true);
    try {
      const result = await playCard(sid, slotLocal, cartaSel.id);
      setServerState(result.state);
      setCartaSel(null);

      // Narrate key events
      for (const evt of (result.events || [])) {
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          falar(winner === slotLocal ? "Você venceu!" : "Você foi derrotado.", true);
          onFim(winner === slotLocal ? { id: "p1" } as any : null);
        }
      }

      // Trigger shake on damage events
      const lastLog = result.state.log?.[result.state.log.length - 1];
      if (lastLog?.t === "dano") {
        setShakeid("hit");
        setTimeout(() => setShakeid(null), 400);
      }
    } catch (err) {
      console.error("Play error:", err);
    }
    setLoading(false);
  }

  async function handlePassar() {
    if (!sid || loading) return;
    setLoading(true);
    try {
      const result = await passTurn(sid, slotLocal);
      setServerState(result.state);
      setCartaSel(null);
      falar(`Turno ${(result.state.turno || 0) + 1}. Novas cartas distribuídas.`);

      for (const evt of (result.events || [])) {
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          falar(winner === slotLocal ? "Você venceu!" : "Você foi derrotado.", true);
          onFim(winner === slotLocal ? { id: "p1" } as any : null);
        }
      }
    } catch (err) {
      console.error("Pass error:", err);
    }
    setLoading(false);
  }

  // Derive display state from server state
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

  // Build Jogador-like objects for display components
  const p1Display: Jogador = myPlayer ? {
    id: myPlayer.id || "p1",
    nome: myPlayer.nome || "Você",
    humano: true,
    monstro: myPlayer.monstro || { id: "", nome: "", hp: 0, atk: 0, def: 0, emoji: "", bg1: "#000", bg2: "#000", glow: "#000", hab: "", habD: "", nivel: 0, poder: null, maxHp: 0 },
    hp: myPlayer.hp || 0,
    maxHp: myPlayer.maxHp || 100,
    mao: myPlayer.mao || [],
    defAtiva: myPlayer.defAtiva || 0,
    imune: myPlayer.imune || false,
    dobra: myPlayer.dobra || false,
    dodgeOnce: myPlayer.dodgeOnce || false,
    swarms: myPlayer.swarms || [null, null],
  } : criarJ("p1", "Você", monstroP1, true);

  // Fill in monster visual data from MONSTROS
  if (p1Display.monstro.id && MONSTROS[p1Display.monstro.id]) {
    const md = MONSTROS[p1Display.monstro.id];
    p1Display.monstro.bg1 = p1Display.monstro.bg1 || md.bg1;
    p1Display.monstro.bg2 = p1Display.monstro.bg2 || md.bg2;
    p1Display.monstro.glow = p1Display.monstro.glow || md.glow;
    p1Display.monstro.habD = p1Display.monstro.habD || md.habD;
  }

  const enemyDisplay: Jogador | null = opponent ? {
    id: opponent.id || "p2",
    nome: opponent.nome || "Adversário",
    humano: false,
    monstro: {
      ...opponent.monstro,
      bg1: MONSTROS[opponent.monstro?.id]?.bg1 || "#222",
      bg2: MONSTROS[opponent.monstro?.id]?.bg2 || "#444",
      glow: MONSTROS[opponent.monstro?.id]?.glow || "#666",
      habD: MONSTROS[opponent.monstro?.id]?.habD || "",
    },
    hp: opponent.hp || 0,
    maxHp: opponent.maxHp || 100,
    mao: [],
    defAtiva: opponent.defAtiva || 0,
    imune: opponent.imune || false,
    dobra: opponent.dobra || false,
    dodgeOnce: opponent.dodgeOnce || false,
    swarms: opponent.swarms || [null, null],
  } : null;

  const handCards = myPlayer?.mao || [];
  const totalCards = handCards.length;
  const arcSpread = Math.min(totalCards * 8, 40);
  const isMyTurn = serverState.fase === "acao";
  const gameOver = serverState.fase === "resultado";

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
      `}</style>
      <ChromeNoise />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "12px 10px 8px",
          fontFamily: "Nunito, sans-serif",
          gap: 8,
        }}
      >
        {/* Turn indicator */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#00e5ff", letterSpacing: 2 }}>
            ⚔️ TURNO {(serverState.turno || 0) + 1}
          </span>
          <span
            style={{
              marginLeft: 12, fontSize: 10,
              color: isMyTurn ? "#69f0ae" : "#ffd54f",
              animation: !isMyTurn && !gameOver ? "pulseOpacity 1s infinite" : undefined,
            }}
          >
            {gameOver ? "FIM DE JOGO" : isMyTurn ? "SUA VEZ" : "AGUARDANDO..."}
          </span>
          {loading && <span style={{ marginLeft: 8, fontSize: 10, color: "#ff9800" }}>⏳</span>}
        </div>

        {/* Enemy monster */}
        {enemyDisplay && enemyDisplay.hp > 0 && (
          <div style={shakeid ? { animation: "shakeHit .3s ease" } : {}}>
            <MonstroDisplay jog={enemyDisplay} inimigo />
          </div>
        )}

        {/* VS divider */}
        <div style={{ textAlign: "center", fontFamily: "Bangers, cursive", fontSize: 18, color: "#ffd54f", letterSpacing: 4, textShadow: "0 0 16px #ffd54f" }}>
          ⚡ VS ⚡
        </div>

        {/* Player monster */}
        <div style={shakeid ? { animation: "shakeHit .3s ease" } : {}}>
          <MonstroDisplay jog={p1Display} />
        </div>

        {/* Log */}
        <GameLog ents={serverState.log || []} />

        {/* Hand of cards */}
        {!gameOver && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 0, minHeight: 180, padding: "8px 0", position: "relative" }}>
            {handCards.map((c: any, i: number) => {
              const mid = (totalCards - 1) / 2;
              const angle = (i - mid) * (arcSpread / Math.max(totalCards - 1, 1));
              return (
                <Carta
                  key={c.id}
                  carta={c}
                  sel={cartaSel?.id === c.id}
                  onClick={() => selCarta(c)}
                  disabled={!isMyTurn || loading}
                  angulo={angle}
                />
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        {!gameOver && (
          <div style={{ display: "flex", gap: 8 }}>
            <BtnMain
              variant={cartaSel ? "gold" : "dark"}
              disabled={!cartaSel || !isMyTurn || loading}
              onClick={jogarCarta}
              style={{ flex: 2 }}
            >
              {cartaSel ? `⚡ JOGAR: ${cartaSel.nome}` : "Selecione uma carta"}
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
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 28, color: serverState.vencedor === slotLocal ? "#69f0ae" : "#ef5350", textShadow: "0 0 20px currentColor" }}>
              {serverState.vencedor === slotLocal ? "🏆 VITÓRIA!" : "💀 DERROTA!"}
            </div>
            <BtnMain variant="gold" onClick={() => onFim(serverState.vencedor === slotLocal ? p1Display : null)} style={{ marginTop: 16 }}>
              CONTINUAR
            </BtnMain>
          </div>
        )}
      </div>

      {/* Power selection modal */}
      {mostraPoder && <ModalPoder onEscolha={escolherPoder} />}
    </div>
  );
}
