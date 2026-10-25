import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { escolherAcao } from "../engine/ai";
import { CARDS, ELEMENTO_INFO, FORTE_CONTRA, MONSTERS } from "../engine/data";
import { createBattle, custoEfetivo, podeJogar, step } from "../engine/engine";
import type { BattleEvent, BattleState, CardDef, CardInstance, Dificuldade, Side, StepResult } from "../engine/types";
import { Arena } from "../render/arena";
import { isMuted, setMuted, sfx, unlockAudio } from "../sfx";
import { MONSTER_ART } from "../assets";
import { CardView } from "./CardView";
import { EnergyOrbs, FighterPanel, type FighterView } from "./Hud";

export interface BattleStats {
  vitoria: boolean;
  danoCausado: number;
  maiorGolpe: number;
  cartas: number;
  turnos: number;
  hpRestante: number;
}

interface Props {
  player: string;
  enemy: string;
  dificuldade: Dificuldade;
  seed: number;
  onEnd: (s: BattleStats) => void;
  onExit: () => void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function viewOf(s: BattleState, side: Side): FighterView {
  const f = s.fighters[side];
  return {
    monsterId: f.monsterId,
    hp: f.hp,
    hpMax: f.hpMax,
    escudo: f.escudo,
    espinhos: f.espinhos,
    esquiva: f.esquiva,
    queimar: f.queimar,
    veneno: f.veneno,
    congelado: f.congelado,
    furia: f.furia,
    evolucao: f.evolucao,
    energia: f.energia,
    energiaMax: f.energiaMax,
    mao: f.mao.length,
    deck: f.deck.length,
  };
}

const HINT_KEY = "ba2.hint.v1";

export function BattleScreen({ player, enemy, dificuldade, seed, onEnd, onExit }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<Arena | null>(null);
  const stateRef = useRef<BattleState | null>(null);
  const busyRef = useRef(true);
  const statsRef = useRef({ dano: 0, maior: 0, cartas: 0 });
  const alive = useRef(true);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const aiCounter = useRef(1);

  const [view, setView] = useState<{ player: FighterView; enemy: FighterView } | null>(null);
  const [hand, setHand] = useState<CardInstance[]>([]);
  const [busy, setBusy] = useState(true);
  const [vez, setVez] = useState<Side>("player");
  const [selected, setSelected] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string; sub?: string; side: Side } | null>(null);
  const [enemyCard, setEnemyCard] = useState<CardDef | null>(null);
  const [flying, setFlying] = useState<{ card: CardDef; rect: DOMRect; to: { x: number; y: number }; id: number } | null>(null);
  const [intro, setIntro] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [info, setInfo] = useState<Side | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [initError, setInitError] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [hint, setHint] = useState<0 | 1 | 2>(() => {
    try {
      return localStorage.getItem(HINT_KEY) ? 0 : 1;
    } catch {
      return 0;
    }
  });
  const [newUids, setNewUids] = useState<Set<number>>(new Set());
  const [shakeUid, setShakeUid] = useState<number | null>(null);

  const setBusyBoth = (b: boolean) => {
    busyRef.current = b;
    setBusy(b);
  };

