/* ─────────────────────────────────────────────
   CATÁLOGO v4 — fonte única de monstros, swarms, ondas
───────────────────────────────────────────── */
import catalogJson from "./data/catalog.json";
import type {
  MonstroCatalog,
  SwarmCatalog,
  OndaCalendario,
  StatusConteudo,
} from "./types/catalog";

export const CATALOG = catalogJson as any;
export const ONDAS: OndaCalendario[] = CATALOG.admin_system.ondas_calendario;

/* MonstroData mantém o shape consumido pelo engine + campos novos do catálogo */
export interface MonstroData {
  id: string;
  nome: string;
  hp: number;
  atk: number;
  def: number;
  emoji: string;
  bg1: string;
  bg2: string;
  glow: string;
  hab: string;
  habD: string;
  status?: StatusConteudo;
  wave?: number;
  wave_nome?: string;
  release_date?: string;
  elemento?: string;
  raridade?: string;
  destaque_mensal?: boolean;
  early_access?: boolean;
  sorteavel_admin?: boolean;
}

export const MONSTROS: Record<string, MonstroData> = Object.freeze(
  (CATALOG.monstros as MonstroCatalog[]).reduce(
    (acc, m) => {
      acc[m.id] = m as MonstroData;
      return acc;
    },
    {} as Record<string, MonstroData>,
  ),
) as Record<string, MonstroData>;

/* Lista ordenada — útil para enumeração */
export const MONSTROS_LISTA: MonstroData[] = CATALOG.monstros as MonstroData[];

/* ─── PLACEHOLDER bloco removido ─── */
const _OLD_MONSTROS_REMOVED = {
  panther: {
    id: "panther",
    nome: "Panther",
    hp: 70,
    atk: 28,
    def: 12,
    emoji: "🐆",
    bg1: "#2b1600",
    bg2: "#f5c842",
    glow: "#ffd54f",
    hab: "Modo Caçador",
    habD: "Raio equipado: ataque +15",
  },
  banana: {
    id: "banana",
    nome: "Banana",
    hp: 80,
    atk: 16,
    def: 24,
    emoji: "🍌",
    bg1: "#5b2300",
    bg2: "#ffb347",
    glow: "#ffd54f",
    hab: "Casca Escorr.",
    habD: "Reduz 10 de dano recebido",
  },
  macaco: {
    id: "macaco",
    nome: "Macaco",
    hp: 65,
    atk: 22,
    def: 18,
    emoji: "🐒",
    bg1: "#4d0d0d",
    bg2: "#e74c3c",
    glow: "#ff8a65",
    hab: "Atq. Surpresa",
    habD: "50% chance de atacar 2x",
  },
  morcego: {
    id: "morcego",
    nome: "Morcego",
    hp: 60,
    atk: 26,
    def: 14,
    emoji: "🦇",
    bg1: "#0f1f48",
    bg2: "#2979ff",
    glow: "#64b5f6",
    hab: "Voo Sombrio",
    habD: "Evita 1 ataque por jogo",
  },
  sprouts: {
    id: "sprouts",
    nome: "Sprouts",
    hp: 68,
    atk: 14,
    def: 28,
    emoji: "🌱",
    bg1: "#113300",
    bg2: "#43a047",
    glow: "#69f0ae",
    hab: "Crescimento",
    habD: "+5 ataque por turno",
  },
  // ─── NOVOS MONSTROS (Fase 3) ───
  drako: {
    id: "drako",
    nome: "Drako",
    hp: 75,
    atk: 32,
    def: 10,
    emoji: "🐉",
    bg1: "#3a0a0a",
    bg2: "#b71c1c",
    glow: "#ff5252",
    hab: "Fúria de Fogo",
    habD: "Ataques de fogo causam +20% de dano",
  },
  crystal: {
    id: "crystal",
    nome: "Crystal",
    hp: 58,
    atk: 18,
    def: 32,
    emoji: "💎",
    bg1: "#1a0033",
    bg2: "#7c4dff",
    glow: "#b388ff",
    hab: "Armadura Cristal",
    habD: "Reflete 15% do dano recebido",
  },
  phantom: {
    id: "phantom",
    nome: "Phantom",
    hp: 55,
    atk: 30,
    def: 8,
    emoji: "👻",
    bg1: "#1a1a2e",
    bg2: "#4a148c",
    glow: "#ce93d8",
    hab: "Fase Sombria",
    habD: "25% chance de esquivar qualquer ataque",
  },
  tsunami: {
    id: "tsunami",
    nome: "Tsunami",
    hp: 72,
    atk: 20,
    def: 22,
    emoji: "🌊",
    bg1: "#002244",
    bg2: "#0277bd",
    glow: "#4fc3f7",
    hab: "Maré Alta",
    habD: "Cura +8 HP por turno automaticamente",
  },
  _volt: {
    id: "volt",
    nome: "Volt",
    hp: 50,
    atk: 36,
    def: 6,
    emoji: "⚡",
    bg1: "#332200",
    bg2: "#f9a825",
    glow: "#ffee58",
    hab: "Descarga Elétrica",
    habD: "Primeiro ataque de cada turno causa dano dobrado",
  },
}; // legado removido

