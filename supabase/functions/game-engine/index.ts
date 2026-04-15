import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ─────────────────────────────────────────────
   GAME DATA (mirrors src/game/data.ts)
───────────────────────────────────────────── */

const MONSTROS: Record<string, any> = {
  panther: { id: "panther", nome: "Panther", hp: 100, atk: 35, def: 15, emoji: "🐆", hab: "Modo Caçador" },
  banana: { id: "banana", nome: "Banana", hp: 120, atk: 20, def: 30, emoji: "🍌", hab: "Casca Escorr." },
  macaco: { id: "macaco", nome: "Macaco", hp: 90, atk: 28, def: 22, emoji: "🐒", hab: "Atq. Surpresa" },
  morcego: { id: "morcego", nome: "Morcego", hp: 85, atk: 32, def: 18, emoji: "🦇", hab: "Voo Sombrio" },
  sprouts: { id: "sprouts", nome: "Sprouts", hp: 95, atk: 18, def: 35, emoji: "🌱", hab: "Crescimento" },
  drako: { id: "drako", nome: "Drako", hp: 110, atk: 40, def: 12, emoji: "🐉", hab: "Fúria de Fogo" },
  crystal: { id: "crystal", nome: "Crystal", hp: 80, atk: 22, def: 40, emoji: "💎", hab: "Armadura Cristal" },
  phantom: { id: "phantom", nome: "Phantom", hp: 75, atk: 38, def: 10, emoji: "👻", hab: "Fase Sombria" },
  tsunami: { id: "tsunami", nome: "Tsunami", hp: 105, atk: 25, def: 28, emoji: "🌊", hab: "Maré Alta" },
  volt: { id: "volt", nome: "Volt", hp: 70, atk: 45, def: 8, emoji: "⚡", hab: "Descarga Elétrica" },
};

const PODERES: Record<string, any> = {
  fogo: { id: "fogo", nome: "Fogo", emoji: "🔥", atkB: 20, defB: 0, hpB: 10 },
  gelo: { id: "gelo", nome: "Gelo", emoji: "❄️", atkB: 5, defB: 25, hpB: 15 },
  raio: { id: "raio", nome: "Raio", emoji: "⚡", atkB: 25, defB: 5, hpB: 5 },
  metal: { id: "metal", nome: "Metal", emoji: "⚙️", atkB: 15, defB: 15, hpB: 20 },
  natureza: { id: "natureza", nome: "Natureza", emoji: "🌿", atkB: 10, defB: 20, hpB: 25 },
};

const SWARMS: any[] = [
  { id: "swarm_faisca", nome: "Faísca", emoji: "⚡", efeito: "atk_flat", valor: 8 },
  { id: "swarm_pedra_viva", nome: "Pedra Viva", emoji: "🪨", efeito: "def_flat", valor: 10 },
  { id: "swarm_slime_verde", nome: "Slime Verde", emoji: "🟢", efeito: "hp_regen", valor: 5 },
  { id: "swarm_veneno", nome: "Veneno Viscoso", emoji: "☣️", efeito: "poison", valor: 6 },
  { id: "swarm_morcego_neon", nome: "Morcego Neon", emoji: "🦇", efeito: "dodge_once", valor: 1 },
  { id: "swarm_raiz_viva", nome: "Raiz Viva", emoji: "🌿", efeito: "growth", valor: 4 },
  { id: "swarm_escudo_azul", nome: "Escudo Azul", emoji: "💎", efeito: "shield_flat", valor: 8 },
  { id: "swarm_trovao", nome: "Trovão", emoji: "⚡", efeito: "atk_flat", valor: 15 },
];

/* ─── Easy Mode Balance Constants ─── */
const EASY_HP_MULTIPLIER = 1.4;
const EASY_ROUND_HEAL = 5;

function easyDamageMultiplier(round: number): number {
  if (round <= 2) return 0.85;
  if (round <= 4) return 0.95;
  return 1.0;
}

function easyAiPassChance(round: number): number {
  if (round <= 3) return 0.4;
  return 0.3;
}

function easyDamageCap(_round: number): number {
  return Infinity;
}

/* Difficulty multipliers for AI stats */
const DIFFICULTY_MULTIPLIERS: Record<string, { hp: number; atk: number; def: number }> = {
  facil: { hp: 1.0, atk: 0.7, def: 0.7 },
  medio: { hp: 1.0, atk: 1.0, def: 1.0 },
  avancado: { hp: 1.4, atk: 1.3, def: 1.3 },
};

