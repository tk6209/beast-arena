import { ChevronLeft, Sparkles } from "lucide-react";
import UniverseMark from "./UniverseMark";

interface UniverseBackLinkProps {
  label?: string;
  className?: string;
}

export default function UniverseBackLink({ label = "Capiverso", className = "" }: UniverseBackLinkProps) {
  return (
    <a
      href="/"
      className={`group inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white/80 shadow-lg backdrop-blur-md transition hover:border-cyan-300/50 hover:bg-black/65 hover:text-white ${className}`}
      aria-label={`Voltar para ${label}`}
    >
      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
      <UniverseMark compact />
    </a>
  );
}