/* ─────────────────────────────────────────────
   PODERES
───────────────────────────────────────────── */
export interface PoderData {
  id: string;
  nome: string;
  emoji: string;
  atkB: number;
  defB: number;
  hpB: number;
  cor: string;
  bg1: string;
  bg2: string;
}

const _OLD_PODERES = {
  fogo: {
    id: "fogo",
    nome: "Fogo",
    emoji: "🔥",
    atkB: 20,
    defB: 0,
    hpB: 10,
    cor: "#ef4444",
    bg1: "#4b0d0d",
    bg2: "#dc2626",
  },
  gelo: {
    id: "gelo",
    nome: "Gelo",
    emoji: "❄️",
    atkB: 5,
    defB: 25,
    hpB: 15,
    cor: "#60a5fa",
    bg1: "#10213b",
    bg2: "#1565c0",
  },
  raio: {
    id: "raio",
    nome: "Raio",
    emoji: "⚡",
    atkB: 25,
    defB: 5,
    hpB: 5,
    cor: "#fbbf24",
    bg1: "#5a3a00",
    bg2: "#d97706",
  },
  metal: {
    id: "metal",
    nome: "Metal",
    emoji: "⚙️",
    atkB: 15,
    defB: 15,
    hpB: 20,
    cor: "#9ca3af",
    bg1: "#374151",
    bg2: "#6b7280",
  },
  natureza: {
    id: "natureza",
    nome: "Natureza",
    emoji: "🌿",
    atkB: 10,
    defB: 20,
    hpB: 25,
    cor: "#34d399",
    bg1: "#143100",
    bg2: "#2e7d32",
  },
};

export const PODERES: Record<string, PoderData> = Object.freeze(
  (CATALOG.poderes as PoderData[]).reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<string, PoderData>,
  ),
) as Record<string, PoderData>;

/* ─────────────────────────────────────────────
   SWARMS
───────────────────────────────────────────── */
export interface SwarmData {
  id: string;
  nome: string;
  emoji: string;
  raridade: string;
  tipo: string;
  efeito: string;
  valor: number;
  desc: string;
  wave?: number;
  wave_nome?: string;
  release_date?: string;
  status?: StatusConteudo;
  early_access?: boolean;
  sorteavel_admin?: boolean;
}

