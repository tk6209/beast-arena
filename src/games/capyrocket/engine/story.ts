import type { BossKind } from "./characters";

// Narrativa da campanha CAPI WARS — usada no briefing inicial e nos chefes.

export const INTRO_STORY = {
  title: "CAPI WARS",
  subtitle: "A Defesa de Capynite",
  lines: [
    "Capynite vivia em paz às margens dos grandes rios —",
    "até a Horda dos Chefes invadir o reino capivara.",
    "Você é o último herói de pé do esquadrão.",
    "Avance pela cidade, liberte os reféns (🆘) e ache vidas extras (1UP).",
    "Derrube os 7 Chefes e devolva a paz a Capynite!",
  ],
  cta: "Avançar ▸",
};

const BOSS_TAGLINES: Record<BossKind, string> = {
  chief: "O líder tribal bloqueia a ponte!",
  general: "O comandante de guerra ordena o ataque!",
  maga: "As sombras se erguem contra você...",
  pirate: "O pirata dos rios quer seu tesouro!",
  dragon: "Fúria incandescente — cuidado com o fogo!",
  emperor: "O soberano não cederá o reino!",
  hydro: "O senhor das águas inunda o caminho!",
};

export function bossTagline(kind: BossKind): string {
  return BOSS_TAGLINES[kind];
}
