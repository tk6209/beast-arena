import React, { useEffect, useState } from "react";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { supabase } from "@/integrations/supabase/client";
import { MONSTROS, SWARMS } from "@/game/data";
import { purchaseShopItem } from "@/game/serverApi";
import { SWARM_RARITY_STYLES } from "@/game/data";
import type { User } from "@supabase/supabase-js";

interface TelaLojaProps {
  user: User;
  onVoltar: () => void;
}

interface ShopItem {
  id: string;
  item_type: string;
  item_key: string;
  name: string;
  description: string;
  price_coins: number;
  level_required: number;
  emoji: string;
  rarity: string;
}

interface PackReveal {
  items: { nome: string; emoji: string; raridade: string }[];
  showing: boolean;
  currentIdx: number;
}

export default function TelaLoja({ user, onVoltar }: TelaLojaProps) {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [packReveal, setPackReveal] = useState<PackReveal | null>(null);
  const [tab, setTab] = useState<"monstros" | "packs">("monstros");

  useEffect(() => { loadData(); }, [user.id]);

  async function loadData() {
    setLoading(true);
    const [{ data: profile }, { data: items }, { data: inventory }] = await Promise.all([
      supabase.from("profiles").select("coins, level").eq("user_id", user.id).single(),
      supabase.from("shop_items").select("*").eq("active", true),
      supabase.from("user_inventory").select("item_type, item_key").eq("user_id", user.id),
    ]);
    if (profile) { setCoins(profile.coins); setLevel(profile.level); }
    if (items) setShopItems(items);
    if (inventory) {
      setOwnedItems(new Set(inventory.map((i: any) => `${i.item_type}:${i.item_key}`)));
    }
    setLoading(false);
  }

  async function buyItem(item: ShopItem) {
    if (buying) return;
    if (coins < item.price_coins) { setMessage("Moedas insuficientes! 💸"); setTimeout(() => setMessage(null), 2000); return; }
    if (level < item.level_required) { setMessage(`Precisa de LV ${item.level_required}! 🔒`); setTimeout(() => setMessage(null), 2000); return; }

    const invKey = item.item_type === "monster_unlock" ? `monster:${item.item_key}` : `${item.item_type}:${item.item_key}`;
    if (item.item_type === "monster_unlock" && ownedItems.has(invKey)) { setMessage("Já desbloqueado! ✅"); setTimeout(() => setMessage(null), 2000); return; }

    setBuying(item.id);

    try {
      await purchaseShopItem({
        userId: user.id,
        itemId: item.id,
        itemType: item.item_type,
        itemKey: item.item_key,
        quantity: 1,
      });

      if (item.item_type === "monster_unlock") {
        setOwnedItems(prev => new Set([...prev, invKey]));
        setCoins(c => c - item.price_coins);
        setMessage(`${item.emoji} ${item.name} desbloqueado! 🎉`);
        try {
          const { triggerMonsterUnlock } = await import("@/components/game/MonsterUnlockOverlay");
          triggerMonsterUnlock(item.item_key);
        } catch {}
      } else if (item.item_type === "swarm_pack") {
        const swarmItems = generatePackSwarms(item.item_key);
        setCoins(c => c - item.price_coins);
        setPackReveal({
          items: swarmItems.map(s => ({ nome: s.nome, emoji: s.emoji, raridade: s.raridade })),
          showing: true,
          currentIdx: 0,
        });
      } else if (item.item_type === "xp_boost") {
        setCoins(c => c - item.price_coins);
        setMessage("⚡ Boost XP 2x ativado para 5 partidas!");
      }
    } catch {
      setMessage("Compra não autorizada no cliente. Tente novamente.");
      setBuying(null);
      setTimeout(() => setMessage(null), 2500);
      return;
    }

    setBuying(null);
    setTimeout(() => setMessage(null), 3000);
  }

  function generatePackSwarms(packKey: string) {
    const count = 3;
    const result: typeof SWARMS[number][] = [];
    for (let i = 0; i < count; i++) {
      let pool = SWARMS;
      if (packKey === "pack_raro") pool = SWARMS.filter(s => s.raridade !== "comum");
      else if (packKey === "pack_lendario") pool = SWARMS.filter(s => s.raridade === "lendario" || s.raridade === "epico" || (Math.random() > 0.5 && s.raridade === "raro"));
      if (pool.length === 0) pool = SWARMS;
      result.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return result;
  }

  const monsterItems = shopItems.filter(i => i.item_type === "monster_unlock");
  const packItems = shopItems.filter(i => i.item_type !== "monster_unlock");

  return (
    <div style={pageBg()}>
      <ChromeNoise />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes packRevealCard {
          0% { opacity:0; transform:scale(0.3) rotateY(180deg); }
          60% { opacity:1; transform:scale(1.1) rotateY(0); }
          100% { transform:scale(1) rotateY(0); }
        }
        @keyframes packGlow {
          0%,100% { box-shadow: 0 0 20px var(--glow-c); }
          50% { box-shadow: 0 0 40px var(--glow-c), 0 0 80px var(--glow-c); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Pack reveal overlay */}
      {packReveal?.showing && (
        <div
          onClick={() => {
            if (packReveal.currentIdx < packReveal.items.length - 1) {
              setPackReveal({ ...packReveal, currentIdx: packReveal.currentIdx + 1 });
            } else {
              setPackReveal(null);
            }
          }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,.85)", display: "flex",
            alignItems: "center", justifyContent: "center", flexDirection: "column",
            gap: 16, cursor: "pointer",
          }}
        >
          {(() => {
            const item = packReveal.items[packReveal.currentIdx];
            const rs = SWARM_RARITY_STYLES[item.raridade] || SWARM_RARITY_STYLES.comum;
            return (
              <>
                <div
                  key={packReveal.currentIdx}
                  style={{
                    width: 180, height: 220, borderRadius: 16,
                    background: `linear-gradient(135deg, rgba(18,20,40,.95), rgba(8,9,18,.98))`,
                    border: `3px solid ${rs.border}`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 12, animation: "packRevealCard .6s ease forwards",
                    // @ts-ignore
                    "--glow-c": rs.glow,
                    boxShadow: `0 0 30px ${rs.glow}`,
                  } as React.CSSProperties}
                >
                  <div style={{ fontSize: 56 }}>{item.emoji}</div>
                  <div style={{ fontFamily: "Bangers, cursive", fontSize: 18, color: "#e8f0ff", letterSpacing: 1 }}>
                    {item.nome}
                  </div>
                  <div style={{
                    fontFamily: "Oswald, sans-serif", fontSize: 10,
                    color: rs.border, letterSpacing: 2, textTransform: "uppercase",
                  }}>{rs.label}</div>
                </div>
                <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#8a95aa" }}>
                  {packReveal.currentIdx + 1} / {packReveal.items.length} — Toque para continuar
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "16px 16px 24px", position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 360, animation: "fadeUp .5s ease forwards" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: 26, color: "#ffd54f", letterSpacing: 3 }}>
              🏪 LOJA
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,213,79,.08)", border: "1px solid rgba(255,213,79,.2)",
              borderRadius: 20, padding: "4px 16px", marginTop: 6,
            }}>
              <span style={{ fontSize: 16 }}>💰</span>
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, color: "#ffd54f" }}>{coins}</span>
              <span style={{ fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8a95aa", marginLeft: 8 }}>
                LV {level}
              </span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              background: "rgba(0,229,255,.1)", border: "1px solid rgba(0,229,255,.3)",
              borderRadius: 8, padding: "8px 14px", marginBottom: 10, textAlign: "center",
              fontFamily: "Nunito, sans-serif", fontSize: 13, color: "#e8f0ff",
            }}>
              {message}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {(["monstros", "packs"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "Bangers, cursive", fontSize: 14, letterSpacing: 2,
                background: tab === t ? "rgba(0,229,255,.15)" : "rgba(255,255,255,.04)",
                color: tab === t ? "#00e5ff" : "#8a95aa",
                borderBottom: tab === t ? "2px solid #00e5ff" : "2px solid transparent",
              }}>
                {t === "monstros" ? "🐾 MONSTROS" : "📦 PACKS"}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 12, padding: 40 }}>Carregando...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(tab === "monstros" ? monsterItems : packItems).map(item => {
                const owned = item.item_type === "monster_unlock" && ownedItems.has(`monster:${item.item_key}`);
                const locked = level < item.level_required;
                const rs = SWARM_RARITY_STYLES[item.rarity] || SWARM_RARITY_STYLES.comum;
                const monsterData = item.item_type === "monster_unlock" ? MONSTROS[item.item_key] : null;

                return (
                  <div key={item.id} style={{
                    background: "rgba(255,255,255,.03)", border: `1px solid ${owned ? "#69f0ae33" : locked ? "#ffffff11" : rs.border + "44"}`,
                    borderRadius: 12, padding: "12px 14px",
                    opacity: locked ? 0.5 : 1, position: "relative", overflow: "hidden",
                  }}>
                    {/* Shimmer for legendaries */}
                    {item.rarity === "lendario" && !owned && (
                      <div style={{
                        position: "absolute", inset: 0, background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,193,7,.05) 50%, transparent 100%)",
                        backgroundSize: "200% 100%", animation: "shimmer 3s ease infinite", pointerEvents: "none",
                      }} />
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `linear-gradient(135deg, ${monsterData?.bg1 || "#1a1a2e"}, ${monsterData?.bg2 || "#16213e"})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, flexShrink: 0,
                        border: `1px solid ${rs.border}44`,
                      }}>
                        {item.emoji}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: "Bangers, cursive", fontSize: 16, color: "#e8f0ff", letterSpacing: 1 }}>
                            {item.name}
                          </span>
                          {owned && <span style={{ fontSize: 12, color: "#69f0ae" }}>✅</span>}
                        </div>
                        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 10, color: "#8a95aa", lineHeight: 1.3 }}>
                          {item.description}
                        </div>
                        {monsterData && (
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#ff7961" }}>⚔️{monsterData.atk}</span>
                            <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#82b1ff" }}>🛡️{monsterData.def}</span>
                            <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 9, color: "#ef5350" }}>❤️{monsterData.hp}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {!owned && (
                          <button
                            disabled={locked || buying === item.id || coins < item.price_coins}
                            onClick={() => buyItem(item)}
                            style={{
                              background: locked ? "rgba(255,255,255,.05)" : coins < item.price_coins ? "rgba(255,255,255,.05)" : "linear-gradient(135deg, #ffd54f, #ff9800)",
                              border: "none", borderRadius: 8,
                              padding: "6px 12px", cursor: locked ? "not-allowed" : "pointer",
                              fontFamily: "Bangers, cursive", fontSize: 13, letterSpacing: 1,
                              color: locked || coins < item.price_coins ? "#8a95aa" : "#1a1a2e",
                            }}
                          >
                            {locked ? `🔒 LV${item.level_required}` : buying === item.id ? "..." : `💰 ${item.price_coins}`}
                          </button>
                        )}
                        {owned && (
                          <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 10, color: "#69f0ae", letterSpacing: 1 }}>
                            OBTIDO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
          </div>
        </div>
      </div>
    </div>
  );
}
