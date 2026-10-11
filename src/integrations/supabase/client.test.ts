import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regressão: com o .env fora do repositório, o build do preview do Lovable saía sem
 * VITE_SUPABASE_URL e o createClient lançava "supabaseUrl is required" ao carregar
 * qualquer tela que importa o cliente (Beast Arena, Admin) → tela branca.
 */
describe("cliente Supabase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("é criado mesmo quando o build não recebe as variáveis VITE_SUPABASE_*", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    vi.resetModules();
    const mod = await import("./client");
    expect(mod.supabase).toBeDefined();
    expect(typeof mod.supabase.from).toBe("function");
  });

  it("a chave embutida é a pública (role anon), nunca a service_role", async () => {
    const { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } = await import("./client");
    const payload = JSON.parse(atob(SUPABASE_PUBLIC_ANON_KEY.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    expect(payload.role).toBe("anon");
    expect(SUPABASE_PUBLIC_URL).toContain(payload.ref);
  });
});