const POOL_ATK = [
  { nome: "Garra de Aço", emoji: "⚔️", valor: 25 },
  { nome: "Pancada", emoji: "👊", valor: 15 },
  { nome: "Pulo Rápido", emoji: "💨", valor: 20 },
  { nome: "Sopro Congelante", emoji: "❄️", valor: 20 },
  { nome: "Raiz Explosiva", emoji: "🌿", valor: 18 },
  { nome: "EXPLODE", emoji: "💥", valor: 50, autoDano: 20, esp: "explode" },
  { nome: "Tudo ou Nada", emoji: "🎲", valor: 0, esp: "tudoOuNada" },
];

const POOL_DEF = [
  { nome: "Escudo Rápido", emoji: "🛡️", valor: 20 },
  { nome: "Carapaça", emoji: "🐢", valor: 30 },
  { nome: "Esquiva", emoji: "✨", valor: 15, esp: "esquiva" },
  { nome: "Barreira", emoji: "💎", valor: 25 },
];

const POOL_CURA = [
  { nome: "Poção Vital", emoji: "🧪", valor: 25 },
  { nome: "Cura Divina", emoji: "💖", valor: 40 },
  { nome: "Ervas Místicas", emoji: "🌿", valor: 15 },
  { nome: "Banho de Luz", emoji: "✨", valor: 30 },
];

/* ─── Helpers ─── */
let _cid = Math.floor(Math.random() * 100000);
function nid() { return ++_cid; }

function rndItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function mkAtk(): any { return { id: nid(), tipo: "ataque", desc: "", ...rndItem(POOL_ATK) }; }
function mkDef(): any { return { id: nid(), tipo: "defesa", desc: "", ...rndItem(POOL_DEF) }; }
function mkCura(): any { return { id: nid(), tipo: "cura", desc: "", ...rndItem(POOL_CURA) }; }
function mkPod(pt: string): any {
  const p = PODERES[pt];
  return { id: nid(), tipo: "poderzinho", sub: pt, nome: `Poderzinho ${p.nome}`, emoji: p.emoji, desc: "" };
}
function mkEvo(t: number): any {
  return { id: nid(), tipo: "evolucao", tier: t, nome: t === 1 ? "Evolução Básica" : t === 2 ? "Evolução Avançada" : "Evolução Final", emoji: "✨", desc: "" };
}
function mkSwarmCard(): any {
  const s = rndItem(SWARMS);
  return { id: nid(), tipo: "swarm", swarmId: s.id, nome: `Swarm: ${s.nome}`, emoji: s.emoji, desc: s.nome, raridade: "" };
}
function mkDes(): any {
  const p = rndItem([
    { nome: "Dano Global", emoji: "🌐", ef: "global" },
    { nome: "Imunidade", emoji: "💎", ef: "imunidade" },
    { nome: "Dobro Dano", emoji: "✖️", ef: "dobro" },
  ]);
  return { id: nid(), tipo: "desafio", ...p, desc: "" };
}

