-- ============ battle_history ============
CREATE TABLE IF NOT EXISTS public.battle_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  won BOOLEAN NOT NULL DEFAULT false,
  monster_used TEXT NOT NULL DEFAULT 'panther',
  opponent_monster TEXT,
  damage_dealt INTEGER NOT NULL DEFAULT 0,
  cards_played INTEGER NOT NULL DEFAULT 0,
  turns INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'ai',
  dificuldade TEXT NOT NULL DEFAULT 'medio',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own battle history"
  ON public.battle_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battle history"
  ON public.battle_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS battle_history_user_id_idx
  ON public.battle_history (user_id, created_at DESC);

-- ============ user_cards ============
CREATE TABLE IF NOT EXISTS public.user_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_key TEXT NOT NULL,
  card_data JSONB NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  raridade TEXT NOT NULL DEFAULT 'comum',
  obtained_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_key)
);

ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON public.user_cards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON public.user_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON public.user_cards FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_cards_user_id_idx ON public.user_cards (user_id);

-- ============ player_decks ============
CREATE TABLE IF NOT EXISTS public.player_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monster_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Deck Principal',
  cards JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, monster_id)
);

ALTER TABLE public.player_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decks"
  ON public.player_decks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON public.player_decks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON public.player_decks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON public.player_decks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS player_decks_user_id_idx ON public.player_decks (user_id);

DROP TRIGGER IF EXISTS update_player_decks_updated_at ON public.player_decks;
CREATE TRIGGER update_player_decks_updated_at
  BEFORE UPDATE ON public.player_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();