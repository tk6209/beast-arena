import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../render/arena", () => ({
  Arena: { create: vi.fn(() => Promise.reject(new Error("WebGL indisponível"))) },
}));

import { BattleScreen } from "./BattleScreen";

// jsdom has no ResizeObserver; BattleScreen only needs it to exist.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

describe("BattleScreen", () => {
  it("mostra erro recuperável quando a arena não inicializa", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onExit = vi.fn();
    render(<BattleScreen player="drako" enemy="crystal" dificuldade="normal" seed={1} onEnd={() => {}} onExit={onExit} />);
    expect(await screen.findByText("Não deu pra abrir a arena")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(onExit).toHaveBeenCalled();
  });
});