const _OLD_SWARMS_JSON = `[
  {
    "id": "swarm_faisca",
    "nome": "Faísca",
    "emoji": "⚡",
    "raridade": "comum",
    "tipo": "ataque",
    "efeito": "atk_flat",
    "valor": 8,
    "desc": "+8 de ataque ao monstro principal"
  },
  {
    "id": "swarm_pedra_viva",
    "nome": "Pedra Viva",
    "emoji": "🪨",
    "raridade": "raro",
    "tipo": "defesa",
    "efeito": "def_flat",
    "valor": 10,
    "desc": "+10 de defesa ao monstro principal"
  },
  {
    "id": "swarm_slime_verde",
    "nome": "Slime Verde",
    "emoji": "🟢",
    "raridade": "comum",
    "tipo": "suporte",
    "efeito": "hp_regen",
    "valor": 5,
    "desc": "Recupera 5 HP por turno"
  },
  {
    "id": "swarm_veneno",
    "nome": "Veneno Viscoso",
    "emoji": "☣️",
    "raridade": "epico",
    "tipo": "efeito",
    "efeito": "poison",
    "valor": 6,
    "desc": "Aplica 6 de dano extra no fim do turno"
  },
  {
    "id": "swarm_morcego_neon",
    "nome": "Morcego Neon",
    "emoji": "🦇",
    "raridade": "raro",
    "tipo": "efeito",
    "efeito": "dodge_once",
    "valor": 1,
    "desc": "Esquiva do próximo ataque uma vez"
  },
  {
    "id": "swarm_raiz_viva",
    "nome": "Raiz Viva",
    "emoji": "🌿",
    "raridade": "comum",
    "tipo": "suporte",
    "efeito": "growth",
    "valor": 4,
    "desc": "+4 de ataque no início do turno"
  },
  {
    "id": "swarm_escudo_azul",
    "nome": "Escudo Azul",
    "emoji": "💎",
    "raridade": "raro",
    "tipo": "defesa",
    "efeito": "shield_flat",
    "valor": 8,
    "desc": "Ganha +8 de defesa temporária por turno"
  },
  {
    "id": "swarm_trovao",
    "nome": "Trovão",
    "emoji": "⚡",
    "raridade": "lendario",
    "tipo": "ataque",
    "efeito": "atk_flat",
    "valor": 15,
    "desc": "+15 de ataque ao monstro principal"
  },
  {
    "id": "swarm_vampiro",
    "nome": "Vampiro Sombrio",
    "emoji": "🧛",
    "raridade": "epico",
    "tipo": "efeito",
    "efeito": "drain",
    "valor": 8,
    "desc": "Drena 8 HP do inimigo por turno e cura você"
  },
  {
    "id": "swarm_espelho",
    "nome": "Espelho Arcano",
    "emoji": "🪞",
    "raridade": "lendario",
    "tipo": "defesa",
    "efeito": "reflect",
    "valor": 25,
    "desc": "Reflete 25% do dano recebido ao atacante"
  },
  {
    "id": "swarm_paralisia",
    "nome": "Aranha Elétrica",
    "emoji": "🕷️",
    "raridade": "epico",
    "tipo": "efeito",
    "efeito": "stun",
    "valor": 30,
    "desc": "30% de chance de atordoar o inimigo por 1 turno"
  },
  {
    "id": "swarm_fenix",
    "nome": "Fênix Menor",
    "emoji": "🔥",
    "raridade": "lendario",
    "tipo": "suporte",
    "efeito": "revive",
    "valor": 20,
    "desc": "Ao morrer, revive com 20 HP (1 vez)"
  },
  {
    "id": "swarm_gelo_eterno",
    "nome": "Gelo Eterno",
    "emoji": "🧊",
    "raridade": "raro",
    "tipo": "defesa",
    "efeito": "def_flat",
    "valor": 12,
    "desc": "+12 de defesa permanente ao monstro"
  }
]`;

export const SWARMS: SwarmData[] = CATALOG.swarms as SwarmData[];

/* ─────────────────────────────────────────────
   FRASES
───────────────────────────────────────────── */
export const FRASES_ATK = [
  (a: string, t: string, d: number) => `${a} lança Garra de Aço em ${t}! ${d} de dano!`,
  (a: string, t: string, d: number) => `Ataque devastador de ${a}! ${t} sofre ${d} pontos!`,
  (a: string, t: string, d: number) => `${a} não tem piedade de ${t}! ${d} de dano direto!`,
];

export const FRASES_DEF = [
  (n: string, v: number) => `${n} levanta o escudo! Mais ${v} de defesa!`,
  (n: string, v: number) => `${n} se protege com ${v} pontos!`,
  (n: string) => `${n} ativa sua barreira energética!`,
];

