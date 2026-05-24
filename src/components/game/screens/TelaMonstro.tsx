import React, { useState, useEffect, useRef } from "react";
import { MONSTROS } from "@/game/data";
import { supabase } from "@/integrations/supabase/client";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import { falar, markGesture } from "@/game/voice";
import { sfxTap } from "@/game/sfx";

interface TelaMonstroProps {
  onConfirmar: (monstroId: string) => void;
  onVoltar?: () => void;
  titulo?: string;
  userId?: string;
  onEvoluir?: (monstroId: string) => void;
  /** "evolution" hides the battle button and only shows Evoluir */
  modo?: "battle" | "evolution";
}

const monsters = Object.values(MONSTROS);
const STARTER_MONSTERS = ["panther", "banana"];

export default function TelaMonstro({
  onConfirmar, onVoltar,
  titulo = "ESCOLHA SEU MONSTRO",
  userId, onEvoluir, modo = "battle",
}: TelaMonstroProps) {
  const [idx, setIdx] = useState(() => {
    const last = localStorage.getItem("beast_last_monster");
    if (last) {
      const i = monsters.findIndex(m => m.id === last);
      if (i >= 0) return i;
    }
    return 0;
  });
  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStart = useRef<number | null>(null);
  const [unlockedMonsters, setUnlockedMonsters] = useState<Set<string>>(new Set(STARTER_MONSTERS));
  const [powerLevels, setPowerLevels] = useState<Record<string, number>>({});

  // Load unlocked monsters from inventory
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from("user_inventory")
        .select("item_key")
        .eq("user_id", userId)
        .eq("item_type", "monster");
      if (data) {
        setUnlockedMonsters(new Set([...STARTER_MONSTERS, ...data.map((d: any) => d.item_key)]));
      }
      const { data: pls } = await supabase.from("user_monsters")
        .select("monster_id,power_level").eq("user_id", userId);
      if (pls) {
        const map: Record<string, number> = {};
        pls.forEach((r: any) => { map[r.monster_id] = r.power_level; });
        setPowerLevels(map);
      }
    })();
  }, [userId]);

  const m = monsters[idx];

  useEffect(() => {
    falar("Escolha seu monstro. Deslize para ver as opções.", true);
  }, []);

  useEffect(() => {
    if (dir) {
      setAnimating(true);
      const t = setTimeout(() => {
        setAnimating(false);
        setDir(null);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [dir, idx]);

  function goTo(newIdx: number) {
    if (animating) return;
    markGesture();
    sfxTap();
    const d = newIdx > idx ? "left" : "right";
    setDir(d);
    setIdx(newIdx);
    const mon = monsters[newIdx];
    falar(`${mon.nome}. Ataque ${mon.atk}, defesa ${mon.def}, vida ${mon.hp}. ${mon.hab}.`);
  }

  function prev() {
    goTo(idx === 0 ? monsters.length - 1 : idx - 1);
  }
  function next() {
    goTo(idx === monsters.length - 1 ? 0 : idx + 1);
  }

  const isUnlocked = !userId || unlockedMonsters.has(m.id);

  function handleConfirm() {
    if (!isUnlocked) return;
    markGesture();
    localStorage.setItem("beast_last_monster", m.id);
    falar(`${m.nome} selecionado! Prepare-se para a batalha.`, true);
    onConfirmar(m.id);
  }

  // Touch/swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(diff) > 50) {
      if (diff < 0) next();
      else prev();
    }
  }

  const slideAnim =
    dir === "left"
      ? "carouselSlideInLeft .4s cubic-bezier(.22,1,.36,1) forwards"
      : dir === "right"
      ? "carouselSlideInRight .4s cubic-bezier(.22,1,.36,1) forwards"
      : "none";

  return (
    <div style={pageBg()}>
      <style>{`
        @keyframes carouselSlideInLeft {
          0% { opacity: 0; transform: translateX(80px) scale(.85) rotateY(-8deg); }
          100% { opacity: 1; transform: translateX(0) scale(1) rotateY(0); }
        }
        @keyframes carouselSlideInRight {
          0% { opacity: 0; transform: translateX(-80px) scale(.85) rotateY(8deg); }
          100% { opacity: 1; transform: translateX(0) scale(1) rotateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px var(--glow-c), 0 8px 40px rgba(0,0,0,.5); }
          50% { box-shadow: 0 0 50px var(--glow-c), 0 8px 50px rgba(0,0,0,.4); }
        }
        @keyframes particleFloat {
          0% { opacity: 0; transform: translateY(20px) scale(0); }
          30% { opacity: 1; transform: translateY(-10px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.5); }
        }
      `}</style>
      <ChromeNoise />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: "16px 14px 20px",
          fontFamily: "Nunito, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Header with back button */}
        <div style={{ textAlign: "center", flexShrink: 0, position: "relative" }}>
          {onVoltar && (
            <button
              onClick={onVoltar}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 8,
                padding: "6px 12px",
                color: "#8a95aa",
                fontSize: 13,
                fontFamily: "Nunito, sans-serif",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              ← Voltar
            </button>
          )}
          <div style={{ fontFamily: "Bangers, cursive", fontSize: 22, color: "#00e5ff", letterSpacing: 2 }}>
            {titulo}
          </div>
          <div style={{ fontSize: 11, color: "#8a95aa", marginTop: 2 }}>
            ← Deslize para navegar
          </div>
        </div>

        {/* Carousel area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            minHeight: 0,
            perspective: "800px",
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Left arrow */}
          <button
            onClick={prev}
            style={{
              position: "absolute",
              left: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 999,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: 18,
              backdropFilter: "blur(4px)",
            }}
          >
            ‹
          </button>

          {/* Card */}
          <div
            key={idx}
            style={{
              width: "min(280px, 75vw)",
              borderRadius: 24,
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(18,20,40,.95), rgba(8,9,18,.98))",
              border: `2px solid ${m.glow}88`,
              // @ts-ignore
              "--glow-c": `${m.glow}66`,
              animation: `${slideAnim}${dir ? "" : ", glowPulse 2.5s ease-in-out infinite"}`,
              transformStyle: "preserve-3d",
            } as React.CSSProperties}
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${m.bg1}, ${m.bg2})`,
                padding: "14px 16px 10px",
                borderBottom: `1px solid ${m.glow}33`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Sparkle particles */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: m.glow,
                    left: `${15 + i * 18}%`,
                    bottom: 8,
                    opacity: 0,
                    animation: `particleFloat 2s ease-out ${i * 0.3}s infinite`,
                  }}
                />
              ))}
              <div style={{ fontFamily: "Bangers, cursive", fontSize: 26, color: "#fff", letterSpacing: 2, textShadow: `0 0 12px ${m.glow}` }}>
                {m.nome}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontFamily: "Nunito, sans-serif" }}>
                {m.hab}
              </div>
            </div>

            {/* Monster image area */}
            <div
              style={{
                background: `radial-gradient(circle at 40% 30%, ${m.glow}22, transparent 50%), linear-gradient(160deg, ${m.bg2}44, rgba(2,6,15,.9))`,
                height: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <MonsterAvatar monstroId={m.id} size={120} glow={m.glow} />
              {/* Aura ring */}
              <div
                style={{
                  position: "absolute",
                  width: 140,
                  height: 140,
                  borderRadius: 999,
                  border: `1px solid ${m.glow}33`,
                  animation: "glowPulse 3s ease-in-out infinite",
                  // @ts-ignore
                  "--glow-c": `${m.glow}22`,
                } as React.CSSProperties}
              />
            </div>

            {/* Stats */}
            <div style={{ padding: "14px 16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
                <StatBadge icon="⚔️" label="ATK" value={m.atk} color="#ff7961" />
                <StatBadge icon="🛡️" label="DEF" value={m.def} color="#82b1ff" />
                <StatBadge icon="❤️" label="HP" value={m.hp} color="#ef5350" />
              </div>
              <div
                style={{
                  textAlign: "center",
                  color: "#ffd54f",
                  fontFamily: "Bangers, cursive",
                  fontSize: 13,
                  letterSpacing: 1,
                }}
              >
                {m.hab}
              </div>
              <div style={{ textAlign: "center", color: "#7e879a", fontSize: 10, marginTop: 2 }}>
                {m.habD}
              </div>
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={next}
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 999,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              fontSize: 18,
              backdropFilter: "blur(4px)",
            }}
          >
            ›
          </button>
        </div>

        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexShrink: 0, margin: "8px 0" }}>
          {monsters.map((mon, i) => (
            <button
              key={mon.id}
              onClick={() => i !== idx && goTo(i)}
              aria-label={`${mon.nome} ${i === idx ? "(selecionado)" : ""}`}
              style={{
                width: i === idx ? 24 : 10,
                height: 10,
                borderRadius: 999,
                background: i === idx ? m.glow : "rgba(255,255,255,.15)",
                border: "none",
                cursor: "pointer",
                transition: "all .3s ease",
                boxShadow: i === idx ? `0 0 8px ${m.glow}` : "none",
                // Larger tap target via padding
                padding: "10px 4px",
                margin: "-10px -4px",
              }}
            />
          ))}
        </div>

        {/* Confirm button */}
        <div style={{ flexShrink: 0, maxWidth: 300, marginInline: "auto", width: "100%" }}>
          {isUnlocked ? (
            <>
              {modo === "battle" && (
                <BtnMain variant="gold" onClick={handleConfirm}>
                  ✅ BATALHAR COM {m.nome.toUpperCase()}
                </BtnMain>
              )}
              {onEvoluir && userId && (
                <button onClick={() => onEvoluir(m.id)} style={{
                  marginTop: 10, width: "100%", padding: "10px 14px",
                  background: "linear-gradient(135deg,#7c3aed,#b794ff)",
                  border: "none", borderRadius: 12, color: "#fff",
                  fontFamily: "Bangers, cursive", letterSpacing: 2, fontSize: 16,
                  cursor: "pointer", boxShadow: "0 6px 20px rgba(124,58,237,.4)",
                }}>
                  ⚡ EVOLUIR · PL {powerLevels[m.id] || 1}
                </button>
              )}
            </>
          ) : (
            <div>
              <BtnMain variant="dark" onClick={() => {}}>
                🔒 BLOQUEADO
              </BtnMain>
              <div style={{
                textAlign: "center", marginTop: 6,
                fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8a95aa",
              }}>
                Desbloqueie na Loja com moedas 💰
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 9, color: "#8a95aa", fontFamily: "Oswald, sans-serif", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: "Bangers, cursive", color, letterSpacing: 1 }}>{value}</div>
    </div>
  );
}
