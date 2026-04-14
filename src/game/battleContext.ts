/**
 * Battle Context — tracks the active battle session ID.
 * All audio/narration events must verify they belong to the active context
 * before executing. This prevents stale audio from a previous battle.
 */

let _activeBattleId: string | null = null;
const _pendingTimers: Set<ReturnType<typeof setTimeout>> = new Set();

export function setBattleId(id: string) {
  clearBattle();
  _activeBattleId = id;
}

export function getBattleId(): string | null {
  return _activeBattleId;
}

export function clearBattle() {
  _activeBattleId = null;
  // Cancel all pending timers
  _pendingTimers.forEach(t => clearTimeout(t));
  _pendingTimers.clear();
  // Cancel any speech synthesis
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Schedule a delayed callback that is automatically cancelled
 * if the battle context changes.
 */
export function battleTimeout(fn: () => void, ms: number, battleId: string): ReturnType<typeof setTimeout> {
  const timer = setTimeout(() => {
    _pendingTimers.delete(timer);
    if (_activeBattleId === battleId) {
      fn();
    }
  }, ms);
  _pendingTimers.add(timer);
  return timer;
}

/**
 * Guard: only execute callback if the given battleId is still active.
 */
export function ifBattleActive(battleId: string, fn: () => void) {
  if (_activeBattleId === battleId) fn();
}
