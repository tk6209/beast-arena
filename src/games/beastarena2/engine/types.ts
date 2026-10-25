// Beast Arena V2 — engine types. Pure data, no DOM, no randomness outside the seeded RNG.

export type Elemento = "fogo" | "agua" | "natureza" | "raio" | "sombra" | "cristal";
export type Side = "player" | "enemy";
export type Raridade = "comum" | "raro" | "epico" | "assinatura";

export type CardKind = "ataque" | "defesa" | "suporte";

/** One effect step of a card. Cards resolve their steps in order. */
export type Effect =
  | { t: "dano"; valor: number; hits?: number; perfura?: boolean; rouboVida?: number; bonusAbaixo?: { hpPct: number; mult: number } }
  | { t: "danoSorte"; valor: number; chance: number }
  | { t: "autoDano"; valor: number }
  | { t: "cura"; valor: number }
  | { t: "escudo"; valor: number }
  | { t: "espinhos"; valor: number }
  | { t: "esquiva"; vezes: number }
  | { t: "queimar"; turnos: number }
  | { t: "veneno"; valor: number }
  | { t: "congelar"; energia: number }
  | { t: "furia"; valor: number }
  | { t: "evoluir"; valor: number }
  | { t: "comprar"; n: number }
  | { t: "energia"; n: number }
  | { t: "descartarInimigo"; n: number };

export interface CardDef {
  id: string;
  nome: string;
  custo: number;
  kind: CardKind;
  raridade: Raridade;
  /** Element of the card's attacks. Undefined = uses the monster's element. */
  elemento?: Elemento;
  efeitos: Effect[];
  texto: string;
  /** Art key: card art id or monster id for signature cards. */
  arte: string;
}

export type PassivaId =
  | "chamaInterna"
  | "modoCacador"
  | "sobrecarga"
  | "mare"
  | "intangivel"
  | "prisma"
  | "fotossintese"
  | "cascaEscorregadia"
  | "furiaPrimata"
  | "vampirismo";

export interface MonsterDef {
  id: string;
  nome: string;
  elemento: Elemento;
  hp: number;
  /** Multiplier applied to card damage. */
  forca: number;
  passiva: PassivaId;
  passivaNome: string;
  passivaTexto: string;
  assinatura: string;
  deck: string[];
  cor: string;
  cor2: string;
  titulo: string;
}

export interface CardInstance {
  uid: number;
  defId: string;
}

export interface Fighter {
  monsterId: string;
  hp: number;
  hpMax: number;
  escudo: number;
  espinhos: number;
  esquiva: number;
  queimar: number;
  veneno: number;
  congelado: number;
  furia: number;
  evolucao: number;
  energia: number;
  energiaMax: number;
  deck: CardInstance[];
  mao: CardInstance[];
  descarte: CardInstance[];
  cartasJogadasNoTurno: number;
  turnosJogados: number;
}

export type Dificuldade = "facil" | "normal" | "dificil";

export interface BattleState {
  seed: number;
  rng: number;
  turno: number;
  vez: Side;
  nextUid: number;
  fighters: Record<Side, Fighter>;
  vencedor: Side | null;
  dificuldade: Dificuldade;
}

export type Action = { type: "jogar"; uid: number } | { type: "passar" };

export type Efetividade = "super" | "fraco" | "normal";

export type BattleEvent =
  | { e: "inicioTurno"; side: Side; turno: number; energia: number }
  | { e: "jogar"; side: Side; card: string; uid: number }
  | { e: "dano"; alvo: Side; valor: number; bloqueado: number; efetividade: Efetividade; hit: number; hits: number; elemento: Elemento; critico: boolean }
  | { e: "esquivou"; alvo: Side }
  | { e: "errou"; side: Side }
  | { e: "cura"; alvo: Side; valor: number }
  | { e: "escudo"; alvo: Side; valor: number }
  | { e: "espinhos"; alvo: Side; valor: number }
  | { e: "status"; alvo: Side; status: "queimar" | "veneno" | "congelar" | "esquiva" | "furia" | "evolucao"; valor: number }
  | { e: "tick"; alvo: Side; status: "queimar" | "veneno"; valor: number }
  | { e: "comprar"; side: Side; n: number }
  | { e: "energia"; side: Side; valor: number }
  | { e: "descartar"; side: Side; n: number }
  | { e: "passiva"; side: Side; passiva: PassivaId; texto: string }
  | { e: "escudoExpirou"; side: Side }
  | { e: "ko"; side: Side }
  | { e: "fimTurno"; side: Side };

export interface StepResult {
  state: BattleState;
  events: BattleEvent[];
}
