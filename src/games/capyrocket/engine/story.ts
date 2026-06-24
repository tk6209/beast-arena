import type { BossKind } from "./characters";

// Narrativa da campanha CAPI WARS — usada no briefing inicial e nos chefes.

export const INTRO_STORY = {
  title: "CAPI WARS",
  subtitle: "A Batalha por CapyCity",
  lines: [
    "CapyCity vivia em paz às margens dos grandes rios —",
    "até a Horda dos Chefes invadir as profundezas do reino.",
    "O Esquadrão Capivara entra em ação: comando, furtividade,",
    "explosivos e muita coragem (e uma boa dose de confusão).",
    "Liberte os reféns (🆘), ache vidas extras (1UP) e avance pela cidade.",
    "Derrube os 7 Chefes e devolva a paz a CapyCity!",
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
