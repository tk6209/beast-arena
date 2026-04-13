import React, { useState, useCallback, useEffect } from "react";
import { MONSTROS, PODERES, SWARMS, IA_PRESETS, novaMao, RND, FRASES_ATK, FRASES_DEF, FRASES_EVO, FRASES_DANO, type CartaData } from "@/game/data";
import {
  criarJ, evoluir, equiparSwarm, aplicarBonusSwarms,
  aplicarEfeitosInicioTurno, aplicarPoisonNoAlvo, iaJogar,
  alog,
  type Jogador, type LogEntry,
} from "@/game/engine";
import {
  emitirEvento, ouvirEventos, buscarJogadores, fecharCanal,
  type GameEvent,
} from "@/game/multiplayer";
import { falar } from "@/game/voice";
import { pageBg, glassPanel } from "@/game/styles";
import Carta from "@/components/game/Carta";
import MonstroDisplay from "@/components/game/MonstroDisplay";
import GameLog from "@/components/game/GameLog";
import BtnMain from "@/components/game/BtnMain";
import ModalPoder from "@/components/game/ModalPoder";
import ChromeNoise from "@/components/game/ChromeNoise";

interface GameState {
  p1: Jogador;
  inimigos: Jogador[];
  fase: string;
  turno: number;
  log: LogEntry[];
  cartaSel: CartaData | null;
  shakeid: string | null;
  vencedor: Jogador | null;
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

  const initGs = useCallback((): GameState => {
    const p1 = criarJ("p1", "Você", monstroP1, true);
    let inimigos: Jogador[];

    if (modo === "multi" && salaId) {
      // For multiplayer, opponent data will arrive via Realtime events
      // Use a placeholder enemy that will be updated when game starts
      const mOut = "morcego";
      const pOut = Object.keys(PODERES)[Math.floor(Math.random() * Object.keys(PODERES).length)];
      let e = criarJ("p2", "Adversário", mOut, false);
      e.monstro = evoluir(e.monstro, pOut);
      e.hp = e.monstro.maxHp;
      e.maxHp = e.monstro.maxHp;
      e.mao = novaMao(5, pOut);
      inimigos = [e];
    } else {
      inimigos = IA_PRESETS.slice(0, 1).map((ai) => {
        const pk = Object.keys(PODERES)[Math.floor(Math.random() * Object.keys(PODERES).length)];
        let e = criarJ(ai.id, ai.nome, ai.monstro, false);
        e.monstro = evoluir(e.monstro, pk);
        e.hp = e.monstro.maxHp;
        e.maxHp = e.monstro.maxHp;
        e.mao = novaMao(5, pk);
        return e;
      });
    }

    return {
      p1,
      inimigos,
      fase: "acao",
      turno: 0,
      log: [{ msg: "⚔️ A batalha começa! Escolha seu poder de evolução.", t: "sistema" }],
      cartaSel: null,
      shakeid: null,
      vencedor: null,
    };
  }, [monstroP1, modo, salaId, slotLocal]);

  const [gs, setGs] = useState<GameState>(initGs);

  // Multiplayer sync via BroadcastChannel
  useEffect(() => {
    if (!salaId) return;
    const bc = new BroadcastChannel(`bac_${salaId}`);
    bc.onmessage = () => {
      const sala = lerSala(salaId);
      if (sala?.ultimaAcao && sala.ultimaAcao.slot !== slotLocal) {
        setGs((prev) => procRemoto(prev, sala.ultimaAcao));
      }
    };
    return () => bc.close();
  }, [salaId, slotLocal]);

  function procRemoto(prev: GameState, acao: any): GameState {
    let log = alog(prev.log, `👤 Adversário jogou ${acao.carta?.nome || "uma carta"}!`, "sistema");
    let p1 = { ...prev.p1 };

    if (acao.carta?.tipo === "ataque") {
      const ai = prev.inimigos[0];
      if (!ai) return prev;
      const fxP1 = aplicarBonusSwarms(p1);
      const def = p1.monstro.def + p1.defAtiva + fxP1.defBonus;
      const fin = Math.max(0, (ai.monstro.atk || 20) + (acao.carta.valor || 0) - def);
      p1.hp = Math.max(0, p1.hp - fin);
      log = alog(log, `💀 Adversário causa ${fin} de dano!`, "dano");
      falar(`O adversário atacou e causou ${fin} de dano.`, true);
    }

    return { ...prev, p1, log };
  }

