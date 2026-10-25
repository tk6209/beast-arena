import { CARDS, FORTE_CONTRA, FRACO_MULT, MONSTERS, SUPER_MULT } from "./data";
import { hashSeed, nextRandom } from "./rng";
import type {
  Action,
  BattleEvent,
  BattleState,
  CardDef,
  CardInstance,
  Dificuldade,
  Efetividade,
  Elemento,
  Fighter,
  Side,
  StepResult,
} from "./types";

export const MAO_INICIAL = 3;
export const COMPRA_POR_TURNO = 2;
export const MAO_MAX = 7;
export const ENERGIA_TETO = 6;
export const CHANCE_CRITICO = 0.08;
export const TURNO_LIMITE = 40;
export const HP_GLOBAL = 1.12;

export const other = (s: Side): Side => (s === "player" ? "enemy" : "player");

/* ---------------- RNG helpers (mutate the working copy only) ---------------- */

function rand(s: BattleState): number {
  const [v, next] = nextRandom(s.rng);
  s.rng = next;
  return v;
}

function shuffle<T>(s: BattleState, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------- Setup ---------------- */

export interface BattleConfig {
  seed: number;
  player: string;
  enemy: string;
  dificuldade?: Dificuldade;
}

function makeFighter(s: BattleState, monsterId: string, hpMult = 1): Fighter {
  const def = MONSTERS[monsterId];
  if (!def) throw new Error(`Monstro desconhecido: ${monsterId}`);
  const cards: CardInstance[] = [def.assinatura, ...def.deck].map((defId) => ({ uid: s.nextUid++, defId }));
  const hp = Math.round(def.hp * HP_GLOBAL * hpMult);
  return {
    monsterId,
    hp,
    hpMax: hp,
    escudo: 0,
    espinhos: 0,
    esquiva: 0,
    queimar: 0,
    veneno: 0,
    congelado: 0,
    furia: 0,
    evolucao: 0,
    energia: 0,
    energiaMax: 0,
    deck: shuffle(s, cards),
    mao: [],
    descarte: [],
    cartasJogadasNoTurno: 0,
    turnosJogados: 0,
  };
}

export function createBattle(cfg: BattleConfig): StepResult {
  const dificuldade = cfg.dificuldade ?? "normal";
  const s: BattleState = {
    seed: cfg.seed,
    rng: hashSeed(cfg.seed),
    turno: 0,
    vez: "player",
    nextUid: 1,
    // placeholder, replaced right below
    fighters: {} as Record<Side, Fighter>,
    vencedor: null,
    dificuldade,
  };
  const enemyHp = dificuldade === "facil" ? 0.85 : dificuldade === "dificil" ? 1.1 : 1;
  s.fighters = { player: makeFighter(s, cfg.player), enemy: makeFighter(s, cfg.enemy, enemyHp) };
  const events: BattleEvent[] = [];
  draw(s, "player", MAO_INICIAL, events);
  // The second player starts with one extra card to soften first-move advantage.
  draw(s, "enemy", MAO_INICIAL + 1, events);
  startTurn(s, "player", events);
  return { state: s, events };
}

/* ---------------- Queries ---------------- */

export function custoEfetivo(f: Fighter, card: CardDef): number {
  const def = MONSTERS[f.monsterId];
  if (def.passiva === "sobrecarga" && f.cartasJogadasNoTurno === 0) return Math.max(0, card.custo - 1);
  return card.custo;
}

export function podeJogar(s: BattleState, side: Side, uid: number): boolean {
  if (s.vencedor || s.vez !== side) return false;
  const f = s.fighters[side];
  const inst = f.mao.find((c) => c.uid === uid);
  if (!inst) return false;
  return custoEfetivo(f, CARDS[inst.defId]) <= f.energia;
}

export function jogaveis(s: BattleState, side: Side): CardInstance[] {
  return s.fighters[side].mao.filter((c) => podeJogar(s, side, c.uid));
}

export function efetividade(atk: Elemento, def: Elemento): Efetividade {
  if (FORTE_CONTRA[atk].includes(def)) return "super";
  if (FORTE_CONTRA[def].includes(atk)) return "fraco";
  return "normal";
}

/* ---------------- Core mechanics ---------------- */

function draw(s: BattleState, side: Side, n: number, events: BattleEvent[]) {
  const f = s.fighters[side];
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (f.mao.length >= MAO_MAX) break;
    if (f.deck.length === 0) {
      if (f.descarte.length === 0) break;
      f.deck = shuffle(s, f.descarte);
      f.descarte = [];
    }
    const c = f.deck.shift();
    if (!c) break;
    f.mao.push(c);
    drawn++;
  }
  if (drawn > 0) events.push({ e: "comprar", side, n: drawn });
}

