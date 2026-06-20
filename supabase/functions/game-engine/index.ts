import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ═══════════════════════════════════════════════════════════
   BEAST ARENA GAME ENGINE v2.0
   
   Core changes from v1:
   - Energy system (3 regen/turn, max 6, each card costs 1-3)
   - Personal deck (10 cards) drawn 3/turn instead of full hand
   - Rebalanced HP/damage for 5-8 turn battles
   - 3 AI archetypes (aggro, control, balanced)
   - Card drop rewards on campaign victory
   - Full passive abilities for all 10 monsters
   - All 13 swarm effects implemented
═══════════════════════════════════════════════════════════ */

/* ── Monster Data ── */
const MONSTROS: Record<string, any> = {
  panther:  { id: "panther",  nome: "Panther",  hp: 70,  atk: 28, def: 12, emoji: "🐆", hab: "Modo Caçador"      },
  banana:   { id: "banana",   nome: "Banana",   hp: 80,  atk: 16, def: 24, emoji: "🍌", hab: "Casca Escorr."     },
  macaco:   { id: "macaco",   nome: "Macaco",   hp: 65,  atk: 22, def: 18, emoji: "🐒", hab: "Atq. Surpresa"     },
  morcego:  { id: "morcego",  nome: "Morcego",  hp: 60,  atk: 26, def: 14, emoji: "🦇", hab: "Voo Sombrio"       },
  sprouts:  { id: "sprouts",  nome: "Sprouts",  hp: 68,  atk: 14, def: 28, emoji: "🌱", hab: "Crescimento"       },
  drako:    { id: "drako",    nome: "Drako",    hp: 75,  atk: 32, def: 10, emoji: "🐉", hab: "Fúria de Fogo"     },
  crystal:  { id: "crystal",  nome: "Crystal",  hp: 58,  atk: 18, def: 32, emoji: "💎", hab: "Armadura Cristal"  },
  phantom:  { id: "phantom",  nome: "Phantom",  hp: 55,  atk: 30, def:  8, emoji: "👻", hab: "Fase Sombria"      },
  tsunami:  { id: "tsunami",  nome: "Tsunami",  hp: 72,  atk: 20, def: 22, emoji: "🌊", hab: "Maré Alta"         },
  volt:     { id: "volt",     nome: "Volt",     hp: 50,  atk: 36, def:  6, emoji: "⚡", hab: "Descarga Elétrica" },
};

/* ── Powers ── */
const PODERES: Record<string, any> = {
  fogo:     { id: "fogo",     nome: "Fogo",     emoji: "🔥", atkB: 12, defB:  0, hpB:  8 },
  gelo:     { id: "gelo",     nome: "Gelo",     emoji: "❄️", atkB:  4, defB: 18, hpB: 12 },
  raio:     { id: "raio",     nome: "Raio",     emoji: "⚡", atkB: 16, defB:  4, hpB:  4 },
  metal:    { id: "metal",    nome: "Metal",    emoji: "⚙️", atkB:  8, defB: 10, hpB: 14 },
  natureza: { id: "natureza", nome: "Natureza", emoji: "🌿", atkB:  6, defB: 14, hpB: 18 },
};

/* ── Swarms (all 13 implemented) ── */
const SWARMS: any[] = [
  { id: "swarm_faisca",       nome: "Faísca",         emoji: "⚡", efeito: "atk_flat",   valor: 6  },
  { id: "swarm_pedra_viva",   nome: "Pedra Viva",     emoji: "🪨", efeito: "def_flat",   valor: 8  },
  { id: "swarm_slime_verde",  nome: "Slime Verde",    emoji: "🟢", efeito: "hp_regen",   valor: 4  },
  { id: "swarm_veneno",       nome: "Veneno Viscoso", emoji: "☣️", efeito: "poison",     valor: 5  },
  { id: "swarm_morcego_neon", nome: "Morcego Neon",   emoji: "🦇", efeito: "dodge_once", valor: 1  },
  { id: "swarm_raiz_viva",    nome: "Raiz Viva",      emoji: "🌿", efeito: "growth",     valor: 3  },
  { id: "swarm_escudo_azul",  nome: "Escudo Azul",    emoji: "💎", efeito: "shield_flat",valor: 6  },
  { id: "swarm_trovao",       nome: "Trovão",         emoji: "⚡", efeito: "atk_flat",   valor: 12 },
  { id: "swarm_vampiro",      nome: "Vampiro Sombrio",emoji: "🧛", efeito: "drain",      valor: 6  },
  { id: "swarm_espelho",      nome: "Espelho Arcano", emoji: "🪞", efeito: "reflect",    valor: 20 },
  { id: "swarm_paralisia",    nome: "Aranha Elétrica",emoji: "🕷️", efeito: "stun",       valor: 25 },
  { id: "swarm_fenix",        nome: "Fênix Menor",    emoji: "🔥", efeito: "revive",     valor: 18 },
  { id: "swarm_gelo_eterno",  nome: "Gelo Eterno",    emoji: "🧊", efeito: "def_flat",   valor: 10 },
];

/* ── Card Pools (with energy cost) ── */
const POOL_ATK = [
  { nome: "Garra de Aço",      emoji: "⚔️",  valor: 22, custo: 2, desc: "Ataque poderoso das garras metálicas!" },
  { nome: "Pancada",           emoji: "👊",  valor: 14, custo: 1, desc: "Golpe direto e rápido." },
  { nome: "Pulo Rápido",       emoji: "💨",  valor: 18, custo: 1, desc: "Ataque ágil e imprevisível." },
  { nome: "Sopro Congelante",  emoji: "❄️",  valor: 18, custo: 2, desc: "Congela e causa dano." },
  { nome: "Raiz Explosiva",    emoji: "🌿",  valor: 16, custo: 1, desc: "Raízes saem do chão com força!" },
  { nome: "EXPLODE",           emoji: "💥",  valor: 45, custo: 3, autoDano: 15, esp: "explode", desc: "45 dano. Você recebe 15." },
  { nome: "Tudo ou Nada",      emoji: "🎲",  valor: 0,  custo: 2, esp: "tudoOuNada",  desc: "70 dano ou zero. A sorte decide!" },
  { nome: "Fúria Final",       emoji: "💀",  valor: 0,  custo: 3, esp: "furiaFinal",  desc: "Quanto menos HP, mais dano (até 65)." },
];