  function novoTurno(state: GameState, nt?: number): GameState {
    let p1 = { ...state.p1 };
    let log = [...state.log];

    const p1Fx = aplicarEfeitosInicioTurno(p1, log);
    p1 = p1Fx.jogador;
    log = p1Fx.log;

    let inimigos = state.inimigos.map((e) => ({ ...e }));
    inimigos = inimigos.map((e) => {
      const r = aplicarEfeitosInicioTurno(e, log);
      log = r.log;
      return r.jogador;
    });

    const mao = novaMao(5, p1.monstro.poder);
    const turnoNum = nt ?? state.turno + 1;

    falar(`Turno ${turnoNum + 1}. Novas cartas distribuídas.`);

    return {
      ...state,
      fase: "acao",
      turno: turnoNum,
      cartaSel: null,
      p1: { ...p1, mao, defAtiva: 0 },
      inimigos: inimigos.map((e) => ({
        ...e,
        mao: novaMao(5, e.monstro.poder),
        defAtiva: 0,
      })),
      log: alog(log, `🔄 Turno ${turnoNum + 1} — Novas cartas distribuídas!`, "sistema"),
      shakeid: null,
      vencedor: null,
    };
  }

  function escolherPoder(pid: string) {
    setMostraPoder(false);
    const p = PODERES[pid];
    falar(
      `Poder ${p.nome} escolhido. ${MONSTROS[monstroP1].nome} evolui para o nível um. Que comece a batalha.`,
      true
    );
    setGs((prev) => {
      const evo = evoluir(prev.p1.monstro, pid);
      const mao = novaMao(5, pid);
      const p1 = { ...prev.p1, monstro: evo, hp: evo.maxHp, maxHp: evo.maxHp, mao };
      return {
        ...prev,
        p1,
        log: alog(
          alog(prev.log, `✨ Poder ${p.nome} escolhido! ${evo.nome} evolui para Nível 1!`, "efeito"),
          `🔄 Turno 1 — Cartas distribuídas!`,
          "sistema"
        ),
      };
    });
  }

  function selCarta(carta: CartaData) {
    if (gs.fase !== "acao") return;
    setGs((p) => ({
      ...p,
      cartaSel: p.cartaSel?.id === carta.id ? null : carta,
    }));
  }