function novaMao(n: number, poder: string | null): any[] {
  if (n <= 0) return [];
  if (n === 1) {
    // Combo penalty: single random card
    const r = Math.random();
    if (r < 0.5) return [mkAtk()];
    if (r < 0.8) return [mkDef()];
    return [mkCura()];
  }
  const cs = [mkAtk(), mkDef()];
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

function evoluir(m: any, pid: string): any {
  const p = PODERES[pid];
  return { ...m, nivel: Math.min(3, (m.nivel || 0) + 1), poder: pid, atk: m.atk + p.atkB, def: m.def + p.defB, maxHp: (m.maxHp || m.hp) + p.hpB };
}

function swarmBonus(swarms: any[]): any {
  let atkBonus = 0, defBonus = 0, hpRegen = 0, poison = 0, growth = 0, shield = 0;
  for (const s of swarms) {
    if (!s) continue;
    if (s.efeito === "atk_flat") atkBonus += s.valor;
    if (s.efeito === "def_flat") defBonus += s.valor;
    if (s.efeito === "hp_regen") hpRegen += s.valor;
    if (s.efeito === "poison") poison += s.valor;
    if (s.efeito === "growth") growth += s.valor;
    if (s.efeito === "shield_flat") shield += s.valor;
  }
  return { atkBonus, defBonus, hpRegen, poison, growth, shield };
}

function aplicarInicioTurno(j: any, log: any[]): { j: any; log: any[] } {
  const fx = swarmBonus(j.swarms || []);
  if (fx.hpRegen > 0) {
    const antes = j.hp;
    j.hp = Math.min(j.maxHp, j.hp + fx.hpRegen);
    if (j.hp > antes) log.push({ msg: `💚 ${j.monstro.nome} recupera ${j.hp - antes} HP!`, t: "cura" });
  }
  if (fx.growth > 0) {
    j.monstro.atk += fx.growth;
    log.push({ msg: `🌿 ${j.monstro.nome} ganha +${fx.growth} ATK!`, t: "efeito" });
  }
  if (fx.shield > 0) {
    j.defAtiva = (j.defAtiva || 0) + fx.shield;
    log.push({ msg: `💎 ${j.monstro.nome} recebe +${fx.shield} escudo!`, t: "efeito" });
  }
  for (const s of (j.swarms || [])) {
    if (s && s.efeito === "dodge_once" && !j.dodgeOnce) {
      j.dodgeOnce = true;
      log.push({ msg: `🦇 ${j.monstro.nome} preparado para esquivar!`, t: "efeito" });
    }
  }
  return { j, log };
}

function aplicarPoison(alvo: any, log: any[]): { alvo: any; log: any[] } {
  const fx = swarmBonus(alvo.swarms || []);
  if (fx.poison > 0) {
    alvo.hp = Math.max(0, alvo.hp - fx.poison);
    log.push({ msg: `☣️ ${alvo.monstro.nome} sofre ${fx.poison} veneno!`, t: "dano" });
  }
  return { alvo, log };
}

/* ─── AI Logic ─── */
function iaJogar(ai: any, dificuldade: string = "medio", turno: number = 0): { tipo: string; carta?: any } {
  const h = ai.mao || [];

  // Easy mode: higher pass chance in early rounds
  if (dificuldade === "facil") {
    const passChance = easyAiPassChance(turno);
    if (Math.random() < passChance) return { tipo: "passar" };
  }

  const hpThreshold = dificuldade === "avancado" ? 50 : 40;
  if (ai.hp < hpThreshold) {
    const cura = h.find((c: any) => c.tipo === "cura");
    if (cura) return { tipo: "cura", carta: cura };
    const d = h.find((c: any) => c.tipo === "defesa");
    if (d) return { tipo: "defesa", carta: d };
  }
  const sw = h.find((c: any) => c.tipo === "swarm");
  if (sw && (ai.swarms || []).some((s: any) => s === null)) return { tipo: "swarm", carta: sw };
  const ev = h.find((c: any) => c.tipo === "evolucao" && (ai.monstro.nivel || 0) < 3 && ai.monstro.poder);
  if (ev && (ai.monstro.nivel || 0) < 2) return { tipo: "evolucao", carta: ev };

  if (dificuldade === "avancado") {
    const ataques = h.filter((c: any) => c.tipo === "ataque").sort((a: any, b: any) => (b.valor || 0) - (a.valor || 0));
    if (ataques.length > 0) return { tipo: "ataque", carta: ataques[0] };
  }

  const a = h.find((c: any) => c.tipo === "ataque"); if (a) return { tipo: "ataque", carta: a };
  const d = h.find((c: any) => c.tipo === "defesa"); if (d) return { tipo: "defesa", carta: d };
  const cura = h.find((c: any) => c.tipo === "cura"); if (cura) return { tipo: "cura", carta: cura };
  const ch = h.find((c: any) => c.tipo === "desafio"); if (ch) return { tipo: "desafio", carta: ch };
  return { tipo: "passar" };
}

/* ─── Create initial player state ─── */
function criarJogador(id: string, nome: string, mId: string): any {
  const m = { ...MONSTROS[mId] };
  return {
    id, nome,
    monstro: { ...m, nivel: 0, poder: null, maxHp: m.hp },
    hp: m.hp, maxHp: m.hp,
    mao: [], defAtiva: 0, imune: false, dobra: false, dodgeOnce: false,
    swarms: [null, null],
  };
}

/* ─────────────────────────────────────────────
   ACTION HANDLERS
───────────────────────────────────────────── */

function handleChoosePower(state: any, payload: any): any {
  const { slot, powerId } = payload;
  if (!PODERES[powerId]) return { error: "Poder inválido" };
  const player = state.players[slot];
  if (!player) return { error: "Jogador não encontrado" };
  if (player.monstro.poder) return { error: "Poder já escolhido" };

  player.monstro = evoluir(player.monstro, powerId);
  player.hp = player.monstro.maxHp;
  player.maxHp = player.monstro.maxHp;
  player.mao = novaMao(5, powerId);

  const log = [...(state.log || []),
    { msg: `✨ Poder ${PODERES[powerId].nome} escolhido! ${player.monstro.nome} evolui para Nível 1!`, t: "efeito" },
    { msg: `🔄 Turno 1 — Cartas distribuídas!`, t: "sistema" },
  ];

  state.players[slot] = player;
  state.log = log;
  state.turno = 0;
  state.fase = "acao";
  state.readyCount = (state.readyCount || 0) + 1;
  return { state, events: [{ type: "power_chosen", slot, powerId }] };
}

/** Apply easy mode damage scaling */
function applyEasyDamageScaling(dmg: number, dificuldade: string, turno: number): number {
  if (dificuldade !== "facil") return dmg;
  const mult = easyDamageMultiplier(turno);
  const capped = Math.min(dmg, easyDamageCap(turno));
  return Math.floor(capped * mult);
}

function processAttack(attacker: any, defender: any, carta: any, log: any[], dificuldade: string = "medio", turno: number = 0): any[] {
  const fxAtk = swarmBonus(attacker.swarms || []);
  let dmg = carta.esp === "tudoOuNada"
    ? (Math.random() < 0.5 ? 80 : 0)
    : attacker.monstro.atk + fxAtk.atkBonus + (carta.valor || 0);

  if (attacker.dobra) { dmg *= 2; attacker.dobra = false; log.push({ msg: `✖️ Dano dobrado!`, t: "combo" }); }
  if (carta.autoDano) { attacker.hp = Math.max(0, attacker.hp - carta.autoDano); log.push({ msg: `💥 Auto-dano de ${carta.autoDano}!`, t: "dano" }); }
  if (attacker.monstro.id === "macaco" && Math.random() < 0.5) { dmg *= 2; log.push({ msg: `🐒 Hit duplo do Macaco!`, t: "combo" }); }

  // Apply easy mode damage scaling
  dmg = applyEasyDamageScaling(dmg, dificuldade, turno);

  if (defender.imune) {
    defender.imune = false;
    log.push({ msg: `💎 ${defender.monstro.nome} estava imune!`, t: "efeito" });
  } else if (defender.dodgeOnce) {
    defender.dodgeOnce = false;
    log.push({ msg: `🌪️ ${defender.monstro.nome} esquivou!`, t: "efeito" });
  } else {
    const fxDef = swarmBonus(defender.swarms || []);
    const def = defender.monstro.def + (defender.defAtiva || 0) + fxDef.defBonus;
    const fin = Math.max(0, dmg - def);
    defender.hp = Math.max(0, defender.hp - fin);
    log.push({ msg: `⚔️ ${attacker.monstro.nome} causa ${fin} de dano em ${defender.monstro.nome}!`, t: "dano", dmg: fin });

    const pr = aplicarPoison(defender, log);
    defender = pr.alvo;
    log = pr.log;
  }

  return log;
}

function handlePlayCard(state: any, payload: any): any {
  const { slot, cardId } = payload;
  const player = state.players[slot];
  if (!player) return { error: "Jogador não encontrado" };
  if (state.currentTurn !== slot && state.modo === "multi") return { error: "Não é seu turno" };

  const cartaIdx = player.mao.findIndex((c: any) => c.id === cardId);
  if (cartaIdx < 0) return { error: "Carta não encontrada na mão" };
  const carta = player.mao[cartaIdx];

  let log = [...(state.log || [])];
  const opSlot = slot === 0 ? 1 : 0;
  let opponent = state.players[opSlot];
  const dificuldade = state.dificuldade || "medio";
  const turno = state.turno || 0;

  if (carta.tipo === "ataque") {
    if (opponent && opponent.hp > 0) {
      log = processAttack(player, opponent, carta, log, dificuldade, turno);
      state.players[opSlot] = opponent;
    }
  } else if (carta.tipo === "defesa") {
    player.defAtiva = (player.defAtiva || 0) + (carta.valor || 0);
    if (carta.esp === "esquiva") {
      player.imune = true;
      log.push({ msg: `🛡️ ${player.monstro.nome} ativa esquiva!`, t: "efeito" });
    } else {
      log.push({ msg: `🛡️ ${player.monstro.nome} se defende com ${carta.valor}!`, t: "efeito" });
    }
  } else if (carta.tipo === "poderzinho") {
    const pp = PODERES[carta.sub];
    if (pp) {
      player.monstro.atk += Math.floor(pp.atkB / 3);
      player.monstro.def += Math.floor(pp.defB / 3);
      log.push({ msg: `${pp.emoji} Poderzinho ${pp.nome} ativado!`, t: "efeito" });
    }
  } else if (carta.tipo === "evolucao") {
    if ((player.monstro.nivel || 0) < 3 && player.monstro.poder) {
      player.monstro = evoluir(player.monstro, player.monstro.poder);
      player.maxHp = player.monstro.maxHp;
      log.push({ msg: `✨ ${player.monstro.nome} evolui para nível ${player.monstro.nivel}!`, t: "efeito" });
    } else {
      return { error: "Evolução máxima ou poder não escolhido" };
    }
  } else if (carta.tipo === "swarm") {
    const swarm = SWARMS.find((s) => s.id === carta.swarmId);
    if (swarm) {
      const swarms = player.swarms || [null, null];
      const sl = swarms.findIndex((s: any) => s === null);
      swarms[sl >= 0 ? sl : 0] = { ...swarm };
      player.swarms = swarms;
      log.push({ msg: `🐾 ${swarm.nome} equipado como Swarm!`, t: "efeito" });
    }
  } else if (carta.tipo === "desafio") {
    if (carta.ef === "global" && opponent) {
      let globalDmg = 15;
      globalDmg = applyEasyDamageScaling(globalDmg, dificuldade, turno);
      opponent.hp = Math.max(0, opponent.hp - globalDmg);
      state.players[opSlot] = opponent;
      log.push({ msg: `🌍 Dano global! ${globalDmg} de dano!`, t: "grande" });
    } else if (carta.ef === "imunidade") {
      player.imune = true;
      log.push({ msg: `💎 ${player.monstro.nome} ativou imunidade!`, t: "efeito" });
    } else if (carta.ef === "dobro") {
      player.dobra = true;
      log.push({ msg: `❌ Próximo ataque com dano dobrado!`, t: "combo" });
    }
  } else if (carta.tipo === "cura") {
    const curaVal = carta.valor || 20;
    const hpAntes = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + curaVal);
    const curado = player.hp - hpAntes;
    log.push({ msg: `💖 ${player.monstro.nome} recupera ${curado} HP com ${carta.nome}!`, t: "cura", hp: curado });
  }

  // Remove card from hand
  player.mao = player.mao.filter((c: any) => c.id !== cardId);
  state.players[slot] = player;
  state.log = log;

  const events: any[] = [{ type: "card_played", slot, carta }];

  // Check victory
  if (opponent && opponent.hp <= 0) {
    state.fase = "resultado";
    state.vencedor = slot;
    events.push({ type: "game_over", winner: slot });
    return { state, events };
  }

  // For AI mode, run AI turn
  if (state.modo === "ai") {
    const aiResult = runAITurn(state, opSlot);
    state = aiResult.state;
    events.push(...aiResult.events);

    if (state.players[slot].hp <= 0) {
      state.fase = "resultado";
      state.vencedor = opSlot;
      events.push({ type: "game_over", winner: opSlot });
      return { state, events };
    }

    state = advanceTurn(state);
    events.push({ type: "new_turn", turno: state.turno });
  } else {
    state.currentTurn = opSlot;
    events.push({ type: "turn_changed", currentTurn: opSlot });
  }

  return { state, events };
}