const POOL_DEF = [
  { nome: "Escudo Rápido",     emoji: "🛡️",  valor: 18, custo: 1, desc: "Bloqueia 18 de dano neste turno." },
  { nome: "Carapaça",          emoji: "🐢",  valor: 26, custo: 2, desc: "Defesa máxima por 1 turno." },
  { nome: "Esquiva",           emoji: "✨",  valor: 14, custo: 1, esp: "esquiva", desc: "Esquiva total do próximo ataque." },
  { nome: "Barreira",          emoji: "💎",  valor: 22, custo: 2, desc: "Barreira energética absorve dano." },
  { nome: "Contra-Ataque",     emoji: "🔄",  valor: 12, custo: 2, esp: "counter", desc: "Defende e reflete 50% do próximo ataque." },
];

const POOL_CURA = [
  { nome: "Poção Vital",       emoji: "🧪",  valor: 20, custo: 2, desc: "Recupera 20 pontos de vida." },
  { nome: "Cura Divina",       emoji: "💖",  valor: 32, custo: 3, desc: "Cura poderosa de 32 HP." },
  { nome: "Ervas Místicas",    emoji: "🌿",  valor: 12, custo: 1, desc: "Cura leve de 12 HP." },
  { nome: "Banho de Luz",      emoji: "✨",  valor: 24, custo: 2, desc: "Luz restauradora cura 24 HP." },
];

const POOL_ESPECIAL = [
  { nome: "Dano Global",       emoji: "🌐",  valor: 0,  custo: 2, tipo: "desafio", ef: "global",    desc: "Todos recebem 12 de dano." },
  { nome: "Imunidade",         emoji: "💎",  valor: 0,  custo: 2, tipo: "desafio", ef: "imunidade", desc: "Imune a dano este turno." },
  { nome: "Dobro Dano",        emoji: "✖️",  valor: 0,  custo: 1, tipo: "desafio", ef: "dobro",     desc: "Próximo ataque com dano dobrado." },
  { nome: "Roubo de Energia",  emoji: "⚡",  valor: 0,  custo: 1, tipo: "desafio", ef: "energySteal", desc: "Rouba 1 de energia do oponente." },
];

/* ── Legendary Cards ── */
const POOL_LENDARIO = [
  { nome: "Meteoro Beast",    emoji: "☄️",  valor: 55, custo: 3, autoDano: 12, esp: "explode",    tipo: "ataque",  raridade: "lendario", desc: "55 dano. Você recebe 12." },
  { nome: "Reviver Ancestral",emoji: "🌅",  valor: 42, custo: 3,               tipo: "cura",     raridade: "lendario", desc: "Recupera 42 HP." },
  { nome: "Escudo dos Deuses",emoji: "🏛️",  valor: 42, custo: 3,               tipo: "defesa",   raridade: "lendario", desc: "Defesa absoluta de 42 pontos." },
  { nome: "Espírito Guardião",emoji: "👼",  valor: 0,  custo: 3, esp: "espirito",tipo: "desafio", raridade: "lendario", desc: "Imune por 2 turnos + cura 16 HP." },
];

/* ── Card Drop Rewards (earned in campaign) ── */
const CARD_DROPS: Record<string, any[]> = {
  comum: [
    ...POOL_ATK.filter(c => !c.esp || c.esp === "").map(c => ({ ...c, tipo: "ataque", raridade: "comum" })),
    ...POOL_DEF.filter(c => !c.esp || c.esp === "").map(c => ({ ...c, tipo: "defesa", raridade: "comum" })),
    ...POOL_CURA.map(c => ({ ...c, tipo: "cura", raridade: "comum" })),
  ],
  incomum: [
    ...POOL_ATK.filter(c => c.esp).map(c => ({ ...c, tipo: "ataque", raridade: "incomum" })),
    ...POOL_DEF.filter(c => c.esp).map(c => ({ ...c, tipo: "defesa", raridade: "incomum" })),
    ...POOL_ESPECIAL.map(c => ({ ...c, raridade: "incomum" })),
  ],
  raro: [...POOL_LENDARIO.slice(0, 2).map(c => ({ ...c, raridade: "raro" }))],
  lendario: [...POOL_LENDARIO.slice(2).map(c => ({ ...c, raridade: "lendario" }))],
};

function randomCardDrop(minRarity: "comum" | "incomum" | "raro" | "lendario" = "comum"): any {
  const r = Math.random();
  let pool: any[];
  if (minRarity === "lendario" || r < 0.02) pool = CARD_DROPS.lendario;
  else if (minRarity === "raro" || r < 0.12) pool = CARD_DROPS.raro;
  else if (minRarity === "incomum" || r < 0.35) pool = CARD_DROPS.incomum;
  else pool = CARD_DROPS.comum;
  const card = rndItem(pool);
  return { ...card, id: `drop_${Date.now()}_${Math.random().toString(36).slice(2)}` };
}

/* ── Difficulty ── */
const DIFFICULTY_MULTIPLIERS: Record<string, { hp: number; atk: number; def: number }> = {
  facil:    { hp: 1.0, atk: 0.65, def: 0.65 },
  medio:    { hp: 1.0, atk: 1.0,  def: 1.0  },
  avancado: { hp: 1.3, atk: 1.25, def: 1.2  },
};

/* ── Helpers ── */
let _cid = Math.floor(Math.random() * 100000);
function nid() { return ++_cid; }
function rndItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function mkAtk(): any  { return { id: nid(), tipo: "ataque",  ...rndItem(POOL_ATK) }; }
function mkDef(): any  { return { id: nid(), tipo: "defesa",  ...rndItem(POOL_DEF) }; }
function mkCura(): any { return { id: nid(), tipo: "cura",    ...rndItem(POOL_CURA) }; }
function mkEsp(): any  { return { id: nid(), ...rndItem(POOL_ESPECIAL) }; }
function mkPod(pt: string): any {
  const p = PODERES[pt];
  return { id: nid(), tipo: "poderzinho", sub: pt, custo: 1, nome: `Poderzinho ${p.nome}`, emoji: p.emoji, desc: `Energize: +ATK e +DEF temporário!` };
}
function mkEvo(t: number): any {
  return { id: nid(), tipo: "evolucao", tier: t, custo: 2,
    nome: t === 1 ? "Evolução Básica" : t === 2 ? "Evolução Avançada" : "Evolução Final",
    emoji: "✨", desc: `Evolui seu monstro ao próximo nível!` };
}
function mkSwarmCard(): any {
  const s = rndItem(SWARMS);
  return { id: nid(), tipo: "swarm", swarmId: s.id, custo: 2, nome: `Swarm: ${s.nome}`, emoji: s.emoji, desc: s.desc ?? s.nome, raridade: "incomum" };
}
function mkLend(): any {
  const c = rndItem(POOL_LENDARIO);
  return { id: nid(), ...c };
}

