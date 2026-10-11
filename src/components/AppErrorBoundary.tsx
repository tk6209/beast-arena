import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Última linha de defesa: se uma tela falhar ao carregar ou renderizar, mostra uma
 * saída (recarregar / voltar ao hub) em vez de deixar a tela inteira em branco.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[app] erro não tratado:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main role="alert" className="grid min-h-[100dvh] place-items-center bg-[#050611] p-6 text-center text-white">
        <div className="max-w-sm">
          <h1 className="font-['Bebas_Neue'] text-5xl leading-none tracking-wide">Esta tela não abriu</h1>
          <p className="mt-3 text-sm font-semibold text-white/65">
            Algo deu errado ao carregar. Recarregue a página; se continuar, volte ao Capiverso e tente outro mundo.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-12 rounded-2xl bg-gradient-to-br from-[#ffcf4a] to-[#ff7a45] font-['Bebas_Neue'] text-2xl tracking-wider text-[#07061a]"
            >
              RECARREGAR
            </button>
            <a href="/" className="min-h-12 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/80 hover:bg-white/5">
              Voltar ao Capiverso
            </a>
          </div>
        </div>
      </main>
    );
  }
}
