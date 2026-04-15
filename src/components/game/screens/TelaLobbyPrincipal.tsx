import React, { useEffect, useState, useRef } from "react";
import { MONSTROS } from "@/game/data";
import { MONSTER_IMAGES, MONSTER_IMAGES_SIDE, MONSTER_IMAGES_BACK } from "@/game/monsterImages";
import { pageBg } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import LobbyParticles from "@/components/game/LobbyParticles";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Dificuldade } from "@/pages/Index";

interface Props {
  user: User;
  onIniciar: (modo: string, diff?: Dificuldade) => void;
  onPerfil: () => void;
  onLoja: () => void;
  onMulti: () => void;
  onMatchmaking: () => void;
  onRanking: () => void;
  onSeasonPass: () => void;
  onMissoes: () => void;
  onConquistas: () => void;
  onAmigos: () => void;
  onLogout: () => void;
}

const LEAGUE_INFO: Record<string, { emoji: string; color: string; label: string }> = {
  bronze: { emoji: "🥉", color: "#cd7f32", label: "BRONZE" },
  silver: { emoji: "🥈", color: "#c0c0c0", label: "PRATA" },
  gold: { emoji: "🥇", color: "#ffd54f", label: "OURO" },
  diamond: { emoji: "💎", color: "#b388ff", label: "DIAMANTE" },
  master: { emoji: "👑", color: "#ff5252", label: "MESTRE" },
};

const monsterKeys = Object.keys(MONSTROS);