function runAITurn(state: any, aiSlot: number): { state: any; events: any[] } {
  const ai = state.players[aiSlot];
  if (!ai || ai.hp <= 0) return { state, events: [] };

  const dificuldade = state.dificuldade || "medio";
  const turno = state.turno || 0;
  const { tipo, carta } = iaJogar(ai, dificuldade, turno);
  const events: any[] = [];
  let log = [...(state.log || [])];
  const playerSlot = aiSlot === 0 ? 1 : 0;
  let player = state.players[playerSlot];

  if (tipo === "swarm" && carta) {
    const swarm = SWARMS.find((s) => s.id === carta.swarmId);
    if (swarm) {
      const swarms = ai.swarms || [null, null];
      const sl = swarms.findIndex((s: any) => s === null);
      swarms[sl >= 0 ? sl : 0] = { ...swarm };
      ai.swarms = swarms;
      log.push({ msg: `🐾 ${ai.monstro.nome} equipou ${swarm.nome}!`, t: "efeito" });
    }
  } else if (tipo === "ataque" && carta) {
    log = processAttack(ai, player, carta, log, dificuldade, turno);
    state.players[playerSlot] = player;
  } else if (tipo === "defesa" && carta) {
    ai.defAtiva = (ai.defAtiva || 0) + (carta.valor || 0);
    log.push({ msg: `🛡️ ${ai.monstro.nome} se defende com ${carta.valor}!`, t: "efeito" });
  } else if (tipo === "evolucao" && carta) {
    if ((ai.monstro.nivel || 0) < 3 && ai.monstro.poder) {
      ai.monstro = evoluir(ai.monstro, ai.monstro.poder);
      ai.maxHp = ai.monstro.maxHp;
      log.push({ msg: `✨ ${ai.monstro.nome} evolui para nível ${ai.monstro.nivel}!`, t: "efeito" });
    }
  } else if (tipo === "cura" && carta) {
    const curaVal = carta.valor || 20;
    const hpAntes = ai.hp;
    ai.hp = Math.min(ai.maxHp, ai.hp + curaVal);
    const curado = ai.hp - hpAntes;
    log.push({ msg: `💖 ${ai.monstro.nome} recupera ${curado} HP com ${carta.nome}!`, t: "cura", hp: curado });
  }

  if (carta) ai.mao = ai.mao.filter((c: any) => c.id !== carta.id);
  state.players[aiSlot] = ai;
  state.log = log;
  events.push({ type: "ai_played", slot: aiSlot, tipo, carta });

  return { state, events };
}

