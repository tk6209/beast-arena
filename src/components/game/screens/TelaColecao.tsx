import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pageBg, DS } from "@/game/styles";
import ChromeNoise from "@/components/game/ChromeNoise";
import BtnMain from "@/components/game/BtnMain";
import Carta from "@/components/game/Carta";
import type { User } from "@supabase/supabase-js";
import type { CartaData } from "@/game/data";

interface Props { user: User; onVoltar: () => void; onDeckBuilder: () => void; }

interface OwnedCard {
  card_key: string;
  card_data: CartaData;
  raridade: string;
  quantity: number;
  obtained_at: string;
}

const RARITY_ORDER = ["lendario", "epico", "raro", "incomum", "comum"];
const RARITY_LABEL: Record<string, string> = {
  lendario: "LENDÁRIAS", epico: "ÉPICAS", raro: "RARAS",
  incomum: "INCOMUNS", comum: "COMUNS",
};
const RARITY_COLOR: Record<string, string> = {
  lendario: DS.gold, epico: DS.violet, raro: DS.cyan,
  incomum: DS.green, comum: "#8a95aa",
};

export default function TelaColecao({ user, onVoltar, onDeckBuilder }: Props) {
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { (async () => {
    setLoading(true);
    const { data } = await supabase.from("user_cards")
      .select("card_key,card_data,raridade,quantity,obtained_at")
      .eq("user_id", user.id)
      .order("obtained_at", { ascending: false });
    setCards((data as any) || []);
    setLoading(false);
  })(); }, [user.id]);

  const counts: Record<string, number> = { all: cards.length };
  for (const r of RARITY_ORDER) counts[r] = cards.filter(c => c.raridade === r).length;

  const filtered = filter === "all" ? cards : cards.filter(c => c.raridade === filter);
  const groups: Record<string, OwnedCard[]> = {};
  for (const c of filtered) (groups[c.raridade] ||= []).push(c);

  return (
    <div style={pageBg("#1a0e08")}>
      <ChromeNoise />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ padding: "16px 12px 24px", maxWidth: 480, margin: "0 auto", animation: "fadeUp .4s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: DS.fontDisplay, fontSize: 30, color: DS.gold, letterSpacing: 3 }}>
            🃏 COLEÇÃO
          </div>
          <div style={{ fontFamily: DS.fontBody, fontSize: 12, color: "#8a95aa", marginTop: 2 }}>
            {cards.length} cartas únicas · {cards.reduce((s, c) => s + c.quantity, 0)} no total
          </div>
        </div>

        {/* Rarity filters */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
          {["all", ...RARITY_ORDER].map(r => {
            const active = filter === r;
            const color = r === "all" ? "#fff" : RARITY_COLOR[r];
            return (
              <button key={r} onClick={() => setFilter(r)} style={{
                flexShrink: 0, padding: "8px 12px", borderRadius: 10,
                background: active ? `${color}22` : "rgba(255,255,255,.03)",
                border: `1px solid ${active ? color : DS.bg3}`,
                color: active ? color : "#8a95aa",
                fontFamily: DS.fontUI, fontSize: 11, letterSpacing: 1,
                cursor: "pointer", textTransform: "uppercase",
              }}>
                {r === "all" ? "TODAS" : RARITY_LABEL[r]} · {counts[r] || 0}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#8a95aa", padding: 60, fontSize: 12 }}>Carregando…</div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#8a95aa", fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            Sua coleção está vazia.<br/>
            Vença batalhas para ganhar cartas raras!
          </div>
        ) : (
          RARITY_ORDER.filter(r => groups[r]?.length).map(r => (
            <div key={r} style={{ marginBottom: 18 }}>
              <div style={{
                fontFamily: DS.fontDisplay, fontSize: 16, letterSpacing: 2,
                color: RARITY_COLOR[r], marginBottom: 8, paddingLeft: 4,
                textShadow: `0 0 12px ${RARITY_COLOR[r]}55`,
              }}>
                {RARITY_LABEL[r]} · {groups[r].length}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, justifyItems: "center" }}>
                {groups[r].map(oc => (
                  <div key={oc.card_key} style={{ position: "relative" }}>
                    <Carta carta={oc.card_data} mini />
                    {oc.quantity > 1 && (
                      <div style={{
                        position: "absolute", top: -4, right: -4,
                        background: DS.gold, color: "#000",
                        fontFamily: DS.fontDisplay, fontSize: 11,
                        padding: "2px 7px", borderRadius: 10,
                        boxShadow: "0 2px 6px rgba(0,0,0,.5)",
                      }}>×{oc.quantity}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <BtnMain variant="gold" onClick={onDeckBuilder}>⚔️ MONTAR DECK</BtnMain>
          <BtnMain variant="blue" onClick={onVoltar}>← VOLTAR</BtnMain>
        </div>
      </div>
    </div>
  );
}