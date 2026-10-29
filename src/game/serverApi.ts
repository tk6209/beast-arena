import { supabase } from "@/integrations/supabase/client";
import { requireVerifiedEconomy } from './economyAvailability';
import { runDemoAction } from './demoEngine';

const demoSessions = new Map<string, any>();
// Staging opt-in only. Production stays in the existing quarantine by default.
const TRUSTED_ECONOMY_ENABLED = import.meta.env.VITE_BEAST_TRUSTED_ECONOMY === 'true';
function assertEconomyCutover(){ if(!TRUSTED_ECONOMY_ENABLED) requireVerifiedEconomy(); }

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "ftlwkkjjpkocklaajavh"}.supabase.co`}/functions/v1/game-engine`;

async function callEngine(action: string, sessionId: string | null, payload: any): Promise<any> {
  if (sessionId?.startsWith('demo:')) {
    const state = demoSessions.get(sessionId);
    if (!state) throw new Error('Partida demonstrativa expirada. Inicie novamente.');
    if (state.fase === 'resultado') throw new Error('Partida já encerrada.');
    const result = runDemoAction(action, state, payload);
    if (result.error) throw new Error(result.error);
    demoSessions.set(sessionId, result.state);
    // Never imply the demo grants a collection card.
    return { ...result, events: result.events.filter((e: any) => e.type !== 'card_drop'), sessionId };
  }
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
  if (!sessionId && modo === 'ai') {
    if (TRUSTED_ECONOMY_ENABLED) {
      const {data:{session}}=await supabase.auth.getSession();
      if (session?.access_token) return callEngine('init_game',null,{modo,players,dificuldade,aiMonstroId});
    }
    const demoId = `demo:${crypto.randomUUID()}`;
    const result = runDemoAction('init_game', {}, {
      modo: 'ai', dificuldade, aiMonstroId,
      players: players.map(p => ({ slot: p.slot, nome: p.nome, monstroId: p.monstroId, powerLevel: 1 })),
    });
    demoSessions.set(demoId, result.state);
    return { ...result, sessionId: demoId, rewardEligible: false };
  }
  // Current production is quarantined; staging can validate only the trusted server contract.
  assertEconomyCutover();
  return callEngine('init_game',sessionId,{modo,players,dificuldade,aiMonstroId});
}

/** Save a card earned in battle to user collection */
// Card drops are granted only by verified session settlement. No client method.
/** Legacy compatibility: an untrusted caller can NEVER mint a card. */
export async function saveCardDrop(_userId: string, _card: unknown): Promise<void> {
  requireVerifiedEconomy();
}


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
  if(!Array.isArray(cards)||cards.length!==10)throw new Error("O deck deve conter 10 cartas.");
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

export interface SettlementReceipt {
  coins:number;xp:number;streak:number;bonus?:number;alreadyProcessed:boolean;
  profile?:{coins:number;xp:number;level:number};
}
export async function recordBattleResult(payload:{sessionId:string}):Promise<{data:SettlementReceipt}>{
  assertEconomyCutover();
  return callEngine("record_battle_result",null,{sessionId:payload.sessionId});
}
export async function purchaseShopItem(payload:{itemId:string;requestId:string}):Promise<{data:{coins:number;itemId:string}}>{
  assertEconomyCutover();
  return callEngine("purchase_item",null,payload);
}
export async function claimDailyReward():Promise<{data:{alreadyClaimed:boolean;coins:number;streak:number}}>{
  assertEconomyCutover();
  return callEngine("claim_daily_reward",null,{});
}
export async function claimMissionReward(payload:{userMissionId:string}):Promise<{data:{coins:number;xp:number}}>{
  assertEconomyCutover();
  return callEngine("claim_mission_reward",null,payload);
}
export async function getEconomyConfig():Promise<{data:{version:number;rules:{daily_coins:number[]}}}>{
  assertEconomyCutover();
  return callEngine("get_economy_config",null,{});
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