  const showToast = useCallback((t: string) => {
    setToast(t);
    setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 1600);
  }, []);

  /* ---------------- Layout ---------------- */

  const relayout = useCallback(() => {
    const host = hostRef.current;
    const a = arenaRef.current;
    if (!host || !a) return;
    const top = topRef.current?.getBoundingClientRect().bottom ?? 0;
    const bottomEl = bottomRef.current?.getBoundingClientRect();
    const bottom = bottomEl ? host.clientHeight - bottomEl.top + 30 : 0;
    a.layout(host.clientWidth, host.clientHeight, { top, bottom });
  }, []);

  /* ---------------- Event playback ---------------- */

  const playBatch = useCallback(
    async (pre: BattleState | null, res: StepResult) => {
      const arena = arenaRef.current;
      const v = {
        player: pre ? viewOf(pre, "player") : viewOf(res.state, "player"),
        enemy: pre ? viewOf(pre, "enemy") : viewOf(res.state, "enemy"),
      };
      let card: CardDef | null = null;
      let actor: Side | null = null;
      let lastIntangivel = false;
      const push = () => {
        setView({ player: { ...v.player }, enemy: { ...v.enemy } });
        for (const s of ["player", "enemy"] as Side[]) {
          arena?.setStatus(s, {
            escudo: v[s].escudo,
            queimar: v[s].queimar,
            veneno: v[s].veneno,
            congelado: v[s].congelado,
            furia: v[s].furia,
            evolucao: v[s].evolucao,
            esquiva: v[s].esquiva,
            espinhos: v[s].espinhos,
          });
        }
      };

      for (const ev of res.events as BattleEvent[]) {
        if (!alive.current) return;
        switch (ev.e) {
          case "jogar": {
            card = CARDS[ev.card];
            actor = ev.side;
            if (pre) v[ev.side].energia = Math.max(0, pre.fighters[ev.side].energia - custoEfetivo(pre.fighters[ev.side], card));
            if (ev.side === "enemy") {
              v.enemy.mao = Math.max(0, v.enemy.mao - 1);
              push();
              sfx.card();
              setEnemyCard(card);
              await sleep(900);
              setEnemyCard(null);
            } else {
              statsRef.current.cartas++;
            }
            break;
          }
          case "inicioTurno": {
            card = null;
            actor = null;
            v[ev.side].energia = ev.energia;
            v[ev.side].energiaMax = res.state.fighters[ev.side].energiaMax;
            v[ev.side].congelado = 0;
            setVez(ev.side);
            setBanner({ id: Date.now(), text: ev.side === "player" ? "SEU TURNO" : "TURNO DO RIVAL", sub: ev.side === "player" ? `⚡ ${ev.energia} de energia` : undefined, side: ev.side });
            if (ev.side === "player") sfx.turn();
            else sfx.enemyTurn();
            break;
          }
          case "fimTurno":
            card = null;
            actor = null;
            break;
          case "dano":
            v[ev.alvo].hp -= ev.valor;
            v[ev.alvo].escudo = Math.max(0, v[ev.alvo].escudo - ev.bloqueado);
            if (ev.alvo === "enemy" && actor === "player") {
              statsRef.current.dano += ev.valor;
              statsRef.current.maior = Math.max(statsRef.current.maior, ev.valor);
            }
            break;
          case "tick":
            v[ev.alvo].hp -= ev.valor;
            if (ev.status === "queimar") v[ev.alvo].queimar = Math.max(0, v[ev.alvo].queimar - 1);
            else v[ev.alvo].veneno = Math.max(0, v[ev.alvo].veneno - 1);
            if (ev.alvo === "enemy") statsRef.current.dano += ev.valor;
            break;
          case "cura":
            v[ev.alvo].hp += ev.valor;
            break;
          case "escudo":
            v[ev.alvo].escudo += ev.valor;
            break;
          case "espinhos":
            v[ev.alvo].espinhos += ev.valor;
            break;
          case "escudoExpirou":
            v[ev.side].escudo = 0;
            v[ev.side].espinhos = 0;
            break;
          case "status": {
            const key = ev.status === "congelar" ? "congelado" : ev.status;
            v[ev.alvo][key] = ev.valor;
            break;
          }
          case "esquivou":
            if (!lastIntangivel) v[ev.alvo].esquiva = Math.max(0, v[ev.alvo].esquiva - 1);
            break;
          case "energia":
            v[ev.side].energia = ev.valor;
            break;
          case "comprar":
            if (ev.side === "player") {
              const finalHand = res.state.fighters.player.mao;
              setHand((cur) => {
                const known = new Set(cur.map((c) => c.uid));
                setNewUids(new Set(finalHand.filter((c) => !known.has(c.uid)).map((c) => c.uid)));
                return finalHand;
              });
              sfx.draw();
            } else v.enemy.mao += ev.n;
            break;
          case "descartar":
            if (ev.side === "player") setHand(res.state.fighters.player.mao);
            else v.enemy.mao = Math.max(0, v.enemy.mao - ev.n);
            break;
          case "ko":
            v[ev.side].hp = 0;
            break;
          default:
            break;
        }
        lastIntangivel = ev.e === "passiva" && ev.passiva === "intangivel";
        push();
        if (arena) await arena.handle(ev, card, actor);
        if (ev.e === "inicioTurno") await sleep(ev.side === "player" ? 550 : 450);
      }
      // Attack cards consume fury: re-sync everything from the authoritative state.
      stateRef.current = res.state;
      v.player = viewOf(res.state, "player");
      v.enemy = viewOf(res.state, "enemy");
      push();
      setHand(res.state.fighters.player.mao);
      setVez(res.state.vez);
    },
    [],
  );

  const finish = useCallback(
    async (s: BattleState) => {
      const win = s.vencedor === "player";
      await sleep(400);
      if (win) void arenaRef.current?.celebrate("player");
      else sfx.defeat();
      await sleep(win ? 1500 : 1300);
      if (!alive.current) return;
      onEndRef.current({
        vitoria: win,
        danoCausado: statsRef.current.dano,
        maiorGolpe: statsRef.current.maior,
        cartas: statsRef.current.cartas,
        turnos: s.fighters.player.turnosJogados,
        hpRestante: s.fighters.player.hp,
      });
    },
    [],
  );

  const runEnemy = useCallback(async () => {
    await sleep(500);
    while (alive.current && stateRef.current && !stateRef.current.vencedor && stateRef.current.vez === "enemy") {
      const pre = stateRef.current;
      const action = escolherAcao(pre, seed * 131 + aiCounter.current++);
      const res = step(pre, action);
      await playBatch(pre, res);
      if (action.type === "jogar") await sleep(350);
    }
  }, [playBatch, seed]);

  const afterBatch = useCallback(async () => {
    const s = stateRef.current;
    if (!s) return;
    if (s.vencedor) return finish(s);
    if (s.vez === "enemy") {
      await runEnemy();
      const s2 = stateRef.current;
      if (s2?.vencedor) return finish(s2);
    }
    setBusyBoth(false);
  }, [finish, runEnemy]);

  /* ---------------- Mount: arena + intro ---------------- */

  useEffect(() => {
    alive.current = true;
    const host = hostRef.current!;
    const created = createBattle({ seed, player, enemy, dificuldade });
    stateRef.current = null;
    setView({ player: viewOf(created.state, "player"), enemy: viewOf(created.state, "enemy") });
    let arena: Arena | null = null;
    let cancelled = false;
    const ro = new ResizeObserver(() => relayout());
    ro.observe(host);
    (async () => {
      try {
        arena = await Arena.create(host, player, enemy);
      } catch (err) {
        // WebGL unavailable or art failed to load: Arena.create already cleaned up.
        console.error("Beast Arena V2: falha ao iniciar a arena", err);
        if (!cancelled) setInitError(true);
        return;
      }
      if (cancelled) {
        arena.destroy();
        return;
      }
      arenaRef.current = arena;
      relayout();
      sfx.whoosh();
      await Promise.all([arena.intro(), sleep(1700)]);
      if (cancelled) return;
      setIntro(false);
      // Initial state already reflects the opening draws; animate them as one batch.
      const initial = { ...created.state, fighters: { player: { ...created.state.fighters.player, mao: [] }, enemy: created.state.fighters.enemy } };
      await playBatch(initial, created);
      stateRef.current = created.state;
      await afterBatch();
    })();
    return () => {
      cancelled = true;
      alive.current = false;
      ro.disconnect();
      arena?.destroy();
      arenaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    relayout();
  }, [hand.length, relayout]);

  /* ---------------- Player actions ---------------- */

  const tryPlay = useCallback(
    async (uid: number, el: HTMLElement | null) => {
      const s = stateRef.current;
      if (!s || busyRef.current || s.vez !== "player") return;
      if (!podeJogar(s, "player", uid)) {
        sfx.error();
        setShakeUid(uid);
        setTimeout(() => setShakeUid(null), 400);
        showToast("Energia insuficiente ⚡");
        return;
      }
      const inst = s.fighters.player.mao.find((c) => c.uid === uid)!;
      const card = CARDS[inst.defId];
      setBusyBoth(true);
      setSelected(null);
      if (hint === 1) setHint(2);
      unlockAudio();
      sfx.card();
      const arena = arenaRef.current;
      const target = arena?.anchorOf(card.kind === "ataque" ? "enemy" : "player") ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      if (el) setFlying({ card, rect: el.getBoundingClientRect(), to: target, id: uid });
      setHand((h) => h.filter((c) => c.uid !== uid));
      await sleep(330);
      setFlying(null);
      const res = step(s, { type: "jogar", uid });
      await playBatch(s, res);
      await afterBatch();
    },
    [afterBatch, hint, playBatch, showToast],
  );

  const endTurn = useCallback(async () => {
    const s = stateRef.current;
    if (!s || busyRef.current || s.vez !== "player") return;
    unlockAudio();
    sfx.click();
    setSelected(null);
    setBusyBoth(true);
    if (hint) {
      setHint(0);
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    const res = step(s, { type: "passar" });
    await playBatch(s, res);
    await afterBatch();
  }, [afterBatch, hint, playBatch]);

  /* ---------------- Card gestures ---------------- */

  const drag = useRef<{ uid: number; x: number; y: number; id: number; el: HTMLElement; moved: boolean } | null>(null);

  const onDown = (e: RPointerEvent<HTMLDivElement>, uid: number) => {
    unlockAudio();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    drag.current = { uid, x: e.clientX, y: e.clientY, id: e.pointerId, el, moved: false };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 10) {
      d.moved = true;
      d.el.classList.add("ba2-card-drag");
      setSelected(d.uid);
    }
    if (d.moved) {
      d.el.style.setProperty("--dx", `${dx}px`);
      d.el.style.setProperty("--dy", `${dy}px`);
      d.el.classList.toggle("ba2-card-ready", -dy > 110);
    }
  };
  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dy = e.clientY - d.y;
    const el = d.el;
    el.classList.remove("ba2-card-drag", "ba2-card-ready");
    el.style.removeProperty("--dx");
    el.style.removeProperty("--dy");
    if (d.moved) {
      if (-dy > 110) void tryPlay(d.uid, el);
      return;
    }
    if (selected === d.uid) void tryPlay(d.uid, el);
    else {
      sfx.hover();
      setSelected(d.uid);
    }
  };

  /* ---------------- Render ---------------- */

  const s = stateRef.current;
  const meuTurno = vez === "player" && !busy;
  const algumaJogavel = !!s && meuTurno && hand.some((c) => podeJogar(s, "player", c.uid));
  const n = hand.length;

  return (
    <div className="ba2-battle" onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}>
      <div ref={hostRef} className="ba2-canvas" onPointerDown={() => setSelected(null)} />

      {view && (
        <>
          <div ref={topRef} className="ba2-top">
            <button className="ba2-icon-btn" onClick={() => setConfirmExit(true)} aria-label="Sair">
              ✕
            </button>
            <FighterPanel side="enemy" f={view.enemy} ativo={vez === "enemy"} onInfo={() => setInfo("enemy")} />
            <button
              className="ba2-icon-btn"
              onClick={() => {
                setMuted(!muted);
                setMutedState(!muted);
              }}
              aria-label={muted ? "Ligar som" : "Desligar som"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>

          <div ref={bottomRef} className="ba2-bottom">
            <div className="ba2-bottom-row">
              <FighterPanel side="player" f={view.player} ativo={vez === "player"} onInfo={() => setInfo("player")} />
              <EnergyOrbs energia={view.player.energia} max={view.player.energiaMax} />
              <button className={`ba2-end ${meuTurno && !algumaJogavel ? "ba2-end-pulse" : ""}`} disabled={!meuTurno} onClick={endTurn}>
                {vez === "enemy" ? "RIVAL…" : "FIM DO\nTURNO"}
              </button>
            </div>
            <div className="ba2-hand" style={{ ["--n" as string]: n }}>
              {hand.map((inst, i) => {
                const card = CARDS[inst.defId];
                const off = i - (n - 1) / 2;
                const jog = !!s && s.vez === "player" && podeJogar(s, "player", inst.uid);
                const custo = s ? custoEfetivo(s.fighters.player, card) : card.custo;
                return (
                  <CardView
                    key={inst.uid}
                    card={card}
                    custo={custo}
                    jogavel={jog || !meuTurno}
                    className={`ba2-hand-card ${selected === inst.uid ? "ba2-card-sel" : ""} ${newUids.has(inst.uid) ? "ba2-card-in" : ""} ${shakeUid === inst.uid ? "ba2-card-shake" : ""}`}
                    style={{ ["--off" as string]: off, ["--i" as string]: i, zIndex: selected === inst.uid ? 50 : 10 + i }}
                    onPointerDown={(e) => onDown(e, inst.uid)}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {hint === 1 && meuTurno && selected === null && <div className="ba2-hint">Toque numa carta para ver. Toque de novo — ou arraste pra cima — para jogar!</div>}
      {hint === 2 && meuTurno && <div className="ba2-hint ba2-hint-end">Sem energia? Toque em FIM DO TURNO ➜</div>}

      {banner && (
        <div key={banner.id} className={`ba2-banner ba2-banner-${banner.side}`}>
          <div className="ba2-banner-text">{banner.text}</div>
          {banner.sub && <div className="ba2-banner-sub">{banner.sub}</div>}
        </div>
      )}

      {enemyCard && (
        <div className="ba2-enemy-card">
          <div className="ba2-enemy-card-label">RIVAL JOGOU</div>
          <CardView card={enemyCard} big />
        </div>
      )}

      {flying && <FlyingCard key={flying.id} {...flying} />}

      {toast && <div className="ba2-toast">{toast}</div>}

      {intro && <VsIntro player={player} enemy={enemy} />}

      {info && view && <MonsterInfo id={view[info].monsterId} onClose={() => setInfo(null)} />}

      {initError && (
        <div className="ba2-modal" role="alertdialog">
          <div className="ba2-modal-box">
            <div className="ba2-modal-title">Não deu pra abrir a arena</div>
            <div className="ba2-info-sub">Seu aparelho não conseguiu carregar os gráficos. Tente de novo.</div>
            <div className="ba2-modal-actions">
              <button className="ba2-btn" onClick={onExit}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="ba2-modal" onClick={() => setConfirmExit(false)}>
          <div className="ba2-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ba2-modal-title">Desistir da batalha?</div>
            <div className="ba2-modal-actions">
              <button className="ba2-btn ba2-btn-ghost" onClick={() => setConfirmExit(false)}>
                Continuar
              </button>
              <button className="ba2-btn ba2-btn-danger" onClick={onExit}>
                Desistir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlyingCard({ card, rect, to }: { card: CardDef; rect: DOMRect; to: { x: number; y: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    el.style.transform = `translate(0px,0px) scale(1.4) rotate(0deg)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = `translate(${to.x - cx}px, ${to.y - cy}px) scale(0.35) rotate(${to.x > cx ? 25 : -25}deg)`;
        el.style.opacity = "0";
      });
    });
  }, [rect, to]);
  return (
    <div ref={ref} className="ba2-flying" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
      <CardView card={card} />
    </div>
  );
}

function VsIntro({ player, enemy }: { player: string; enemy: string }) {
  const p = MONSTERS[player];
  const e = MONSTERS[enemy];
  return (
    <div className="ba2-vs">
      <div className="ba2-vs-side ba2-vs-p" style={{ ["--c" as string]: p.cor }}>
        <img src={MONSTER_ART[player]} alt="" />
        <div className="ba2-vs-name">{p.nome}</div>
      </div>
      <div className="ba2-vs-mark">VS</div>
      <div className="ba2-vs-side ba2-vs-e" style={{ ["--c" as string]: e.cor }}>
        <img src={MONSTER_ART[enemy]} alt="" />
        <div className="ba2-vs-name">{e.nome}</div>
      </div>
    </div>
  );
}

function MonsterInfo({ id, onClose }: { id: string; onClose: () => void }) {
  const m = MONSTERS[id];
  const el = ELEMENTO_INFO[m.elemento];
  const forte = FORTE_CONTRA[m.elemento].map((x) => ELEMENTO_INFO[x]);
  const fraco = (Object.keys(FORTE_CONTRA) as (keyof typeof FORTE_CONTRA)[]).filter((k) => FORTE_CONTRA[k].includes(m.elemento)).map((x) => ELEMENTO_INFO[x]);
  return (
    <div className="ba2-modal" onClick={onClose}>
      <div className="ba2-modal-box ba2-info" onClick={(e) => e.stopPropagation()} style={{ ["--c" as string]: m.cor }}>
        <img className="ba2-info-img" src={MONSTER_ART[id]} alt="" />
        <div className="ba2-modal-title">{m.nome}</div>
        <div className="ba2-info-sub">
          {el.icone} {el.nome} · {m.titulo}
        </div>
        <div className="ba2-info-pass">
          <b>{m.passivaNome}</b>
          <span>{m.passivaTexto}</span>
        </div>
        <div className="ba2-info-row">
          <span>Forte contra: {forte.map((f) => `${f.icone} ${f.nome}`).join(", ")}</span>
          <span>Fraco contra: {fraco.map((f) => `${f.icone} ${f.nome}`).join(", ")}</span>
        </div>
        <button className="ba2-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