export default function TelaLobbyPrincipal({
  user, onIniciar, onPerfil, onLoja, onMulti, onMatchmaking, onRanking, onSeasonPass, onMissoes, onConquistas, onAmigos, onLogout,
}: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [league, setLeague] = useState<any>(null);
  const [seasonPass, setSeasonPass] = useState<any>(null);
  const [selectedMonster, setSelectedMonster] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const [fade, setFade] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);
  const monsterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [user.id]);

  async function loadData() {
    const [{ data: p }, { data: s }, { data: l }, { data: sp }] = await Promise.all([
      supabase.from("profiles").select("display_name, level, xp, coins, avatar_url").eq("user_id", user.id).single(),
      supabase.from("user_stats").select("total_wins, total_losses, win_streak, best_streak, favorite_monster").eq("user_id", user.id).single(),
      supabase.from("player_leagues").select("*").eq("user_id", user.id).single(),
      supabase.from("season_pass").select("*").eq("user_id", user.id).single(),
    ]);
    if (p) setProfile(p);
    if (s) setStats(s);
    if (l) setLeague(l);
    if (sp) setSeasonPass(sp);
  }

  const currentKey = monsterKeys[selectedMonster];
  const currentMonster = MONSTROS[currentKey];
  const currentImg = MONSTER_IMAGES[currentKey];
  const leagueInfo = LEAGUE_INFO[league?.league || "bronze"];
  const xpForNext = (profile?.level || 1) * 100;
  const xpPct = profile ? Math.min(100, (profile.xp / xpForNext) * 100) : 0;

  const cycleMonster = (dir: number) => {
    setFade(false);
    setTimeout(() => {
      setSelectedMonster((s) => (s + dir + monsterKeys.length) % monsterKeys.length);
      setFade(true);
    }, 200);
  };

  const handleDragStart = (clientX: number) => { setDragging(true); lastX.current = clientX; };
  const handleDragMove = (clientX: number) => {
    if (!dragging) return;
    const delta = clientX - lastX.current;
    setRotation(r => r + delta * 0.8);
    lastX.current = clientX;
  };
  const handleDragEnd = () => setDragging(false);

  return (
    <div
      style={{
        ...pageBg(),
        background: `radial-gradient(ellipse at 50% 70%, ${currentMonster.bg2}22, transparent 60%), radial-gradient(ellipse at 50% 100%, ${currentMonster.glow}10, transparent 50%), linear-gradient(180deg, #060a14 0%, #0a1628 40%, #0d1b2e 100%)`,
        transition: "background 1s ease",
      }}
    >
      <ChromeNoise />
      <LobbyParticles />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes monsterFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulseGlow { 0%,100%{opacity:.3} 50%{opacity:.6} }
        @keyframes scanLine { 0%{top:-2px} 100%{top:100%} }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        position: "relative", zIndex: 1, overflow: "hidden",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        paddingBottom: 0,
      }}>

        {/* ═══ TOP BAR ═══ */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px 6px", zIndex: 10, flexShrink: 0,
        }}>
          {/* Player info */}
          <div
            onClick={onPerfil}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              animation: "slideInLeft .5s ease forwards",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${currentMonster.bg1}, ${currentMonster.bg2})`,
              border: `2px solid ${leagueInfo.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: `0 0 12px ${leagueInfo.color}44`,
            }}>
              {stats?.favorite_monster ? MONSTROS[stats.favorite_monster]?.emoji || "⚔️" : "⚔️"}
            </div>
            <div>
              <div style={{ fontFamily: "Bangers, cursive", fontSize: 13, color: "#e8f0ff", letterSpacing: 1, lineHeight: 1.1 }}>
                {profile?.display_name || "Jogador"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#ffd54f" }}>
                  LV {profile?.level || 1}
                </span>
                <div style={{
                  width: 40, height: 3, borderRadius: 2, background: "rgba(255,255,255,.1)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${xpPct}%`,
                    background: "linear-gradient(90deg, #00e5ff, #7eb8ff)", borderRadius: 2,
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Currencies */}
          <div style={{ display: "flex", gap: 6, animation: "slideInRight .5s ease forwards" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(255,213,79,.08)", border: "1px solid rgba(255,213,79,.2)",
              borderRadius: 14, padding: "4px 10px",
            }}>
              <span style={{ fontSize: 12 }}>💰</span>
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 13, color: "#ffd54f" }}>
                {profile?.coins?.toLocaleString() || 0}
              </span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(0,229,255,.08)", border: "1px solid rgba(0,229,255,.15)",
              borderRadius: 14, padding: "4px 10px",
            }}>
              <span style={{ fontSize: 10, color: leagueInfo.color }}>{leagueInfo.emoji}</span>
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 10, color: leagueInfo.color }}>
                {league?.rating || 1000}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ MAIN ARENA AREA ═══ */}
        <div style={{
          flex: 1, position: "relative", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>

          {/* ── LEFT COLUMN — closer to center ── */}
          <div style={{
            position: "absolute",
            left: "3%",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            display: "flex", flexDirection: "column", gap: "2.5vh",
            animation: "slideInLeft .6s ease forwards",
            opacity: 0.85,
            transition: "opacity .3s",
            maxHeight: "80%",
            justifyContent: "center",
          }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.85"; }}>
            <SidePanel onClick={onRanking} bg={`linear-gradient(135deg, ${leagueInfo.color}15, ${leagueInfo.color}08)`} border={`${leagueInfo.color}33`} delay={0}>
              <div style={{ fontFamily: "Bangers, cursive", fontSize: 10, color: leagueInfo.color, letterSpacing: 1.5 }}>
                {leagueInfo.emoji} {leagueInfo.label}
              </div>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#8a95aa", marginTop: 2 }}>
                {stats?.total_wins || 0}V / {stats?.total_losses || 0}D
              </div>
            </SidePanel>

            <SidePanel onClick={onSeasonPass} bg="linear-gradient(135deg, rgba(255,213,79,.1), rgba(255,152,0,.06))" border="rgba(255,213,79,.25)" delay={1}>
              <div style={{ fontFamily: "Bangers, cursive", fontSize: 10, color: "#ffd54f", letterSpacing: 1 }}>
                🏆 SEASON
              </div>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 8, color: "#8a95aa", marginTop: 2 }}>
                Tier {seasonPass?.tier || 0}
              </div>
            </SidePanel>

            <SidePanel onClick={onLoja} bg="rgba(0,229,255,.08)" border="rgba(0,229,255,.2)" delay={2}>
              <div style={{ fontFamily: "Bangers, cursive", fontSize: 10, color: "#00e5ff", letterSpacing: 1 }}>
                🏪 LOJA
              </div>
            </SidePanel>

            <SidePanel onClick={onMissoes} bg="rgba(105,240,174,.08)" border="rgba(105,240,174,.2)" delay={3}>
              <div style={{ fontFamily: "Bangers, cursive", fontSize: 10, color: "#69f0ae", letterSpacing: 1 }}>
                🎯 MISSÕES
              </div>
            </SidePanel>
          </div>

          {/* ── RIGHT COLUMN — game modes, closer to center ── */}
          <div style={{
            position: "absolute",
            right: "3%",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            display: "flex", flexDirection: "column", gap: "2.5vh",
            alignItems: "flex-end",
            animation: "slideInRight .6s ease forwards",
            opacity: 0.85,
            transition: "opacity .3s",
            maxHeight: "80%",
            justifyContent: "center",
          }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.85"; }}>
            {!showDiff ? (
              <>
                <ModeButton label="⚔️ DUELO IA" color="#00e5ff" desc="vs CPU" onClick={() => setShowDiff(true)} delay={0} />
                <ModeButton label="🌐 MULTI" color="#69f0ae" desc="Amigo" onClick={onMulti} delay={1} />
                <ModeButton label="🎯 RANKED" color="#ffd54f" desc="ELO" onClick={onMatchmaking} delay={2} />
                <ModeButton label="🏆 RANKING" color="#b388ff" desc="Top 10" onClick={onRanking} delay={3} />
              </>
            ) : (
              <>
                <ModeButton label="😊 FÁCIL" color="#69f0ae" onClick={() => { setShowDiff(false); onIniciar("duel", "facil"); }} />
                <ModeButton label="⚔️ MÉDIO" color="#00e5ff" onClick={() => { setShowDiff(false); onIniciar("duel", "medio"); }} />
                <ModeButton label="💀 HARD" color="#ffd54f" onClick={() => { setShowDiff(false); onIniciar("duel", "avancado"); }} />
                <ModeButton label="← VOLTAR" color="#8a95aa" onClick={() => setShowDiff(false)} />
              </>
            )}
          </div>

          {/* ── CENTER — MONSTER DISPLAY ── */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative",
            width: "50%",
            maxWidth: 280,
          }}>
            {/* Glow orb */}
            <div style={{
              position: "absolute", width: "90%", aspectRatio: "1", borderRadius: "50%",
              background: `radial-gradient(circle, ${currentMonster.glow}25, transparent 70%)`,
              animation: "pulseGlow 3s ease-in-out infinite",
              pointerEvents: "none",
            }} />

            {/* Monster — draggable 360° */}
            <div
              ref={monsterRef}
              onMouseDown={(e) => handleDragStart(e.clientX)}
              onMouseMove={(e) => handleDragMove(e.clientX)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
              onTouchEnd={handleDragEnd}
              style={{
                position: "relative",
                width: "clamp(160px, 55vw, 260px)",
                aspectRatio: "1",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: dragging ? "grabbing" : "grab",
                zIndex: 20, perspective: 1000,
                touchAction: "none",
              }}
            >
              {/* Shadow under monster */}
              <div style={{
                position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
                width: "60%", height: 20, borderRadius: "50%",
                background: `radial-gradient(ellipse, ${currentMonster.glow}20, transparent 70%)`,
                filter: "blur(6px)", pointerEvents: "none",
              }} />

              {/* Monster images */}
              {(() => {
                const norm = (((rotation % 360) + 360) % 360);
                const isLeftSide = norm >= 225 && norm < 315;
                const isFront = norm < 45 || norm >= 315;
                const isSide = (norm >= 45 && norm < 135) || (norm >= 225 && norm < 315);
                const isBack = norm >= 135 && norm < 225;

                const frontImg = MONSTER_IMAGES[currentKey];
                const sideImg = MONSTER_IMAGES_SIDE[currentKey];
                const backImg = MONSTER_IMAGES_BACK[currentKey];

                const imgStyle = (visible: boolean, flip: boolean): React.CSSProperties => ({
                  position: "absolute" as const,
                  top: 0, left: 0, width: "100%", height: "100%",
                  objectFit: "contain" as const,
                  opacity: visible && fade ? 1 : 0,
                  filter: `drop-shadow(0 0 40px ${currentMonster.glow}66)`,
                  transition: "opacity .35s ease, filter .3s, transform .35s ease",
                  animation: !dragging && fade && visible ? "monsterFloat 3s ease-in-out infinite" : "none",
                  transform: flip ? "scaleX(-1)" : "scaleX(1)",
                  pointerEvents: "none" as const,
                });

                return (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <img src={frontImg} alt="" draggable={false} style={imgStyle(isFront, false)} />
                    <img src={sideImg} alt="" draggable={false} style={imgStyle(isSide, isLeftSide)} />
                    <img src={backImg} alt="" draggable={false} style={imgStyle(isBack, false)} />
                  </div>
                );
              })()}

              {/* Rotation indicator */}
              <div style={{
                position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
                fontFamily: "Oswald, sans-serif", fontSize: 8,
                color: "rgba(255,255,255,.25)", letterSpacing: 1,
                opacity: dragging ? 1 : 0, transition: "opacity .3s",
              }}>
                {(() => {
                  const norm = (((rotation % 360) + 360) % 360);
                  if (norm < 45 || norm > 315) return "▶ FRENTE";
                  if (norm >= 45 && norm < 135) return "◀ LATERAL";
                  if (norm >= 135 && norm < 225) return "◆ COSTAS";
                  return "▶ LATERAL";
                })()}
              </div>

              {/* Scan line */}
              <div style={{
                position: "absolute", left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${currentMonster.glow}33, transparent)`,
                animation: "scanLine 4s linear infinite", pointerEvents: "none",
              }} />
            </div>

            {/* Monster name */}
            <div style={{
              fontFamily: "Bangers, cursive", fontSize: "clamp(16px, 5vw, 22px)", color: currentMonster.glow,
              letterSpacing: 3, marginTop: 4, textShadow: `0 0 20px ${currentMonster.glow}44`,
              transition: "color .3s ease",
            }}>
              {currentMonster.nome}
            </div>
            <div style={{
              fontFamily: "Nunito, sans-serif", fontSize: "clamp(8px, 2.5vw, 10px)", color: "#8a95aa",
              letterSpacing: 1, textAlign: "center",
            }}>
              {currentMonster.hab} — {currentMonster.habD}
            </div>

            {/* Monster cycle arrows */}
            <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
              <button onClick={() => cycleMonster(-1)} style={arrowBtn}>◀</button>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {monsterKeys.map((_, i) => (
                  <div key={i} style={{
                    width: i === selectedMonster ? 12 : 5, height: 5,
                    borderRadius: 3, transition: "all .3s ease",
                    background: i === selectedMonster ? currentMonster.glow : "rgba(255,255,255,.15)",
                  }} />
                ))}
              </div>
              <button onClick={() => cycleMonster(1)} style={arrowBtn}>▶</button>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM NAV ═══ */}
        <div style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          padding: `10px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)`,
          background: "linear-gradient(180deg, transparent, rgba(0,0,0,.5))",
          zIndex: 10, flexShrink: 0,
        }}>
          <BottomTab icon="⚔️" label="COMBATE" active onClick={() => setShowDiff(true)} />
          <BottomTab icon="🏪" label="LOJA" onClick={onLoja} />
          <BottomTab icon="🏆" label="RANKING" onClick={onRanking} />
          <BottomTab icon="👤" label="PERFIL" onClick={onPerfil} />
          <BottomTab icon="🚪" label="SAIR" onClick={onLogout} />
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SidePanel({ children, onClick, bg, border, delay = 0 }: { children: React.ReactNode; onClick: () => void; bg: string; border: string; delay?: number }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: bg, border: `1px solid ${border}`,
        borderRadius: 10, padding: "8px 10px", cursor: "pointer",
        width: "clamp(80px, 22vw, 110px)",
        transform: pressed ? "scale(0.93)" : "scale(1)",
        boxShadow: pressed ? `0 0 16px ${border}, inset 0 0 8px ${border}` : "none",
        transition: "transform .15s ease, box-shadow .15s ease",
        animation: `fadeUp .5s ease ${delay * 0.1}s both`,
      }}
    >
      {children}
    </div>
  );
}

function ModeButton({ label, color, desc, onClick, delay = 0 }: { label: string; color: string; desc?: string; onClick: () => void; delay?: number }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: `${color}12`, border: `1px solid ${color}33`,
        borderRadius: 10, padding: "8px 12px", cursor: "pointer",
        fontFamily: "Bangers, cursive", fontSize: 10, color,
        letterSpacing: 1.5, textAlign: "right",
        width: "clamp(80px, 22vw, 110px)",
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
        transform: pressed ? "scale(0.93)" : "scale(1)",
        boxShadow: pressed ? `0 0 16px ${color}66, inset 0 0 8px ${color}33` : "none",
        transition: "transform .15s ease, box-shadow .15s ease",
        animation: `fadeUp .5s ease ${delay * 0.1}s both`,
      }}
    >
      <span>{label}</span>
      {desc && <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 7, color: "#8a95aa", letterSpacing: 1 }}>{desc}</span>}
    </button>
  );
}

function BottomTab({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      cursor: "pointer", opacity: active ? 1 : 0.6,
      minWidth: 44, minHeight: 44,
      justifyContent: "center",
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{
        fontFamily: "Oswald, sans-serif", fontSize: 7, letterSpacing: 1,
        color: active ? "#00e5ff" : "#8a95aa",
      }}>{label}</span>
    </div>
  );
}

const arrowBtn: React.CSSProperties = {
  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 8, padding: "6px 12px", cursor: "pointer",
  color: "#8a95aa", fontSize: 14, fontFamily: "Oswald, sans-serif",
};
