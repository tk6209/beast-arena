import { useNavigate } from "react-router-dom";
import { Swords, Crosshair } from "lucide-react";

/**
 * Menu inicial: o jogador escolhe qual jogo abrir antes de começar.
 * - Beast Arena (jogo de cartas) vive no app principal, em /beast-arena.
 * - CAPI WARS (run-and-gun) é uma entrada HTML própria, em /capyrocket.html.
 */
export default function GameSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#0b0f1a] via-[#10131f] to-[#05070d] text-white flex flex-col items-center justify-center px-5 py-10">
      <header className="text-center mb-8">
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
          className="group relative overflow-hidden rounded-2xl border-2 border-rose-500/60 bg-gradient-to-br from-[#2a1320] to-[#140a12] p-6 text-left transition-transform duration-150 active:scale-[0.97] hover:border-rose-400"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/90 shadow-lg mb-4">
            <Swords className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Bangers','Black Han Sans',sans-serif", color: "#ffd3dc" }}>
            BEAST ARENA
          </h2>
          <p className="mt-1 text-sm text-slate-300">Jogo de cartas — lute, evolua, conquiste.</p>
          <span className="mt-4 inline-block text-xs uppercase tracking-widest text-rose-300/80">Jogar ▸</span>
        </button>

        {/* CAPI WARS */}
        <a
          href="/capyrocket.html"
          className="group relative overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-[#1b2436] to-[#0a0f18] p-6 text-left transition-transform duration-150 active:scale-[0.97] hover:border-amber-300 block"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/90 shadow-lg mb-4">
            <Crosshair className="w-8 h-8 text-[#11151f]" />
          </div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Bangers','Black Han Sans',sans-serif", color: "#ffe08a" }}>
            CAPI WARS
          </h2>
          <p className="mt-1 text-sm text-slate-300">Ação run-and-gun com o esquadrão capivara.</p>
          <span className="mt-4 inline-block text-xs uppercase tracking-widest text-amber-300/80">Jogar ▸</span>
        </a>
      </div>

      <footer className="mt-10 text-xs text-slate-500">Capynite • {new Date().getFullYear()}</footer>
    </div>
  );
}