  function jogarCarta() {
    const carta = gs.cartaSel;
    if (!carta || gs.fase !== "acao") return;

    let log = [...gs.log];
    let p1 = { ...gs.p1, monstro: { ...gs.p1.monstro }, swarms: [...gs.p1.swarms] };
    let inimigos = gs.inimigos.map((e) => ({ ...e, monstro: { ...e.monstro }, swarms: [...e.swarms] }));

    if (carta.tipo === "ataque") {
      const fxP1 = aplicarBonusSwarms(p1);
      let dmg =
        carta.esp === "tudoOuNada"
          ? Math.random() < 0.5 ? 80 : 0
          : p1.monstro.atk + fxP1.atkBonus + (carta.valor || 0);

      if (p1.dobra) {
        dmg *= 2;
        p1.dobra = false;
        falar("Dano dobrado ativado. Prepare-se para sofrer.");
      }

      if (carta.autoDano) {
        p1.hp = Math.max(0, p1.hp - carta.autoDano);
        log = alog(log, `💥 Auto-dano de ${carta.autoDano} pontos!`, "dano");
        falar(`Auto-dano de ${carta.autoDano} pontos!`);
      }

      if (p1.monstro.id === "macaco" && Math.random() < 0.5) {
        dmg *= 2;
        log = alog(log, `🐒 Ataque Surpresa do Macaco. Hit duplo.`, "combo");
        falar("Ataque Surpresa do Macaco. Hit duplo.", true);
      }

      const tgt = inimigos.find((e) => e.hp > 0);
      if (tgt) {
        const fxTgt = aplicarBonusSwarms(tgt);
        const def = tgt.monstro.def + tgt.defAtiva + fxTgt.defBonus;
        let fin = Math.max(0, dmg - def);

        if (tgt.imune) {
          fin = 0;
          tgt.imune = false;
          log = alog(log, `💎 ${tgt.monstro.nome} estava imune! O ataque não surtiu efeito!`, "efeito");
          falar(`${tgt.monstro.nome} estava imune! O ataque não surtiu efeito!`, true);
        } else if (tgt.dodgeOnce) {
          fin = 0;
          tgt.dodgeOnce = false;
          log = alog(log, `🌪️ ${tgt.monstro.nome} esquivou com ajuda dos Swarms!`, "efeito");
          falar(`${tgt.monstro.nome} esquivou com ajuda dos Swarms!`, true);
        } else {
          tgt.hp = Math.max(0, tgt.hp - fin);
          const fa = RND(FRASES_ATK, p1.monstro.nome, tgt.monstro.nome, fin);
          log = alog(log, `⚔️ ${fa}`, "dano");
          falar(fa, true);

          const poisonR = aplicarPoisonNoAlvo(tgt, log);
          inimigos = inimigos.map((e) => (e.id === tgt.id ? poisonR.jogador : e));
          log = poisonR.log;

          if (tgt.hp > 0 && tgt.hp <= 25) falar(`${tgt.monstro.nome} está quase sem energia.`);
        }
      }
    } else if (carta.tipo === "defesa") {
      p1.defAtiva += carta.valor || 0;
      if (carta.esp === "esquiva") {
        p1.imune = true;
        const f = `${p1.monstro.nome} ativa esquiva! Imune ao próximo ataque!`;
        log = alog(log, `🛡️ ${f}`, "efeito");
        falar(f, true);
      } else {
        const f = RND(FRASES_DEF, p1.monstro.nome, carta.valor);
        log = alog(log, `🛡️ ${f}`, "efeito");
        falar(f, true);
      }
    } else if (carta.tipo === "poderzinho") {
      const pp = PODERES[carta.sub!];
      p1.monstro = {
        ...p1.monstro,
        atk: p1.monstro.atk + Math.floor(pp.atkB / 3),
        def: p1.monstro.def + Math.floor(pp.defB / 3),
      };
      const f = `Poderzinho ${pp.nome} ativado! ${p1.monstro.nome} fica mais forte!`;
      log = alog(log, `${pp.emoji} ${f}`, "efeito");
      falar(f, true);
    } else if (carta.tipo === "evolucao") {
      if (p1.monstro.nivel < 3 && p1.monstro.poder) {
        p1.monstro = evoluir(p1.monstro, p1.monstro.poder);
        p1.maxHp = p1.monstro.maxHp;
        const f = RND(FRASES_EVO, p1.monstro.nome, p1.monstro.nivel, PODERES[p1.monstro.poder!].nome);
        log = alog(log, `✨ ${f}`, "efeito");
        falar(f, true);
      } else {
        log = alog(log, "⚠️ Evolução máxima ou poder não escolhido!", "sistema");
        return;
      }
    } else if (carta.tipo === "swarm") {
      const swarm = SWARMS.find((s) => s.id === carta.swarmId);
      if (swarm) {
        const slotLivre = p1.swarms.findIndex((s) => s === null);
        const slot = slotLivre >= 0 ? slotLivre : 0;
        p1 = equiparSwarm(p1, swarm, slot);
        const f = `${swarm.nome} foi equipado como Swarm auxiliar!`;
        log = alog(log, `🐾 ${f}`, "efeito");
        falar(f, true);
      }
    } else if (carta.tipo === "desafio") {
      if (carta.ef === "global") {
        inimigos = inimigos.map((e) => ({ ...e, hp: Math.max(0, e.hp - 15) }));
        log = alog(log, `🌍 Dano global! Todos os adversários recebem quinze de dano!`, "grande");
        falar("Dano global! Todos os adversários recebem quinze de dano!", true);
      } else if (carta.ef === "imunidade") {
        p1.imune = true;
        log = alog(log, `💎 ${p1.monstro.nome} ativou imunidade total!`, "efeito");
        falar(`${p1.monstro.nome} ativou imunidade total! Nenhum ataque pode acertar!`, true);
      } else if (carta.ef === "dobro") {
        p1.dobra = true;
        log = alog(log, `❌ Próximo ataque com dano dobrado! Hora de devastar!`, "combo");
        falar("Próximo ataque com dano dobrado! Hora de devastar!", true);
      }
    }

    p1.mao = p1.mao.filter((c) => c.id !== carta.id);

    if (salaId) {
      const sala = lerSala(salaId);
      if (sala) salvarSala(salaId, { ...sala, ultimaAcao: { slot: slotLocal, carta, ts: Date.now() } });
    }

    const gs2: GameState = { ...gs, p1, inimigos, cartaSel: null, log, fase: "inimigo", shakeid: null, vencedor: null };

    if (inimigos.every((e) => e.hp <= 0)) {
      falar("Você venceu! Todos os adversários foram derrotados.", true);
      setGs({ ...gs2, fase: "resultado", vencedor: p1 });
      onFim(p1);
      return;
    }

    setGs(gs2);
    setTimeout(() => rodarIA(gs2), 750);
  }

