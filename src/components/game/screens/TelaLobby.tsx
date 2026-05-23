import React, { useState, useEffect, useCallback } from "react";
import { MONSTROS } from "@/game/data";
import { falar } from "@/game/voice";
import { pageBg, glassPanel } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import QRCode from "@/components/game/QRCode";
import { toast } from "@/hooks/use-toast";
import {
  criarSessao,
  entrarComoJogador,
  atualizarSessao,
  ouvirJogadores,
  fecharCanal,
  type GameSession,
  type GamePlayer,
} from "@/game/multiplayer";

interface TelaLobbyProps {
  monstroHost: string;
  onBatalha: (salaId: string, slot: number) => void;
}

export default function TelaLobby({ monstroHost, onBatalha }: TelaLobbyProps) {
  const [sessao, setSessao] = useState<GameSession | null>(null);
  const [jogadores, setJogadores] = useState<GamePlayer[]>([]);
  const [pronto, setPronto] = useState(false);
  const [loading, setLoading] = useState(true);

  const base = window.location.href.split("?")[0];
  const urlConvidado = sessao ? `${base}?sala=${sessao.join_code}&slot=1` : "";

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Create session in Supabase
        const s = await criarSessao();
        if (cancelled) return;
        setSessao(s);

        // Join as host (slot 0)
        const player = await entrarComoJogador(s.id, 0, monstroHost, "Anfitrião", MONSTROS[monstroHost].hp, MONSTROS[monstroHost].hp);
        if (cancelled) return;
        setJogadores([player]);
        setLoading(false);

        falar(
          `Sala criada. Código ${s.join_code.split("").join(" ")}. Mostre o QR Code para o adversário.`,
          true
        );

        // Listen for players joining via Realtime
        const channel = ouvirJogadores(
          s.id,
          async (newPlayer: GamePlayer) => {
            setJogadores((prev) => [...prev, newPlayer]);
            setPronto(true);
            falar("Adversário conectado. Pronto para batalhar.", true);
            // Update session status
            await atualizarSessao(s.id, { status: "active" as any });
          }
        );

        return () => {
          fecharCanal(channel);
        };
      } catch (err) {
        console.error("Erro ao criar sala:", err);
        setLoading(false);
      }
    }

    const cleanupPromise = init();
    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [monstroHost]);

  if (loading) {
    return (
      <div style={pageBg()}>
        <ChromeNoise />
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: 24, color: "#00e5ff", letterSpacing: 2 }}>
            ⏳ Criando sala...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageBg()}>
      <ChromeNoise />

      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily: "Nunito, sans-serif",
          gap: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: 26,
            color: "#00e5ff",
            letterSpacing: 2,
          }}
        >
          🎱 SALA MULTIJOGADOR
        </div>

        <div
          style={{
            ...glassPanel("#00e5ff55", {
              padding: 18,
              textAlign: "center" as const,
              boxShadow: "0 0 32px rgba(0,229,255,.16), 0 18px 44px rgba(0,0,0,.35)",
            }),
          }}
        >
          <div style={{ fontSize: 11, color: "#8fa0bc", marginBottom: 8, letterSpacing: 1 }}>
            ESCANEIE PARA ENTRAR
          </div>
          <QRCode valor={urlConvidado} tam={190} />
          <div
            style={{
              marginTop: 12,
              fontFamily: "Bangers, cursive",
              fontSize: 24,
              color: "#ffd54f",
              letterSpacing: 5,
            }}
          >
            {sessao?.join_code}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#6d7a92",
              marginTop: 6,
              wordBreak: "break-all" as const,
              maxWidth: 240,
            }}
          >
            Ou acesse: <span style={{ color: "#8ddfff" }}>{urlConvidado}</span>
          </div>

          {/* Share buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(urlConvidado).then(() => {
                  toast({ title: "✅ Link copiado!", description: "Cole no WhatsApp ou onde quiser." });
                }).catch(() => {
                  toast({ title: "❌ Erro ao copiar", variant: "destructive" });
                });
              }}
              style={{
                background: "rgba(0,229,255,.12)", border: "1px solid rgba(0,229,255,.3)",
                borderRadius: 10, padding: "8px 14px", color: "#00e5ff",
                fontFamily: "Bangers, cursive", fontSize: 13, cursor: "pointer",
                letterSpacing: 1, display: "flex", alignItems: "center", gap: 6,
              }}
            >
              📋 COPIAR LINK
            </button>
            <button
              onClick={() => {
                const msg = `⚔️ Vem jogar Beast Arena comigo!\n🎮 Entre na sala: ${sessao?.join_code}\n👉 ${urlConvidado}`;
                const whatsUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                window.open(whatsUrl, "_blank");
              }}
              style={{
                background: "linear-gradient(135deg, #25d366, #128c7e)", border: "none",
                borderRadius: 10, padding: "8px 14px", color: "#fff",
                fontFamily: "Bangers, cursive", fontSize: 13, cursor: "pointer",
                letterSpacing: 1, display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 4px 16px rgba(37,211,102,.3)",
              }}
            >
              💬 WHATSAPP
            </button>
          </div>

          {/* Native share */}
          {typeof navigator.share === "function" && (
            <button
              onClick={() => {
                navigator.share({
                  title: "Beast Arena — Desafio!",
                  text: `⚔️ Entre na minha sala Beast Arena! Código: ${sessao?.join_code}`,
                  url: urlConvidado,
                }).catch(() => {});
              }}
              style={{
                marginTop: 8,
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 10, padding: "8px 14px", color: "#8fa0bc",
                fontFamily: "Nunito, sans-serif", fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, margin: "8px auto 0",
              }}
            >
              📤 Compartilhar...
            </button>
          )}
        </div>

        <div
          style={{
            ...glassPanel(pronto ? "#00e67655" : "#2d3646", {
              padding: "12px 18px",
              textAlign: "center" as const,
              minWidth: 240,
            }),
          }}
        >
          {!pronto ? (
            <div
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: 12,
                color: "#94a0b5",
                animation: "pulseOpacity 1.5s infinite",
              }}
            >
              ⏳ Aguardando adversário...
            </div>
          ) : (
            <div
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: 16,
                color: "#00e676",
                letterSpacing: 1,
              }}
            >
              ✅ Adversário conectado!
            </div>
          )}

          {jogadores.map((j) => (
            <div key={j.id} style={{ fontSize: 11, color: "#8190a9", marginTop: 5 }}>
              Slot {j.slot + 1}:{" "}
              {j.monster_id && MONSTROS[j.monster_id]
                ? `${MONSTROS[j.monster_id].nome} ${MONSTROS[j.monster_id].emoji}`
                : "aguardando"}
            </div>
          ))}
        </div>

        <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 10 }}>
          {pronto && sessao && (
            <BtnMain variant="blue" onClick={() => onBatalha(sessao.id, 0)}>
              ⚔️ INICIAR BATALHA
            </BtnMain>
          )}
          <BtnMain variant="dark" onClick={() => window.location.reload()}>
            ← VOLTAR
          </BtnMain>
        </div>
      </div>
    </div>
  );
}
