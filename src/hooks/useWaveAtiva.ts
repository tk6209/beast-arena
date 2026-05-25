import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WaveRow {
  wave: number;
  nome: string;
  release_date: string;
  status: "ativo" | "pre_lancamento" | "inativo" | "futuro";
  monstro_destaque: string | null;
  tema: string | null;
}

export interface UseWaveAtiva {
  loading: boolean;
  waves: WaveRow[];
  waveAtual: WaveRow | null;
  waveNome: string;
  proximaOnda: WaveRow | null;
}

let cache: WaveRow[] | null = null;
const listeners = new Set<(rows: WaveRow[]) => void>();
let subscribed = false;

function broadcast(rows: WaveRow[]) {
  cache = rows;
  listeners.forEach((fn) => fn(rows));
}

async function fetchWaves() {
  const { data, error } = await supabase
    .from("waves")
    .select("*")
    .order("wave");
  if (error) {
    console.error("[useWaveAtiva] fetch error:", error);
    return;
  }
  broadcast((data ?? []) as WaveRow[]);
}

function ensureSubscription() {
  if (subscribed) return;
  subscribed = true;
  fetchWaves();
  supabase
    .channel("waves-global")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "waves" },
      () => fetchWaves(),
    )
    .subscribe();
}

export function useWaveAtiva(): UseWaveAtiva {
  const [waves, setWaves] = useState<WaveRow[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    ensureSubscription();
    const fn = (rows: WaveRow[]) => {
      setWaves(rows);
      setLoading(false);
    };
    listeners.add(fn);
    if (cache) {
      setWaves(cache);
      setLoading(false);
    }
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const ativas = waves.filter((w) => w.status === "ativo");
  const waveAtual =
    ativas.length > 0
      ? ativas.reduce((max, w) => (w.wave > max.wave ? w : max), ativas[0])
      : null;

  const today = new Date().toISOString().slice(0, 10);
  const preLanc = waves
    .filter((w) => w.status === "pre_lancamento" && w.release_date > today)
    .sort((a, b) => a.release_date.localeCompare(b.release_date));
  const proximaOnda = preLanc[0] ?? null;

  return {
    loading,
    waves,
    waveAtual,
    waveNome: waveAtual?.nome ?? "",
    proximaOnda,
  };
}