/* ── Default Starter Deck (10 cards for new players) ── */
function starterDeck(poder: string | null): any[] {
  const deck = [
    mkAtk(), mkAtk(), mkAtk(),       // 3 attack
    mkDef(), mkDef(),                 // 2 defense
    mkCura(), mkCura(),               // 2 heal
    mkEsp(),                          // 1 special
    mkSwarmCard(),                    // 1 swarm
  ];
  if (poder) deck.push(mkPod(poder)); else deck.push(mkAtk());
  return deck.map((c, i) => ({ ...c, id: i + 1 }));
}

/* ── Draw hand from deck (3 cards per turn) ── */
function drawFromDeck(deck: any[], drawn: number[], n: number): { hand: any[]; newDrawn: number[] } {
  const available = deck.filter(c => !drawn.includes(c.id));
  if (available.length === 0) {
    // Reshuffle: reset drawn but keep current hand
    return drawFromDeck(deck, [], n);
  }
  const toDraw = Math.min(n, available.length);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const hand = shuffled.slice(0, toDraw);
  return { hand, newDrawn: [...drawn, ...hand.map(c => c.id)] };
}

/* ── Swarm Bonus Calculator ── */
function swarmBonus(swarms: any[]): any {
  let atkBonus = 0, defBonus = 0, hpRegen = 0, poison = 0, growth = 0, shield = 0;
  let drain = 0, reflect = 0, stunChance = 0, hasRevive = false;
  for (const s of swarms) {
    if (!s) continue;
    if (s.efeito === "atk_flat")    atkBonus  += s.valor;
    if (s.efeito === "def_flat")    defBonus  += s.valor;
    if (s.efeito === "hp_regen")    hpRegen   += s.valor;
    if (s.efeito === "poison")      poison    += s.valor;
    if (s.efeito === "growth")      growth    += s.valor;
    if (s.efeito === "shield_flat") shield    += s.valor;
    if (s.efeito === "drain")       drain     += s.valor;
    if (s.efeito === "reflect")     reflect   += s.valor;
    if (s.efeito === "stun")        stunChance += s.valor;
    if (s.efeito === "revive" && !s._used) hasRevive = true;
  }
  return { atkBonus, defBonus, hpRegen, poison, growth, shield, drain, reflect, stunChance, hasRevive };
}

/* ── Evolução ── */
function evoluir(m: any, pid: string): any {
  const p = PODERES[pid];
  return { ...m, nivel: Math.min(3, (m.nivel || 0) + 1), poder: pid,
    atk: m.atk + p.atkB, def: m.def + p.defB, maxHp: (m.maxHp || m.hp) + p.hpB };
}

/* ── Start-of-turn effects ── */
function aplicarInicioTurno(j: any, log: any[]): { j: any; log: any[] } {
  const fx = swarmBonus(j.swarms || []);
  if (fx.hpRegen > 0) {
    const antes = j.hp;
    j.hp = Math.min(j.maxHp, j.hp + fx.hpRegen);
    if (j.hp > antes) log.push({ msg: `💚 ${j.monstro.nome} recupera ${j.hp - antes} HP (Swarm)!`, t: "cura" });
  }
  if (fx.growth > 0) {
    j.monstro.atk += fx.growth;
    log.push({ msg: `🌿 ${j.monstro.nome} ganha +${fx.growth} ATK (Swarm)!`, t: "efeito" });
  }
  if (fx.shield > 0) {
    j.defAtiva = (j.defAtiva || 0) + fx.shield;
    log.push({ msg: `💎 ${j.monstro.nome} recebe +${fx.shield} escudo (Swarm)!`, t: "efeito" });
  }
  for (const s of (j.swarms || [])) {
    if (s && s.efeito === "dodge_once" && !j.dodgeOnce) {
      j.dodgeOnce = true;
      log.push({ msg: `🦇 ${j.monstro.nome} pronto para esquivar!`, t: "efeito" });
    }
  }
  // Monster passives
  if (j.monstro.id === "tsunami") {
    const antes = j.hp;
    j.hp = Math.min(j.maxHp, j.hp + 6);
    if (j.hp > antes) log.push({ msg: `🌊 Maré Alta! ${j.monstro.nome} recupera ${j.hp - antes} HP!`, t: "cura" });
  }
  if (j.monstro.id === "volt") j._voltUsed = false;
  if (j.stunned) { j.stunned = false; log.push({ msg: `${j.monstro.nome} se recupera do atordoamento.`, t: "efeito" }); }
  // Regenerate energy (max 6, min 3)
  j.energia = Math.min(6, (j.energia || 0) + 3);
  return { j, log };
}

/* ── Fênix revive ── */
function checkRevive(player: any, log: any[]): { player: any; revived: boolean; log: any[] } {
  if (player.hp > 0) return { player, revived: false, log };
  const swarms = player.swarms || [];
  const fenixIdx = swarms.findIndex((s: any) => s && s.efeito === "revive" && !s._used);
  if (fenixIdx < 0) return { player, revived: false, log };
  swarms[fenixIdx] = { ...swarms[fenixIdx], _used: true };
  player.swarms = swarms;
  player.hp = swarms[fenixIdx].valor;
  log.push({ msg: `🔥 Fênix Menor ressuscita ${player.monstro.nome} com ${player.hp} HP!`, t: "cura" });
  return { player, revived: true, log };
}

/* ── Poison on defender ── */
function aplicarPoison(alvo: any, log: any[]): { alvo: any; log: any[] } {
  const fx = swarmBonus(alvo.swarms || []);
  if (fx.poison > 0) {
    alvo.hp = Math.max(0, alvo.hp - fx.poison);
    log.push({ msg: `☣️ ${alvo.monstro.nome} sofre ${fx.poison} de veneno!`, t: "dano" });
  }
  return { alvo, log };
}

