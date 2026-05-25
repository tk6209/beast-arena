import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "moderador" | "jogador_vip" | "jogador";

export function useUserRole() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (userId: string | null) => {
      if (!userId) {
        if (mounted) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (mounted) {
        setRoles((data ?? []).map((r: any) => r.role as Role));
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      load(data.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = roles.includes("admin");
  const isMod = roles.includes("moderador");
  const isVip = roles.includes("jogador_vip");
  const role: Role = isAdmin
    ? "admin"
    : isMod
    ? "moderador"
    : isVip
    ? "jogador_vip"
    : "jogador";

  return { roles, role, loading, isAdmin, isMod, isVip };
}