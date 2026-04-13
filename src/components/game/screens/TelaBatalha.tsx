import React, { useState, useEffect, useRef } from "react";
import { MONSTROS, PODERES, type CartaData } from "@/game/data";
import {
  criarJ,
  type Jogador, type LogEntry,
} from "@/game/engine";
import {
  criarSessao, ouvirSessao, fecharCanal,
  type GameSession,
} from "@/game/multiplayer";
import { initGame, choosePower, playCard, passTurn } from "@/game/serverApi";
import { falar } from "@/game/voice";
import { pageBg } from "@/game/styles";
import Carta from "@/components/game/Carta";
import HpBar from "@/components/game/HpBar";
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
          { slot: slotLocal, nome: "Você", monstroId: monstroP1 },
        ]);
        setServerState(result.state);
      } catch (err) {
        console.error("Init error:", err);
      }
    }
    init();
  }, []);

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
      for (const evt of (result.events || [])) {
        if (evt.type === "game_over") {
          const winner = result.state.vencedor;
          falar(winner === slotLocal ? "Você venceu!" : "Você foi derrotado.", true);
          onFim(winner === slotLocal ? { id: "p1" } as any : null);
        }
      }
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

  // Find the full card data for the selected card
  const selectedFull = cartaSel ? handCards.find((c: any) => c.id === cartaSel.id) || cartaSel : null;

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
      <GameLog ents={serverState.log || []} />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "8px 10px",
          fontFamily: "Nunito, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Top: Turn + Enemy HP */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          {/* Turn indicator */}
          <div style={{ textAlign: "center", height: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontFamily: "Bangers, cursive", fontSize: 13, color: "#00e5ff", letterSpacing: 2 }}>
              ⚔️ TURNO {(serverState.turno || 0) + 1}
            </span>
            <span
              style={{
                fontSize: 10,
                color: isMyTurn ? "#69f0ae" : "#ffd54f",
                animation: !isMyTurn && !gameOver ? "pulseOpacity 1s infinite" : undefined,
              }}
            >
              {gameOver ? "FIM" : isMyTurn ? "SUA VEZ" : "AGUARDANDO..."}
            </span>
            {loading && <span style={{ fontSize: 10, color: "#ff9800" }}>⏳</span>}
          </div>

          {/* Enemy HP bar */}
          <div style={shakeid ? { animation: "shakeHit .3s ease" } : {}}>
            <HpBar jog={enemyDisplay} inimigo />
          </div>
        </div>

        {/* Center: Selected Card (hero area) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            padding: "8px 0",
          }}
        >
          {selectedFull ? (
            <div style={{ transform: "scale(0.92)", transformOrigin: "center" }}>
              <Carta carta={selectedFull} sel={true} disabled />
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#4a5568",
                fontFamily: "Bangers, cursive",
                fontSize: 18,
                letterSpacing: 2,
              }}
            >
              {gameOver ? "" : "👆 TOQUE UMA CARTA"}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!gameOver && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginBottom: 6 }}>
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
              gap: 8,
              overflowX: "auto",
              overflowY: "hidden",
              padding: "6px 0",
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

        {/* Player HP bar */}
        <div style={{ flexShrink: 0, paddingTop: 4 }}>
          <HpBar jog={p1Display} />
        </div>
      </div>

      {mostraPoder && <ModalPoder onEscolha={escolherPoder} />}
    </div>
  );
}
