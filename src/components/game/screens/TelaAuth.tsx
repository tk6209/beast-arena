import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { DS, pageBg } from "@/game/styles";
import BtnMain from "@/components/game/BtnMain";
import ChromeNoise from "@/components/game/ChromeNoise";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface TelaAuthProps {
  onAuth: () => void;
  onSkip: () => void;
}

/**
 * Login / cadastro do Beast Arena.
 *
 * Responsivo de verdade: o Beast Arena roda em paisagem no celular (≈ 375–430 px de
 * altura), onde a coluna única antiga cortava o botão ENTRAR sem permitir rolagem.
 * Agora a tela rola, e em telas baixas e largas vira duas colunas (marca + Google à
 * esquerda, e-mail à direita), cabendo inteira sem rolar.
 */
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
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/beast-arena`,
      });
      if (result.error) {
        throw result.error;
      }
      if (result.redirected) return;
      onAuth();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "Erro ao conectar com Google");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(null);
    setSuccess(null);
  };

  return (
    <div style={{ ...pageBg(), height: "100dvh", minHeight: 0 }}>
      <ChromeNoise />
      <style>{`
        @keyframes authFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .auth-scroll { position:relative; z-index:1; height:100%; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; }
        .auth-wrap { min-height:100%; display:flex; align-items:center; justify-content:center; box-sizing:border-box;
          padding: max(56px, calc(env(safe-area-inset-top) + 56px)) max(20px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left)); }
        .auth-card { width:100%; max-width:380px; display:grid; gap:20px; animation:authFadeUp .45s ease both; }
        .auth-brand { text-align:center; display:grid; gap:6px; justify-items:center; }
        .auth-shield { font-size:48px; line-height:1; filter:drop-shadow(0 0 20px #00e5ff); }
        .auth-title { margin:0; font-family:${DS.fontDisplay}; font-weight:400; font-size:clamp(34px, 6vw, 44px); letter-spacing:2px; line-height:1;
          background:linear-gradient(180deg,#e8f0ff 0%,#7eb8ff 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .auth-sub { font-family:${DS.fontBody}; font-size:14px; color:#9aa6bd; margin:0; }
        .auth-form { display:grid; gap:10px; }
        .auth-or { display:flex; align-items:center; gap:12px; font-family:${DS.fontBody}; font-size:12px; color:#8a95aa; }
        .auth-or::before, .auth-or::after { content:""; flex:1; height:1px; background:rgba(255,255,255,.12); }
        .auth-label { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
        .auth-input { width:100%; box-sizing:border-box; min-height:48px; padding:12px 14px; font-size:16px; /* 16px evita o zoom automático do iOS */
          font-family:${DS.fontBody}; background:rgba(0,229,255,.06); border:1px solid rgba(0,229,255,.25); border-radius:10px; color:#e8f0ff; outline:none; }
        .auth-input::placeholder { color:#8190aa; }
        .auth-input:focus-visible { border-color:#38e1ff; box-shadow:0 0 0 3px rgba(56,225,255,.25); }
        .auth-msg { font-family:${DS.fontBody}; font-size:13px; margin:0; text-align:center; }
        .auth-toggle { background:none; border:0; padding:8px; min-height:44px; cursor:pointer; font-family:${DS.fontBody}; font-size:14px; color:#38e1ff; justify-self:center; }
        .auth-toggle:focus-visible, .auth-back:focus-visible { outline:2px solid #38e1ff; outline-offset:2px; border-radius:8px; }
        .auth-back { position:absolute; z-index:2; top:max(12px, env(safe-area-inset-top)); left:max(12px, env(safe-area-inset-left));
          display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 14px 0 10px; border-radius:999px; cursor:pointer;
          border:1px solid rgba(255,255,255,.15); background:rgba(0,0,0,.4); color:rgba(255,255,255,.85); font-family:${DS.fontBody}; font-size:14px; font-weight:600; }
        /* Telas baixas e largas (celular em paisagem): duas colunas, tudo visível sem rolar */
        @media (max-height: 560px) and (min-width: 540px) {
          .auth-wrap { padding-top: max(16px, env(safe-area-inset-top)); padding-bottom: max(16px, env(safe-area-inset-bottom)); }
          .auth-card { max-width:760px; grid-template-columns: 1fr 1fr; align-items:center; column-gap:clamp(16px, 4vw, 32px); row-gap:12px; }
          .auth-brand { gap:4px; }
          .auth-shield { font-size:34px; }
          .auth-title { font-size:34px; }
          .auth-sub { font-size:13px; }
          .auth-input { min-height:44px; padding:10px 12px; }
        }
        @media (max-height: 400px) and (min-width: 540px) {
          .auth-shield { display:none; }
        }
        @media (prefers-reduced-motion: reduce) { .auth-card { animation:none; } }
      `}</style>

      <button type="button" className="auth-back" onClick={onSkip} aria-label="Voltar sem entrar">
        <ChevronLeft size={18} aria-hidden /> Voltar
      </button>

      <div className="auth-scroll">
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="auth-brand">
              <div className="auth-shield" aria-hidden>🛡️</div>
              <h2 className="auth-title">{mode === "login" ? "ENTRAR" : "CRIAR CONTA"}</h2>
              <p className="auth-sub">Salve seu progresso e entre no ranking global</p>
              <div style={{ width: "100%", marginTop: 10 }}>
                <BtnMain variant="dark" onClick={handleGoogle} disabled={loading} style={{ color: "#e8f0ff", fontSize: 20 }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Entrar com Google
                  </span>
                </BtnMain>
              </div>
            </div>

            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) void handleEmail();
              }}
            >
              <div className="auth-or">ou com e-mail</div>
              <label className="auth-label" htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
              <label className="auth-label" htmlFor="auth-password">Senha</label>
              <input
                id="auth-password"
                className="auth-input"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                enterKeyHint="go"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (mín. 6 caracteres)"
              />

              {error && <p role="alert" className="auth-msg" style={{ color: "#ff6b6b" }}>{error}</p>}
              {success && <p role="status" className="auth-msg" style={{ color: "#69f0ae" }}>{success}</p>}

              {/* Sem onClick: o <button> do BtnMain é type=submit dentro do form (Enter também envia) */}
              <BtnMain variant="blue" disabled={loading}>
                {loading ? "..." : mode === "login" ? "ENTRAR" : "CADASTRAR"}
              </BtnMain>
              <button type="button" className="auth-toggle" onClick={toggleMode}>
                {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
