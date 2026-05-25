import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string }> = {
  ativo: {
    label: "ATIVO",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/60",
  },
  pre_lancamento: {
    label: "PRÉ-LANÇAMENTO",
    className: "bg-sky-500/20 text-sky-300 border-sky-400/60",
  },
  inativo: {
    label: "INATIVO",
    className: "bg-zinc-500/20 text-zinc-300 border-zinc-400/60",
  },
  futuro: {
    label: "FUTURO",
    className: "bg-purple-500/20 text-purple-300 border-purple-400/60",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  if (!status) return null;
  const m = MAP[status] ?? MAP.futuro;
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-[10px] font-bold tracking-wider border",
        m.className,
        className,
      )}
    >
      {m.label}
    </Badge>
  );
}