-- Battle history table
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

CREATE INDEX IF NOT EXISTS battle_history_user_id_idx ON public.battle_history (user_id, created_at DESC);