function advanceTurn(state: any): any {
  let log = [...(state.log || [])];
  const dificuldade = state.dificuldade || "medio";

  for (let i = 0; i < state.players.length; i++) {
    const r = aplicarInicioTurno(state.players[i], log);
    state.players[i] = r.j;
    log = r.log;
  }

  // Easy mode: mini-heal between rounds for both players
  if (dificuldade === "facil") {
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      const antes = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + EASY_ROUND_HEAL);
      const healed = p.hp - antes;
      if (healed > 0) {
        log.push({ msg: `💚 ${p.monstro.nome} regenera ${healed} HP entre rounds.`, t: "cura" });
      }
    }
  }

  state.turno = (state.turno || 0) + 1;
  for (let i = 0; i < state.players.length; i++) {
    // Combo penalty: only 1 card next turn if combo was used
    const handSize = state.players[i].comboUsed ? 1 : 5;
    state.players[i].mao = novaMao(handSize, state.players[i].monstro.poder);
    state.players[i].defAtiva = 0;
    if (state.players[i].comboUsed) {
      log.push({ msg: `⚡ ${state.players[i].monstro.nome} recebe apenas 1 carta (penalidade combo)!`, t: "sistema" });
      state.players[i].comboUsed = false;
    }
  }
  state.fase = "acao";
  state.currentTurn = 0;
  log.push({ msg: `🔄 Turno ${state.turno + 1} — Novas cartas!`, t: "sistema" });
  state.log = log;
  return state;
}

