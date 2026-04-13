
-- Create game session status enum
CREATE TYPE public.game_status AS ENUM ('waiting', 'active', 'finished');

-- Game sessions table
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  join_code TEXT NOT NULL UNIQUE,
  status public.game_status NOT NULL DEFAULT 'waiting',
  state_json JSONB DEFAULT '{}',
  current_turn INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Game players table
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot IN (0, 1)),
  nickname TEXT NOT NULL DEFAULT 'Jogador',
  monster_id TEXT NOT NULL,
  hp INTEGER NOT NULL DEFAULT 100,
  max_hp INTEGER NOT NULL DEFAULT 100,
  state_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (session_id, slot)
);

-- Game events table
CREATE TABLE public.game_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_slot INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- RLS: game_sessions (anonymous multiplayer - open access)
CREATE POLICY "Anyone can view game sessions" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create game sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game sessions" ON public.game_sessions FOR UPDATE USING (true);

-- RLS: game_players
CREATE POLICY "Anyone can view game players" ON public.game_players FOR SELECT USING (true);
CREATE POLICY "Anyone can join as game player" ON public.game_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game players" ON public.game_players FOR UPDATE USING (true);

-- RLS: game_events
CREATE POLICY "Anyone can view game events" ON public.game_events FOR SELECT USING (true);
CREATE POLICY "Anyone can create game events" ON public.game_events FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_players_updated_at
  BEFORE UPDATE ON public.game_players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