export const FRASES_EVO = [
  (n: string, lv: number, p: string) => `Incrível! ${n} evolui para nível ${lv} com o poder do ${p}!`,
  (n: string, lv: number) => `${n} está evoluindo! Nível ${lv} alcançado!`,
];

export const FRASES_DANO = [
  (n: string, d: number, h: number) => `${n} sofre ${d} de dano! Resta ${h} pontos de vida!`,
  (n: string, d: number, h: number) => `Ai! ${n} recebe ${d} no peito! ${h} de vida restante!`,
];

export function RND(arr: ((...args: any[]) => string)[], ...a: any[]): string {
  return arr[Math.floor(Math.random() * arr.length)](...a);
}

/* ─────────────────────────────────────────────
   CARTAS
───────────────────────────────────────────── */
export interface CartaData {
  id: number;
  tipo: string;
  nome: string;
  emoji: string;
  custo?: number;       // energy cost (1-3)
  valor?: number;
  desc: string;
  esp?: string;
  autoDano?: number;
  sub?: string;
  bg1?: string;
  bg2?: string;
  tier?: number;
  swarmId?: string;
  raridade?: string;
  ef?: string;
}

let _id = 0;
const nid = () => ++_id;

const POOL_ATK = [
  { nome: "Garra de Aço",     emoji: "⚔️", valor: 22, custo: 2, desc: "Ataque poderoso das garras metálicas!" },
  { nome: "Pancada",          emoji: "👊", valor: 14, custo: 1, desc: "Golpe direto e rápido." },
  { nome: "Pulo Rápido",      emoji: "💨", valor: 18, custo: 1, desc: "Ataque ágil e imprevisível." },
  { nome: "Sopro Congelante", emoji: "❄️", valor: 18, custo: 2, desc: "Congela o oponente no lugar." },
  { nome: "Raiz Explosiva",   emoji: "🌿", valor: 16, custo: 1, desc: "Raízes saem do chão com força!" },
  { nome: "EXPLODE",          emoji: "💥", valor: 45, custo: 3, autoDano: 15, desc: "45 de dano. Você recebe 15.", esp: "explode" },
  { nome: "Tudo ou Nada",     emoji: "🎲", valor: 0,  custo: 2, desc: "70 de dano ou zero. A sorte decide!", esp: "tudoOuNada" },
  { nome: "Fúria Final",      emoji: "💀", valor: 0,  custo: 3, desc: "Quanto menos HP, mais dano (até 65).", esp: "furiaFinal" },
];

const POOL_DEF = [
  { nome: "Escudo Rápido",  emoji: "🛡️", valor: 18, custo: 1, desc: "Bloqueia 18 de dano neste turno." },
  { nome: "Carapaça",       emoji: "🐢", valor: 26, custo: 2, desc: "Defesa máxima por 1 turno." },
  { nome: "Esquiva",        emoji: "✨", valor: 14, custo: 1, esp: "esquiva", desc: "Esquiva total do próximo ataque." },
  { nome: "Barreira",       emoji: "💎", valor: 22, custo: 2, desc: "Barreira energética absorve dano." },
  { nome: "Contra-Ataque",  emoji: "🔄", valor: 12, custo: 2, esp: "counter", desc: "Defende e reflete 50% do próximo ataque." },
];

const POOL_CURA = [
  { nome: "Poção Vital",   emoji: "🧪", valor: 20, custo: 2, desc: "Recupera 20 pontos de vida." },
  { nome: "Cura Divina",   emoji: "💖", valor: 32, custo: 3, desc: "Cura poderosa de 32 HP." },
  { nome: "Ervas Místicas",emoji: "🌿", valor: 12, custo: 1, desc: "Cura leve de 12 HP." },
  { nome: "Banho de Luz",  emoji: "✨", valor: 24, custo: 2, desc: "Luz restauradora cura 24 HP." },
];

export const mkAtk = (): CartaData => ({
  id: nid(),
  tipo: "ataque",
  ...POOL_ATK[Math.floor(Math.random() * POOL_ATK.length)],
});