function handleComboCards(state: any, payload: any): any {
  const { slot, cardId1, cardId2 } = payload;
  const player = state.players[slot];
  if (!player) return { error: "Jogador não encontrado" };

  const idx1 = player.mao.findIndex((c: any) => c.id === cardId1);
  const idx2 = player.mao.findIndex((c: any) => c.id === cardId2);
  if (idx1 < 0 || idx2 < 0) return { error: "Cartas não encontradas na mão" };

  const carta1 = player.mao[idx1];
  const carta2 = player.mao[idx2];

  // Both cards must be same type and one of: ataque, defesa, cura
  const validTypes = ["ataque", "defesa", "cura"];
  if (carta1.tipo !== carta2.tipo || !validTypes.includes(carta1.tipo)) {
    return { error: "Combo requer duas cartas do mesmo tipo (ataque, defesa ou cura)" };
  }

  let log = [...(state.log || [])];
  const opSlot = slot === 0 ? 1 : 0;
  let opponent = state.players[opSlot];
  const dificuldade = state.dificuldade || "medio";
  const turno = state.turno || 0;
  const events: any[] = [];

  const comboType = carta1.tipo;
  const combinedVal = Math.floor(((carta1.valor || 0) + (carta2.valor || 0)) * 1.5);

  if (comboType === "ataque" && opponent && opponent.hp > 0) {
    const fxAtk = swarmBonus(player.swarms || []);
    let dmg = player.monstro.atk + fxAtk.atkBonus + combinedVal;
    if (player.dobra) { dmg *= 2; player.dobra = false; log.push({ msg: `✖️ Dano dobrado!`, t: "combo" }); }
    dmg = applyEasyDamageScaling(dmg, dificuldade, turno);

    if (opponent.imune) {
      opponent.imune = false;
      log.push({ msg: `💎 ${opponent.monstro.nome} estava imune!`, t: "efeito" });
    } else if (opponent.dodgeOnce) {
      opponent.dodgeOnce = false;
      log.push({ msg: `🌪️ ${opponent.monstro.nome} esquivou!`, t: "efeito" });
    } else {
      const fxDef = swarmBonus(opponent.swarms || []);
      const def = opponent.monstro.def + (opponent.defAtiva || 0) + fxDef.defBonus;
      const fin = Math.max(0, dmg - def);
      opponent.hp = Math.max(0, opponent.hp - fin);
      log.push({ msg: `⚡ COMBO! ${player.monstro.nome} causa ${fin} de dano com ${carta1.nome} + ${carta2.nome}!`, t: "dano", dmg: fin });
    }
    state.players[opSlot] = opponent;
  } else if (comboType === "defesa") {
    player.defAtiva = (player.defAtiva || 0) + combinedVal;
    log.push({ msg: `⚡ COMBO! ${player.monstro.nome} se defende com ${combinedVal}!`, t: "efeito" });
  } else if (comboType === "cura") {
    const hpAntes = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + combinedVal);
    const curado = player.hp - hpAntes;
    log.push({ msg: `⚡ COMBO! ${player.monstro.nome} recupera ${curado} HP!`, t: "cura", hp: curado });
  }

  // Remove both cards, mark combo penalty
  player.mao = player.mao.filter((c: any) => c.id !== cardId1 && c.id !== cardId2);
  player.comboUsed = true;
  state.players[slot] = player;
  state.log = log;

  events.push({ type: "combo_played", slot, cards: [carta1, carta2], comboType });

  // Check victory
  if (opponent && opponent.hp <= 0) {
    state.fase = "resultado";
    state.vencedor = slot;
    events.push({ type: "game_over", winner: slot });
    return { state, events };
  }

  // For AI mode, run AI turn
  if (state.modo === "ai") {
    const aiResult = runAITurn(state, opSlot);
    state = aiResult.state;
    events.push(...aiResult.events);

    if (state.players[slot].hp <= 0) {
      state.fase = "resultado";
      state.vencedor = opSlot;
      events.push({ type: "game_over", winner: opSlot });
      return { state, events };
    }

    state = advanceTurn(state);
    events.push({ type: "new_turn", turno: state.turno });
  } else {
    state.currentTurn = opSlot;
    events.push({ type: "turn_changed", currentTurn: opSlot });
  }

  return { state, events };
}

