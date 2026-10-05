import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import OrientationGate from './OrientationGate';

let portrait: boolean;
let touch: boolean;
let orientationQuery: EventTarget;
function StatefulGame() {
  const [turn, setTurn] = useState(1);
  return <button onClick={() => setTurn(turn + 1)}>Turn {turn}</button>;
}
beforeEach(() => {
  portrait = true; touch = true; orientationQuery = new EventTarget();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() { return query === '(orientation: portrait)' ? portrait : touch; },
    addEventListener: orientationQuery.addEventListener.bind(orientationQuery),
    removeEventListener: orientationQuery.removeEventListener.bind(orientationQuery),
  }));
  Object.defineProperty(window.screen, 'orientation', { configurable: true, value: undefined });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('mobile orientation and initialization', () => {
  it('preserves an initialized game through repeated rotation without native lock', () => {
    render(<OrientationGate><StatefulGame /></OrientationGate>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => { portrait = false; orientationQuery.dispatchEvent(new Event('change')); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name:'Turn 1'}));
    act(() => { portrait = true; window.dispatchEvent(new Event('orientationchange')); });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => { portrait = false; window.dispatchEvent(new Event('resize')); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name:'Turn 2'})).toBeInTheDocument();
  });
  it('starts unblocked when loaded in landscape', () => {
    portrait = false;
    render(<OrientationGate><StatefulGame /></OrientationGate>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  it('never blocks a portrait desktop window', () => {
    touch = false;
    render(<OrientationGate><StatefulGame /></OrientationGate>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('keeps rotation usable when Android/browser rejects native locking', async () => {
    Object.defineProperty(window.screen, 'orientation', { configurable:true, value:{ lock:vi.fn().mockRejectedValue(new Error('NotSupportedError')) }});
    render(<OrientationGate><StatefulGame /></OrientationGate>);
    await act(async () => { await Promise.resolve(); });
    act(() => { portrait=false; window.dispatchEvent(new Event('resize')); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