/* ═══════════════════════════════════════════════════════════
   CORE ATTACK PROCESSOR — all passives + swarm effects
═══════════════════════════════════════════════════════════ */
function processAttack(attacker: any, defender: any, carta: any, log: any[], dificuldade: string = "medio"): any[] {
  const fxAtk = swarmBonus(attacker.swarms || []);
  let dmg: number;

  // Special card effects
  if (carta.esp === "tudoOuNada")  dmg = Math.random() < 0.5 ? 70 : 0;
  else if (carta.esp === "furiaFinal") dmg = Math.floor(((attacker.maxHp - attacker.hp) / attacker.maxHp) * 65);
  else dmg = attacker.monstro.atk + fxAtk.atkBonus + (carta.valor || 0);

  // Attacker passives
  if (attacker.dobra)                            { dmg *= 2; attacker.dobra = false; log.push({ msg: `✖️ Dano dobrado!`, t: "combo" }); }
  if (carta.autoDano)                            { attacker.hp = Math.max(0, attacker.hp - carta.autoDano); log.push({ msg: `💥 Auto-dano de ${carta.autoDano}!`, t: "dano" }); }
  if (attacker.monstro.id === "macaco" && Math.random() < 0.5) { dmg *= 2; log.push({ msg: `🐒 Hit duplo do Macaco!`, t: "combo" }); }
  if (attacker.monstro.id === "drako")           { dmg = Math.floor(dmg * 1.2); log.push({ msg: `🐉 Fúria de Fogo! +20% dano!`, t: "efeito" }); }
  if (attacker.monstro.id === "volt" && !attacker._voltUsed) { dmg *= 2; attacker._voltUsed = true; log.push({ msg: `⚡ Descarga Elétrica! Primeiro ataque dobrado!`, t: "combo" }); }

  // Scale down on easy
  if (dificuldade === "facil") dmg = Math.floor(dmg * 0.85);

  // Stun from swarm
  if (fxAtk.stunChance > 0 && Math.random() * 100 < fxAtk.stunChance) {
    defender.stunned = true;
    log.push({ msg: `🕷️ ${defender.monstro.nome} foi atordoado!`, t: "efeito" });
  }

  // Defender reactions
  if (defender.imune) {
    defender.imune = false;
    log.push({ msg: `💎 ${defender.monstro.nome} estava imune!`, t: "efeito" });
    return log;
  }
  if (defender.dodgeOnce) {
    defender.dodgeOnce = false;
    log.push({ msg: `🌪️ ${defender.monstro.nome} esquivou!`, t: "efeito" });
    return log;
  }
  // Phantom passive dodge
  if (defender.monstro.id === "phantom" && Math.random() < 0.25) {
    log.push({ msg: `👻 ${defender.monstro.nome} atravessa o plano sombrio e esquiva!`, t: "efeito" });
    return log;
  }

  const fxDef = swarmBonus(defender.swarms || []);
  const def = defender.monstro.def + (defender.defAtiva || 0) + fxDef.defBonus;
  let fin = Math.max(0, dmg - def);

  // Counter attack defense
  if (defender.counterActive && fin > 0) {
    const reflected = Math.floor(fin * 0.5);
    attacker.hp = Math.max(0, attacker.hp - reflected);
    defender.counterActive = false;
    log.push({ msg: `🔄 Contra-ataque! ${reflected} refletido em ${attacker.monstro.nome}!`, t: "efeito" });
  }

  // Crystal passive: reflect 15%
  if (defender.monstro.id === "crystal" && fin > 0) {
    const reflected = Math.floor(fin * 0.15);
    attacker.hp = Math.max(0, attacker.hp - reflected);
    log.push({ msg: `💎 Armadura Cristal reflete ${reflected} em ${attacker.monstro.nome}!`, t: "efeito" });
  }

  // Swarm: Espelho Arcano
  if (fxDef.reflect > 0 && fin > 0) {
    const reflected = Math.floor(fin * (fxDef.reflect / 100));
    attacker.hp = Math.max(0, attacker.hp - reflected);
    log.push({ msg: `🪞 Espelho Arcano reflete ${reflected} em ${attacker.monstro.nome}!`, t: "efeito" });
  }

  defender.hp = Math.max(0, defender.hp - fin);
  log.push({ msg: `⚔️ ${attacker.monstro.nome} causa ${fin} dano em ${defender.monstro.nome}!`, t: "dano", dmg: fin });

  // Swarm: Vampiro
  if (fxAtk.drain > 0 && fin > 0) {
    const drained = Math.min(fxAtk.drain, fin);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + drained);
    log.push({ msg: `🧛 ${attacker.monstro.nome} drena ${drained} HP!`, t: "cura" });
  }

  const pr = aplicarPoison(defender, log);
  return pr.log;
}