  function rodarIA(state: GameState) {
    let p1 = { ...state.p1, monstro: { ...state.p1.monstro }, swarms: [...state.p1.swarms] };
    let inimigos = state.inimigos.map((e) => ({ ...e, monstro: { ...e.monstro }, swarms: [...e.swarms] }));
    let log = [...state.log];
    let shakeid: string | null = null;

    for (let i = 0; i < inimigos.length; i++) {
      const ai = inimigos[i];
      if (ai.hp <= 0) continue;

      const { tipo, carta } = iaJogar(ai);

      if (tipo === "swarm" && carta) {
        const swarm = SWARMS.find((s) => s.id === carta.swarmId);
        if (swarm) {
          const slotLivre = ai.swarms.findIndex((s) => s === null);
          const slot = slotLivre >= 0 ? slotLivre : 0;
          inimigos[i] = equiparSwarm(ai, swarm, slot);
          log = alog(log, `🐾 ${ai.monstro.nome} equipou ${swarm.nome}!`, "efeito");
          falar(`${ai.monstro.nome} equipou um Swarm auxiliar.`, true);
        }
      } else if (tipo === "ataque" && carta) {
        const fxAI = aplicarBonusSwarms(ai);
        let dmg =
          carta.esp === "tudoOuNada"
            ? Math.random() < 0.5 ? 80 : 0
            : ai.monstro.atk + fxAI.atkBonus + (carta.valor || 0);

        if (p1.imune) {
          p1.imune = false;
          const f = `${p1.monstro.nome} estava imune! O ataque de ${ai.monstro.nome} falhou!`;
          log = alog(log, `💎 ${f}`, "efeito");
          falar(f, true);
        } else if (p1.dodgeOnce) {
          p1.dodgeOnce = false;
          const f = `${p1.monstro.nome} esquivou do ataque de ${ai.monstro.nome}!`;
          log = alog(log, `🌪️ ${f}`, "efeito");
          falar(f, true);
        } else {
          const fxP1 = aplicarBonusSwarms(p1);
          const def = p1.monstro.def + p1.defAtiva + fxP1.defBonus;
          const fin = Math.max(0, dmg - def);
          p1.hp = Math.max(0, p1.hp - fin);
          shakeid = "p1";
          const fa = RND(FRASES_DANO, p1.monstro.nome, fin, p1.hp);
          log = alog(log, `💀 ${fa}`, "dano");
          falar(fa, true);
        }
      } else if (tipo === "defesa" && carta) {
        ai.defAtiva += carta.valor || 0;
        inimigos[i] = ai;
        log = alog(log, `🛡️ ${ai.monstro.nome} se defende com ${carta.valor} pontos!`, "efeito");
      } else if (tipo === "evolucao" && carta) {
        if (ai.monstro.nivel < 3 && ai.monstro.poder) {
          ai.monstro = evoluir(ai.monstro, ai.monstro.poder);
          ai.maxHp = ai.monstro.maxHp;
          inimigos[i] = ai;
          log = alog(log, `✨ ${ai.monstro.nome} evolui para nível ${ai.monstro.nivel}!`, "efeito");
        }
      }

      if (carta) {
        ai.mao = ai.mao.filter((c) => c.id !== carta.id);
        inimigos[i] = { ...ai };
      }
    }

    if (p1.hp <= 0) {
      const winner = inimigos.find((e) => e.hp > 0) || null;
      falar("Você foi derrotado.", true);
      setGs({ ...state, p1, inimigos, log, fase: "resultado", vencedor: winner, shakeid });
      onFim(winner);
      return;
    }

    const ns = novoTurno({ ...state, p1, inimigos, log, shakeid, vencedor: null });
    setGs(ns);
  }

