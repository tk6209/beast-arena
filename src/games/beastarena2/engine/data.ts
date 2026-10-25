import type { CardDef, Elemento, MonsterDef } from "./types";

/** Strong-against table. Attacker element -> elements it deals super damage to. */
export const FORTE_CONTRA: Record<Elemento, Elemento[]> = {
  // Two simple triangles, easy to learn: Fogo > Natureza > Água > Fogo and Raio > Sombra > Cristal > Raio.
  fogo: ["natureza"],
  natureza: ["agua"],
  agua: ["fogo"],
  raio: ["sombra"],
  sombra: ["cristal"],
  cristal: ["raio"],
};

export const ELEMENTO_INFO: Record<Elemento, { nome: string; cor: string; icone: string }> = {
  fogo: { nome: "Fogo", cor: "#ff6a2b", icone: "🔥" },
  agua: { nome: "Água", cor: "#2fb8ff", icone: "💧" },
  natureza: { nome: "Natureza", cor: "#5bdc5b", icone: "🌿" },
  raio: { nome: "Raio", cor: "#ffd93b", icone: "⚡" },
  sombra: { nome: "Sombra", cor: "#b07cff", icone: "🌙" },
  cristal: { nome: "Cristal", cor: "#ff7ad9", icone: "💎" },
};

export const SUPER_MULT = 1.5;
export const FRACO_MULT = 0.75;

const c = (d: CardDef) => d;

