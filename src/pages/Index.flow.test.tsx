import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * Fluxo de entrada centralizado na Landing (TelaHome):
 * - sem sessão → landing; telas protegidas voltam para a landing (sem TelaAuth inline)
 * - sessão válida (incl. relançamento do PWA) → lobby direto, sem flash da landing
 * - TOKEN_REFRESHED durante a batalha não força o lobby
 * - logout → landing; convidado joga contra IA
 * - nome do jogador logado nunca é gravado direto em profiles fora do perfil
 */

type AuthCb = (event: string, session: unknown) => unknown;
const h = vi.hoisted(() => ({
  cb: null as null | ((event: string, session: unknown) => unknown),
  update: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/integrations/supabase/client", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = (): any =>
    new Proxy(function () {}, {
      get: (_t, p) => {
        if (p === "then") return (r: (v: unknown) => unknown) => r({ data: null, error: null });
        if (p === "update") return (...a: unknown[]) => { h.update(...a); return chain(); };
        return chain();
      },
      apply: () => chain(),
    });
  return {
    supabase: {
      auth: {
        onAuthStateChange: (cb: AuthCb) => { h.cb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
        getSession: async () => ({ data: { session: null } }),
        signOut: h.signOut,
      },
      from: () => chain(),
      channel: () => chain(),
      removeChannel: () => {},
    },
  };
});

vi.mock("@/components/game/screens/TelaHome", () => ({
  default: (p: { onLogin: () => void; onIniciar: (m: string) => void; onPerfil: () => void }) => (
    <div data-testid="home">
      <button onClick={p.onLogin}>login</button>
      <button onClick={() => p.onIniciar("ai")}>guest-ai</button>
      <button onClick={p.onPerfil}>go-perfil</button>
    </div>
  ),
}));
vi.mock("@/components/game/screens/TelaAuth", () => ({ default: () => <div data-testid="auth" /> }));
vi.mock("@/components/game/screens/TelaLobbyPrincipal", () => ({
  default: (p: { onLogout: () => void; onIniciar: (m: string) => void }) => (
    <div data-testid="lobby">
      <button onClick={p.onLogout}>logout</button>
      <button onClick={() => p.onIniciar("ai")}>play</button>
    </div>
  ),
}));
vi.mock("@/components/game/screens/TelaMonstro", () => ({
  default: (p: { onConfirmar: (id: string) => void }) => (
    <div data-testid="monstro"><button onClick={() => p.onConfirmar("panther")}>pick</button></div>
  ),
}));
vi.mock("@/components/game/screens/TelaNome", () => ({
  default: (p: { onConfirmar: (n: string) => void }) => (
    <div data-testid="nome"><button onClick={() => p.onConfirmar("NovoNome")}>confirm-name</button></div>
  ),
}));
vi.mock("@/components/game/screens/TelaEntrar", () => ({ default: () => <div data-testid="entrar" /> }));
vi.mock("@/components/game/screens/TelaBatalha", () => ({ default: () => <div data-testid="batalha" /> }));
vi.mock("@/components/game/screens/TelaPerfil", () => ({ default: () => <div data-testid="perfil" /> }));
vi.mock("@/components/game/screens/TelaDailyReward", () => ({ default: () => null }));
vi.mock("@/components/game/GameInviteNotification", () => ({ default: () => null }));
vi.mock("@/components/game/MonsterUnlockOverlay", () => ({ default: () => null }));
vi.mock("@/components/game/ScreenTransition", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const SESSION = { user: { id: "11111111-1111-1111-1111-111111111111", email: "j@test.com" } };

async function mount() {
  const { default: Index } = await import("./Index");
  render(<MemoryRouter><Index /></MemoryRouter>);
}
const emit = (e: string, s: unknown) => act(async () => { await h.cb!(e, s); });

describe("Index — entrada centralizada na landing", () => {
  beforeEach(() => {
    localStorage.clear();
    h.update.mockReset();
    window.history.replaceState({}, "", "/beast-arena");
  });

  it("não mostra a landing antes da resolução inicial da sessão (sem flash)", async () => {
    await mount();
    expect(screen.queryByTestId("home")).toBeNull();
    expect(screen.queryByTestId("lobby")).toBeNull();
  });

  it("sessão restaurada (refresh/PWA) vai direto ao lobby", async () => {
    await mount();
    await emit("INITIAL_SESSION", SESSION);
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
  });

  it("sem sessão → landing; tela protegida volta para landing, não TelaAuth inline", async () => {
    await mount();
    await emit("INITIAL_SESSION", null);
    expect(screen.getByTestId("home")).toBeInTheDocument();
    fireEvent.click(screen.getByText("go-perfil"));
    expect(screen.getByTestId("home")).toBeInTheDocument();
    expect(screen.queryByTestId("auth")).toBeNull();
    expect(screen.queryByTestId("perfil")).toBeNull();
  });

  it("CTA de login da landing abre o login; login (OAuth/senha) leva ao lobby", async () => {
    await mount();
    await emit("INITIAL_SESSION", null);
    fireEvent.click(screen.getByText("login"));
    expect(screen.getByTestId("auth")).toBeInTheDocument();
    await emit("SIGNED_IN", SESSION);
    expect(screen.getByTestId("lobby")).toBeInTheDocument();
  });

  it("convidado pode jogar contra a IA", async () => {
    await mount();
    await emit("INITIAL_SESSION", null);
    fireEvent.click(screen.getByText("guest-ai"));
    fireEvent.click(screen.getByText("pick"));
    expect(screen.getByTestId("batalha")).toBeInTheDocument();
  });

  it("TOKEN_REFRESHED/SIGNED_IN durante a batalha não força o lobby", async () => {
    await mount();
    await emit("INITIAL_SESSION", SESSION);
    fireEvent.click(screen.getByText("play"));
    fireEvent.click(screen.getByText("pick"));
    expect(screen.getByTestId("batalha")).toBeInTheDocument();
    await emit("TOKEN_REFRESHED", SESSION);
    await emit("SIGNED_IN", SESSION);
    expect(screen.getByTestId("batalha")).toBeInTheDocument();
  });

  it("logout volta para a landing", async () => {
    await mount();
    await emit("INITIAL_SESSION", SESSION);
    fireEvent.click(screen.getByText("logout"));
    await emit("SIGNED_OUT", null);
    expect(screen.getByTestId("home")).toBeInTheDocument();
  });

  it("link de sala pendente é preservado mesmo com sessão", async () => {
    window.history.replaceState({}, "", "/beast-arena?sala=abc");
    await mount();
    await emit("INITIAL_SESSION", SESSION);
    expect(screen.getByTestId("nome")).toBeInTheDocument();
  });

  it("jogador logado não renomeia o perfil fora das configurações", async () => {
    window.history.replaceState({}, "", "/beast-arena?sala=abc");
    await mount();
    await emit("INITIAL_SESSION", SESSION);
    fireEvent.click(screen.getByText("confirm-name"));
    expect(h.update).not.toHaveBeenCalled();
  });
});
