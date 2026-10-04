import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrientationGate from "./OrientationGate";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: height });
}

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches:
        query === "(orientation: portrait)"
          ? window.innerHeight > window.innerWidth
          : query === "(pointer: coarse)" || query === "(hover: none)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe("OrientationGate", () => {
  beforeEach(() => {
    setViewport(390, 844);
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });
    installMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not bootstrap Beast Arena while a mobile device is still in portrait", () => {
    render(
      <OrientationGate>
        <div data-testid="game-runtime">game</div>
      </OrientationGate>,
    );

    expect(screen.getByRole("dialog", { name: /gire o dispositivo/i })).toBeInTheDocument();
    expect(screen.queryByTestId("game-runtime")).not.toBeInTheDocument();
  });

  it("boots the game after Android rotates to landscape and keeps the runtime mounted afterwards", () => {
    render(
      <OrientationGate>
        <div data-testid="game-runtime">game</div>
      </OrientationGate>,
    );

    expect(screen.queryByTestId("game-runtime")).not.toBeInTheDocument();

    setViewport(844, 390);
    fireEvent(window, new Event("orientationchange"));

    expect(screen.queryByRole("dialog", { name: /gire o dispositivo/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("game-runtime")).toBeInTheDocument();

    setViewport(390, 844);
    fireEvent.resize(window);

    expect(screen.getByRole("dialog", { name: /gire o dispositivo/i })).toBeInTheDocument();
    expect(screen.getByTestId("game-runtime")).toBeInTheDocument();
  });

  it("never blocks a non-touch desktop window even when it is portrait-shaped", () => {
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === "(orientation: portrait)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    render(
      <OrientationGate>
        <div data-testid="game-runtime">game</div>
      </OrientationGate>,
    );

    expect(screen.queryByRole("dialog", { name: /gire o dispositivo/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("game-runtime")).toBeInTheDocument();
  });
});
