import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/game-engine`;

async function callEngine(action: string, sessionId: string | null, payload: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, sessionId, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function initGame(
  sessionId: string | null,
  modo: string,
  players: { slot: number; nome: string; monstroId: string; powerLevel?: number }[],
  dificuldade?: string,
  aiMonstroId?: string,
  playerDeck?: any[]
) {
  return callEngine("init_game", sessionId, { modo, players, dificuldade, aiMonstroId, playerDeck });
}

/** Card rewards are written by the server's authenticated battle settlement. */
/** Load player deck for a monster */
export async function loadPlayerDeck(userId: string, monstroId: string): Promise<any[] | null> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("player_decks")
    .select("cards")
    .eq("user_id", userId)
    .eq("monster_id", monstroId)
    .single();
  return (data?.cards as any[]) || null;
}

/** Save player deck */
export async function savePlayerDeck(userId: string, monstroId: string, cards: any[]): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  if (!Array.isArray(cards) || cards.length !== 10) throw new Error("O baralho deve conter exatamente 10 cartas.");
  const { error } = await supabase.from("player_decks").upsert({
    user_id: userId,
    monster_id: monstroId,
    cards,
  }, { onConflict: "user_id,monster_id" });
  if (error) throw error;
}

export async function choosePower(sessionId: string, slot: number, powerId: string) {
  return callEngine("choose_power", sessionId, { slot, powerId });
}

export async function playCard(sessionId: string, slot: number, cardId: number) {
  return callEngine("play_card", sessionId, { slot, cardId });
}

export async function passTurn(sessionId: string, slot: number) {
  return callEngine("pass_turn", sessionId, { slot });
}

export async function comboCards(sessionId: string, slot: number, cardId1: number, cardId2: number) {
  return callEngine("combo_cards", sessionId, { slot, cardId1, cardId2 });
}

export interface BattleSettlement {
  alreadyProcessed: boolean;
  coins: number;
  xp: number;
  streak: number;
  bonus?: number;
  won?: boolean;
  profile?: { coins: number; xp: number; level: number };
}

/** Idempotent settlement; game winner, loot, and rewards always come from the server. */
export async function recordBattleResult(sessionId: string): Promise<{ data: BattleSettlement }> {
  return callEngine("record_battle_result", null, { sessionId });
}

/** Idempotency key is scoped to the purchase attempt; double clicks reuse the same key. */
export async function purchaseShopItem(payload: { itemId: string; requestId: string }) {
  return callEngine("purchase_item", null, payload);
}

export async function claimDailyReward() {
  return callEngine("claim_daily_reward", null, {});
}

export async function claimMissionReward(payload: { userMissionId: string }) {
  return callEngine("claim_mission_reward", null, payload);
}

export async function getEconomyConfig(): Promise<{ data: { version: number; rules: { daily_coins: number[] } } }> {
  return callEngine("get_economy_config", null, {});
}

/** Accept a friend request: insert friendship + mark request accepted */
export async function acceptFriendRequest(payload: { requestId: string; senderId: string }): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [a, b] = [user.id, payload.senderId].sort();
  const { error: insErr } = await supabase
    .from("friendships")
    .insert({ user_a: a, user_b: b });
  if (insErr && !insErr.message.includes("duplicate")) throw insErr;
  const { error: upErr } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", payload.requestId);
  if (upErr) throw upErr;
}
