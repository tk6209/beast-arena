import { useNavigate } from "react-router-dom";
import capiArt from "@/assets/monsters/capirocket.png";
import drakoArt from "@/assets/monsters/drako.png";
import herosBg from "@/assets/capy_herois_360.png";

/**
 * Menu inicial: o jogador escolhe qual jogo abrir antes de começar.
 * - Beast Arena (jogo de cartas) vive no app principal, em /beast-arena.
 * - CAPI WARS (run-and-gun) é uma entrada HTML própria, em /capyrocket.html.
 */
export default function GameSelect() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#05070d] text-white flex flex-col items-center justify-center px-5 py-8">
      {/* Fundo: mosaico dos heróis capivara, esmaecido. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.14]"
        style={{ backgroundImage: `url(${herosBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0f1a]/85 via-[#10131f]/88 to-[#05070d]/95"
      />

      <div className="relative z-10 flex w-full flex-col items-center">
      <header className="text-center mb-7">
        <h1
          className="text-5xl sm:text-6xl font-black tracking-wide"
          style={{ fontFamily: "'Bangers','Black Han Sans',sans-serif", color: "#ffcf4a", textShadow: "0 4px 0 #000, 0 0 28px rgba(255,207,74,.45)" }}
        >
          CAPYNITE ARCADE
        </h1>
        <p className="mt-2 text-sm sm:text-base uppercase tracking-[0.25em] text-slate-400" style={{ fontFamily: "'Oswald',sans-serif" }}>
          Escolha um jogo para começar
        </p>
      </header>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Beast Arena */}
        <button
          type="button"
          onClick={() => navigate("/beast-arena")}
          className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-rose-500/60 bg-[#140a12] text-left transition-transform duration-150 active:scale-[0.97] hover:border-rose-400"
        >
          <div className="relative h-44 sm:h-48 overflow-hidden bg-gradient-to-br from-[#3a1322] to-[#180a12]">
            <img
              src={drakoArt}
              alt="Beast Arena"
              className="absolute inset-0 m-auto h-[88%] w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105"
              draggable={false}
            />
          </div>
          <div className="p-5">
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Bangers','Black Han Sans',sans-serif", color: "#ffd3dc" }}>
              BEAST ARENA
            </h2>
            <p className="mt-1 text-sm text-slate-300">Jogo de cartas — lute, evolua, conquiste.</p>
            <span className="mt-3 inline-block text-xs uppercase tracking-widest text-rose-300/80">Jogar ▸</span>
          </div>
        </button>

        {/* CAPI WARS */}
        <a
          href="/capyrocket.html"
          className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-[#0a0f18] text-left transition-transform duration-150 active:scale-[0.97] hover:border-amber-300"
        >
          <div className="relative h-44 sm:h-48 overflow-hidden bg-gradient-to-br from-[#23314a] to-[#0a0f18]">
            <img
              src={capiArt}
              alt="CAPI WARS"
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-105"
              draggable={false}
            />
          </div>
          <div className="p-5">
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Bangers','Black Han Sans',sans-serif", color: "#ffe08a" }}>
              CAPI WARS
            </h2>
            <p className="mt-1 text-sm text-slate-300">Ação run-and-gun com o esquadrão capivara.</p>
            <span className="mt-3 inline-block text-xs uppercase tracking-widest text-amber-300/80">Jogar ▸</span>
          </div>
        </a>
      </div>

      <footer className="mt-9 text-xs text-slate-500">Capynite • {new Date().getFullYear()}</footer>
      </div>
    </div>
  );
}