function handlePassTurn(state: any, payload: any): any {
  const { slot } = payload;
  const events: any[] = [{ type: "pass", slot }];

  if (state.modo === "ai") {
    const opSlot = slot === 0 ? 1 : 0;
    const aiResult = runAITurn(state, opSlot);
    state = aiResult.state;
    events.push(...aiResult.events);

    if (state.players[slot].hp <= 0) {
      state.fase = "resultado";
      state.vencedor = opSlot;
      events.push({ type: "game_over", winner: opSlot });
      return { state, events };
    }

    state = advanceTurn(state);
    events.push({ type: "new_turn", turno: state.turno });
  } else {
    const opSlot = slot === 0 ? 1 : 0;
    state.currentTurn = opSlot;
    events.push({ type: "turn_changed", currentTurn: opSlot });
  }

  return { state, events };
}

function handleInitGame(state: any, payload: any): any {
  const { modo, players: playerConfigs, dificuldade = "medio", aiMonstroId } = payload;
  const diffMult = DIFFICULTY_MULTIPLIERS[dificuldade] || DIFFICULTY_MULTIPLIERS.medio;

  const players: any[] = [];
  for (const pc of playerConfigs) {
    const p = criarJogador(pc.slot.toString(), pc.nome, pc.monstroId);
    // Apply easy mode HP boost to player too
    if (dificuldade === "facil") {
      p.monstro.maxHp = Math.floor(p.monstro.maxHp * EASY_HP_MULTIPLIER);
      p.monstro.hp = p.monstro.maxHp;
      p.hp = p.monstro.maxHp;
      p.maxHp = p.monstro.maxHp;
    }
    players[pc.slot] = p;
  }

  // For AI mode, set up AI player
  if (modo === "ai" && players.length < 2) {
    const aiM = aiMonstroId && MONSTROS[aiMonstroId] ? aiMonstroId : rndItem(Object.keys(MONSTROS));
    const aiP = rndItem(Object.keys(PODERES));
    let ai = criarJogador("ai", "Rival Sombrio", aiM);
    ai.monstro = evoluir(ai.monstro, aiP);

    // Apply difficulty scaling to AI
    ai.monstro.atk = Math.round(ai.monstro.atk * diffMult.atk);
    ai.monstro.def = Math.round(ai.monstro.def * diffMult.def);
    ai.monstro.maxHp = Math.round(ai.monstro.maxHp * diffMult.hp);
    
    // Easy mode: also boost AI HP so fights last longer
    if (dificuldade === "facil") {
      ai.monstro.maxHp = Math.floor(ai.monstro.maxHp * EASY_HP_MULTIPLIER);
    }
    
    ai.hp = ai.monstro.maxHp;
    ai.maxHp = ai.monstro.maxHp;
    ai.mao = novaMao(5, aiP);
    players[1] = ai;
  }

  return {
    state: {
      modo,
      dificuldade,
      players,
      turno: 0,
      fase: "poder",
      log: [{ msg: "⚔️ A batalha começa! Escolha seu poder de evolução.", t: "sistema" }],
      currentTurn: 0,
      vencedor: null,
      readyCount: 0,
    },
    events: [{ type: "game_initialized", modo }],
  };
}

