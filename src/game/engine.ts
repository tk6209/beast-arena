import { MONSTROS, PODERES, SWARMS, type CartaData, type SwarmData, novaMao } from "./data";

/* ─────────────────────────────────────────────
   JOGADOR TYPE
───────────────────────────────────────────── */
export interface MonstroState {
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
  nivel: number;
  poder: string | null;
  maxHp: number;
}

export interface Jogador {
  id: string;
  nome: string;
  humano: boolean;
  monstro: MonstroState;
  hp: number;
  maxHp: number;
  mao: CartaData[];
  defAtiva: number;
  imune: boolean;
  dobra: boolean;
  dodgeOnce: boolean;
  swarms: (SwarmData | null)[];
}

export interface LogEntry {
  msg: string;
  t: string;
}

export const alog = (ents: LogEntry[], msg: string, t: string = "sistema"): LogEntry[] => [
  ...ents,
  { msg, t },
];

/* ─────────────────────────────────────────────
   CRIAR JOGADOR
───────────────────────────────────────────── */
export function criarJ(id: string, nome: string, mId: string, humano: boolean): Jogador {
  const m = { ...MONSTROS[mId] };
  return {
    id,
    nome,
    humano,
    monstro: { ...m, nivel: 0, poder: null, maxHp: m.hp },
    hp: m.hp,
    maxHp: m.hp,
    mao: [],
    defAtiva: 0,
    imune: false,
    dobra: false,
    dodgeOnce: false,
    swarms: [null, null],
  };
}

/* ─────────────────────────────────────────────
   EVOLUÇÃO
───────────────────────────────────────────── */
export function evoluir(monstro: MonstroState, pid: string): MonstroState {
  const p = PODERES[pid];
  const lv = Math.min(3, monstro.nivel + 1);
  return {
    ...monstro,
    nivel: lv,
    poder: pid,
    atk: monstro.atk + p.atkB,
    def: monstro.def + p.defB,
    maxHp: monstro.maxHp + p.hpB,
  };
}

/* ─────────────────────────────────────────────
   SWARMS
───────────────────────────────────────────── */
export function equiparSwarm(jogador: Jogador, swarm: SwarmData, slot: number = 0): Jogador {
  const novos = [...jogador.swarms];
  novos[slot] = { ...swarm };
  return { ...jogador, swarms: novos };
}

export interface SwarmBonus {
  atkBonus: number;
  defBonus: number;
  hpRegen: number;
  poison: number;
  growth: number;
  shield: number;
}

export function aplicarBonusSwarms(jogador: Jogador): SwarmBonus {
  let atkBonus = 0;
  let defBonus = 0;
  let hpRegen = 0;
  let poison = 0;
  let growth = 0;
  let shield = 0;

  for (const swarm of jogador.swarms) {
    if (!swarm) continue;
    if (swarm.efeito === "atk_flat") atkBonus += swarm.valor;
    if (swarm.efeito === "def_flat") defBonus += swarm.valor;
    if (swarm.efeito === "hp_regen") hpRegen += swarm.valor;
    if (swarm.efeito === "poison") poison += swarm.valor;
    if (swarm.efeito === "growth") growth += swarm.valor;
    if (swarm.efeito === "shield_flat") shield += swarm.valor;
  }

  return { atkBonus, defBonus, hpRegen, poison, growth, shield };
}

export function aplicarEfeitosInicioTurno(
  jogador: Jogador,
  log: LogEntry[]
): { jogador: Jogador; log: LogEntry[] } {
  let j = { ...jogador };
  let novoLog = [...log];
  const fx = aplicarBonusSwarms(j);

  if (fx.hpRegen > 0) {
    const hpAntes = j.hp;
    j.hp = Math.min(j.maxHp, j.hp + fx.hpRegen);
    const curado = j.hp - hpAntes;
    if (curado > 0) {
      novoLog = alog(novoLog, `💚 ${j.monstro.nome} recupera ${curado} HP com seus Swarms!`, "cura");
    }
  }

  if (fx.growth > 0) {
    j.monstro = { ...j.monstro, atk: j.monstro.atk + fx.growth };
    novoLog = alog(novoLog, `🌿 ${j.monstro.nome} cresce com seus Swarms e ganha +${fx.growth} ATK!`, "efeito");
  }

  if (fx.shield > 0) {
    j.defAtiva += fx.shield;
    novoLog = alog(novoLog, `💎 ${j.monstro.nome} recebe +${fx.shield} de escudo temporário!`, "efeito");
  }

  for (const swarm of j.swarms) {
    if (!swarm) continue;
    if (swarm.efeito === "dodge_once" && !j.dodgeOnce) {
      j.dodgeOnce = true;
      novoLog = alog(novoLog, `🦇 ${j.monstro.nome} está preparado para esquivar do próximo ataque!`, "efeito");
    }
  }

  return { jogador: j, log: novoLog };
}

export function aplicarPoisonNoAlvo(
  alvo: Jogador,
  log: LogEntry[]
): { jogador: Jogador; log: LogEntry[] } {
  let j = { ...alvo };
  let novoLog = [...log];
  const fx = aplicarBonusSwarms(j);
  if (fx.poison > 0) {
    j.hp = Math.max(0, j.hp - fx.poison);
    novoLog = alog(novoLog, `☣️ ${j.monstro.nome} sofre ${fx.poison} de dano venenoso dos Swarms!`, "dano");
  }
  return { jogador: j, log: novoLog };
}

/* ─────────────────────────────────────────────
   IA
───────────────────────────────────────────── */
export function iaJogar(ia: Jogador): { tipo: string; carta?: CartaData } {
  const h = ia.mao;

  if (ia.hp < 35) {
    const d = h.find((c) => c.tipo === "defesa");
    if (d) return { tipo: "defesa", carta: d };
  }

  const swarmCard = h.find((c) => c.tipo === "swarm");
  if (swarmCard && ia.swarms.some((s) => s === null)) {
    return { tipo: "swarm", carta: swarmCard };
  }

  const ev = h.find((c) => c.tipo === "evolucao" && ia.monstro.nivel < 3 && ia.monstro.poder);
  if (ev && ia.monstro.nivel < 2) return { tipo: "evolucao", carta: ev };

  const a = h.find((c) => c.tipo === "ataque");
  if (a) return { tipo: "ataque", carta: a };

  const d = h.find((c) => c.tipo === "defesa");
  if (d) return { tipo: "defesa", carta: d };

  const ch = h.find((c) => c.tipo === "desafio");
  if (ch) return { tipo: "desafio", carta: ch };

  return { tipo: "passar" };
}

/* ─────────────────────────────────────────────
   SALA (localStorage + BroadcastChannel)
───────────────────────────────────────────── */
const SK = (id: string) => `bac_sala_${id}`;

export function salvarSala(sid: string, dados: any) {
  localStorage.setItem(SK(sid), JSON.stringify({ ...dados, ts: Date.now() }));
  try {
    const bc = new BroadcastChannel(`bac_${sid}`);
    bc.postMessage("sync");
    bc.close();
  } catch {}
}

export function lerSala(sid: string): any {
  try {
    return JSON.parse(localStorage.getItem(SK(sid)) || "null");
  } catch {
    return null;
  }
}
