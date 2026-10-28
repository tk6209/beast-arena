import { supabase } from "@/integrations/supabase/client";
import { requireVerifiedEconomy } from './economyAvailability';

/** Disabled until a trusted atomic server event exists. */
export async function awardGems(userId: string, amount: number, reason: string): Promise<number | null> {
  requireVerifiedEconomy();
}

export async function getGems(userId: string): Promise<number> {
  const { data } = await supabase.from("profiles").select("gems").eq("user_id", userId).single();
  return data?.gems || 0;
}