function heal(s: BattleState, side: Side, valor: number, events: BattleEvent[]) {
  const f = s.fighters[side];
  if (f.hp <= 0) return;
  const real = Math.min(valor, f.hpMax - f.hp);
  if (real <= 0) return;
  f.hp += real;
  events.push({ e: "cura", alvo: side, valor: real });
}

function checkKo(s: BattleState, events: BattleEvent[]): boolean {
  if (s.vencedor) return true;
  for (const side of ["player", "enemy"] as Side[]) {
    if (s.fighters[side].hp <= 0) {
      s.fighters[side].hp = 0;
      events.push({ e: "ko", side });
      // If both fall at the same time (thorns/self-damage), the acting side loses.
      s.vencedor = other(side);
      return true;
    }
  }
  return false;
}

function startTurn(s: BattleState, side: Side, events: BattleEvent[]) {
  s.vez = side;
  s.turno++;
  const f = s.fighters[side];
  const def = MONSTERS[f.monsterId];
  f.turnosJogados++;
  f.cartasJogadasNoTurno = 0;

  if (f.escudo > 0 || f.espinhos > 0) events.push({ e: "escudoExpirou", side });
  f.escudo = 0;
  f.espinhos = 0;

  // Damage over time ignores shields.
  if (f.queimar > 0) {
    f.hp -= 3;
    events.push({ e: "tick", alvo: side, status: "queimar", valor: 3 });
    f.queimar--;
    if (checkKo(s, events)) return;
  }
  if (f.veneno > 0) {
    const v = f.veneno;
    f.hp -= v;
    events.push({ e: "tick", alvo: side, status: "veneno", valor: v });
    f.veneno--;
    if (checkKo(s, events)) return;
  }

  if (def.passiva === "prisma") {
    f.escudo += 6;
    events.push({ e: "passiva", side, passiva: def.passiva, texto: "+6 escudo" });
    events.push({ e: "escudo", alvo: side, valor: 6 });
  }
  if (def.passiva === "mare" && f.hp < f.hpMax) {
    events.push({ e: "passiva", side, passiva: def.passiva, texto: "+4 vida" });
    heal(s, side, 4, events);
  }

  f.energiaMax = Math.min(ENERGIA_TETO, 2 + f.turnosJogados);
  f.energia = Math.max(0, f.energiaMax - f.congelado);
  f.congelado = 0;
  events.push({ e: "inicioTurno", side, turno: s.turno, energia: f.energia });
  draw(s, side, COMPRA_POR_TURNO, events);
}

interface HitOpts {
  base: number;
  flatBonus: number;
  mult: number;
  perfura: boolean;
  rouboVida: number;
  elemento: Elemento;
  hit: number;
  hits: number;
}