export const mkDef = (): CartaData => ({
  id: nid(),
  tipo: "defesa",
  ...POOL_DEF[Math.floor(Math.random() * POOL_DEF.length)],
});

export const mkCura = (): CartaData => ({
  id: nid(),
  tipo: "cura",
  ...POOL_CURA[Math.floor(Math.random() * POOL_CURA.length)],
});

export const mkPod = (pt: string): CartaData => ({
  id: nid(),
  tipo: "poderzinho",
  sub: pt,
  nome: `Poderzinho ${PODERES[pt].nome}`,
  emoji: PODERES[pt].emoji,
  desc: `Energize com o poder do ${PODERES[pt].nome}!`,
  bg1: PODERES[pt].bg1,
  bg2: PODERES[pt].bg2,
});

export const mkEvo = (t: number): CartaData => ({
  id: nid(),
  tipo: "evolucao",
  tier: t,
  nome: t === 1 ? "Evolução Básica" : t === 2 ? "Evolução Avançada" : "Evolução Final",
  emoji: "✨",
  desc: `+${t * 10} HP e +${t * 5} de ataque!`,
});

export const mkSwarmCard = (): CartaData => {
  const s = SWARMS[Math.floor(Math.random() * SWARMS.length)];
  return {
    id: nid(),
    tipo: "swarm",
    swarmId: s.id,
    nome: `Swarm: ${s.nome}`,
    emoji: s.emoji,
    desc: s.desc,
    raridade: s.raridade,
  };
};

export const mkDes = (): CartaData => {
  const p = [
    { nome: "Dano Global", emoji: "🌐", ef: "global", desc: "Todos adversários recebem 15 de dano." },
    { nome: "Imunidade", emoji: "💎", ef: "imunidade", desc: "Imune a dano este turno." },
    { nome: "Dobro Dano", emoji: "✖️", ef: "dobro", desc: "Próximo ataque com dano dobrado." },
  ];
  return { id: nid(), tipo: "desafio", ...p[Math.floor(Math.random() * p.length)] };
};

/* ─── COMBO CARDS (Fase 3) ─── */
const COMBO_CARDS: Record<string, { nome: string; emoji: string; valor: number; desc: string; tipo: string }[]> = {
  fogo: [
    { nome: "Chama Combo", emoji: "🔥", valor: 35, desc: "Combo de fogo! +35 dano com bônus elemental.", tipo: "ataque" },
    { nome: "Escudo Ígneo", emoji: "🛡️🔥", valor: 25, desc: "Escudo de fogo que queima quem ataca.", tipo: "defesa" },
  ],
  gelo: [
    { nome: "Congelamento Total", emoji: "❄️💎", valor: 30, desc: "Congela e defende 30 pontos.", tipo: "defesa" },
    { nome: "Estilhaço Gélido", emoji: "❄️⚔️", valor: 30, desc: "Fragmentos de gelo causam 30 de dano.", tipo: "ataque" },
  ],
  raio: [
    { nome: "Raio Duplo", emoji: "⚡⚡", valor: 40, desc: "Dois raios! 40 de dano elétrico.", tipo: "ataque" },
    { nome: "Campo Elétrico", emoji: "⚡🛡️", valor: 20, desc: "Eletrifica o campo, +20 defesa.", tipo: "defesa" },
  ],
  metal: [
    { nome: "Punho de Ferro", emoji: "🤖⚔️", valor: 35, desc: "Punho metálico devastador, 35 dano.", tipo: "ataque" },
    { nome: "Armadura Reforçada", emoji: "⚙️🛡️", valor: 35, desc: "Armadura extra de 35 defesa.", tipo: "defesa" },
  ],
  natureza: [
    { nome: "Tempestade Verde", emoji: "🌿🌪️", valor: 28, desc: "Tempestade natural causa 28 dano.", tipo: "ataque" },
    { nome: "Regeneração Total", emoji: "🌿💚", valor: 45, desc: "A natureza cura 45 HP.", tipo: "cura" },
  ],
};

