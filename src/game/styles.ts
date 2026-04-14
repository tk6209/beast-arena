import type { CSSProperties } from "react";

export function pageBg(): CSSProperties {
  return {
    minHeight: "100dvh",
    background:
      "radial-gradient(ellipse at 50% -10%, #18335a 0%, #0b1223 38%, #070716 66%, #020207 100%)",
    position: "relative",
    overflow: "hidden",
    paddingTop: "env(safe-area-inset-top)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
}

export function glassPanel(border = "#203657", extra: CSSProperties = {}): CSSProperties {
  return {
    background: "linear-gradient(180deg, rgba(10,17,34,.88), rgba(4,7,18,.92))",
    border: `1px solid ${border}`,
    borderRadius: 16,
    boxShadow: "0 12px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
    backdropFilter: "blur(10px)",
    ...extra,
  };
}

export function actionBtn(c1: string, c2: string, border: string, disabled = false): CSSProperties {
  return {
    background: disabled
      ? "linear-gradient(180deg, #151920, #10131a)"
      : `linear-gradient(135deg, ${c1}, ${c2})`,
    border: `1px solid ${disabled ? "#2a2f39" : border}`,
    borderRadius: 14,
    padding: "12px 18px",
    color: disabled ? "#5e6674" : "#fff",
    fontFamily: "Bangers, cursive",
    fontSize: 18,
    letterSpacing: 1.4,
    boxShadow: disabled
      ? "none"
      : `0 8px 24px ${border}33, inset 0 1px 0 rgba(255,255,255,.14)`,
    cursor: disabled ? "default" : "pointer",
    transition: "transform .18s ease, box-shadow .18s ease, opacity .18s ease",
  };
}

export function hpBarColor(pct: number): string {
  if (pct > 50) return "#00e676";
  if (pct > 25) return "#ffd54f";
  return "#ff5252";
}

export const MONSTER_GLOW: Record<string, { g: string }> = {
  panther: { g: "#ffd54f" },
  banana: { g: "#ffca28" },
  macaco: { g: "#ff8a65" },
  morcego: { g: "#64b5f6" },
  sprouts: { g: "#69f0ae" },
  drako: { g: "#ff5252" },
  crystal: { g: "#b388ff" },
  phantom: { g: "#ce93d8" },
  tsunami: { g: "#4fc3f7" },
  volt: { g: "#ffee58" },
};

export function cartaPaleta(c: { tipo: string; esp?: string; bg1?: string; bg2?: string; raridade?: string }) {
  if (c.tipo === "ataque" && c.esp) {
    return { t: "#4f0c0c", m: "#c0392b", badge: "ATAQUE", bc: "#ef4444", glow: "#ef444455" };
  }
  if (c.tipo === "ataque") {
    return { t: "#5b3a00", m: "#d4a017", badge: "ATAQUE", bc: "#f59e0b", glow: "#f59e0b44" };
  }
  if (c.tipo === "defesa") {
    return { t: "#0b1c38", m: "#1565c0", badge: "DEFESA", bc: "#60a5fa", glow: "#60a5fa44" };
  }
  if (c.tipo === "poderzinho") {
    return { t: c.bg1 || "#78350f", m: c.bg2 || "#d97706", badge: "PODERZINHO", bc: "#fbbf24", glow: "#fbbf2444" };
  }
  if (c.tipo === "evolucao") {
    return { t: "#0f3b24", m: "#166534", badge: "EVOLUÇÃO", bc: "#34d399", glow: "#34d39944" };
  }
  if (c.tipo === "swarm") {
    const SWARM_RARITY: Record<string, { border: string; glow: string; label: string }> = {
      comum: { border: "#4caf50", glow: "#4caf5033", label: "COMUM" },
      raro: { border: "#2196f3", glow: "#2196f333", label: "RARO" },
      epico: { border: "#9c27b0", glow: "#9c27b033", label: "ÉPICO" },
      lendario: { border: "#ffc107", glow: "#ffc10733", label: "LENDÁRIO" },
      hyper: { border: "#00e5ff", glow: "#00e5ff33", label: "HYPER" },
    };
    const rs = SWARM_RARITY[c.raridade || "comum"] || SWARM_RARITY.comum;
    return { t: "#18122d", m: "#2c2152", badge: `SWARM ${rs.label}`, bc: rs.border, glow: rs.glow };
  }
  if (c.tipo === "desafio") {
    return { t: "#5a0038", m: "#c2185b", badge: "DESAFIO", bc: "#f472b6", glow: "#f472b644" };
  }
  return { t: "#222", m: "#444", badge: "CARTA", bc: "#aaa", glow: "#ffffff22" };
}
