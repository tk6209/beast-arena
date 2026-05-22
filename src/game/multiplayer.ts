import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────
   MULTIPLAYER — Supabase Realtime Integration
───────────────────────────────────────────── */

export interface GameSession {
  id: string;
  join_code: string;
  status: "waiting" | "active" | "finished";
  state_json: any;
  current_turn: number;
}

export interface GamePlayer {
  id: string;
  session_id: string;
  slot: number;
  nickname: string;
  monster_id: string;
  hp: number;
  max_hp: number;
  state_json: any;
}

export interface GameEvent {
  id: string;
  session_id: string;
  player_slot: number;
  event_type: string;
  payload_json: any;
  created_at: string;
}

/* ─── Generate join code ─── */
function gerarCodigo(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/* ─── Create Session ─── */
export async function criarSessao(): Promise<GameSession> {
  const join_code = gerarCodigo();
  const { data, error } = await supabase
    .from("game_sessions")
    .insert({ join_code, status: "waiting" as any, state_json: {}, current_turn: 0 })
    .select()
    .single();
  if (error) throw new Error(`Erro ao criar sala: ${error.message}`);
  return data as unknown as GameSession;
}

/* ─── Find Session by code ─── */
export async function buscarSessao(joinCode: string): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("join_code", joinCode.toUpperCase())
    .single();
  if (error) return null;
  return data as unknown as GameSession;
}

/* ─── Update Session ─── */
export async function atualizarSessao(
  sessionId: string,
  updates: Partial<Pick<GameSession, "status" | "state_json" | "current_turn">>
): Promise<void> {
  const { error } = await supabase
    .from("game_sessions")
    .update(updates as any)
    .eq("id", sessionId);
  if (error) throw new Error(`Erro ao atualizar sala: ${error.message}`);
}

/* ─── Join as Player ─── */
export async function entrarComoJogador(
  sessionId: string,
  slot: number,
  monsterId: string,
  nickname: string = "Jogador",
  hp: number = 100,
  maxHp: number = 100,
  userId?: string
): Promise<GamePlayer> {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data: auth } = await supabase.auth.getUser();
    resolvedUserId = auth?.user?.id;
  }
  const { data, error } = await supabase
    .from("game_players")
    .insert({
      session_id: sessionId,
      slot,
      nickname,
      monster_id: monsterId,
      hp,
      max_hp: maxHp,
      state_json: resolvedUserId ? { user_id: resolvedUserId } : {},
    })
    .select()
    .single();
  if (error) throw new Error(`Erro ao entrar na sala: ${error.message}`);
  return data as unknown as GamePlayer;
}

/* ─── Get Players in Session ─── */
export async function buscarJogadores(sessionId: string): Promise<GamePlayer[]> {
  const { data, error } = await supabase
    .from("game_players")
    .select("*")
    .eq("session_id", sessionId)
    .order("slot", { ascending: true });
  if (error) return [];
  return (data || []) as unknown as GamePlayer[];
}

/* ─── Emit Game Event ─── */
export async function emitirEvento(
  sessionId: string,
  playerSlot: number,
  eventType: string,
  payload: any = {}
): Promise<void> {
  const { error } = await supabase
    .from("game_events")
    .insert({
      session_id: sessionId,
      player_slot: playerSlot,
      event_type: eventType,
      payload_json: payload,
    });
  if (error) console.error("Erro ao emitir evento:", error.message);
}

/* ─── Subscribe to Session Changes (Realtime) ─── */
export function ouvirSessao(
  sessionId: string,
  onUpdate: (session: GameSession) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`session_${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "game_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new as unknown as GameSession);
      }
    )
    .subscribe();
  return channel;
}

/* ─── Subscribe to Players joining (Realtime) ─── */
export function ouvirJogadores(
  sessionId: string,
  onInsert: (player: GamePlayer) => void,
  onUpdate?: (player: GamePlayer) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`players_${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_players",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onInsert(payload.new as unknown as GamePlayer);
      }
    );

  if (onUpdate) {
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "game_players",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new as unknown as GamePlayer);
      }
    );
  }

  channel.subscribe();
  return channel;
}

/* ─── Subscribe to Game Events (Realtime) ─── */
export function ouvirEventos(
  sessionId: string,
  onEvento: (evento: GameEvent) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`events_${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_events",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onEvento(payload.new as unknown as GameEvent);
      }
    )
    .subscribe();
  return channel;
}

/* ─── Cleanup channel ─── */
export function fecharCanal(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