export const CARDS: Record<string, CardDef> = Object.fromEntries(
  [
    c({ id: "pancada", nome: "Pancada", custo: 1, kind: "ataque", raridade: "comum", efeitos: [{ t: "dano", valor: 7 }], texto: "Causa 7 de dano.", arte: "pancada" }),
    c({ id: "garra", nome: "Garra de Aço", custo: 2, kind: "ataque", raridade: "comum", efeitos: [{ t: "dano", valor: 12, perfura: true }], texto: "12 de dano. Ignora escudo.", arte: "garra_de_aco" }),
    c({ id: "sopro", nome: "Sopro Congelante", custo: 2, kind: "ataque", raridade: "raro", elemento: "agua", efeitos: [{ t: "dano", valor: 7 }, { t: "congelar", energia: 1 }], texto: "7 de dano. Inimigo perde 1 energia no próximo turno.", arte: "sopro_congelante" }),
    c({ id: "raiz", nome: "Raiz Explosiva", custo: 2, kind: "ataque", raridade: "raro", elemento: "natureza", efeitos: [{ t: "dano", valor: 6 }, { t: "veneno", valor: 4 }], texto: "6 de dano + Veneno 4.", arte: "raiz_explosiva" }),
    c({ id: "explosao", nome: "Explosão", custo: 3, kind: "ataque", raridade: "raro", elemento: "fogo", efeitos: [{ t: "dano", valor: 20 }, { t: "autoDano", valor: 4 }], texto: "20 de dano. Você sofre 4.", arte: "explode" }),
    c({ id: "enxame", nome: "Enxame", custo: 3, kind: "ataque", raridade: "epico", efeitos: [{ t: "dano", valor: 5, hits: 4 }], texto: "4 golpes de 5.", arte: "swarm" }),
    c({ id: "tudo", nome: "Tudo ou Nada", custo: 2, kind: "ataque", raridade: "epico", efeitos: [{ t: "danoSorte", valor: 24, chance: 0.5 }], texto: "50%: 24 de dano. Senão, nada!", arte: "tudo_ou_nada" }),
    c({ id: "cura", nome: "Cura", custo: 2, kind: "suporte", raridade: "comum", efeitos: [{ t: "cura", valor: 12 }], texto: "Recupera 12 de vida.", arte: "cura" }),
    c({ id: "barreira", nome: "Barreira", custo: 2, kind: "defesa", raridade: "comum", efeitos: [{ t: "escudo", valor: 14 }], texto: "Ganha 14 de escudo.", arte: "barreira" }),
    c({ id: "carapaca", nome: "Carapaça", custo: 1, kind: "defesa", raridade: "raro", efeitos: [{ t: "escudo", valor: 6 }, { t: "espinhos", valor: 3 }], texto: "6 de escudo + Espinhos 3.", arte: "carapaca" }),
    c({ id: "escudoRapido", nome: "Escudo Rápido", custo: 0, kind: "defesa", raridade: "comum", efeitos: [{ t: "escudo", valor: 4 }], texto: "Ganha 4 de escudo.", arte: "escudo_rapido" }),
    c({ id: "esquiva", nome: "Esquiva", custo: 1, kind: "defesa", raridade: "raro", efeitos: [{ t: "esquiva", vezes: 1 }], texto: "Desvia do próximo golpe.", arte: "esquiva" }),
    c({ id: "pulo", nome: "Pulo Rápido", custo: 1, kind: "suporte", raridade: "comum", efeitos: [{ t: "comprar", n: 2 }], texto: "Compra 2 cartas.", arte: "pulo_rapido" }),
    c({ id: "poderzinho", nome: "Poderzinho", custo: 1, kind: "suporte", raridade: "comum", efeitos: [{ t: "furia", valor: 6 }], texto: "Próximo ataque +6.", arte: "poderzinho" }),
    c({ id: "evolucao", nome: "Evolução", custo: 3, kind: "suporte", raridade: "epico", efeitos: [{ t: "evoluir", valor: 3 }], texto: "Todos os seus ataques +3 até o fim.", arte: "evolucao" }),
    c({ id: "desafio", nome: "Desafio", custo: 1, kind: "suporte", raridade: "raro", efeitos: [{ t: "energia", n: 1 }, { t: "congelar", energia: 1 }], texto: "+1 energia agora. Inimigo perde 1 no próximo turno.", arte: "desafio" }),

    // Signature cards — one per monster, art is the monster itself.
    c({ id: "sig_drako", nome: "Inferno", custo: 4, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 16 }, { t: "queimar", turnos: 3 }], texto: "16 de dano + Queimadura 3 turnos.", arte: "drako" }),
    c({ id: "sig_panther", nome: "Bote Fatal", custo: 4, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 15, bonusAbaixo: { hpPct: 0.4, mult: 2 } }], texto: "15 de dano. Dobra se o inimigo tiver menos de 40% de vida.", arte: "panther" }),
    c({ id: "sig_volt", nome: "Tempestade", custo: 4, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 5, hits: 4 }], texto: "4 raios de 5 de dano.", arte: "volt" }),
    c({ id: "sig_tsunami", nome: "Onda Gigante", custo: 4, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 14 }, { t: "cura", valor: 10 }], texto: "14 de dano e recupera 10.", arte: "tsunami" }),
    c({ id: "sig_phantom", nome: "Pesadelo", custo: 3, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 10 }, { t: "congelar", energia: 2 }], texto: "10 de dano. Inimigo perde 2 energia.", arte: "phantom" }),
    c({ id: "sig_crystal", nome: "Fortaleza", custo: 3, kind: "defesa", raridade: "assinatura", efeitos: [{ t: "escudo", valor: 22 }, { t: "espinhos", valor: 6 }], texto: "22 de escudo + Espinhos 6.", arte: "crystal" }),
    c({ id: "sig_sprouts", nome: "Floresta Viva", custo: 4, kind: "suporte", raridade: "assinatura", efeitos: [{ t: "cura", valor: 14 }, { t: "veneno", valor: 5 }], texto: "Recupera 14 + Veneno 5 no inimigo.", arte: "sprouts" }),
    c({ id: "sig_banana", nome: "Escorregão", custo: 3, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 10 }, { t: "descartarInimigo", n: 2 }], texto: "10 de dano. Inimigo descarta 2 cartas.", arte: "banana" }),
    c({ id: "sig_macaco", nome: "Soco Sísmico", custo: 4, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 24 }], texto: "24 de dano.", arte: "macaco" }),
    c({ id: "sig_morcego", nome: "Noite Eterna", custo: 4, kind: "ataque", raridade: "assinatura", efeitos: [{ t: "dano", valor: 12, rouboVida: 1 }], texto: "12 de dano. Recupera todo o dano causado.", arte: "morcego" }),
  ].map((d) => [d.id, d]),
);

const m = (d: MonsterDef) => d;

