import React, { useEffect, useState } from "react";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { supabase } from "@/integrations/supabase/client";
import { MONSTROS } from "@/game/data";
import {
  isSfxEnabled, isMusicEnabled, isVoiceEnabled,
  setSfxEnabled, setMusicEnabled, setVoiceEnabled,
  savePrefsToDb,
} from "@/game/audioPreferences";
import { validateDisplayName, canChangeName, daysUntilNameChange } from "@/game/nameValidation";
import type { User } from "@supabase/supabase-js";

interface BattleHistoryRow {
  id: string;
  won: boolean;
  monster_used: string;
  opponent_monster: string | null;
  damage_dealt: number;
  cards_played: number;
  mode: string;
  dificuldade: string;
  created_at: string;
}

interface TelaPefilProps {
  user: User;
  onVoltar: () => void;
  onLogout: () => void;
  onReplayTutorial?: () => void;
}

interface Profile {
  display_name: string;
  public_id: string;
  level: number;
  xp: number;
  coins: number;
  name_changed_at: string | null;
}

interface Stats {
  total_wins: number;
  total_losses: number;
  win_streak: number;
  best_streak: number;
  favorite_monster: string | null;
}

export default function TelaPerfil({ user, onVoltar, onLogout, onReplayTutorial }: TelaPefilProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Audio toggles
  const [sfx, setSfx] = useState(isSfxEnabled());
  const [music, setMusic] = useState(isMusicEnabled());
  const [voice, setVoice] = useState(isVoiceEnabled());

  const [history, setHistory] = useState<BattleHistoryRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("display_name, public_id, level, xp, coins, name_changed_at").eq("user_id", user.id).single(),
        supabase.from("user_stats").select("total_wins, total_losses, win_streak, best_streak, favorite_monster").eq("user_id", user.id).single(),
      ]);
      if (p) { setProfile(p as Profile); setNewName(p.display_name); }
      if (s) setStats(s);
      // Load last 10 battles
      const { data: hist } = await supabase
        .from("battle_history")
        .select("id, won, monster_used, opponent_monster, damage_dealt, cards_played, mode, dificuldade, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (hist) setHistory(hist as BattleHistoryRow[]);
      setLoading(false);
    })();
  }, [user.id]);

  const xpForNextLevel = (profile?.level || 1) * 100;
  const xpProgress = profile ? Math.min(100, (profile.xp / xpForNextLevel) * 100) : 0;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const favoriteMonster = stats?.favorite_monster ? MONSTROS[stats.favorite_monster] : null;

  // Audio toggle handlers
  const toggleSfx = () => { const v = !sfx; setSfx(v); setSfxEnabled(v); savePrefsToDb(user.id); };
  const toggleMusic = () => { const v = !music; setMusic(v); setMusicEnabled(v); savePrefsToDb(user.id); };
  const toggleVoice = () => { const v = !voice; setVoice(v); setVoiceEnabled(v); savePrefsToDb(user.id); };

  // Name change
  const handleSaveName = async () => {
    const validation = validateDisplayName(newName);
    if (!validation.valid) { setNameError(validation.error || "Nome inválido"); return; }
    if (!canChangeName(profile?.name_changed_at || null)) {
      const days = daysUntilNameChange(profile?.name_changed_at || null);
      setNameError(`Aguarde ${days} dia(s) para trocar novamente.`);
      return;
    }

    setNameSaving(true);
    setNameError("");
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: newName.trim(),
        display_name_normalized: newName.trim().toLowerCase(),
        name_changed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      setNameError("Erro ao salvar nome.");
    } else {
      setProfile(p => p ? { ...p, display_name: newName.trim(), name_changed_at: new Date().toISOString() } : p);
      setEditingName(false);
    }
    setNameSaving(false);
  };

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: "100%",
          maxWidth: 340,
          animation: "fadeUp .5s ease forwards",
        }}>
          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #00e5ff33, #7eb8ff33)",
              border: "2px solid #00e5ff44",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, margin: "0 auto 8px",
            }}>
              {favoriteMonster?.emoji || "⚔️"}
            </div>

            {/* Display name — editable */}
            {editingName ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
                <input
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setNameError(""); }}
                  maxLength={20}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,.06)", border: "1px solid rgba(0,229,255,.2)",
                    color: "#e8f0ff", fontSize: 16, fontFamily: "Bangers, cursive",
                    textAlign: "center", outline: "none", width: 200,
                  }}
                />
                {nameError && <div style={{ fontSize: 10, color: "#ef4444", fontFamily: "Nunito, sans-serif" }}>{nameError}</div>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={handleSaveName} disabled={nameSaving} style={{
                    padding: "4px 14px", borderRadius: 6,
                    background: "rgba(105,240,174,.15)", border: "1px solid rgba(105,240,174,.3)",
                    color: "#69f0ae", fontSize: 11, cursor: "pointer", fontFamily: "Nunito, sans-serif",
                  }}>Salvar</button>
                  <button onClick={() => { setEditingName(false); setNameError(""); setNewName(profile?.display_name || ""); }} style={{
                    padding: "4px 14px", borderRadius: 6,
                    background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                    color: "#8a95aa", fontSize: 11, cursor: "pointer", fontFamily: "Nunito, sans-serif",
                  }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  fontFamily: "Bangers, cursive", fontSize: 24,
                  color: "#e8f0ff", letterSpacing: 2,
                  cursor: "pointer",
                }} onClick={() => setEditingName(true)}>
                  {profile?.display_name || "Jogador"} ✏️
                </div>
                <div style={{
                  fontFamily: "Oswald, sans-serif", fontSize: 11, color: "#00e5ff",
                  letterSpacing: 1, marginTop: 2,
                }}>
                  {profile?.public_id || ""}
                </div>
              </div>
            )}

            <div style={{
              fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8a95aa", marginTop: 2,
            }}>
              {user.email}
            </div>
          </div>

          {/* Level + XP */}
          <div style={{
            background: "rgba(0,229,255,.04)",
            border: "1px solid rgba(0,229,255,.1)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontFamily: "Bangers, cursive", fontSize: 16, color: "#ffd54f", letterSpacing: 1 }}>
                LV {profile?.level || 1}
              </span>
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 11, color: "#8a95aa" }}>
                {profile?.xp || 0} / {xpForNextLevel} XP
              </span>
            </div>
            <div style={{
              height: 6, borderRadius: 3,
              background: "rgba(255,255,255,.1)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${xpProgress}%`,
                background: "linear-gradient(90deg, #00e5ff, #7eb8ff)",
                borderRadius: 3, transition: "width .5s ease",
              }} />
            </div>
          </div>

          {/* Coins */}
          <div style={{
            background: "rgba(255,213,79,.04)",
            border: "1px solid rgba(255,213,79,.15)",
            borderRadius: 10, padding: "10px 16px", marginBottom: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#ffd54f", letterSpacing: 1 }}>
              💰 MOEDAS
            </span>
            <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, color: "#ffd54f" }}>
              {profile?.coins || 0}
            </span>
          </div>

          {/* Stats */}
          <div style={{
            background: "rgba(0,229,255,.04)",
            border: "1px solid rgba(0,229,255,.1)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 10,
          }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#00e5ff", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>
              📊 ESTATÍSTICAS
            </div>
            {loading ? (
              <div style={{ color: "#8a95aa", fontSize: 12, textAlign: "center" }}>Carregando...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Vitórias", value: stats?.total_wins || 0, color: "#69f0ae" },
                  { label: "Derrotas", value: stats?.total_losses || 0, color: "#ef4444" },
                  { label: "Sequência", value: stats?.win_streak || 0, color: "#ffd54f" },
                  { label: "Melhor", value: stats?.best_streak || 0, color: "#00e5ff" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 22, color: s.color }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8a95aa" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audio Settings */}
          <div style={{
            background: "rgba(179,136,255,.04)",
            border: "1px solid rgba(179,136,255,.15)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 10,
          }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#b388ff", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>
              🔊 ÁUDIO
            </div>
            {[
              { label: "Efeitos Sonoros", value: sfx, toggle: toggleSfx, emoji: "🎵" },
              { label: "Música", value: music, toggle: toggleMusic, emoji: "🎶" },
              { label: "Narração", value: voice, toggle: toggleVoice, emoji: "🗣️" },
            ].map(a => (
              <div key={a.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.04)",
              }}>
                <span style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#94a3b8" }}>
                  {a.emoji} {a.label}
                </span>
                <button onClick={a.toggle} style={{
                  width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                  background: a.value ? "rgba(105,240,174,.3)" : "rgba(255,255,255,.1)",
                  border: `1px solid ${a.value ? "rgba(105,240,174,.5)" : "rgba(255,255,255,.15)"}`,
                  position: "relative", transition: "all .2s ease",
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: a.value ? "#69f0ae" : "#8a95aa",
                    position: "absolute", top: 2,
                    left: a.value ? 20 : 2,
                    transition: "all .2s ease",
                  }} />
                </button>
              </div>
            ))}
          </div>

          {/* Battle History */}
          <div style={{
            background: "rgba(255,213,79,.03)",
            border: "1px solid rgba(255,213,79,.1)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 10,
          }}>
            <div
              onClick={() => setShowHistory(h => !h)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ fontFamily: "Bangers, cursive", fontSize: 14, color: "#ffd54f", letterSpacing: 2 }}>
                📜 HISTÓRICO
              </span>
              <span style={{ fontSize: 12, color: "#8a95aa" }}>{showHistory ? "▲" : "▼"}</span>
            </div>

            {showHistory && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {history.length === 0 ? (
                  <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8a95aa", textAlign: "center", padding: "8px 0" }}>
                    Nenhuma batalha registrada ainda.
                  </div>
                ) : history.map((b) => {
                  const mData = MONSTROS[b.monster_used];
                  const oppData = b.opponent_monster ? MONSTROS[b.opponent_monster] : null;
                  const date = new Date(b.created_at);
                  const dateStr = `${date.getDate().toString().padStart(2,"0")}/${(date.getMonth()+1).toString().padStart(2,"0")} ${date.getHours().toString().padStart(2,"0")}:${date.getMinutes().toString().padStart(2,"0")}`;
                  return (
                    <div key={b.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: b.won ? "rgba(105,240,174,.05)" : "rgba(239,68,68,.05)",
                      border: `1px solid ${b.won ? "rgba(105,240,174,.15)" : "rgba(239,68,68,.15)"}`,
                      borderRadius: 8, padding: "7px 10px",
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{mData?.emoji || "⚔️"}</span>
                      {oppData && <><span style={{ fontSize: 10, color: "#8a95aa" }}>vs</span>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{oppData.emoji}</span></>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "Bangers, cursive", fontSize: 11, letterSpacing: 1,
                          color: b.won ? "#69f0ae" : "#ef4444",
                        }}>
                          {b.won ? "✅ VITÓRIA" : "💀 DERROTA"}
                          <span style={{ color: "#8a95aa", fontSize: 9, marginLeft: 6 }}>
                            {b.mode === "ai" ? `vs IA (${b.dificuldade})` : "vs Jogador"}
                          </span>
                        </div>
                        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 9, color: "#8a95aa" }}>
                          🗡️{b.damage_dealt} · 🃏{b.cards_played} · {dateStr}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tutorial replay + actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {onReplayTutorial && (
              <BtnMain variant="dark" onClick={onReplayTutorial}>📖 REPETIR TUTORIAL</BtnMain>
            )}
            <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
            <BtnMain variant="dark" onClick={handleLogout}>🚪 SAIR DA CONTA</BtnMain>
          </div>
        </div>
      </div>
    </div>
  );
}