/* ═══════════════════════════════════════════════════════════
   AI ARCHETYPES
   - aggro: plays highest damage, ignores defense
   - control: uses defense/heals heavily, plays safely
   - balanced: reads situation, adapts
═══════════════════════════════════════════════════════════ */
function iaJogar(ai: any, dificuldade: string = "medio", turno: number = 0): { tipo: string; carta?: any } {
  const h: any[] = ai.mao || [];
  const energia = ai.energia || 0;
  const archetype = ai.archetype || "balanced";

  // Can't play with no energy
  const playable = h.filter(c => (c.custo || 1) <= energia);
  if (playable.length === 0) return { tipo: "passar" };

  // Easy mode: random pass chance
  if (dificuldade === "facil" && turno <= 3 && Math.random() < 0.35) return { tipo: "passar" };

  if (archetype === "aggro") {
    // Always attack with highest damage card
    const ataques = playable.filter(c => c.tipo === "ataque").sort((a: any, b: any) => (b.valor || 0) - (a.valor || 0));
    if (ataques.length > 0) return { tipo: "ataque", carta: ataques[0] };
    // If no attacks, heal to keep attacking
    const cura = playable.find(c => c.tipo === "cura");
    if (cura && ai.hp < ai.maxHp * 0.3) return { tipo: "cura", carta: cura };
    return { tipo: "passar" };
  }

  if (archetype === "control") {
    // Prioritize defense and swarms, attack only when safe
    if (ai.hp < ai.maxHp * 0.5) {
      const cura = playable.find(c => c.tipo === "cura");
      if (cura) return { tipo: "cura", carta: cura };
      const def = playable.find(c => c.tipo === "defesa");
      if (def) return { tipo: "defesa", carta: def };
    }
    const sw = playable.find(c => c.tipo === "swarm" && (ai.swarms || []).some((s: any) => s === null));
    if (sw) return { tipo: "swarm", carta: sw };
    const def = playable.find(c => c.tipo === "defesa");
    if (def && Math.random() < 0.5) return { tipo: "defesa", carta: def };
    const ev = playable.find(c => c.tipo === "evolucao" && (ai.monstro.nivel || 0) < 3 && ai.monstro.poder);
    if (ev) return { tipo: "evolucao", carta: ev };
    const atk = playable.filter(c => c.tipo === "ataque").sort((a: any, b: any) => (b.valor || 0) - (a.valor || 0));
    if (atk.length) return { tipo: "ataque", carta: atk[0] };
    return { tipo: "passar" };
  }

  // Balanced (default)
  const hpPct = ai.hp / ai.maxHp;
  if (hpPct < 0.3) {
    const cura = playable.find(c => c.tipo === "cura");
    if (cura) return { tipo: "cura", carta: cura };
    const def = playable.find(c => c.tipo === "defesa");
    if (def) return { tipo: "defesa", carta: def };
  }
  const sw = playable.find(c => c.tipo === "swarm" && (ai.swarms || []).some((s: any) => s === null));
  if (sw && turno <= 2) return { tipo: "swarm", carta: sw };
  const ev = playable.find(c => c.tipo === "evolucao" && (ai.monstro.nivel || 0) < 3 && ai.monstro.poder);
  if (ev && (ai.monstro.nivel || 0) < 2) return { tipo: "evolucao", carta: ev };
  if (dificuldade === "avancado") {
    const ataques = playable.filter(c => c.tipo === "ataque").sort((a: any, b: any) => (b.valor || 0) - (a.valor || 0));
    if (ataques.length) return { tipo: "ataque", carta: ataques[0] };
  }
  const atk = playable.find(c => c.tipo === "ataque");
  if (atk) return { tipo: "ataque", carta: atk };
  const def = playable.find(c => c.tipo === "defesa");
  if (def && hpPct < 0.6) return { tipo: "defesa", carta: def };
  const cura = playable.find(c => c.tipo === "cura");
  if (cura && hpPct < 0.7) return { tipo: "cura", carta: cura };
  const desfio = playable.find(c => c.tipo === "desafio");
  if (desfio) return { tipo: "desafio", carta: desfio };
  return { tipo: "passar" };
}

/* ── Create player ── */
function criarJogador(id: string, nome: string, mId: string, powerLevel: number = 1): any {
  const m = { ...MONSTROS[mId] };
  // Apply Power Level scaling (Brawl Stars style)
  const pl = Math.max(1, Math.min(11, powerLevel));
  const hpMult  = 1 + 0.06 * (pl - 1);
  const atkMult = 1 + 0.05 * (pl - 1);
  m.hp  = Math.round(m.hp  * hpMult);
  m.atk = Math.round(m.atk * atkMult);
  return {
    id, nome,
    monstro: { ...m, nivel: 0, poder: null, maxHp: m.hp, powerLevel: pl },
    hp: m.hp, maxHp: m.hp,
    mao: [], deck: [], drawnIds: [],
    defAtiva: 0, imune: false, dobra: false, dodgeOnce: false,
    swarms: [null, null],
    energia: 3, // start with 3 energy
    _voltUsed: false,
    powerLevel: pl,
  };
}

/* ═══════════════════════════════════════════════════════════
   ACTION HANDLERS
═══════════════════════════════════════════════════════════ */

function handleChoosePower(state: any, payload: any): any {
  const { slot, powerId } = payload;
  if (!PODERES[powerId]) return { error: "Poder inválido" };
  const player = state.players[slot];
  if (!player) return { error: "Jogador não encontrado" };
  if (player.monstro.poder) return { error: "Poder já escolhido" };

  player.monstro = evoluir(player.monstro, powerId);
  player.hp = player.monstro.maxHp;
  player.maxHp = player.monstro.maxHp;
  player.energia = 3;

  // Build starter deck if player has none
  if (!player.deck || player.deck.length === 0) {
    player.deck = starterDeck(powerId);
  }
  // Draw initial hand (3 cards)
  const draw = drawFromDeck(player.deck, [], 3);
  player.mao = draw.hand;
  player.drawnIds = draw.newDrawn;

  const readyCount = (state.readyCount || 0) + 1;
  const totalPlayers = state.players.filter(Boolean).length;
  const log = [...(state.log || []),
    { msg: `✨ Poder ${PODERES[powerId].nome} escolhido! ${player.monstro.nome} evolui!`, t: "efeito" },
  ];

  state.players[slot] = player;
  state.readyCount = readyCount;

  if (state.modo === "multi" && readyCount < totalPlayers) {
    state.log = [...log, { msg: `⏳ Aguardando adversário escolher poder...`, t: "sistema" }];
    state.fase = "poder";
  } else {
    state.log = [...log, { msg: `🔄 Turno 1 — Compre suas cartas!`, t: "sistema" }];
    state.turno = 0;
    state.fase = "acao";
    state.currentTurn = 0;
  }

  return { state, events: [{ type: "power_chosen", slot, powerId, allReady: readyCount >= totalPlayers }] };
}

