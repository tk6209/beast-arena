import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithPassword: h.signIn, signUp: h.signUp } },
}));
vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn(async () => ({ redirected: true })) } },
}));

import TelaAuth from "./TelaAuth";

describe("TelaAuth", () => {
  beforeEach(() => {
    h.signIn.mockReset();
    h.signIn.mockResolvedValue({ error: null });
  });

  function fill() {
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "joshua@test.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "segredo1" } });
  }

  it("ENTRAR envia o login uma única vez", async () => {
    const onAuth = vi.fn();
    render(<TelaAuth onAuth={onAuth} onSkip={() => {}} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "ENTRAR" }));
    await waitFor(() => expect(onAuth).toHaveBeenCalled());
    expect(h.signIn).toHaveBeenCalledTimes(1);
    expect(h.signIn).toHaveBeenCalledWith({ email: "joshua@test.com", password: "segredo1" });
  });

  it("Enter na senha também envia (formulário de verdade)", async () => {
    render(<TelaAuth onAuth={() => {}} onSkip={() => {}} />);
    fill();
    fireEvent.submit(screen.getByLabelText("Senha").closest("form")!);
    await waitFor(() => expect(h.signIn).toHaveBeenCalledTimes(1));
  });

  it("tem saída para voltar sem entrar", () => {
    const onSkip = vi.fn();
    render(<TelaAuth onAuth={() => {}} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar sem entrar" }));
    expect(onSkip).toHaveBeenCalled();
  });

  it("campos com autocomplete e 16px (sem zoom no iOS)", () => {
    render(<TelaAuth onAuth={() => {}} onSkip={() => {}} />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "current-password");
  });
});
