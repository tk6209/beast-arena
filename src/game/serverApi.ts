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

export async function initGame(sessionId: string | null, modo: string, players: { slot: number; nome: string; monstroId: string }[], dificuldade?: string, aiMonstroId?: string) {
  return callEngine("init_game", sessionId, { modo, players, dificuldade, aiMonstroId });
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
