import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GameSelect from "./GameSelect";

function renderHub() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<GameSelect />} />
        <Route path="/beast-arena" element={<div>BEAST ROUTE OK</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Capynite Hub", () => {
  beforeEach(() => window.localStorage.clear());

  it("presents Joshua Edition and both playable worlds", () => {
    renderHub();
    expect(screen.getAllByText("JOSHUA EDITION").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BEAST ARENA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CAPI WARS").length).toBeGreaterThan(0);
  });

  it("keeps future worlds locked", () => {
    renderHub();
    fireEvent.click(screen.getByRole("button", { name: /WORLD 03.*PRÓXIMO MUNDO/i }));
    expect(screen.getByRole("button", { name: /EM BREVE/i })).toBeDisabled();
  });

  it("routes Beast Arena through the SPA without a reload", () => {
    renderHub();
    fireEvent.click(screen.getByRole("button", { name: /WORLD 01.*BEAST ARENA/i }));
    expect(screen.getByText("BEAST ROUTE OK")).toBeInTheDocument();
  });
});
