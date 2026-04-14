/* ─────────────────────────────────────────────
   MONSTROS
───────────────────────────────────────────── */
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
}

export const MONSTROS: Record<string, MonstroData> = {
  panther: {
    id: "panther",
    nome: "Panther",
    hp: 100,
    atk: 35,
    def: 15,
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
    hp: 120,
    atk: 20,
    def: 30,
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
    hp: 90,
    atk: 28,
    def: 22,
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
    hp: 85,
    atk: 32,
    def: 18,
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
    hp: 95,
    atk: 18,
    def: 35,
    emoji: "🌱",
    bg1: "#113300",
    bg2: "#43a047",
    glow: "#69f0ae",
    hab: "Crescimento",
    habD: "+5 ataque por turno",
  },
};

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

export const PODERES: Record<string, PoderData> = {
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
}

const SWARMS_JSON = `[
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
  }
]`;

export const SWARMS: SwarmData[] = JSON.parse(SWARMS_JSON);

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
  { nome: "Garra de Aço", emoji: "⚔️", valor: 25, desc: "Ataque poderoso das garras metálicas!" },
  { nome: "Pancada", emoji: "👊", valor: 15, desc: "Golpe direto com força bruta." },
  { nome: "Pulo Rápido", emoji: "💨", valor: 20, desc: "Ataque ágil e imprevisível." },
  { nome: "Sopro Congelante", emoji: "❄️", valor: 20, desc: "Congela o oponente no lugar." },
  { nome: "Raiz Explosiva", emoji: "🌿", valor: 18, desc: "Raízes saem do chão com força!" },
  { nome: "EXPLODE", emoji: "💥", valor: 50, autoDano: 20, desc: "50 de dano. Você recebe 20.", esp: "explode" },
  { nome: "Tudo ou Nada", emoji: "🎲", valor: 0, desc: "80 de dano ou zero. A sorte decide!", esp: "tudoOuNada" },
];

const POOL_DEF = [
  { nome: "Escudo Rápido", emoji: "🛡️", valor: 20, desc: "Bloqueia 20 de dano neste turno." },
  { nome: "Carapaça", emoji: "🐢", valor: 30, desc: "Defesa máxima por 1 turno." },
  { nome: "Esquiva", emoji: "✨", valor: 15, esp: "esquiva", desc: "Esquiva total do próximo ataque." },
  { nome: "Barreira", emoji: "💎", valor: 25, desc: "Barreira energética absorve dano." },
];

const POOL_CURA = [
  { nome: "Poção Vital", emoji: "🧪", valor: 25, desc: "Recupera 25 pontos de vida." },
  { nome: "Cura Divina", emoji: "💖", valor: 40, desc: "Cura poderosa de 40 HP." },
  { nome: "Ervas Místicas", emoji: "🌿", valor: 15, desc: "Cura leve de 15 HP com essência natural." },
  { nome: "Banho de Luz", emoji: "✨", valor: 30, desc: "Luz restauradora cura 30 HP." },
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

export function novaMao(n: number, poder: string | null): CartaData[] {
  const cs: CartaData[] = [mkAtk(), mkDef()];
  for (let i = 2; i < n; i++) {
    const r = Math.random();
    if (r < 0.22) cs.push(mkAtk());
    else if (r < 0.38) cs.push(mkDef());
    else if (r < 0.50) cs.push(mkCura());
    else if (r < 0.60 && poder) cs.push(mkPod(poder));
    else if (r < 0.70) cs.push(mkDes());
    else if (r < 0.82) cs.push(mkSwarmCard());
    else cs.push(mkEvo(Math.ceil(Math.random() * 3)));
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
];