function strike(s: BattleState, atkSide: Side, o: HitOpts, events: BattleEvent[]) {
  const defSide = other(atkSide);
  const a = s.fighters[atkSide];
  const d = s.fighters[defSide];
  const aDef = MONSTERS[a.monsterId];
  const dDef = MONSTERS[d.monsterId];

  if (d.esquiva > 0) {
    d.esquiva--;
    events.push({ e: "esquivou", alvo: defSide });
    return;
  }
  if (dDef.passiva === "intangivel" && rand(s) < 0.25) {
    events.push({ e: "passiva", side: defSide, passiva: "intangivel", texto: "Atravessou!" });
    events.push({ e: "esquivou", alvo: defSide });
    return;
  }

  const ef = efetividade(o.elemento, dDef.elemento);
  let mult = o.mult * aDef.forca;
  if (ef === "super") mult *= SUPER_MULT;
  if (ef === "fraco") mult *= FRACO_MULT;
  if (aDef.passiva === "modoCacador" && d.hp < d.hpMax * 0.5) mult *= 1.3;
  const critico = rand(s) < CHANCE_CRITICO;
  if (critico) mult *= 1.5;

  let dmg = Math.round((o.base + o.flatBonus) * mult);
  if (dDef.passiva === "cascaEscorregadia") dmg = Math.max(1, dmg - 3);

  let bloqueado = 0;
  if (!o.perfura && d.escudo > 0) {
    bloqueado = Math.min(d.escudo, dmg);
    d.escudo -= bloqueado;
  }
  const real = dmg - bloqueado;
  d.hp -= real;
  events.push({ e: "dano", alvo: defSide, valor: real, bloqueado, efetividade: ef, hit: o.hit, hits: o.hits, elemento: o.elemento, critico });

  if (real > 0) {
    const steal = o.rouboVida + (aDef.passiva === "vampirismo" ? 0.25 : 0);
    if (steal > 0) heal(s, atkSide, Math.max(1, Math.round(real * steal)), events);
    if (aDef.passiva === "chamaInterna" && real >= 3 && d.hp > 0) {
      d.queimar = Math.min(5, Math.max(d.queimar, 1));
      events.push({ e: "status", alvo: defSide, status: "queimar", valor: d.queimar });
    }
  }
  if (d.espinhos > 0 && real + bloqueado > 0 && d.hp > 0) {
    a.hp -= d.espinhos;
    events.push({ e: "dano", alvo: atkSide, valor: d.espinhos, bloqueado: 0, efetividade: "normal", hit: 1, hits: 1, elemento: dDef.elemento, critico: false });
  }
}

