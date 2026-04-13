import React, { useState, useCallback } from "react";
import TelaHome from "@/components/game/screens/TelaHome";
import TelaMonstro from "@/components/game/screens/TelaMonstro";
import TelaLobby from "@/components/game/screens/TelaLobby";
import TelaEntrar from "@/components/game/screens/TelaEntrar";
import TelaBatalha from "@/components/game/screens/TelaBatalha";
import TelaResultado from "@/components/game/screens/TelaResultado";
import type { Jogador } from "@/game/engine";

type Tela = "home" | "monstro" | "lobby" | "entrar" | "batalha" | "resultado";

export default function Index() {
  const [tela, setTela] = useState<Tela>("home");
  const [modo, setModo] = useState<string>("duel");
  const [monstroP1, setMonstroP1] = useState<string>("");
  const [salaId, setSalaId] = useState<string | null>(null);
  const [slotLocal, setSlotLocal] = useState<number>(0);
  const [vencedor, setVencedor] = useState<Jogador | null>(null);

  // Check URL for room join (join_code from QR/link)
  const [joinCode, setJoinCode] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sala = params.get("sala");
    if (sala) {
      setJoinCode(sala);
      setModo("multi");
      setTela("monstro");
    }
  }, []);

  const handleIniciar = (m: string) => {
    setModo(m);
    setTela("monstro");
  };

  const handleMonstroConfirm = (mId: string) => {
    setMonstroP1(mId);
    if (joinCode) {
      // Guest joining via URL — pass join_code to TelaEntrar
      setSalaId(joinCode);
      setSlotLocal(1);
      setTela("entrar");
    } else if (modo === "multi") {
      setTela("lobby");
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

  const handleFim = (v: Jogador | null) => {
    setVencedor(v);
    setTela("resultado");
  };

  const handleRejogo = () => {
    window.history.replaceState({}, "", window.location.pathname);
    setSalaId(null);
    setJoinCode(null);
    setSlotLocal(0);
    setVencedor(null);
    setMonstroP1("");
    setTela("home");
  };

  switch (tela) {
    case "home":
      return <TelaHome onIniciar={handleIniciar} />;
    case "monstro":
      return <TelaMonstro onConfirmar={handleMonstroConfirm} />;
    case "lobby":
      return <TelaLobby monstroHost={monstroP1} onBatalha={handleBatalha} />;
    case "entrar":
      return salaId ? (
        <TelaEntrar salaId={salaId} monstroConv={monstroP1} onEntrar={handleEntrar} />
      ) : null;
    case "batalha":
      return (
        <TelaBatalha
          modo={modo}
          monstroP1={monstroP1}
          salaId={salaId}
          slotLocal={slotLocal}
          onFim={handleFim}
        />
      );
    case "resultado":
      return <TelaResultado vencedor={vencedor} onRejogo={handleRejogo} />;
    default:
      return <TelaHome onIniciar={handleIniciar} />;
  }
}