/* ─────────────────────────────────────────────
   MAIN HANDLER
───────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, sessionId: rawSessionId, payload } = await req.json();

    // Auth: try to validate JWT, but allow anonymous for AI games
    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;
    if (authHeader?.startsWith("Bearer ")) {
      const authSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: authError } = await authSupabase.auth.getClaims(token);
      if (!authError && claims?.claims?.sub) {
        isAuthenticated = true;
      }
    }

    // For multiplayer, require authentication
    if (payload?.modo === "multi" && !isAuthenticated) {
      return new Response(JSON.stringify({ error: "Autenticação necessária para multiplayer" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create session on the fly if none provided (AI duels)
    let sessionId = rawSessionId;
    if (!sessionId && action === "init_game") {
      const joinCode = Math.random().toString(36).slice(2, 7).toUpperCase();
      const { data: newSess, error: sessErr } = await supabase
        .from("game_sessions")
        .insert({ join_code: joinCode, status: "waiting", state_json: {}, current_turn: 0 })
        .select("id")
        .single();
      if (sessErr) throw new Error(`Erro ao criar sessão: ${sessErr.message}`);
      sessionId = newSess.id;
    }

    let state: any = {};
    if (sessionId && action !== "init_game") {
      const { data: session } = await supabase
        .from("game_sessions")
        .select("state_json, current_turn, status")
        .eq("id", sessionId)
        .single();
      if (session?.state_json) {
        state = session.state_json;
      }
    }

    let result: any;
    switch (action) {
      case "init_game":
        result = handleInitGame(state, payload);
        break;
      case "choose_power":
        result = handleChoosePower(state, payload);
        break;
      case "play_card":
        result = handlePlayCard(state, payload);
        break;
      case "pass_turn":
        result = handlePassTurn(state, payload);
        break;
      case "combo_cards":
        result = handleComboCards(state, payload);
        break;
      default:
        return new Response(JSON.stringify({ error: "Ação desconhecida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sessionId) {
      await supabase
        .from("game_sessions")
        .update({
          state_json: result.state,
          current_turn: result.state.currentTurn || 0,
          status: result.state.fase === "resultado" ? "finished" : "active",
        })
        .eq("id", sessionId);

      for (const evt of (result.events || [])) {
        await supabase.from("game_events").insert({
          session_id: sessionId,
          player_slot: payload.slot ?? 0,
          event_type: evt.type,
          payload_json: evt,
        });
      }
    }

    return new Response(JSON.stringify({ state: result.state, events: result.events, sessionId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Engine error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});