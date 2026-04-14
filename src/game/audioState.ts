/**
 * Global audio mute state — controls SFX, music, and voice.
 */
let _muted = localStorage.getItem("beast_arena_muted") === "true";

export function isMuted(): boolean { return _muted; }

export function setMuted(m: boolean) {
  _muted = m;
  localStorage.setItem("beast_arena_muted", String(m));
}

export function toggleMuted(): boolean {
  setMuted(!_muted);
  return _muted;
}