export const mkCombo = (poder: string): CartaData | null => {
  const pool = COMBO_CARDS[poder];
  if (!pool) return null;
  const card = pool[Math.floor(Math.random() * pool.length)];
  return { id: nid(), tipo: card.tipo, ...card, esp: "combo", bg1: PODERES[poder].bg1, bg2: PODERES[poder].bg2, raridade: "raro" };
};

/* ─── LEGENDARY CARDS (Fase 3) ─── */
const POOL_LENDARIO = [
  { nome: "Meteoro Beast", emoji: "☄️", valor: 60, autoDano: 15, desc: "60 de dano massivo. Você recebe 15.", esp: "explode", tipo: "ataque" },
  { nome: "Reviver Ancestral", emoji: "🌅", valor: 50, desc: "Recupera 50 HP. Lendário!", tipo: "cura" },
  { nome: "Escudo dos Deuses", emoji: "🏛️", valor: 50, desc: "Defesa absoluta de 50 pontos.", tipo: "defesa" },
  { nome: "Fúria Final", emoji: "💀", valor: 0, desc: "Quanto menos HP, mais dano (até 80).", esp: "furiaFinal", tipo: "ataque" },
  { nome: "Espírito Guardião", emoji: "👼", valor: 0, desc: "Imune por 2 turnos + cura 20 HP.", esp: "espirito", tipo: "desafio", ef: "imunidade" },
];

export const mkLendario = (): CartaData => {
  const card = POOL_LENDARIO[Math.floor(Math.random() * POOL_LENDARIO.length)];
  return { id: nid(), ...card, raridade: "lendario" };
};

export function novaMao(n: number, poder: string | null, monstroId?: string): CartaData[] {
  const cs: CartaData[] = [mkAtk(), mkDef()];
  for (let i = 2; i < n; i++) {
    const r = Math.random();
    if (r < 0.20) cs.push(mkAtk());
    else if (r < 0.34) cs.push(mkDef());
    else if (r < 0.44) cs.push(mkCura());
    else if (r < 0.52 && poder) cs.push(mkPod(poder));
    else if (r < 0.58) cs.push(mkDes());
    else if (r < 0.68) cs.push(mkSwarmCard());
    else if (r < 0.76) cs.push(mkEvo(Math.ceil(Math.random() * 3)));
    else if (r < 0.85 && poder) {
      const combo = mkCombo(poder);
      if (combo) cs.push(combo); else cs.push(mkAtk());
    }
    else if (r < 0.92) cs.push(mkLendario());
    else cs.push(mkAtk());
  }
  return cs.sort(() => Math.random() - 0.5);
}

/* ─────────────────────────────────────────────
   SWARM RARITY STYLES
───────────────────────────────────────────── */
export const SWARM_RARITY_STYLES: Record<string, { border: string; glow: string; label: string }> = {
  comum: { border: "#4caf50", glow: "#4caf5033", label: "COMUM" },
  raro: { border: "#2196f3", glow: "#2196f333", label: "RARO" },
  epico: { border: "#9c27b0", glow: "#9c27b033", label: "ÉPICO" },
  lendario: { border: "#ffc107", glow: "#ffc10733", label: "LENDÁRIO" },
  hyper: { border: "#00e5ff", glow: "#00e5ff33", label: "HYPER" },
};

/* ─────────────────────────────────────────────
   IA PRESETS
───────────────────────────────────────────── */
export const IA_PRESETS = [
  { id: "p2", nome: "Rival Sombrio", monstro: "morcego" },
  { id: "p3", nome: "Mestre Banana", monstro: "banana" },
  { id: "p4", nome: "Drako Flamejante", monstro: "drako" },
  { id: "p5", nome: "Crystal Guardião", monstro: "crystal" },
  { id: "p6", nome: "Phantom Noturno", monstro: "phantom" },
  { id: "p7", nome: "Tsunami Profundo", monstro: "tsunami" },
  { id: "p8", nome: "Volt Relâmpago", monstro: "volt" },
];
