import React, { useState, useCallback } from "react";
import TelaHome from "@/components/game/screens/TelaHome";
import TelaNome from "@/components/game/screens/TelaNome";
import TelaMonstro from "@/components/game/screens/TelaMonstro";
import TelaLobby from "@/components/game/screens/TelaLobby";
import TelaEntrar from "@/components/game/screens/TelaEntrar";
import TelaBatalha from "@/components/game/screens/TelaBatalha";
import TelaResultado from "@/components/game/screens/TelaResultado";
import { MONSTROS } from "@/game/data";
import type { Jogador } from "@/game/engine";

type Tela = "home" | "nome" | "monstro" | "lobby" | "entrar" | "batalha" | "resultado";
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

  // Campaign state
  const [campaignQueue, setCampaignQueue] = useState<string[]>([]);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [campaignWins, setCampaignWins] = useState(0);
  const [campaignFinished, setCampaignFinished] = useState(false);

  const [joinCode, setJoinCode] = useState<string | null>(null);

  React.useEffect(() => {
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
    setTela("nome");
  };

  const handleNomeConfirm = (nome: string) => {
    setNomeJogador(nome);
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
  };

  const handleRecomecar = () => { resetAll(); setTela("monstro"); };
  const handleSair = () => { resetAll(); setTela("home"); };

  const currentOpponent = campaignQueue[campaignIndex] || undefined;

  switch (tela) {
    case "home":
      return <TelaHome onIniciar={handleIniciar} />;
    case "nome":
      return <TelaNome onConfirmar={handleNomeConfirm} />;
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
          key={`battle-${campaignIndex}`}
          modo={modo}
          monstroP1={monstroP1}
          nomeJogador={nomeJogador}
          salaId={salaId}
          slotLocal={slotLocal}
          onFim={handleFim}
          dificuldade={dificuldade}
          aiMonstroId={currentOpponent}
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
        />
      );
    default:
      return <TelaHome onIniciar={handleIniciar} />;
  }
}