  // Calculate fan angles for hand
  const handCards = gs.p1.mao;
  const totalCards = handCards.length;
  const arcSpread = Math.min(totalCards * 8, 40);

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
          <span
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: 14,
              color: "#00e5ff",
              letterSpacing: 2,
            }}
          >
            ⚔️ TURNO {gs.turno + 1}
          </span>
          <span
            style={{
              marginLeft: 12,
              fontSize: 10,
              color: gs.fase === "acao" ? "#69f0ae" : "#ffd54f",
              animation: gs.fase !== "acao" ? "pulseOpacity 1s infinite" : undefined,
            }}
          >
            {gs.fase === "acao" ? "SUA VEZ" : gs.fase === "inimigo" ? "INIMIGO JOGANDO..." : ""}
          </span>
        </div>

        {/* Enemy monster */}
        {gs.inimigos.filter((e) => e.hp > 0).map((e) => (
          <div key={e.id} style={gs.shakeid === e.id ? { animation: "shakeHit .3s ease" } : {}}>
            <MonstroDisplay jog={e} inimigo />
          </div>
        ))}

        {/* VS divider */}
        <div
          style={{
            textAlign: "center",
            fontFamily: "Bangers, cursive",
            fontSize: 18,
            color: "#ffd54f",
            letterSpacing: 4,
            textShadow: "0 0 16px #ffd54f",
          }}
        >
          ⚡ VS ⚡
        </div>

        {/* Player monster */}
        <div style={gs.shakeid === "p1" ? { animation: "shakeHit .3s ease" } : {}}>
          <MonstroDisplay jog={gs.p1} />
        </div>

        {/* Log */}
        <GameLog ents={gs.log} />

        {/* Hand of cards */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 0,
            minHeight: 180,
            padding: "8px 0",
            position: "relative",
          }}
        >
          {handCards.map((c, i) => {
            const mid = (totalCards - 1) / 2;
            const angle = (i - mid) * (arcSpread / Math.max(totalCards - 1, 1));
            return (
              <Carta
                key={c.id}
                carta={c}
                sel={gs.cartaSel?.id === c.id}
                onClick={() => selCarta(c)}
                disabled={gs.fase !== "acao"}
                angulo={angle}
              />
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <BtnMain
            variant={gs.cartaSel ? "gold" : "dark"}
            disabled={!gs.cartaSel || gs.fase !== "acao"}
            onClick={jogarCarta}
            style={{ flex: 2 }}
          >
            {gs.cartaSel ? `⚡ JOGAR: ${gs.cartaSel.nome}` : "Selecione uma carta"}
          </BtnMain>
          <BtnMain
            variant="dark"
            disabled={gs.fase !== "acao"}
            onClick={() => {
              const ns = novoTurno(gs);
              setGs(ns);
            }}
            style={{ flex: 1 }}
          >
            ⏭ PASSAR
          </BtnMain>
        </div>
      </div>

      {/* Power selection modal */}
      {mostraPoder && <ModalPoder onEscolha={escolherPoder} />}
    </div>
  );
}