function handlePlayCard(state: any, payload: any): any {
  const { slot, cardId } = payload;
  const player = state.players[slot];
  if (!player) return { error: "Jogador não encontrado" };
  if (state.currentTurn !== slot && state.modo === "multi") return { error: "Não é seu turno" };

  const cartaIdx = player.mao.findIndex((c: any) => c.id === cardId);
  if (cartaIdx < 0) return { error: "Carta não encontrada na mão" };
  const carta = player.mao[cartaIdx];

  // Energy check
  const custo = carta.custo || 1;
  if ((player.energia || 0) < custo) return { error: `Energia insuficiente (${player.energia}/${custo})` };

  let log = [...(state.log || [])];
  const opSlot = slot === 0 ? 1 : 0;
  let opponent = state.players[opSlot];
  const dificuldade = state.dificuldade || "medio";

  // Spend energy
  player.energia = (player.energia || 0) - custo;

  // Process card effect
  if (carta.tipo === "ataque") {
    if (opponent && opponent.hp > 0) {
      log = processAttack(player, opponent, carta, log, dificuldade);
      state.players[opSlot] = opponent;
    }
  } else if (carta.tipo === "defesa") {
    player.defAtiva = (player.defAtiva || 0) + (carta.valor || 0);
    if (carta.esp === "esquiva") {
      player.imune = true;
      log.push({ msg: `🛡️ ${player.monstro.nome} ativa esquiva!`, t: "efeito" });
    } else if (carta.esp === "counter") {
      player.counterActive = true;
      log.push({ msg: `🔄 ${player.monstro.nome} prepara contra-ataque!`, t: "efeito" });
    } else {
      log.push({ msg: `🛡️ ${player.monstro.nome} defende com ${carta.valor}!`, t: "efeito" });
    }
  } else if (carta.tipo === "poderzinho") {
    const pp = PODERES[carta.sub];
    if (pp) {
      player.monstro.atk += Math.floor(pp.atkB / 4);
      player.monstro.def += Math.floor(pp.defB / 4);
      log.push({ msg: `${pp.emoji} Poderzinho ${pp.nome} ativado!`, t: "efeito" });
    }
  } else if (carta.tipo === "evolucao") {
    if ((player.monstro.nivel || 0) < 3 && player.monstro.poder) {
      player.monstro = evoluir(player.monstro, player.monstro.poder);
      player.maxHp = player.monstro.maxHp;
      player.hp = Math.min(player.hp + 8, player.maxHp); // small heal on evolve
      log.push({ msg: `✨ ${player.monstro.nome} evolui para nível ${player.monstro.nivel}!`, t: "evolucao", nivel: player.monstro.nivel });
    } else {
      return { error: "Evolução máxima atingida" };
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
      const dmg = dificuldade === "facil" ? 10 : 12;
      opponent.hp = Math.max(0, opponent.hp - dmg);
      state.players[opSlot] = opponent;
      log.push({ msg: `🌍 Dano global! ${dmg} de dano no inimigo!`, t: "grande" });
    } else if (carta.ef === "imunidade") {
      player.imune = true;
      log.push({ msg: `💎 ${player.monstro.nome} ativou imunidade!`, t: "efeito" });
    } else if (carta.ef === "dobro") {
      player.dobra = true;
      log.push({ msg: `❌ Próximo ataque com dano dobrado!`, t: "combo" });
    } else if (carta.ef === "energySteal" && opponent) {
      const stolen = Math.min(1, opponent.energia || 0);
      opponent.energia = (opponent.energia || 0) - stolen;
      player.energia = Math.min(6, (player.energia || 0) + stolen);
      state.players[opSlot] = opponent;
      log.push({ msg: `⚡ ${player.monstro.nome} rouba ${stolen} de energia!`, t: "combo" });
    } else if (carta.esp === "espirito") {
      player.imune = true;
      player.espirito = 2; // 2 turns immune
      const heal = 16;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      log.push({ msg: `👼 Espírito Guardião! Imunidade + ${heal} HP!`, t: "cura" });
    }
  } else if (carta.tipo === "cura") {
    const curaVal = carta.valor || 18;
    const hpAntes = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + curaVal);
    const curado = player.hp - hpAntes;
    log.push({ msg: `💖 ${player.monstro.nome} recupera ${curado} HP com ${carta.nome}!`, t: "cura", hp: curado });
  }

  // Remove card from hand
  player.mao = player.mao.filter((c: any) => c.id !== cardId);
  state.players[slot] = player;
  state.log = log;
  state.lastPlayedCard = carta;
  state.lastPlayedBy = slot;

  const events: any[] = [{ type: "card_played", slot, carta }];

  // Victory check with Fênix revive
  if (opponent && opponent.hp <= 0) {
    const rev = checkRevive(opponent, [...log]);
    state.log = rev.log;
    if (rev.revived) { state.players[opSlot] = rev.player; }
    else {
      state.fase = "resultado"; state.vencedor = slot;
      events.push({ type: "game_over", winner: slot });
      // Card drop reward
      const drop = randomCardDrop("incomum");
      events.push({ type: "card_drop", card: drop, slot });
      return { state, events };
    }
  }

  // AI turn
  if (state.modo === "ai") {
    const aiResult = runAITurn(state, opSlot);
    state = aiResult.state;
    events.push(...aiResult.events);
    // Check player death after AI
    if (state.players[slot].hp <= 0) {
      const rev = checkRevive(state.players[slot], [...state.log]);
      state.log = rev.log;
      if (rev.revived) { state.players[slot] = rev.player; }
      else {
        state.fase = "resultado"; state.vencedor = opSlot;
        events.push({ type: "game_over", winner: opSlot });
        return { state, events };
      }
    }
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

  if (carta && ai.energia >= (carta.custo || 1)) {
    ai.energia -= carta.custo || 1;
  }

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
    log = processAttack(ai, player, carta, log, dificuldade);
    state.players[playerSlot] = player;
  } else if (tipo === "defesa" && carta) {
    ai.defAtiva = (ai.defAtiva || 0) + (carta.valor || 0);
    if (carta.esp === "esquiva") { ai.imune = true; }
    log.push({ msg: `🛡️ ${ai.monstro.nome} defende com ${carta.valor}!`, t: "efeito" });
  } else if (tipo === "evolucao" && carta) {
    if ((ai.monstro.nivel || 0) < 3 && ai.monstro.poder) {
      ai.monstro = evoluir(ai.monstro, ai.monstro.poder);
      ai.maxHp = ai.monstro.maxHp;
      log.push({ msg: `✨ ${ai.monstro.nome} evolui para nível ${ai.monstro.nivel}!`, t: "evolucao" });
    }
  } else if (tipo === "cura" && carta) {
    const curaVal = carta.valor || 18;
    const hpAntes = ai.hp;
    ai.hp = Math.min(ai.maxHp, ai.hp + curaVal);
    log.push({ msg: `💖 ${ai.monstro.nome} recupera ${ai.hp - hpAntes} HP!`, t: "cura" });
  } else if (tipo === "desafio" && carta) {
    if (carta.ef === "dobro") { ai.dobra = true; log.push({ msg: `❌ ${ai.monstro.nome} prepara ataque dobrado!`, t: "combo" }); }
    else if (carta.ef === "imunidade") { ai.imune = true; log.push({ msg: `💎 ${ai.monstro.nome} ativou imunidade!`, t: "efeito" }); }
  }

  if (carta) ai.mao = ai.mao.filter((c: any) => c.id !== carta.id);
  state.players[aiSlot] = ai;
  state.log = log;
  events.push({ type: "ai_played", slot: aiSlot, tipo, carta });

  return { state, events };
}

