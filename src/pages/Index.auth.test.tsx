import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * Regressão: o callback de `onAuthStateChange` do Index fazia `await` de chamadas
 * ao Supabase (signOut, profiles). O supabase-js executa esse callback DENTRO do
 * lock interno de autenticação; quando o callback espera outra chamada do cliente,
 * o lock nunca é liberado e nenhuma requisição sai mais. Em navegador real, para
 * quem tem sessão salva, a batalha ficava eternamente em "CARREGANDO..." (tela
 * azul/escura sem jogo).
 *
 * O contrato (documentado no supabase-js): o callback precisa retornar sem esperar
 * por outras chamadas do Supabase; esse trabalho deve ser despachado depois.
 * O jsdom não reproduz o timing dos locks do navegador, então o teste fixa o
 * contrato diretamente: com um `signOut` que nunca resolve, o callback tem que
 * terminar mesmo assim.
 */

type AuthCallback = (event: string, session: unknown) => unknown;

const h = vi.hoisted(() => ({
  authCallback: null as null | ((event: string, session: unknown) => unknown),
  signOut: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => {
  // Qualquer cadeia `.from().select().eq()...` resolve com { data: null }.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeChain = (): any =>
    new Proxy(function () {}, {
      get: (_t, prop) => {
        if (prop === "then") return (res: (v: unknown) => unknown) => res({ data: null, error: null });
        return makeChain();
      },
      apply: () => makeChain(),
    });

  return {
    supabase: {
      auth: {
        onAuthStateChange: (cb: AuthCallback) => {
          h.authCallback = cb;
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        getSession: async () => ({ data: { session: null } }),
        signOut: h.signOut,
      },
      from: () => makeChain(),
      channel: () => makeChain(),
      removeChannel: () => {},
    },
  };
});

const SESSION = {
  user: { id: "11111111-1111-1111-1111-111111111111", email: "jogador@test.com" },
};

describe("Index — onAuthStateChange não pode esperar chamadas do Supabase", () => {
  beforeEach(() => {
    window.localStorage.clear();
    h.authCallback = null;
    // signOut que nunca resolve: se o callback fizer `await` nele, trava.
    h.signOut.mockReset();
    h.signOut.mockImplementation(() => new Promise(() => {}));
  });

  async function mountIndex() {
    const { default: Index } = await import("./Index");
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );
    expect(h.authCallback).toBeTypeOf("function");
  }

  it("o callback retorna sem esperar signOut/profiles (não segura o lock do supabase-js)", async () => {
    await mountIndex();

    const finished = Promise.resolve(h.authCallback!("INITIAL_SESSION", SESSION)).then(() => "done");
    const timeout = new Promise((r) => setTimeout(() => r("hung"), 300));

    await expect(Promise.race([finished, timeout])).resolves.toBe("done");
  });

  it("mesmo assim, depois do callback, derruba as outras sessões", async () => {
    await mountIndex();
    await h.authCallback!("INITIAL_SESSION", SESSION);

    await vi.waitFor(() => {
      expect(h.signOut).toHaveBeenCalledWith({ scope: "others" });
    });
  });
});
