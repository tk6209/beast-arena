import type { CSSProperties } from "react";

/* ═══════════════════════════════════════════════════════
   BEAST ARENA — Design System v3.0
   Aesthetic: Dark Fantasy Arcade
   Palette: Obsidian · Ember Gold · Blood Red · Chrome
═══════════════════════════════════════════════════════ */

export const DS = {
  // Core palette
  bg0:     "#080503",   // deepest black with warm tint
  bg1:     "#100c09",   // card surfaces
  bg2:     "#181210",   // elevated surfaces
  bg3:     "#221a16",   // borders/dividers

  gold:    "#f0b429",   // primary accent — amber gold
  goldL:   "#ffd166",   // light gold
  goldD:   "#b8860b",   // dark gold
  ember:   "#ff6b2b",   // attack/fire accent
  blood:   "#c0392b",   // danger/death
  cyan:    "#00d4ff",   // tech/energy accent
  green:   "#27ae60",   // heal/success
  violet:  "#8b5cf6",   // special/magic

  // Typography
  fontDisplay: "'Black Han Sans', 'Bangers', cursive",
  fontUI:      "'Oswald', sans-serif",
  fontBody:    "'Nunito', sans-serif",

  // Shadows
  shadowGold: "0 0 20px rgba(240,180,41,.35), 0 0 60px rgba(240,180,41,.12)",
  shadowEmber:"0 0 20px rgba(255,107,43,.35), 0 0 60px rgba(255,107,43,.12)",
  shadowCyan: "0 0 20px rgba(0,212,255,.35), 0 0 60px rgba(0,212,255,.12)",
};

export function pageBg(accent?: string): CSSProperties {
  return {
    minHeight: "100dvh",
    background: `radial-gradient(ellipse at 50% -5%, ${accent || "#1a0e08"} 0%, #0d0806 35%, #080503 70%, #050302 100%)`,
    position: "relative",
    overflow: "hidden",
    paddingTop: "env(safe-area-inset-top)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
}

export function glassPanel(border = DS.bg3, extra: CSSProperties = {}): CSSProperties {
  return {
    background: `linear-gradient(160deg, ${DS.bg2}f0, ${DS.bg1}f8)`,
    border: `1px solid ${border}`,
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.03)",
    backdropFilter: "blur(12px)",
    ...extra,
  };
}

export function actionBtn(c1: string, c2: string, border: string, disabled = false): CSSProperties {
  return {
    background: disabled
      ? `linear-gradient(180deg, ${DS.bg2}, ${DS.bg1})`
      : `linear-gradient(160deg, ${c1}, ${c2})`,
    border: `1px solid ${disabled ? DS.bg3 : border}`,
    borderRadius: 14,
    padding: "14px 18px 16px",
    color: disabled ? "#3a3028" : "#fff",
    fontFamily: DS.fontDisplay,
    fontSize: 20,
    letterSpacing: 2,
    textShadow: disabled ? "none" : "0 2px 0 rgba(0,0,0,.45)",
    boxShadow: disabled
      ? "none"
      : [
          `0 5px 0 0 ${border}`,                   // 3D base (Brawl-style bevel)
          `0 8px 18px ${border}55`,                // soft drop glow
          "inset 0 1px 0 rgba(255,255,255,.28)",   // top highlight
          "inset 0 -2px 0 rgba(0,0,0,.25)",        // bottom inner shadow
        ].join(", "),
    cursor: disabled ? "default" : "pointer",
    transition: "transform .08s cubic-bezier(.4,0,.2,1), box-shadow .08s cubic-bezier(.4,0,.2,1)",
    minHeight: 48,
    transform: "translateY(0)",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
  };
}

export function hpBarColor(pct: number): string {
  if (pct > 55) return DS.green;
  if (pct > 25) return DS.gold;
  return DS.blood;
}

export const MONSTER_GLOW: Record<string, { g: string }> = {
  panther:  { g: DS.gold    },
  banana:   { g: "#f0c030"  },
  macaco:   { g: DS.ember   },
  morcego:  { g: "#7b68ee"  },
  sprouts:  { g: DS.green   },
  drako:    { g: "#e74c3c"  },
  crystal:  { g: DS.cyan    },
  phantom:  { g: "#9b59b6"  },
  tsunami:  { g: "#3498db"  },
  volt:     { g: "#f1c40f"  },
};

export function cartaPaleta(c: { tipo: string; esp?: string; bg1?: string; bg2?: string; raridade?: string }) {
  const rar = c.raridade || "comum";

  // Rarity border overrides
  const rarBorder: Record<string, string> = {
    lendario: DS.gold,
    epico:    DS.violet,
    raro:     DS.cyan,
    incomum:  DS.green,
    comum:    DS.bg3,
  };

  if (c.tipo === "ataque" && c.esp) {
    return { t:"#2d0a04", m:"#7a1a0a", badge:"ESPECIAL", bc:"#e74c3c", glow:"#e74c3c44", rarBc: rarBorder[rar] };
  }
  if (c.tipo === "ataque") {
    return { t:"#1e0d03", m:"#5c2a06", badge:"ATAQUE",  bc:DS.ember,  glow:`${DS.ember}33`, rarBc: rarBorder[rar] };
  }
  if (c.tipo === "defesa") {
    return { t:"#040d1e", m:"#0a2050", badge:"DEFESA",  bc:DS.cyan,   glow:`${DS.cyan}33`,  rarBc: rarBorder[rar] };
  }
  if (c.tipo === "cura") {
    return { t:"#031808", m:"#0a3a14", badge:"CURA",    bc:DS.green,  glow:`${DS.green}33`, rarBc: rarBorder[rar] };
  }
  if (c.tipo === "poderzinho") {
    return { t: c.bg1||"#1e1204", m: c.bg2||"#5c3a08", badge:"PODER", bc:DS.gold,  glow:`${DS.gold}33`, rarBc: rarBorder[rar] };
  }
  if (c.tipo === "evolucao") {
    return { t:"#0d1004", m:"#243010", badge:"EVOLUÇÃO", bc:"#6bcb3c", glow:"#6bcb3c33", rarBc: rarBorder[rar] };
  }
  if (c.tipo === "swarm") {
    return { t:"#14082a", m:"#280e50", badge:"SWARM",  bc:DS.violet, glow:`${DS.violet}33`, rarBc: rarBorder[rar] };
  }
  if (c.tipo === "desafio") {
    return { t:"#1a0a1a", m:"#3d1440", badge:"ESPECIAL", bc:"#d466ff", glow:"#d466ff33", rarBc: rarBorder[rar] };
  }
  return { t:DS.bg1, m:DS.bg2, badge:"CARTA", bc:DS.bg3, glow:"#ffffff11", rarBc: rarBorder[rar] };
}
