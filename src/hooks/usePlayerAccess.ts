import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MONSTROS_LISTA, SWARMS, type MonstroData, type SwarmData } from "@/game/data";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Combina status do catálogo + early_access_items do jogador.
 * - admin / moderador: vê TUDO (todos os status)
 * - jogador / jogador_vip: vê só ativos + itens que ele ganhou em sorteios
 */
export function usePlayerAccess() {
  const { isAdmin, isMod, loading: loadingRole } = useUserRole();
  const [earlyItemIds, setEarlyItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) {
        if (mounted) {
          setEarlyItemIds(new Set());
          setLoading(false);
        }
        return;
      }
      const { data: rows } = await supabase
        .from("early_access_items")
        .select("item_id, expira_em")
        .eq("user_id", uid);
      if (!mounted) return;
      const now = new Date();
      const ids = new Set(
        (rows ?? [])
          .filter((r: any) => !r.expira_em || new Date(r.expira_em) > now)
          .map((r: any) => r.item_id as string),
      );
      setEarlyItemIds(ids);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const seeAll = isAdmin || isMod;

  const canUse = (itemId: string, status?: string) => {
    if (seeAll) return true;
    if (status === "ativo") return true;
    return earlyItemIds.has(itemId);
  };

  const monstrosDisponiveis: MonstroData[] = MONSTROS_LISTA.filter((m) =>
    canUse(m.id, m.status),
  );
  const swarmsDisponiveis: SwarmData[] = SWARMS.filter((s) =>
    canUse(s.id, s.status),
  );

  return {
    loading: loading || loadingRole,
    monstrosDisponiveis,
    swarmsDisponiveis,
    canUse,
    seeAll,
    isAdmin,
    isMod,
  };
}