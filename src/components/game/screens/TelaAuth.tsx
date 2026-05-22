import React, { useState } from "react";
import { pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface TelaAuthProps {
  onAuth: () => void;
  onSkip: () => void;
}

export default function TelaAuth({ onAuth, onSkip }: TelaAuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmail = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setSuccess("Verifique seu email para confirmar o cadastro!");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth();
      }
    } catch (e: any) {
      setError(e.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        throw result.error;
      }
      if (result.redirected) return;
      onAuth();
    } catch (e: any) {
      setError(e.message || "Erro ao conectar com Google");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "Nunito, sans-serif",
    background: "rgba(0,229,255,.06)",
    border: "1px solid rgba(0,229,255,.25)",
    borderRadius: 8,
    color: "#e8f0ff",
    outline: "none",
    boxSizing: "border-box",
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
          textAlign: "center",
          animation: "fadeUp .5s ease forwards",
        }}>
          <div style={{ fontSize: 48, marginBottom: 8, filter: "drop-shadow(0 0 20px #00e5ff)" }}>🛡️</div>

          <h2 style={{
            fontFamily: "Bangers, cursive",
            fontSize: 28,
            color: "#e8f0ff",
            letterSpacing: 2,
            margin: "0 0 4px",
            background: "linear-gradient(180deg, #e8f0ff 0%, #7eb8ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </h2>

          <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#8a95aa", marginBottom: 20 }}>
            Salve seu progresso e entre no ranking global
          </div>

          {/* Google */}
          <BtnMain variant="dark" onClick={handleGoogle} disabled={loading}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Entrar com Google
            </span>
          </BtnMain>

          <div style={{
            display: "flex", alignItems: "center", gap: 12, margin: "16px 0",
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
            <span style={{ fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8a95aa" }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
          </div>

          {/* Email form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              style={inputStyle}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha (min 6 caracteres)"
              onKeyDown={e => e.key === "Enter" && handleEmail()}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#ef4444", marginBottom: 8 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#69f0ae", marginBottom: 8 }}>
              {success}
            </div>
          )}

          <BtnMain variant="blue" onClick={handleEmail} disabled={loading}>
            {loading ? "..." : mode === "login" ? "ENTRAR" : "CADASTRAR"}
          </BtnMain>

          <div
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: 12,
              color: "#00e5ff",
              marginTop: 12,
              cursor: "pointer",
            }}
          >
            {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </div>

        </div>
      </div>
    </div>
  );
}
