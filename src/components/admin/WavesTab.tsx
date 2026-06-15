import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/hooks/use-toast";

type WaveRow = {
  wave: number;
  nome: string;
  release_date: string;
  status: string;
  monstro_destaque: string | null;
  tema: string | null;
};

const STATUSES = ["ativo", "pre_lancamento", "inativo", "futuro"];

export default function WavesTab() {
  const [rows, setRows] = useState<WaveRow[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const { data } = await supabase.from("waves").select("*").order("wave");
    setRows((data ?? []) as WaveRow[]);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (wave: number, status: string) => {
    setBusy(wave);
    const { error } = await supabase
      .from("waves")
      .update({ status })
      .eq("wave", wave);
    setBusy(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Onda atualizada", description: `Wave ${wave} → ${status}` });
      load();
    }
  };

  const ativarAgora = (wave: number) => updateStatus(wave, "ativo");

  const rodarCron = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("activate-waves", {
        method: "POST",
      });
      if (error) throw error;
      toast({
        title: "Cron executado",
        description: `Ativadas: ${data.activated} • Pré-lançamento: ${data.pre_launched}`,
      });
      load();
    } catch (e: any) {
      toast({ title: "Erro no cron", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cyan-300">📅 Ondas (Waves)</h2>
        <Button onClick={rodarCron} variant="outline">
          ▶ Rodar cron agora
        </Button>
      </div>

      <div className="grid gap-2">
        {rows.map((w) => (
          <div
            key={w.wave}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3"
          >
            <div className="w-10 text-center font-bold text-cyan-400">
              #{w.wave}
            </div>
            <div className="flex-1 min-w-[160px]">
              <div className="font-semibold text-white">{w.nome}</div>
              <div className="text-xs text-zinc-400">
                {w.release_date} {w.tema && `• ${w.tema}`}{" "}
                {w.monstro_destaque && `• ⭐ ${w.monstro_destaque}`}
              </div>
            </div>
            <StatusBadge status={w.status} />
            <select
              className="rounded-md border border-cyan-500/30 bg-slate-800 px-2 py-1 text-sm text-white"
              value={w.status}
              disabled={busy === w.wave}
              onChange={(e) => updateStatus(w.wave, e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {w.status !== "ativo" && (
              <Button
                size="sm"
                onClick={() => ativarAgora(w.wave)}
                disabled={busy === w.wave}
              >
                Ativar agora
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}