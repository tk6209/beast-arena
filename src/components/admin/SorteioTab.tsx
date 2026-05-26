import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CATALOG } from "@/game/data";
import { toast } from "@/hooks/use-toast";

type Sorteio = {
  id: string;
  titulo: string;
  tipo: string;
  item_id: string;
  item_tipo: string;
  max_ganhadores: number;
  status: string;
  ganhadores: string[];
  created_at: string;
  sorteado_em: string | null;
};

function sorteaveis() {
  const monstros = (CATALOG.monstros as any[])
    .filter((m) => m.sorteavel_admin)
    .map((m) => ({ id: m.id, nome: m.nome, emoji: m.emoji, tipo: "monstro" }));
  const swarms = (CATALOG.swarms as any[])
    .filter((s) => s.sorteavel_admin)
    .map((s) => ({ id: s.id, nome: s.nome, emoji: s.emoji, tipo: "swarm" }));
  const cartas = ((CATALOG.cartas?.lendario as any[]) ?? [])
    .filter((c) => c.sorteavel_admin)
    .map((c) => ({
      id: c.nome,
      nome: c.nome,
      emoji: c.emoji,
      tipo: "carta",
    }));
  return [...monstros, ...swarms, ...cartas];
}

export default function SorteioTab() {
  const [list, setList] = useState<Sorteio[]>([]);
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"publico" | "vip" | "exclusivo">("publico");
  const [itemKey, setItemKey] = useState("");
  const [max, setMax] = useState(10);
  const [busy, setBusy] = useState(false);

  const items = sorteaveis();

  const load = async () => {
    const { data } = await supabase
      .from("sorteios")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data ?? []) as Sorteio[]);
  };

  useEffect(() => {
    load();
  }, []);

  const criar = async () => {
    const item = items.find((i) => `${i.tipo}:${i.id}` === itemKey);
    if (!titulo || !item) {
      toast({ title: "Preencha título e item", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("sorteios").insert({
      titulo,
      tipo,
      item_id: item.id,
      item_tipo: item.tipo,
      max_ganhadores: max,
      criado_por: userData.user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sorteio criado" });
      setOpen(false);
      setTitulo("");
      setItemKey("");
      load();
    }
  };

  const sortear = async (id: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("executar-sorteio", {
      body: { sorteio_id: id },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Sorteio realizado",
        description: `${(data as any)?.total ?? 0} ganhadores`,
      });
      load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cyan-300">🎲 Sorteios</h2>
        <Button onClick={() => setOpen((o) => !o)}>+ Novo Sorteio</Button>
      </div>

      {open && (
        <div className="rounded-lg border border-cyan-500/30 bg-slate-900/70 p-4 space-y-3">
          <input
            placeholder="Título do sorteio"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-md border border-cyan-500/30 bg-slate-800 px-3 py-2 text-white"
          />
          <div className="flex gap-2">
            {(["publico", "vip", "exclusivo"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm ${
                  tipo === t
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-zinc-600 text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <select
            value={itemKey}
            onChange={(e) => setItemKey(e.target.value)}
            className="w-full rounded-md border border-cyan-500/30 bg-slate-800 px-3 py-2 text-white"
          >
            <option value="">— escolha um item sorteável —</option>
            <optgroup label="Monstros">
              {items
                .filter((i) => i.tipo === "monstro")
                .map((i) => (
                  <option key={`m:${i.id}`} value={`monstro:${i.id}`}>
                    {i.emoji} {i.nome}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Swarms">
              {items
                .filter((i) => i.tipo === "swarm")
                .map((i) => (
                  <option key={`s:${i.id}`} value={`swarm:${i.id}`}>
                    {i.emoji} {i.nome}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Cartas Lendárias">
              {items
                .filter((i) => i.tipo === "carta")
                .map((i) => (
                  <option key={`c:${i.id}`} value={`carta:${i.id}`}>
                    {i.emoji} {i.nome}
                  </option>
                ))}
            </optgroup>
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            Máx. ganhadores:
            <input
              type="number"
              min={1}
              max={50}
              value={max}
              onChange={(e) => setMax(parseInt(e.target.value) || 1)}
              className="w-20 rounded-md border border-cyan-500/30 bg-slate-800 px-2 py-1 text-white"
            />
          </label>
          <div className="flex gap-2">
            <Button onClick={criar} disabled={busy}>
              Criar
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {list.length === 0 && (
          <div className="text-center text-zinc-500 py-4">Nenhum sorteio ainda.</div>
        )}
        {list.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3"
          >
            <div className="flex-1">
              <div className="font-semibold text-white">{s.titulo}</div>
              <div className="text-xs text-zinc-400">
                {s.tipo} • {s.item_tipo}:{s.item_id} • máx {s.max_ganhadores}
              </div>
            </div>
            <div
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                s.status === "sorteado"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : s.status === "aberto"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "bg-zinc-500/20 text-zinc-300"
              }`}
            >
              {s.status.toUpperCase()}
            </div>
            {s.status === "aberto" && (
              <Button
                size="sm"
                onClick={() => sortear(s.id)}
                disabled={busy}
              >
                🎲 Sortear
              </Button>
            )}
            {s.status === "sorteado" && (
              <span className="text-xs text-emerald-400">
                {s.ganhadores?.length ?? 0} ganhadores
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}