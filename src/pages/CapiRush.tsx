import { useCallback, useEffect, useRef, useState } from "react";
import { Coins, Heart, Shield } from "lucide-react";
import UniverseBackLink from "@/components/capynite/UniverseBackLink";
import { CAPYNITE_STORAGE } from "@/brand/capynite";
import { NO_INPUT, START_LIVES, createState, step, type RushInput, type RushState } from "@/games/capirush/engine";
import { drawScene, makeView } from "@/games/capirush/render";

type Phase = "ready" | "playing" | "over";

interface Hud {
  score: number;
  coins: number;
  lives: number;
  shield: boolean;
}

const HUD0: Hud = { score: 0, coins: 0, lives: START_LIVES, shield: false };
const SWIPE_PX = 22;

function readBest(): number {
  try {
    const n = Number.parseInt(window.localStorage.getItem(CAPYNITE_STORAGE.rushHighscore) || "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(n: number) {
  try {
    window.localStorage.setItem(CAPYNITE_STORAGE.rushHighscore, String(n));
  } catch {
    /* armazenamento indisponível (modo privado): o recorde só vale nesta sessão */
  }
}

export default function CapiRush() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RushState>(createState(1));
  const phaseRef = useRef<Phase>("ready");
  const pendingRef = useRef<RushInput>({ ...NO_INPUT });
  const shakeRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState<Hud>(HUD0);
  const [best, setBest] = useState(readBest);
  const [newRecord, setNewRecord] = useState(false);

  const start = useCallback(() => {
    stateRef.current = createState((Date.now() & 0x7fffffff) || 1);
    pendingRef.current = { ...NO_INPUT };
    phaseRef.current = "playing";
    setPhase("playing");
    setNewRecord(false);
    setHud(HUD0);
  }, []);

  const queue = useCallback((k: keyof RushInput) => {
    pendingRef.current[k] = true;
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
      view = makeView(W, H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      const s = stateRef.current;

      if (phaseRef.current === "playing") {
        const input = pendingRef.current;
        pendingRef.current = { ...NO_INPUT };
        // Passos fixos de até 1/60 s para o movimento ficar estável em telas lentas.
        let left = dt;
        let events: string[] = [];
        let first = true;
        while (left > 1e-6) {
          const h = Math.min(left, 1 / 60);
          events = events.concat(step(s, h, first ? input : NO_INPUT));
          first = false;
          left -= h;
        }
        if (events.includes("hit") || events.includes("shield-break")) shakeRef.current = reduceMotion ? 0 : 14;
        if (events.includes("over")) {
          phaseRef.current = "over";
          setPhase("over");
          setHud({ score: s.score, coins: s.coins, lives: 0, shield: false });
          setBest((prev) => {
            if (s.score > prev) {
              writeBest(s.score);
              setNewRecord(true);
              return s.score;
            }
            return prev;
          });
        } else if (now - hudAt > 90) {
          hudAt = now;
          setHud((h) =>
            h.score === s.score && h.coins === s.coins && h.lives === s.lives && h.shield === s.shield
              ? h
              : { score: s.score, coins: s.coins, lives: s.lives, shield: s.shield },
          );
        }
      } else if (phaseRef.current === "ready") {
        // Vitrine: a cidade passa devagar atrás do menu.
        s.distance += dt * 6;
        s.time += dt;
      }

      shakeRef.current = Math.max(0, shakeRef.current - dt * 60);
      drawScene(ctx, view, s, shakeRef.current);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /* Teclado */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (phaseRef.current !== "playing") {
        if (k === "enter" || k === " ") {
          e.preventDefault();
          start();
        }
        return;
      }
      if (e.repeat) return;
      if (k === "arrowleft" || k === "a") queue("left");
      else if (k === "arrowright" || k === "d") queue("right");
      else if (k === "arrowup" || k === "w" || k === " ") queue("jump");
      else if (k === "arrowdown" || k === "s") queue("slide");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue, start]);

  /* Toque: deslizar o dedo = trocar de pista / pular / deslizar; toque curto = pular */
  const touch = useRef<{ x: number; y: number; id: number; used: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "playing") return;
    touch.current = { x: e.clientX, y: e.clientY, id: e.pointerId, used: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const t = touch.current;
    if (!t || t.id !== e.pointerId || t.used) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    t.used = true;
    if (Math.abs(dx) > Math.abs(dy)) queue(dx < 0 ? "left" : "right");
    else queue(dy < 0 ? "jump" : "slide");
    // Permite encadear gestos sem tirar o dedo da tela.
    touch.current = { x: e.clientX, y: e.clientY, id: e.pointerId, used: false };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t || t.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - t.x, e.clientY - t.y);
    if (!t.used && moved < SWIPE_PX / 2) queue("jump");
  };

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
        <canvas ref={canvasRef} className="block h-full w-full" aria-label="Capi Rush: corrida de capivara em CapyCity" role="img" />
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto">
          <UniverseBackLink />
        </div>
        <div className="flex flex-col items-end gap-1 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur">
          <div data-testid="rush-score" className="font-['Bebas_Neue'] text-3xl leading-none tracking-wide text-white">
            {hud.score.toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="flex items-center gap-1 text-amber-300">
              <Coins className="h-4 w-4" /> {hud.coins}
            </span>
            <span className="flex items-center gap-0.5" aria-label={`${hud.lives} vidas`}>
              {Array.from({ length: START_LIVES }, (_, i) => (
                <Heart key={i} className={`h-4 w-4 ${i < hud.lives ? "fill-rose-400 text-rose-400" : "text-white/25"}`} />
              ))}
            </span>
            {hud.shield && <Shield className="h-4 w-4 text-cyan-300" aria-label="Escudo ativo" />}
          </div>
        </div>
      </div>

      {phase === "ready" && (
        <Overlay>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">WORLD 03 · ENDLESS RUN</div>
          <h1 className="mt-1 font-['Bebas_Neue'] text-7xl leading-[0.85] tracking-wide text-white">CAPI RUSH</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm font-semibold text-white/65">
            Corra por CapyCity, desvie dos trens, pule as barreiras e junte moedas. Quanto mais longe, mais rápido!
          </p>
          <ul className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-2 text-left text-xs font-bold text-white/70">
            <li className="rounded-xl bg-white/5 p-2">👈👉 Deslize para os lados: troca de pista</li>
            <li className="rounded-xl bg-white/5 p-2">👆 Deslize para cima ou toque: pula</li>
            <li className="rounded-xl bg-white/5 p-2">👇 Deslize para baixo: rola sob as barras</li>
            <li className="rounded-xl bg-white/5 p-2">⌨️ Setas/WASD e Espaço no teclado</li>
          </ul>
          <PlayButton onClick={start}>JOGAR</PlayButton>
          {best > 0 && <div className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-300">Recorde: {best.toLocaleString("pt-BR")}</div>}
        </Overlay>
      )}

      {phase === "over" && (
        <Overlay>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-300">FIM DA CORRIDA</div>
          <div data-testid="rush-final" className="mt-1 font-['Bebas_Neue'] text-7xl leading-[0.85] text-white">
            {hud.score.toLocaleString("pt-BR")}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1 text-lg font-bold text-amber-300">
            <Coins className="h-5 w-5" /> {hud.coins} moedas
          </div>
          {newRecord ? (
            <div className="mt-2 text-sm font-black uppercase tracking-widest text-emerald-300">🏆 Novo recorde!</div>
          ) : (
            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-white/50">Recorde: {best.toLocaleString("pt-BR")}</div>
          )}
          <PlayButton onClick={start}>JOGAR DE NOVO</PlayButton>
        </Overlay>
      )}
    </main>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#050611]/65 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-[28px] border border-white/15 bg-black/55 p-5 text-center shadow-[0_30px_90px_rgba(0,0,0,.55)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

function PlayButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffcf4a] to-[#ff7a45] px-6 font-['Bebas_Neue'] text-3xl tracking-wider text-[#07061a] shadow-[0_8px_30px_rgba(255,122,69,.35)] transition active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
