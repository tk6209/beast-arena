import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pageBg, DS } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import Carta from "@/components/game/Carta";
import MonsterAvatar from "@/components/game/MonsterAvatar";
import { MONSTROS } from "@/game/data";
import { loadPlayerDeck, savePlayerDeck } from "@/game/serverApi";
import type { User } from "@supabase/supabase-js";
import type { CartaData } from "@/game/data";

interface Props { user: User; onVoltar: () => void; }

const DECK_SIZE = 8;

interface OwnedCard { card_key: string; card_data: CartaData; quantity: number; raridade: string; }

export default function TelaDeckBuilder({ user, onVoltar }: Props) {
  const monsterIds = Object.keys(MONSTROS);
  const [selMonster, setSelMonster] = useState<string>(monsterIds[0]);
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [deck, setDeck] = useState<CartaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Load owned cards once
  useEffect(() => { (async () => {
    const { data } = await supabase.from("user_cards")
      .select("card_key,card_data,quantity,raridade")
      .eq("user_id", user.id);
    setOwned((data as any) || []);
  })(); }, [user.id]);

  // Load deck for selected monster
  useEffect(() => { (async () => {
    setLoading(true);
    const d = await loadPlayerDeck(user.id, selMonster);
    setDeck(d || []);
    setLoading(false);
  })(); }, [user.id, selMonster]);

  function toggleCard(c: CartaData) {
    const inDeck = deck.find(d => d.id === c.id);
    if (inDeck) { setDeck(deck.filter(d => d.id !== c.id)); return; }
    if (deck.length >= DECK_SIZE) { setToast(`Máximo ${DECK_SIZE} cartas`); setTimeout(() => setToast(null), 1500); return; }
    setDeck([...deck, c]);
  }

  async function handleSave() {
    if (deck.length === 0) { setToast("Deck vazio"); setTimeout(() => setToast(null), 1500); return; }
    setSaving(true);
    try {
      await savePlayerDeck(user.id, selMonster, deck);
      setToast("✅ Deck salvo!");
      setTimeout(() => setToast(null), 1500);
    } catch (e) { setToast("Erro ao salvar"); setTimeout(() => setToast(null), 1800); }
    setSaving(false);
  }

  const mInfo = MONSTROS[selMonster];

  return (
    <div style={pageBg("#0a1430")}>
      <ChromeNoise />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ padding: "16px 12px 24px", maxWidth: 480, margin: "0 auto", animation: "fadeUp .4s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: DS.fontDisplay, fontSize: 28, color: DS.cyan, letterSpacing: 3 }}>⚔️ DECK BUILDER</div>
        </div>

        {/* Monster selector */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
          {monsterIds.map(id => {
            const active = selMonster === id;
            return (
              <button key={id} onClick={() => setSelMonster(id)} style={{
                flexShrink: 0, width: 56, height: 56, borderRadius: 12,
                background: active ? `${DS.cyan}22` : "rgba(255,255,255,.03)",
                border: `2px solid ${active ? DS.cyan : DS.bg3}`,
                cursor: "pointer", padding: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MonsterAvatar monstroId={id} size={44} />
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: DS.fontUI, fontSize: 11, color: "#8a95aa", textAlign: "center", marginBottom: 10 }}>
          DECK DE <span style={{ color: DS.gold }}>{mInfo?.nome?.toUpperCase()}</span> · {deck.length}/{DECK_SIZE}
        </div>

        {/* Current deck */}
        <div style={{
          background: "rgba(0,212,255,.04)", border: `1px solid ${DS.cyan}44`,
          borderRadius: 14, padding: 10, marginBottom: 14, minHeight: 140,
        }}>
          <div style={{ fontFamily: DS.fontUI, fontSize: 10, color: DS.cyan, letterSpacing: 2, marginBottom: 6 }}>DECK ATIVO</div>
          {deck.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8a95aa", fontSize: 11, padding: 20 }}>
              Toque nas cartas abaixo para adicionar
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, justifyItems: "center" }}>
              {deck.map(c => (
                <div key={c.id} onClick={() => toggleCard(c)} style={{ cursor: "pointer" }}>
                  <Carta carta={c} mini sel />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Owned pool */}
        <div style={{ fontFamily: DS.fontUI, fontSize: 10, color: "#8a95aa", letterSpacing: 2, marginBottom: 6 }}>
          MINHAS CARTAS · {owned.length}
        </div>
        {loading ? (
          <div style={{ textAlign: "center", color: "#8a95aa", padding: 30, fontSize: 12 }}>Carregando…</div>
        ) : owned.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#8a95aa", fontSize: 12 }}>
            Você ainda não tem cartas. Vença batalhas para coletar!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, justifyItems: "center", marginBottom: 14 }}>
            {owned.map(oc => {
              const inDeck = !!deck.find(d => d.id === oc.card_data.id);
              return (
                <div key={oc.card_key} onClick={() => toggleCard(oc.card_data)}
                     style={{ cursor: "pointer", opacity: inDeck ? 0.35 : 1, position: "relative" }}>
                  <Carta carta={oc.card_data} mini sel={inDeck} />
                  {oc.quantity > 1 && (
                    <div style={{
                      position: "absolute", top: -4, right: -4, background: DS.gold, color: "#000",
                      fontFamily: DS.fontDisplay, fontSize: 10, padding: "1px 6px", borderRadius: 10,
                    }}>×{oc.quantity}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          <BtnMain variant="gold" onClick={handleSave} disabled={saving}>
            {saving ? "SALVANDO…" : "💾 SALVAR DECK"}
          </BtnMain>
          <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
        </div>

        {toast && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: DS.bg1, border: `1px solid ${DS.gold}`, color: DS.gold,
            padding: "10px 18px", borderRadius: 12, fontFamily: DS.fontUI, fontSize: 13,
            boxShadow: DS.shadowGold, zIndex: 999,
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
}