function resolveCard(s: BattleState, side: Side, card: CardDef, events: BattleEvent[]) {
  const me = s.fighters[side];
  const opSide = other(side);
  const op = s.fighters[opSide];
  const meDef = MONSTERS[me.monsterId];
  const elemento = card.elemento ?? meDef.elemento;
  let atacou = false;

  for (const fx of card.efeitos) {
    if (s.vencedor) return;
    switch (fx.t) {
      case "dano":
      case "danoSorte": {
        atacou = true;
        if (fx.t === "danoSorte" && rand(s) >= fx.chance) {
          events.push({ e: "errou", side });
          break;
        }
        const hits = fx.t === "dano" ? fx.hits ?? 1 : 1;
        let mult = 1;
        if (fx.t === "dano" && fx.bonusAbaixo && op.hp < op.hpMax * fx.bonusAbaixo.hpPct) mult *= fx.bonusAbaixo.mult;
        const primata = meDef.passiva === "furiaPrimata" && me.hp < me.hpMax * 0.5 ? 5 : 0;
        for (let h = 1; h <= hits; h++) {
          strike(
            s,
            side,
            {
              base: fx.valor,
              flatBonus: h === 1 ? me.furia + me.evolucao + primata : 0,
              mult,
              perfura: fx.t === "dano" && !!fx.perfura,
              rouboVida: fx.t === "dano" ? fx.rouboVida ?? 0 : 0,
              elemento,
              hit: h,
              hits,
            },
            events,
          );
          if (checkKo(s, events)) return;
        }
        break;
      }
      case "autoDano":
        me.hp -= fx.valor;
        events.push({ e: "dano", alvo: side, valor: fx.valor, bloqueado: 0, efetividade: "normal", hit: 1, hits: 1, elemento, critico: false });
        if (checkKo(s, events)) return;
        break;
      case "cura":
        heal(s, side, meDef.passiva === "fotossintese" ? Math.round(fx.valor * 1.5) : fx.valor, events);
        break;
      case "escudo":
        me.escudo += fx.valor;
        events.push({ e: "escudo", alvo: side, valor: fx.valor });
        break;
      case "espinhos":
        me.espinhos += fx.valor;
        events.push({ e: "espinhos", alvo: side, valor: fx.valor });
        break;
      case "esquiva":
        me.esquiva += fx.vezes;
        events.push({ e: "status", alvo: side, status: "esquiva", valor: me.esquiva });
        break;
      case "queimar":
        op.queimar = Math.min(5, op.queimar + fx.turnos);
        events.push({ e: "status", alvo: opSide, status: "queimar", valor: op.queimar });
        break;
      case "veneno":
        op.veneno = Math.min(12, op.veneno + fx.valor);
        events.push({ e: "status", alvo: opSide, status: "veneno", valor: op.veneno });
        break;
      case "congelar":
        op.congelado = Math.min(3, op.congelado + fx.energia);
        events.push({ e: "status", alvo: opSide, status: "congelar", valor: op.congelado });
        break;
      case "furia":
        me.furia += fx.valor;
        events.push({ e: "status", alvo: side, status: "furia", valor: me.furia });
        break;
      case "evoluir":
        me.evolucao += fx.valor;
        events.push({ e: "status", alvo: side, status: "evolucao", valor: me.evolucao });
        break;
      case "comprar":
        draw(s, side, fx.n, events);
        break;
      case "energia":
        me.energia += fx.n;
        events.push({ e: "energia", side, valor: me.energia });
        break;
      case "descartarInimigo": {
        let n = 0;
        for (let i = 0; i < fx.n && op.mao.length > 0; i++) {
          const idx = Math.floor(rand(s) * op.mao.length);
          op.descarte.push(...op.mao.splice(idx, 1));
          n++;
        }
        if (n > 0) events.push({ e: "descartar", side: opSide, n });
        break;
      }
    }
  }
  if (atacou) me.furia = 0;
}

/* ---------------- Public step ---------------- */

export function step(prev: BattleState, action: Action): StepResult {
  const s: BattleState = structuredClone(prev);
  const events: BattleEvent[] = [];
  if (s.vencedor) return { state: s, events };
  const side = s.vez;
  const me = s.fighters[side];

  if (action.type === "jogar") {
    const idx = me.mao.findIndex((c) => c.uid === action.uid);
    if (idx < 0) throw new Error("Carta não está na mão");
    const card = CARDS[me.mao[idx].defId];
    const custo = custoEfetivo(me, card);
    if (custo > me.energia) throw new Error("Energia insuficiente");
    me.energia -= custo;
    const [inst] = me.mao.splice(idx, 1);
    me.descarte.push(inst);
    me.cartasJogadasNoTurno++;
    events.push({ e: "jogar", side, card: card.id, uid: inst.uid });
    resolveCard(s, side, card, events);
    return { state: s, events };
  }

  events.push({ e: "fimTurno", side });
  if (s.turno >= TURNO_LIMITE) {
    // Sudden death: higher remaining HP fraction wins; ties go to the defender.
    const p = s.fighters.player.hp / s.fighters.player.hpMax;
    const e = s.fighters.enemy.hp / s.fighters.enemy.hpMax;
    const loser: Side = p > e ? "enemy" : "player";
    s.fighters[loser].hp = 0;
    events.push({ e: "ko", side: loser });
    s.vencedor = other(loser);
    return { state: s, events };
  }
  startTurn(s, other(side), events);
  return { state: s, events };
}
