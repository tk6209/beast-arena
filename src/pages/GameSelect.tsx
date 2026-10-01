import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Gamepad2, LockKeyhole, Map, Sparkles, Trophy, Zap } from "lucide-react";
import { CAPYNITE_BRAND, CAPYNITE_STORAGE, CAPYNITE_WORLDS, type CapyniteWorld } from "@/brand/capynite";
import UniverseMark from "@/components/capynite/UniverseMark";
import "@/brand/capynite.css";
import capiArt from "@/assets/monsters/capirocket.png";
import drakoArt from "@/assets/monsters/drako.png";
import capiviniArt from "@/assets/monsters/capivini.png";
import herosBg from "@/assets/capy_herois_360.webp";

const WORLD_ART: Record<string, string> = {
  "beast-arena": drakoArt,
  "capi-wars": capiArt,
  "unknown-zone": capiviniArt,
};

function readNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const value = Number.parseInt(window.localStorage.getItem(key) || "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function worldStatus(world: CapyniteWorld) {
  return world.status === "live" ? "Disponível agora" : "Em construção";
}

export default function GameSelect() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(() => {
    if (typeof window === "undefined") return CAPYNITE_WORLDS[0].id;
    return window.localStorage.getItem(CAPYNITE_STORAGE.lastWorld) || CAPYNITE_WORLDS[0].id;
  });

  const activeWorld = useMemo(
    () => CAPYNITE_WORLDS.find((world) => world.id === activeId) || CAPYNITE_WORLDS[0],
    [activeId],
  );

  const playerName = typeof window === "undefined"
    ? "PLAYER 01"
    : window.localStorage.getItem(CAPYNITE_STORAGE.beastPlayerName) || "PLAYER 01";
  const beastWins = readNumber(CAPYNITE_STORAGE.beastGuestWins);
  const capyHighscore = readNumber(CAPYNITE_STORAGE.capyHighscore);

  const launch = (world: CapyniteWorld) => {
    setActiveId(world.id);
    if (world.status !== "live" || world.runtime === "locked") return;
    window.localStorage.setItem(CAPYNITE_STORAGE.lastWorld, world.id);
    if (world.runtime === "spa") navigate(world.href);
    else window.location.assign(world.href);
  };

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#050611] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-[0.10]"
        style={{ backgroundImage: `url(${herosBg})` }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(124,58,237,.28),transparent_30%),radial-gradient(circle_at_85%_55%,rgba(56,225,255,.12),transparent_28%),linear-gradient(180deg,rgba(5,6,17,.78),rgba(5,6,17,.97))]" />
      <div aria-hidden className="capynite-grid pointer-events-none fixed inset-0 opacity-40" />
      <div aria-hidden className="capynite-orb capynite-orb-a" />
      <div aria-hidden className="capynite-orb capynite-orb-b" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1480px] flex-col px-4 pb-8 pt-5 sm:px-7 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <UniverseMark />
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55 backdrop-blur md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.8)]" />
            CapyCity Online
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-xl">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-cyan-300 font-['Bebas_Neue'] text-xl text-[#07061a] shadow-[0_0_22px_rgba(56,225,255,.28)]">J</div>
            <div className="hidden sm:block">
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Creator signal</div>
              <div className="font-['Bebas_Neue'] text-lg tracking-wider text-white">JOSHUA</div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-5">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-violet-100">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              {CAPYNITE_BRAND.creatorLine}
            </div>

            <h1 className="font-['Bebas_Neue'] text-[clamp(4.8rem,13vw,9.7rem)] leading-[0.73] tracking-[-0.015em] text-white">
              CAPY
              <span className="block bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent">VERSE</span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-semibold leading-relaxed text-white/62 sm:text-lg">
              {CAPYNITE_BRAND.tagline} Entre em cada mundo, descubra novos personagens e construa a sua história dentro do universo do Joshua.
            </p>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              <Metric icon={<Gamepad2 className="h-4 w-4" />} value="2" label="Mundos jogáveis" />
              <Metric icon={<Trophy className="h-4 w-4" />} value={String(beastWins)} label="Vitórias locais" />
              <Metric icon={<Zap className="h-4 w-4" />} value={capyHighscore.toLocaleString("pt-BR")} label="Recorde Capi Wars" />
            </div>

            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 backdrop-blur-lg sm:max-w-xl">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 font-['Bebas_Neue'] text-xl text-cyan-100">01</div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black uppercase tracking-[0.24em] text-white/35">Capynite Passport</div>
                <div className="truncate font-['Bebas_Neue'] text-2xl tracking-wide text-white">{playerName}</div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">Status</div>
                <div className="text-xs font-black uppercase tracking-widest text-emerald-300">Explorador</div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[500px] rounded-[34px] border border-white/10 bg-black/30 p-3 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-4">
            <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
            <div className="mb-3 flex items-center justify-between px-1 py-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">Mapa do universo</div>
                <div className="mt-1 flex items-center gap-2 font-['Bebas_Neue'] text-2xl tracking-wider text-white">
                  <Map className="h-5 w-5 text-cyan-300" /> ESCOLHA UM MUNDO
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">{CAPYNITE_BRAND.city}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {CAPYNITE_WORLDS.map((world) => {
                const active = world.id === activeWorld.id;
                const locked = world.status !== "live";
                return (
                  <button
                    key={world.id}
                    type="button"
                    onClick={() => locked ? setActiveId(world.id) : launch(world)}
                    onMouseEnter={() => setActiveId(world.id)}
                    className={`group relative min-h-[250px] overflow-hidden rounded-[26px] border text-left transition duration-300 ${active ? "-translate-y-1 border-white/35 bg-white/[0.09] shadow-[0_22px_48px_rgba(0,0,0,.38)]" : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]"}`}
                    aria-pressed={active}
                  >
                    <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 50% 35%, ${world.accent}35, transparent 48%), linear-gradient(180deg, transparent, #050611 86%)` }} />
                    <img
                      src={WORLD_ART[world.id]}
                      alt=""
                      draggable={false}
                      className={`absolute left-1/2 top-2 h-[68%] w-auto max-w-[90%] -translate-x-1/2 object-contain drop-shadow-[0_15px_28px_rgba(0,0,0,.55)] transition duration-500 group-hover:scale-105 ${locked ? "grayscale opacity-45" : ""}`}
                    />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/65 backdrop-blur">
                      {locked && <LockKeyhole className="h-3 w-3" />}{world.badge}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">{world.eyebrow}</div>
                      <div className="mt-1 font-['Bebas_Neue'] text-3xl leading-none tracking-wide text-white">{world.name}</div>
                      <div className="mt-2 text-[11px] font-bold leading-snug text-white/50">{world.feature}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: activeWorld.accent }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: activeWorld.accent, boxShadow: `0 0 12px ${activeWorld.accent}` }} />
                    {worldStatus(activeWorld)}
                  </div>
                  <h2 className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-wide text-white sm:text-5xl">{activeWorld.name}</h2>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-white/55">{activeWorld.description}</p>
                </div>
                <button
                  type="button"
                  disabled={activeWorld.status !== "live"}
                  onClick={() => launch(activeWorld)}
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 font-['Bebas_Neue'] text-xl tracking-wider text-[#07061a] shadow-[0_8px_30px_rgba(0,0,0,.28)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                  style={{ background: `linear-gradient(135deg, ${activeWorld.accent}, ${activeWorld.secondary})` }}
                >
                  {activeWorld.status === "live" ? "ENTRAR NO MUNDO" : "EM BREVE"}
                  {activeWorld.status === "live" ? <ArrowRight className="h-5 w-5" /> : <LockKeyhole className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-4 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>{CAPYNITE_BRAND.name} · {CAPYNITE_BRAND.edition}</span>
          <span>Design language: playful · cinematic · child-safe</span>
        </footer>
      </div>
    </main>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-md">
      <div className="mb-2 text-cyan-300">{icon}</div>
      <div className="font-['Bebas_Neue'] text-2xl tracking-wide text-white sm:text-3xl">{value}</div>
      <div className="mt-0.5 text-[8px] font-black uppercase leading-tight tracking-[0.14em] text-white/35">{label}</div>
    </div>
  );
}
