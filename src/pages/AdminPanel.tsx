import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import WavesTab from "@/components/admin/WavesTab";
import SorteioTab from "@/components/admin/SorteioTab";
import ConteudoTab from "@/components/admin/ConteudoTab";

type Aba = "ondas" | "sorteios" | "conteudo";

export default function AdminPanel() {
  const { isAdmin, loading } = useUserRole();
  const [aba, setAba] = useState<Aba>("ondas");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d2137] flex items-center justify-center text-cyan-300">
        Carregando…
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs: { id: Aba; label: string }[] = [
    { id: "ondas", label: "📅 Ondas" },
    { id: "sorteios", label: "🎲 Sorteios" },
    { id: "conteudo", label: "🃏 Conteúdo" },
  ];

  return (
    <div className="min-h-screen bg-[#0d2137] text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-300 mb-6" style={{ fontFamily: "Bangers, sans-serif", letterSpacing: 2 }}>
          ⚙️ Admin · Beast Arena
        </h1>
        <div className="flex gap-2 mb-6 border-b border-cyan-500/20">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                aba === t.id
                  ? "border-b-2 border-cyan-400 text-cyan-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {aba === "ondas" && <WavesTab />}
        {aba === "sorteios" && <SorteioTab />}
        {aba === "conteudo" && <ConteudoTab />}
      </div>
    </div>
  );
}