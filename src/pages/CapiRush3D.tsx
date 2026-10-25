import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsUp, Coins, Heart, Magnet, Pause, Play, Rocket, Shield } from "lucide-react";
import UniverseBackLink from "@/components/capynite/UniverseBackLink";
import { CAPYNITE_STORAGE } from "@/brand/capynite";
import { BASE_SPEED, JET_TIME, MAGNET_TIME, MAX_SPEED, MULTI_TIME, NO_INPUT, START_LIVES, continueFromCheckpoint, createState, step, type RushInput, type RushState } from "@/games/capirush/engine";
import { HEROES, getHero, preloadHeroes, type Hero } from "@/games/capirush/heroes";
import { Rush3D } from "@/games/capirush3d/world";
import "./capirush3d.css";
import type { CapyHeroId } from "@/games/capy3d/capybara";

type Phase = "ready" | "playing" | "paused" | "over";

interface Hud {
  score: number;
  coins: number;
  lives: number;
  shield: boolean;
  meters: number;
  speed: number;
  magnet: number;
  jet: number;
  multi: number;
  airJump: boolean;
}

const HUD0: Hud = { score: 0, coins: 0, lives: START_LIVES, shield: false, meters: 0, speed: 0, magnet: 0, jet: 0, multi: 0, airJump: true };

function hudOf(s: RushState): Hud {
  const r = (n: number) => Math.round(n * 10) / 10;
  return {
    score: s.score,
    coins: s.coins,
    lives: s.lives,
    shield: s.shield,
    meters: Math.floor(s.distance),
    speed: Math.round(s.speed * 5) / 5,
    magnet: r(s.magnet),
    jet: r(s.jet),
    multi: r(s.multi),
    airJump: s.y <= 0 || s.jumpsLeft > 0,
  };
}
const sameHud = (a: Hud, b: Hud) => (Object.keys(a) as (keyof Hud)[]).every((k) => a[k] === b[k]);
const SWIPE_PX = 22;

