import type { Dificuldade } from "../engine/types";

export interface Progress {
  vitorias: number;
  derrotas: number;
  sequencia: number;
  melhorSequencia: number;
  porMonstro: Record<string, number>;
  ultimoMonstro: string;
  dificuldade: Dificuldade;
}

const KEY = "ba2.progress.v1";

export const PROGRESS_INICIAL: Progress = {
  vitorias: 0,
  derrotas: 0,
  sequencia: 0,
  melhorSequencia: 0,
  porMonstro: {},
  ultimoMonstro: "drako",
  dificuldade: "normal",
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...PROGRESS_INICIAL };
    return { ...PROGRESS_INICIAL, ...JSON.parse(raw) };
  } catch {
    return { ...PROGRESS_INICIAL };
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress stays in memory */
  }
}

export function registrarResultado(p: Progress, monstro: string, vitoria: boolean): Progress {
  const seq = vitoria ? p.sequencia + 1 : 0;
  return {
    ...p,
    vitorias: p.vitorias + (vitoria ? 1 : 0),
    derrotas: p.derrotas + (vitoria ? 0 : 1),
    sequencia: seq,
    melhorSequencia: Math.max(p.melhorSequencia, seq),
    porMonstro: vitoria ? { ...p.porMonstro, [monstro]: (p.porMonstro[monstro] ?? 0) + 1 } : p.porMonstro,
  };
}
