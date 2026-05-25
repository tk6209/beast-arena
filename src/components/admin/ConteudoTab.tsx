import { CATALOG } from "@/game/data";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function ConteudoTab() {
  const monstros = CATALOG.monstros as any[];
  const swarms = CATALOG.swarms as any[];
  const counts = {
    ativo: monstros.filter((m) => m.status === "ativo").length,
    pre: monstros.filter((m) => m.status === "pre_lancamento").length,
    inativo: monstros.filter((m) => m.status === "inativo").length,
    futuro: monstros.filter((m) => m.status === "futuro").length,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-cyan-300">🃏 Conteúdo do Catálogo</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3 text-center">
            <div className="text-3xl font-bold text-cyan-300">{v}</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400">{k}</div>
          </div>
        ))}
      </div>
      <div className="text-sm text-zinc-400">
        Total: <strong>{monstros.length}</strong> monstros · <strong>{swarms.length}</strong> swarms
      </div>
      <div className="grid gap-1.5 max-h-96 overflow-y-auto">
        {monstros.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm border-b border-zinc-800 py-1.5">
            <span className="w-6">{m.emoji}</span>
            <span className="flex-1 text-white">{m.nome}</span>
            <span className="text-xs text-zinc-500">W{m.wave}</span>
            <StatusBadge status={m.status} />
          </div>
        ))}
      </div>
    </div>
  );
}