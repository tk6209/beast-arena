import { supabase } from "@/integrations/supabase/client";

/** XP Boost multiplier (e.g. 2x). Could vary per item_key in the future. */
const BOOST_MULTIPLIER: Record<string, number> = {
  xp_boost_2x: 2,
  default: 2,
};

export interface XpBoostStatus {
  active: boolean;
  multiplier: number;
  remaining: number;
  itemKey: string | null;
}

export async function getActiveXpBoost(userId: string): Promise<XpBoostStatus> {
  if (!userId) return { active: false, multiplier: 1, remaining: 0, itemKey: null };
  const { data } = await supabase
    .from("user_inventory")
    .select("item_key, quantity")
    .eq("user_id", userId)
    .eq("item_type", "xp_boost")
    .gt("quantity", 0)
    .order("acquired_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { active: false, multiplier: 1, remaining: 0, itemKey: null };
  const mult = BOOST_MULTIPLIER[data.item_key] || BOOST_MULTIPLIER.default;
  return { active: true, multiplier: mult, remaining: data.quantity, itemKey: data.item_key };
}

/** Consume one charge of the active boost. Returns new remaining or null. */
export async function consumeXpBoost(userId: string): Promise<number | null> {
  const status = await getActiveXpBoost(userId);
  if (!status.active || !status.itemKey) return null;
  const newQty = Math.max(0, status.remaining - 1);
  await supabase
    .from("user_inventory")
    .update({ quantity: newQty })
    .eq("user_id", userId)
    .eq("item_type", "xp_boost")
    .eq("item_key", status.itemKey);
  return newQty;
}