export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(
  [
    m({ id: "drako", nome: "Drako", titulo: "Dragãozinho de Brasa", elemento: "fogo", hp: 78, forca: 1.05, passiva: "chamaInterna", passivaNome: "Chama Interna", passivaTexto: "Ataques com 3+ de dano queimam o inimigo por 1 turno.", assinatura: "sig_drako", cor: "#ff6a2b", cor2: "#ffb347",
      deck: ["pancada", "pancada", "pancada", "garra", "explosao", "explosao", "barreira", "escudoRapido", "poderzinho", "poderzinho", "pulo"] }),
    m({ id: "panther", nome: "Panther", titulo: "Caçador Dourado", elemento: "raio", hp: 78, forca: 1.05, passiva: "modoCacador", passivaNome: "Modo Caçador", passivaTexto: "+30% de dano quando o inimigo está abaixo de 50% de vida.", assinatura: "sig_panther", cor: "#ffd54f", cor2: "#3dff6e",
      deck: ["pancada", "pancada", "garra", "garra", "tudo", "barreira", "escudoRapido", "esquiva", "poderzinho", "pulo", "desafio"] }),
    m({ id: "volt", nome: "Volt", titulo: "Faísca Veloz", elemento: "raio", hp: 58, forca: 0.95, passiva: "sobrecarga", passivaNome: "Sobrecarga", passivaTexto: "A primeira carta de cada turno custa 1 a menos.", assinatura: "sig_volt", cor: "#ffe14a", cor2: "#fff6a8",
      deck: ["pancada", "pancada", "pancada", "enxame", "garra", "esquiva", "escudoRapido", "escudoRapido", "pulo", "barreira", "poderzinho"] }),
    m({ id: "tsunami", nome: "Tsunami", titulo: "Serpente das Marés", elemento: "agua", hp: 82, forca: 1.03, passiva: "mare", passivaNome: "Maré", passivaTexto: "Recupera 4 de vida no início de cada turno.", assinatura: "sig_tsunami", cor: "#2fb8ff", cor2: "#9be7ff",
      deck: ["pancada", "pancada", "sopro", "sopro", "garra", "barreira", "barreira", "cura", "escudoRapido", "pulo", "desafio"] }),
    m({ id: "phantom", nome: "Phantom", titulo: "Assombração Noturna", elemento: "sombra", hp: 64, forca: 1.0, passiva: "intangivel", passivaNome: "Intangível", passivaTexto: "25% de chance de atravessar golpes inimigos.", assinatura: "sig_phantom", cor: "#a46bff", cor2: "#e2c9ff",
      deck: ["pancada", "pancada", "sopro", "garra", "tudo", "esquiva", "escudoRapido", "desafio", "desafio", "poderzinho", "pulo"] }),
    m({ id: "crystal", nome: "Crystal", titulo: "Guardião Prismático", elemento: "cristal", hp: 94, forca: 1.12, passiva: "prisma", passivaNome: "Prisma", passivaTexto: "Começa cada turno com 6 de escudo.", assinatura: "sig_crystal", cor: "#ff7ad9", cor2: "#b48cff",
      deck: ["pancada", "pancada", "garra", "garra", "explosao", "barreira", "carapaca", "carapaca", "evolucao", "poderzinho", "pulo"] }),
    m({ id: "sprouts", nome: "Sprouts", titulo: "Brotinho Ancestral", elemento: "natureza", hp: 74, forca: 0.95, passiva: "fotossintese", passivaNome: "Fotossíntese", passivaTexto: "Suas curas recuperam 50% a mais.", assinatura: "sig_sprouts", cor: "#5bdc5b", cor2: "#b8ff7a",
      deck: ["pancada", "pancada", "pancada", "raiz", "raiz", "garra", "cura", "barreira", "carapaca", "pulo", "poderzinho"] }),
    m({ id: "banana", nome: "Banana", titulo: "Mecha-Banana", elemento: "natureza", hp: 86, forca: 1.03, passiva: "cascaEscorregadia", passivaNome: "Casca Escorregadia", passivaTexto: "Cada golpe recebido causa 3 a menos.", assinatura: "sig_banana", cor: "#ffc23d", cor2: "#ff8a1f",
      deck: ["pancada", "pancada", "raiz", "garra", "tudo", "tudo", "barreira", "escudoRapido", "carapaca", "poderzinho", "pulo"] }),
    m({ id: "macaco", nome: "Macaco", titulo: "Gorila de Rubi", elemento: "fogo", hp: 94, forca: 1.06, passiva: "furiaPrimata", passivaNome: "Fúria Primata", passivaTexto: "Abaixo de 50% de vida, ataques causam +5.", assinatura: "sig_macaco", cor: "#ff3b4e", cor2: "#ff9a7a",
      deck: ["pancada", "pancada", "pancada", "garra", "explosao", "barreira", "barreira", "escudoRapido", "evolucao", "poderzinho", "desafio"] }),
    m({ id: "morcego", nome: "Morcego", titulo: "Lorde da Noite", elemento: "sombra", hp: 70, forca: 1.0, passiva: "vampirismo", passivaNome: "Vampirismo", passivaTexto: "Recupera 25% do dano que causa.", assinatura: "sig_morcego", cor: "#4b7bff", cor2: "#7dfcff",
      deck: ["pancada", "pancada", "pancada", "garra", "sopro", "sopro", "esquiva", "barreira", "escudoRapido", "poderzinho", "pulo"] }),
  ].map((d) => [d.id, d]),
);

export const MONSTER_ORDER = ["drako", "panther", "volt", "tsunami", "phantom", "crystal", "sprouts", "banana", "macaco", "morcego"];
