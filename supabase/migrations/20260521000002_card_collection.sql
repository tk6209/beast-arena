-- User card collection table
CREATE TABLE IF NOT EXISTS public.user_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_key TEXT NOT NULL,         -- unique card identifier (nome + tipo)
  card_data JSONB NOT NULL,       -- full card definition
  quantity INTEGER NOT NULL DEFAULT 1,
  raridade TEXT NOT NULL DEFAULT 'comum',
  obtained_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_key)
);

ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON public.user_cards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cards"
  ON public.user_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON public.user_cards FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_cards_user_id_idx ON public.user_cards (user_id);

-- Player decks table
CREATE TABLE IF NOT EXISTS public.player_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monster_id TEXT NOT NULL,       -- deck is per monster
  name TEXT NOT NULL DEFAULT 'Deck Principal',
  cards JSONB NOT NULL DEFAULT '[]', -- array of card data
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, monster_id)
);

ALTER TABLE public.player_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own decks"
  ON public.player_decks FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS player_decks_user_id_idx ON public.player_decks (user_id);

-- Trigger for updated_at
CREATE TRIGGER update_player_decks_updated_at
  BEFORE UPDATE ON public.player_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