function readStore(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* armazenamento indisponível (modo privado): vale só nesta sessão */
  }
}
function readBest(): number {
  const n = Number.parseInt(readStore(CAPYNITE_STORAGE.rushHighscore) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export default function CapiRush3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<ReturnType<typeof step>>([]);
  const stateRef = useRef<RushState>(createState(1));
  const phaseRef = useRef<Phase>("ready");
  const pendingRef = useRef<RushInput>({ ...NO_INPUT });
  const heroRef = useRef<Hero>(getHero(readStore(CAPYNITE_STORAGE.rushHero)));

  const [phase, setPhaseState] = useState<Phase>("ready");
  const [hero, setHero] = useState<Hero>(heroRef.current);
  const [hud, setHud] = useState<Hud>(HUD0);
  const [best, setBest] = useState(readBest);
  const [newRecord, setNewRecord] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const [hitAt, setHitAt] = useState(0);
  const [cpBanner, setCpBanner] = useState<{ at: number; m: number; level: number } | null>(null);
  const [cpAvailable, setCpAvailable] = useState<number | null>(null);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const pickHero = useCallback((h: Hero) => {
    heroRef.current = h;
    setHero(h);
    writeStore(CAPYNITE_STORAGE.rushHero, h.id);
  }, []);

  // Pré-visualização do bioma na vitrine: /capi-rush?m=1000 (só muda o fundo do menu).
  useEffect(() => {
    const m = Number.parseInt(new URLSearchParams(window.location.search).get("m") || "", 10);
    if (Number.isFinite(m) && m > 0) stateRef.current.distance = m;
  }, []);

  const start = useCallback(() => {
    stateRef.current = createState((Date.now() & 0x7fffffff) || 1);
    // QA shortcut: /capi-rush-3d?start=300 begins further down the track (trains appear after 120 m).
    const skip = Number.parseInt(new URLSearchParams(window.location.search).get("start") || "", 10);
    if (Number.isFinite(skip) && skip > 0) stateRef.current.distance = Math.min(skip, 2000);
    pendingRef.current = { ...NO_INPUT };
    setNewRecord(false);
    setHud(HUD0);
    setPhase("playing");
  }, [setPhase]);

  const continueRun = useCallback(() => {
    const next = continueFromCheckpoint(stateRef.current, (Date.now() & 0x7fffffff) || 1);
    if (!next) return;
    stateRef.current = next;
    pendingRef.current = { ...NO_INPUT };
    setNewRecord(false);
    setHud(hudOf(next));
    setPhase("playing");
  }, [setPhase]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") setPhase("paused");
    else if (phaseRef.current === "paused") setPhase("playing");
  }, [setPhase]);

  const queue = useCallback((k: keyof RushInput) => {
    pendingRef.current[k] = true;
  }, []);

  useEffect(() => {
    preloadHeroes();
  }, []);

  /* Loop principal */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let world: Rush3D;
    try {
      world = new Rush3D(host);
    } catch (err) {
      console.error("Capi Rush 3D: WebGL indisponível", err);
      setNoGl(true);
      return;
    }
    world.setHero(heroRef.current.id as CapyHeroId);
    const ro = new ResizeObserver(() => world.resize());
    ro.observe(host);

    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    let prevPhase = phaseRef.current;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // O timestamp do rAF pode ser anterior ao performance.now() inicial: nunca deixe dt negativo.
      const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20));
      last = now;
      const s = stateRef.current;
      const ph = phaseRef.current;
      if (ph !== prevPhase && ph === "playing" && prevPhase !== "paused") world.snapCamera();
      prevPhase = ph;
      world.setHero(heroRef.current.id as CapyHeroId);
      let events: ReturnType<typeof step> = [];

      if (ph === "playing") {
        const input = pendingRef.current;
        pendingRef.current = { ...NO_INPUT };
        // Passos fixos de até 1/60 s para o movimento ficar estável em telas lentas.
        let left = dt;
        let first = true;
        while (left > 1e-6) {
          const h = Math.min(left, 1 / 60);
          events = events.concat(step(s, h, first ? input : NO_INPUT));
          first = false;
          left -= h;
        }
        if (events.includes("over")) {
          setPhase("over");
          setHud({ ...hudOf(s), lives: 0, shield: false, magnet: 0, jet: 0, multi: 0 });
          setBest((prev) => {
            if (s.score > prev) {
              writeStore(CAPYNITE_STORAGE.rushHighscore, String(s.score));
              setNewRecord(true);
              return s.score;
            }
            return prev;
          });
        } else if (now - hudAt > 90) {
          hudAt = now;
          const next = hudOf(s);
          setHud((h) => (sameHud(h, next) ? h : next));
        }
        if (events.includes("hit")) setHitAt(now);
        if (events.includes("checkpoint") && s.checkpoint) setCpBanner({ at: now, m: s.checkpoint.distance, level: s.level });
        if (events.includes("over")) setCpAvailable(s.checkpoint ? s.checkpoint.distance : null);
      }
      eventsRef.current = events;
      world.frame(ph === "paused" ? 0 : dt, s, events, ph);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      last = performance.now();
      if (document.hidden && phaseRef.current === "playing") setPhase("paused");
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      world.destroy();
    };
  }, [setPhase]);

  /* Teclado */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ph = phaseRef.current;
      if (ph === "ready" || ph === "over") {
        if (k === "enter" || k === " ") {
          e.preventDefault();
          start();
        } else if (ph === "ready" && (k === "arrowleft" || k === "arrowright")) {
          const i = HEROES.findIndex((h) => h.id === heroRef.current.id);
          pickHero(HEROES[(i + (k === "arrowright" ? 1 : HEROES.length - 1)) % HEROES.length]);
        }
        return;
      }
      if (k === "p" || k === "escape") {
        e.preventDefault();
        togglePause();
        return;
      }
      if (ph !== "playing" || e.repeat) return;
      if (k === "arrowleft" || k === "a") queue("left");
      else if (k === "arrowright" || k === "d") queue("right");
      else if (k === "arrowup" || k === "w" || k === " ") queue("jump");
      else if (k === "arrowdown" || k === "s") queue("slide");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue, start, pickHero, togglePause]);

  /* Toque: deslizar o dedo = trocar de pista / pular / deslizar; toque curto = pular */
  const touch = useRef<{ x: number; y: number; id: number; used: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "playing") return;
    touch.current = { x: e.clientX, y: e.clientY, id: e.pointerId, used: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const t = touch.current;
    if (!t || t.id !== e.pointerId) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    if (Math.abs(dx) > Math.abs(dy)) queue(dx < 0 ? "left" : "right");
    else queue(dy < 0 ? "jump" : "slide");
    // Permite encadear gestos sem tirar o dedo da tela.
    touch.current = { x: e.clientX, y: e.clientY, id: e.pointerId, used: true };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t || t.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - t.x, e.clientY - t.y);
    if (!t.used && moved < SWIPE_PX / 2) queue("jump");
  };

  const speedPct = Math.round(Math.max(0, Math.min(1, (hud.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED))) * 100);
  const playing = phase === "playing" || phase === "paused";

  return (
    <main className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#8fd3ff] text-white">
      {hitAt > 0 && <div key={hitAt} aria-hidden className="pointer-events-none absolute inset-0 z-10 animate-[rush3dHit_.45s_ease-out_forwards] bg-[radial-gradient(circle,transparent_45%,rgba(255,40,40,.55))]" />}
      {cpBanner && (
        <div key={cpBanner.at} aria-live="polite" className="rush3d-cp pointer-events-none absolute inset-x-0 top-[22%] z-20 text-center">
          <div className="rush3d-title font-['Bebas_Neue'] text-6xl leading-none text-[#6dff8a]">CHECKPOINT!</div>
          <div className="mt-1 text-lg font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,.6)]">🚩 {cpBanner.m.toLocaleString("pt-BR")} m salvos · Nível {cpBanner.level}</div>
        </div>
      )}
      {noGl && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#050611] p-6 text-center">
          <div>
            <div className="font-['Bebas_Neue'] text-4xl">Sem 3D neste aparelho</div>
            <p className="mt-2 text-sm text-white/70">Seu navegador não liberou gráficos 3D (WebGL).</p>
            <a href="/capi-rush" className="mt-4 inline-block rounded-xl bg-white/15 px-4 py-2 font-bold">Jogar a versão clássica</a>
          </div>
        </div>
      )}
      <div
        ref={wrapRef}
        data-testid="rush-stage"
        className="absolute inset-0 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (touch.current = null)}
      >
        <div ref={hostRef} className="absolute inset-0" role="img" aria-label="Capi Rush 3D: corrida de capivara por CapyCity" />
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          <UniverseBackLink />
          {playing && (
            <button
              type="button"
              onClick={togglePause}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={phase === "paused" ? "Continuar" : "Pausar"}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md transition hover:border-cyan-300/50"
            >
              {phase === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
        <div
          className="flex items-stretch gap-2 rounded-2xl border bg-black/50 p-2 pr-3 backdrop-blur-md"
          style={{ borderColor: `${hero.accent}55`, boxShadow: `0 0 28px ${hero.accent}22` }}
        >
          <img src={hero.portrait} alt="" draggable={false} className="h-12 w-12 shrink-0 rounded-xl bg-white/5 object-contain object-bottom" style={{ boxShadow: `inset 0 0 0 1.5px ${hero.accent}88` }} />
          <div className="flex min-w-[88px] flex-col items-end justify-between">
            <div data-testid="rush-score" className="font-['Bebas_Neue'] text-3xl leading-none tracking-wide text-white">
              {hud.score.toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center gap-2.5 text-[13px] font-bold leading-none">
              <span className="flex items-center gap-1 text-amber-300">
                <Coins className="h-3.5 w-3.5" /> {hud.coins}
              </span>
              <span className="flex items-center gap-0.5" aria-label={`${hud.lives} vidas`}>
                {Array.from({ length: START_LIVES }, (_, i) => (
                  <Heart key={i} className={`h-3.5 w-3.5 ${i < hud.lives ? "fill-rose-400 text-rose-400" : "text-white/25"}`} />
                ))}
              </span>
              {hud.shield && <Shield className="h-3.5 w-3.5 text-cyan-300" aria-label="Escudo ativo" />}
            </div>
          </div>
        </div>
        {playing && (
          <div className="flex flex-wrap justify-end gap-1.5" aria-live="polite">
            {hud.jet > 0 && <PowerChip icon={<Rocket className="h-3.5 w-3.5" />} label="Foguete" left={hud.jet} total={JET_TIME} color="#ff7a45" />}
            {hud.magnet > 0 && <PowerChip icon={<Magnet className="h-3.5 w-3.5" />} label="Ímã" left={hud.magnet} total={MAGNET_TIME} color="#ff4d6d" />}
            {hud.multi > 0 && <PowerChip icon={<span className="font-['Bebas_Neue'] text-sm leading-none">x2</span>} label="Pontos x2" left={hud.multi} total={MULTI_TIME} color="#ffcf4a" />}
            {hud.jet <= 0 && (
              <span
                className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold backdrop-blur ${hud.airJump ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-black/40 text-white/35"}`}
                aria-label={hud.airJump ? "Pulo duplo pronto" : "Pulo duplo usado"}
              >
                <ChevronsUp className="h-3.5 w-3.5" /> Pulo duplo
              </span>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Medidor de velocidade + distância */}
      {playing && (
        <div className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-3 flex items-end justify-between gap-3">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur">
            <span data-testid="rush-meters" className="font-['Bebas_Neue'] text-2xl tracking-wide">{hud.meters.toLocaleString("pt-BR")}</span>
            <span className="ml-1 text-xs font-bold text-white/55">m</span>
          </div>
          <div className="w-32 sm:w-44">
            <div className="mb-1 flex justify-between text-[10px] font-bold text-white/55">
              <span>Velocidade</span>
              <span>{speedPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${Math.max(4, speedPct)}%`, background: `linear-gradient(90deg, ${hero.accent}, #ffcf4a, #ff7a45)` }} />
            </div>
          </div>
        </div>
      )}

      {phase === "ready" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,env(safe-area-inset-top))] text-center">
          <div>
            <h1 className="rush3d-title font-['Bebas_Neue'] text-7xl leading-[0.82] tracking-wide text-white">CAPI RUSH</h1>
            <div className="mt-1 inline-block -rotate-2 rounded-lg bg-[#ff2d6f] px-2 py-0.5 font-['Bebas_Neue'] text-lg tracking-widest text-white shadow-[0_4px_0_#7a0030]">3D</div>
          </div>
          <div className="pointer-events-auto mx-auto w-full max-w-sm">
            <div className="rush3d-name font-['Bebas_Neue'] text-5xl leading-none tracking-wider text-white">{hero.name}</div>
            <div className="mb-3 text-sm font-extrabold text-white [text-shadow:0_2px_0_rgba(0,0,0,.45)]">{hero.tagline}</div>
            <div role="radiogroup" aria-label="Escolha seu herói" className="flex justify-center gap-2">
              {HEROES.map((h) => {
                const on = h.id === hero.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={h.name}
                    onClick={() => pickHero(h)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-[3px] bg-[#1d3b8f] p-0.5 shadow-[0_4px_0_rgba(0,0,0,.35)] transition ${on ? "-translate-y-1 scale-110" : "opacity-80"}`}
                    style={{ borderColor: on ? "#ffd34a" : "rgba(255,255,255,.6)" }}
                  >
                    <img src={h.portrait} alt="" draggable={false} className="h-full w-full object-contain object-bottom" />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={start}
              onPointerDown={(e) => e.stopPropagation()}
              className="rush3d-play mt-4 inline-flex min-h-16 w-full items-center justify-center rounded-2xl font-['Bebas_Neue'] text-4xl tracking-wider text-[#2a1600] transition active:translate-y-1"
            >
              CORRER!
            </button>
            {best > 0 && <div className="mt-2 text-sm font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,.5)]">🏆 Recorde: {best.toLocaleString("pt-BR")}</div>}
            <p className="mt-2 text-[11px] font-bold leading-snug text-white/90 [text-shadow:0_1px_0_rgba(0,0,0,.6)]">Deslize: lados troca de pista, cima pula (2x no ar = mortal), baixo rola.</p>
          </div>
        </div>
      )}

      {phase === "paused" && (
        <Overlay>
          <div className="font-['Bebas_Neue'] text-6xl leading-none text-white">PAUSADO</div>
          <PlayButton onClick={togglePause}>CONTINUAR</PlayButton>
        </Overlay>
      )}

      {phase === "over" && (
        <Overlay>
          <img src={hero.portrait} alt="" draggable={false} className="mx-auto h-24 w-auto object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,.6)]" />
          <div className="mt-1 text-sm font-bold text-rose-300">Fim da corrida</div>
          <div data-testid="rush-final" className="font-['Bebas_Neue'] text-7xl leading-[0.85] text-white">
            {hud.score.toLocaleString("pt-BR")}
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-base font-bold">
            <span className="flex items-center gap-1 text-amber-300"><Coins className="h-4 w-4" /> {hud.coins}</span>
            <span className="text-white/70">{hud.meters.toLocaleString("pt-BR")} m</span>
          </div>
          {newRecord ? (
            <div className="mt-2 text-sm font-black text-emerald-300">Novo recorde!</div>
          ) : (
            <div className="mt-2 text-xs font-bold text-white/55">Recorde: {best.toLocaleString("pt-BR")}</div>
          )}
          {cpAvailable !== null && (
            <button
              type="button"
              onClick={continueRun}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-4 inline-flex min-h-14 w-full flex-col items-center justify-center rounded-2xl border-[3px] border-[#1b2c6b] bg-gradient-to-b from-[#7dff9a] to-[#22b04f] px-6 font-['Bebas_Neue'] text-3xl leading-none tracking-wider text-[#06281a] shadow-[0_6px_0_#0d6b2c] transition active:translate-y-1"
            >
              CONTINUAR DO CHECKPOINT
              <span className="font-sans text-xs font-black tracking-normal">🚩 a partir de {cpAvailable.toLocaleString("pt-BR")} m</span>
            </button>
          )}
          <PlayButton onClick={start}>{cpAvailable !== null ? "RECOMEÇAR DO ZERO" : "JOGAR DE NOVO"}</PlayButton>
        </Overlay>
      )}
    </main>
  );
}

function PowerChip({ icon, label, left, total, color }: { icon: React.ReactNode; label: string; left: number; total: number; color: string }) {
  const pct = Math.max(0, Math.min(1, left / total));
  const ending = left < 1.5;
  return (
    <span
      className={`relative flex items-center gap-1 overflow-hidden rounded-full border bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur ${ending ? "animate-pulse" : ""}`}
      style={{ borderColor: `${color}88`, boxShadow: `0 0 14px ${color}44` }}
      aria-label={`${label}: ${Math.ceil(left)} segundos`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 opacity-30" style={{ width: `${pct * 100}%`, background: color }} />
      <span className="relative flex items-center gap-1" style={{ color }}>{icon}</span>
      <span className="relative tabular-nums">{Math.ceil(left)}s</span>
    </span>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-[#050611]/60 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-[28px] border border-white/15 bg-black/55 p-5 text-center shadow-[0_30px_90px_rgba(0,0,0,.55)] backdrop-blur-xl">{children}</div>
    </div>
  );
}

function PlayButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffcf4a] to-[#ff7a45] px-6 font-['Bebas_Neue'] text-3xl tracking-wider text-[#07061a] shadow-[0_8px_30px_rgba(255,122,69,.35)] transition active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
