/**
 * Global audio mute state — controls SFX, music, and voice.
 * Now delegates to granular audioPreferences for channel-specific control.
 */
import { isSfxEnabled, isMusicEnabled, isVoiceEnabled } from "./audioPreferences";

let _muted = localStorage.getItem("beast_arena_muted") === "true";

export function isMuted(): boolean { return _muted; }

/** Check if SFX should play (not globally muted AND sfx channel enabled) */
export function shouldPlaySfx(): boolean { return !_muted && isSfxEnabled(); }

/** Check if music should play */
export function shouldPlayMusic(): boolean { return !_muted && isMusicEnabled(); }

/** Check if voice should play */
export function shouldPlayVoice(): boolean { return !_muted && isVoiceEnabled(); }

export function setMuted(m: boolean) {
  _muted = m;
  localStorage.setItem("beast_arena_muted", String(m));
}

export function toggleMuted(): boolean {
  setMuted(!_muted);
  return _muted;
}