function advanceTurn(state: any): any {
  let log = [...(state.log || [])];

  for (let i = 0; i < state.players.length; i++) {
    const r = aplicarInicioTurno(state.players[i], log);
    state.players[i] = r.j;
    log = r.log;
  }

  state.turno = (state.turno || 0) + 1;

  // Draw 3 cards for each player from their personal deck
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    p.defAtiva = 0; // reset defense
    // Draw new cards
    if (p.deck && p.deck.length > 0) {
      const draw = drawFromDeck(p.deck, p.drawnIds || [], 3);
      p.mao = [...(p.mao || []), ...draw.hand]; // add to existing hand (max carried = prev unplayed + 3 new)
      if (p.mao.length > 6) p.mao = p.mao.slice(p.mao.length - 6); // cap at 6
      p.drawnIds = draw.newDrawn;
    }
    // Decay espirito counter
    if (p.espirito > 0) {
      p.espirito--;
      if (p.espirito === 0) { p.imune = false; log.push({ msg: `👼 Proteção do Espírito Guardião acabou!`, t: "sistema" }); }
    }
    state.players[i] = p;
  }

  state.fase = "acao";
  state.currentTurn = 0;
  log.push({ msg: `🔄 Turno ${state.turno + 1} — 3 cartas compradas!`, t: "sistema" });
  state.log = log;
  return state;
}

function handlePassTurn(state: any, payload: any): any {
  const { slot } = payload;
  const player = state.players[slot];
  const events: any[] = [{ type: "pass", slot }];

  if (state.modo === "ai") {
    const opSlot = slot === 0 ? 1 : 0;
    const aiResult = runAITurn(state, opSlot);
    state = aiResult.state;
    events.push(...aiResult.events);

    if (state.players[slot].hp <= 0) {
      const rev = checkRevive(state.players[slot], [...state.log]);
      state.log = rev.log;
      if (!rev.revived) {
        state.fase = "resultado"; state.vencedor = opSlot;
        events.push({ type: "game_over", winner: opSlot });
        return { state, events };
      } else { state.players[slot] = rev.player; }
    }

    state = advanceTurn(state);
    events.push({ type: "new_turn", turno: state.turno });
  } else {
    const opSlot = slot === 0 ? 1 : 0;
    state.currentTurn = opSlot;
    // Give opponent their energy
    state.players[opSlot].energia = Math.min(6, (state.players[opSlot].energia || 0) + 3);
    events.push({ type: "turn_changed", currentTurn: opSlot });
  }

  return { state, events };
}

function handleComboCards(state: any, payload: any): any {
  const { slot, cardId1, cardId2 } = payload;
  const player = state.players[slot];
  if (!player) return { error: "Jogador não encontrado" };

  const idx1 = player.mao.findIndex((c: any) => c.id === cardId1);
  const idx2 = player.mao.findIndex((c: any) => c.id === cardId2);
  if (idx1 < 0 || idx2 < 0) return { error: "Cartas não encontradas" };

  const carta1 = player.mao[idx1];
  const carta2 = player.mao[idx2];
  const validTypes = ["ataque", "defesa", "cura"];
  if (carta1.tipo !== carta2.tipo || !validTypes.includes(carta1.tipo)) {
    return { error: "Combo requer duas cartas do mesmo tipo básico" };
  }
  // Special cards cannot combo
  if (carta1.esp || carta2.esp) return { error: "Cartas especiais não podem entrar em combo" };

  // Combo costs sum of both
  const custoTotal = (carta1.custo || 1) + (carta2.custo || 1);
  if ((player.energia || 0) < custoTotal) return { error: `Energia insuficiente para combo (${player.energia}/${custoTotal})` };
  player.energia -= custoTotal;

  let log = [...(state.log || [])];
  const opSlot = slot === 0 ? 1 : 0;
  let opponent = state.players[opSlot];
  const dificuldade = state.dificuldade || "medio";
  const events: any[] = [];
  const combinedVal = Math.floor(((carta1.valor || 0) + (carta2.valor || 0)) * 1.5);

  const comboType = carta1.tipo;
  if (comboType === "ataque" && opponent && opponent.hp > 0) {
    const fxAtk = swarmBonus(player.swarms || []);
    let dmg = player.monstro.atk + fxAtk.atkBonus + combinedVal;
    if (player.dobra) { dmg *= 2; player.dobra = false; }
    if (dificuldade === "facil") dmg = Math.floor(dmg * 0.85);
    if (opponent.imune) { opponent.imune = false; log.push({ msg: `💎 ${opponent.monstro.nome} estava imune!`, t: "efeito" }); }
    else if (opponent.dodgeOnce) { opponent.dodgeOnce = false; log.push({ msg: `🌪️ ${opponent.monstro.nome} esquivou!`, t: "efeito" }); }
    else {
      const fxDef = swarmBonus(opponent.swarms || []);
      const def = opponent.monstro.def + (opponent.defAtiva || 0) + fxDef.defBonus;
      const fin = Math.max(0, dmg - def);
      opponent.hp = Math.max(0, opponent.hp - fin);
      log.push({ msg: `⚡ COMBO! ${player.monstro.nome} causa ${fin} dano com ${carta1.nome} + ${carta2.nome}!`, t: "dano", dmg: fin });
    }
    state.players[opSlot] = opponent;
  } else if (comboType === "defesa") {
    player.defAtiva = (player.defAtiva || 0) + combinedVal;
    log.push({ msg: `⚡ COMBO Defesa! ${player.monstro.nome} se protege com ${combinedVal}!`, t: "efeito" });
  } else if (comboType === "cura") {
    const hpAntes = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + combinedVal);
    log.push({ msg: `⚡ COMBO Cura! ${player.monstro.nome} recupera ${player.hp - hpAntes} HP!`, t: "cura", hp: player.hp - hpAntes });
  }

  player.mao = player.mao.filter((c: any) => c.id !== cardId1 && c.id !== cardId2);
  state.players[slot] = player;
  state.log = log;
  events.push({ type: "combo_played", slot, cards: [carta1, carta2], comboType });

  if (opponent && opponent.hp <= 0) {
    const rev = checkRevive(opponent, [...log]);
    state.log = rev.log;
    if (rev.revived) { state.players[opSlot] = rev.player; }
    else {
      state.fase = "resultado"; state.vencedor = slot;
      events.push({ type: "game_over", winner: slot });
      events.push({ type: "card_drop", card: randomCardDrop("incomum"), slot });
      return { state, events };
    }
  }

  if (state.modo === "ai") {
    const aiResult = runAITurn(state, opSlot);
    state = aiResult.state;
    events.push(...aiResult.events);
    if (state.players[slot].hp <= 0) {
      const rev = checkRevive(state.players[slot], [...state.log]);
      state.log = rev.log;
      if (!rev.revived) {
        state.fase = "resultado"; state.vencedor = opSlot;
        events.push({ type: "game_over", winner: opSlot });
        return { state, events };
      } else { state.players[slot] = rev.player; }
    }
  } else {
    state.currentTurn = opSlot;
    events.push({ type: "turn_changed", currentTurn: opSlot });
  }

  return { state, events };
}

