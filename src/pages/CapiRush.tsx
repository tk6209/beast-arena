import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsUp, Coins, Heart, Magnet, Pause, Play, Rocket, Shield } from "lucide-react";
import UniverseBackLink from "@/components/capynite/UniverseBackLink";
import { CAPYNITE_STORAGE } from "@/brand/capynite";
import { BASE_SPEED, JET_TIME, MAGNET_TIME, MAX_SPEED, MULTI_TIME, NO_INPUT, START_LIVES, createState, step, type RushInput, type RushState } from "@/games/capirush/engine";
import { HEROES, getHero, preloadHeroes, type Hero } from "@/games/capirush/heroes";
import { Fx, drawScene, makeView } from "@/games/capirush/render";

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
  level: number;
}

const HUD0: Hud = { score: 0, coins: 0, lives: START_LIVES, shield: false, meters: 0, speed: 0, magnet: 0, jet: 0, multi: 0, airJump: true, level: 1 };

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
    level: s.level,
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

export default function CapiRush() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RushState>(createState(1));
  const phaseRef = useRef<Phase>("ready");
  const pendingRef = useRef<RushInput>({ ...NO_INPUT });
  const fxRef = useRef(new Fx());
  const heroRef = useRef<Hero>(getHero(readStore(CAPYNITE_STORAGE.rushHero)));

  const [phase, setPhaseState] = useState<Phase>("ready");
  const [hero, setHero] = useState<Hero>(heroRef.current);
  const [hud, setHud] = useState<Hud>(HUD0);
  const [best, setBest] = useState(readBest);
  const [newRecord, setNewRecord] = useState(false);
  /** Aviso "Nível N" que aparece por ~1,8 s quando o jogador sobe de nível. */
  const [levelUp, setLevelUp] = useState<{ level: number; key: number } | null>(null);
  const levelTimer = useRef<number>();

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
    fxRef.current = new Fx();
    pendingRef.current = { ...NO_INPUT };
    setNewRecord(false);
    setLevelUp(null);
    setHud(HUD0);
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
    return () => window.clearTimeout(levelTimer.current);
  }, []);

  /* Loop principal */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let view = makeView(wrap.clientWidth || 360, wrap.clientHeight || 640);
    const resize = () => {
      const W = wrap.clientWidth || 360;
      const H = wrap.clientHeight || 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cam = view.cam;
      view = makeView(W, H);
      view.cam = cam;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // O timestamp do rAF pode ser anterior ao performance.now() inicial: nunca deixe dt negativo.
      const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20));
      last = now;
      const s = stateRef.current;
      const fx = fxRef.current;
      const ph = phaseRef.current;

      if (ph === "playing") {
        const input = pendingRef.current;
        pendingRef.current = { ...NO_INPUT };
        // Passos fixos de até 1/60 s para o movimento ficar estável em telas lentas.
        let left = dt;
        let events: ReturnType<typeof step> = [];
        let first = true;
        while (left > 1e-6) {
          const h = Math.min(left, 1 / 60);
          events = events.concat(step(s, h, first ? input : NO_INPUT));
          first = false;
          left -= h;
        }
        fx.onEvents(events, s, heroRef.current, reduced);
        fx.update(dt, s, 0, true);
        if (events.includes("level")) {
          setLevelUp({ level: s.level, key: now });
          window.clearTimeout(levelTimer.current);
          levelTimer.current = window.setTimeout(() => setLevelUp(null), 1800);
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
      } else if (ph === "ready") {
        // Vitrine: a cidade passa devagar atrás do menu.
        s.distance += dt * 9;
        s.time += dt;
        fx.update(dt, s, 0, false);
      } else {
        fx.update(dt * (ph === "over" ? 1 : 0), s, 0, false);
      }

      drawScene(ctx, view, s, { heroId: heroRef.current.id, fx, reduced });
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
    <main className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#050611] text-white">
      <div
        ref={wrapRef}
        data-testid="rush-stage"
        className="absolute inset-0 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (touch.current = null)}
      >
        <canvas ref={canvasRef} className="block h-full w-full" aria-label="Capi Rush: corrida de capivara por CapyCity e pela selva" role="img" />
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

      {/* Aviso de nível novo */}
      {phase === "playing" && levelUp && (
        <div key={levelUp.key} role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[28%] flex justify-center animate-in fade-in zoom-in-90 duration-300">
          <div className="rounded-2xl border border-amber-300/40 bg-black/45 px-5 py-2 text-center backdrop-blur-md">
            <div className="font-['Bebas_Neue'] text-4xl leading-none tracking-wider text-amber-200 drop-shadow-[0_0_18px_rgba(255,207,74,.6)]">Nível {levelUp.level}</div>
            <div className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-white/70">Mais rápido · mais desafios</div>
          </div>
        </div>
      )}

      {/* Medidor de velocidade + distância */}
      {playing && (
        <div className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-3 flex items-end justify-between gap-3">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur">
            <span data-testid="rush-meters" className="font-['Bebas_Neue'] text-2xl tracking-wide">{hud.meters.toLocaleString("pt-BR")}</span>
            <span className="ml-1 text-xs font-bold text-white/55">m</span>
          </div>
          <div className="w-32 sm:w-44">
            <div className="mb-1 flex justify-between text-[10px] font-bold text-white/55">
              <span>Velocidade · Nv {hud.level}</span>
              <span>{speedPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${Math.max(4, speedPct)}%`, background: `linear-gradient(90deg, ${hero.accent}, #ffcf4a, #ff7a45)` }} />
            </div>
          </div>
        </div>
      )}

      {phase === "ready" && (
        <Overlay>
          <h1 className="font-['Bebas_Neue'] text-7xl leading-[0.82] tracking-wide text-white drop-shadow-[0_4px_24px_rgba(56,225,255,.45)]">CAPI RUSH</h1>
          <p className="mx-auto mt-2 max-w-[17rem] text-sm font-semibold text-white/65">Atravesse CapyCity e a selva antiga. Quanto mais longe, mais rápido.</p>

          <div className="relative mx-auto mt-3 flex h-36 items-end justify-center">
            <div aria-hidden className="absolute bottom-0 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full blur-2xl" style={{ background: hero.accent, opacity: 0.45 }} />
            <img key={hero.id} src={hero.portrait} alt={hero.name} draggable={false} className="relative max-h-full w-auto max-w-[11rem] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,.6)] animate-in fade-in zoom-in-95 duration-200" />
          </div>
          <div className="mt-1 font-['Bebas_Neue'] text-3xl leading-none tracking-wider" style={{ color: hero.accent }}>{hero.name}</div>
          <div className="text-xs font-semibold text-white/55">{hero.tagline}</div>

          <div role="radiogroup" aria-label="Escolha seu herói" className="mt-3 flex justify-center gap-1.5">
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
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl border bg-white/5 p-1 transition ${on ? "scale-110 bg-white/15" : "opacity-60 hover:opacity-100"}`}
                  style={{ borderColor: on ? h.accent : "rgba(255,255,255,.12)", boxShadow: on ? `0 0 18px ${h.accent}66` : undefined }}
                >
                  <img src={h.portrait} alt="" draggable={false} className="h-full w-full object-contain object-bottom" />
                </button>
              );
            })}
          </div>

          <PlayButton onClick={start}>JOGAR</PlayButton>
          <p className="mt-3 text-[11px] font-semibold leading-snug text-white/55">Deslize para os lados para trocar de pista, para cima para pular (de novo no ar = pulo duplo) e para baixo para rolar. Pegue ímã, foguete, x2, escudo e caixas-presente. No teclado: setas ou WASD.</p>
          {best > 0 && <div className="mt-2 text-xs font-bold text-amber-300">Recorde: {best.toLocaleString("pt-BR")}</div>}
        </Overlay>
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
          <PlayButton onClick={start}>JOGAR DE NOVO</PlayButton>
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
