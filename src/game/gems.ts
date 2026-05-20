import { supabase } from "@/integrations/supabase/client";

/** Atomically award (positive) or spend (negative) gems and log transaction. */
export async function awardGems(userId: string, amount: number, reason: string): Promise<number | null> {
  if (!userId || amount === 0) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("gems")
    .eq("user_id", userId)
    .single();
  const current = prof?.gems || 0;
  const newBalance = Math.max(0, current + amount);
  if (amount < 0 && current + amount < 0) return null; // insufficient
  await supabase.from("profiles").update({ gems: newBalance }).eq("user_id", userId);
  await supabase.from("gem_transactions").insert({
    user_id: userId,
    amount,
    reason,
    balance_after: newBalance,
  });
  return newBalance;
}

export async function getGems(userId: string): Promise<number> {
  const { data } = await supabase.from("profiles").select("gems").eq("user_id", userId).single();
  return data?.gems || 0;
}