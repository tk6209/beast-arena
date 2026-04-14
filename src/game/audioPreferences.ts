/**
 * Audio Preferences — Granular audio channel control.
 * Replaces the old single-toggle mute system.
 * Persists to localStorage and syncs to DB when available.
 */

import { supabase } from "@/integrations/supabase/client";

interface AudioPrefs {
  sfx_enabled: boolean;
  music_enabled: boolean;
  voice_enabled: boolean;
}

const STORAGE_KEY = "beast_audio_prefs";

let _prefs: AudioPrefs = {
  sfx_enabled: true,
  music_enabled: true,
  voice_enabled: true,
};

// Load from localStorage on init
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    _prefs = { ..._prefs, ...parsed };
  }
} catch {}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_prefs));
}

export function isSfxEnabled(): boolean { return _prefs.sfx_enabled; }
export function isMusicEnabled(): boolean { return _prefs.music_enabled; }
export function isVoiceEnabled(): boolean { return _prefs.voice_enabled; }

export function setSfxEnabled(v: boolean) { _prefs.sfx_enabled = v; persist(); }
export function setMusicEnabled(v: boolean) { _prefs.music_enabled = v; persist(); }
export function setVoiceEnabled(v: boolean) { _prefs.voice_enabled = v; persist(); }

export function getAudioPrefs(): AudioPrefs { return { ..._prefs }; }

/** Load preferences from DB and merge */
export async function loadPrefsFromDB(userId: string) {
  try {
    const { data } = await supabase
      .from("user_preferences")
      .select("sfx_enabled, music_enabled, voice_enabled")
      .eq("user_id", userId)
      .single();
    if (data) {
      _prefs = {
        sfx_enabled: data.sfx_enabled ?? true,
        music_enabled: data.music_enabled ?? true,
        voice_enabled: data.voice_enabled ?? true,
      };
      persist();
    }
  } catch {}
}

/** Save preferences to DB */
export async function savePrefsToDb(userId: string) {
  try {
    await supabase
      .from("user_preferences")
      .upsert({
        user_id: userId,
        sfx_enabled: _prefs.sfx_enabled,
        music_enabled: _prefs.music_enabled,
        voice_enabled: _prefs.voice_enabled,
      }, { onConflict: "user_id" });
  } catch {}
}