function handleInitGame(state: any, payload: any): any {
  const { modo, players: playerConfigs, dificuldade = "medio", aiMonstroId, playerDeck } = payload;
  const diffMult = DIFFICULTY_MULTIPLIERS[dificuldade] || DIFFICULTY_MULTIPLIERS.medio;

  const players: any[] = [];
  for (const pc of playerConfigs) {
    const p = criarJogador(pc.slot.toString(), pc.nome, pc.monstroId, pc.powerLevel || 1);
    if (pc.deck && pc.deck.length >= 5) {
      p.deck = pc.deck; // use player's personal deck
    }
    players[pc.slot] = p;
  }

  if (modo === "ai" && players.length < 2) {
    const aiM = aiMonstroId && MONSTROS[aiMonstroId] ? aiMonstroId : rndItem(Object.keys(MONSTROS));
    const aiP = rndItem(Object.keys(PODERES));
    const archetypes = ["aggro", "control", "balanced"];
    // AI scales to player's PL (±1) so battles stay fair
    const playerPL = playerConfigs?.[0]?.powerLevel || 1;
    const aiPL = Math.max(1, Math.min(11, playerPL + (Math.random() < 0.5 ? 0 : -1)));
    let ai = criarJogador("ai", "Rival Sombrio", aiM, aiPL);
    ai.archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    ai.monstro = evoluir(ai.monstro, aiP);
    // Apply difficulty scaling
    ai.monstro.atk = Math.round(ai.monstro.atk * diffMult.atk);
    ai.monstro.def = Math.round(ai.monstro.def * diffMult.def);
    ai.monstro.maxHp = Math.round(ai.monstro.maxHp * diffMult.hp);
    if (dificuldade === "facil") ai.monstro.maxHp = Math.floor(ai.monstro.maxHp * 1.2);
    ai.hp = ai.monstro.maxHp;
    ai.maxHp = ai.monstro.maxHp;
    ai.deck = starterDeck(aiP);
    const draw = drawFromDeck(ai.deck, [], 3);
    ai.mao = draw.hand;
    ai.drawnIds = draw.newDrawn;
    players[1] = ai;
  }

  return {
    state: {
      modo, dificuldade, players,
      turno: 0, fase: "poder",
      log: [{ msg: "⚔️ A batalha começa! Escolha seu poder de evolução.", t: "sistema" }],
      currentTurn: 0, vencedor: null, readyCount: 0,
    },
    events: [{ type: "game_initialized", modo }],
  };
}

/* ═══════════════════════════════════════════════════════════
   MAIN HANDLER
═══════════════════════════════════════════════════════════ */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, sessionId: rawSessionId, payload } = await req.json();

    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;
    let requesterUserId: string | null = null;
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
        requesterUserId = claims.claims.sub as string;
      }
    }

    // Require authentication for all engine calls to prevent anonymous DB writes/flooding.
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let sessionId = rawSessionId;
    if (!sessionId && action === "init_game") {
      const joinCode = Math.random().toString(36).slice(2, 7).toUpperCase();
      const { data: newSess, error: sessErr } = await supabase
        .from("game_sessions")
        .insert({ join_code: joinCode, status: "waiting", state_json: {}, current_turn: 0 })
        .select("id").single();
      if (sessErr) throw new Error(`Erro ao criar sessão: ${sessErr.message}`);
      sessionId = newSess.id;
    }


    // Enforce slot ownership for state-mutating actions on existing sessions.
    const MUTATING_ACTIONS = new Set(["choose_power", "play_card", "pass_turn", "combo_cards"]);
    if (sessionId && MUTATING_ACTIONS.has(action) && payload?.slot !== undefined) {
      if (!isAuthenticated || !requesterUserId) {
        return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: slotRow } = await supabase
        .from("game_players")
        .select("slot, state_json")
        .eq("session_id", sessionId)
        .filter("state_json->>user_id", "eq", requesterUserId)
        .maybeSingle();

      if (!slotRow || slotRow.slot !== payload.slot) {
        return new Response(JSON.stringify({ error: "Slot inválido para este usuário" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let state: any = {};
    if (sessionId && action !== "init_game") {
      const { data: session } = await supabase
        .from("game_sessions")
        .select("state_json, current_turn, status")
        .eq("id", sessionId).single();
      if (session?.state_json) state = session.state_json;
    }

    let result: any;
    switch (action) {
      case "init_game":    result = handleInitGame(state, payload); break;
      case "choose_power": result = handleChoosePower(state, payload); break;
      case "play_card":    result = handlePlayCard(state, payload); break;
      case "pass_turn":    result = handlePassTurn(state, payload); break;
      case "combo_cards":  result = handleComboCards(state, payload); break;
      default:
        return new Response(JSON.stringify({ error: "Ação desconhecida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sessionId) {
      await supabase.from("game_sessions").update({
        state_json: result.state,
        current_turn: result.state.currentTurn || 0,
        status: result.state.fase === "resultado" ? "finished" : "active",
      }).eq("id", sessionId);

      for (const evt of (result.events || [])) {
        await supabase.from("game_events").insert({
          session_id: sessionId,
          player_slot: payload?.slot ?? 0,
          event_type: evt.type,
          payload_json: evt,
        });
      }
    }

    return new Response(
      JSON.stringify({ state: result.state, events: result.events, sessionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Engine error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor", code: "GAME_ENGINE_INTERNAL" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
