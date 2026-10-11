import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AppErrorBoundary from "./AppErrorBoundary";

function Boom(): JSX.Element {
  throw new Error("supabaseUrl is required.");
}

describe("AppErrorBoundary", () => {
  it("mostra uma saída em vez de tela branca quando uma tela quebra", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RECARREGAR" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar ao Capiverso/ })).toHaveAttribute("href", "/");
    spy.mockRestore();
  });
});
