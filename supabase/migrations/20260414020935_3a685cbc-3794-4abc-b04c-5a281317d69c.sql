
-- Matchmaking queue
CREATE TABLE public.matchmaking_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  monster_id TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medio',
  player_name TEXT NOT NULL DEFAULT 'Jogador',
  league TEXT NOT NULL DEFAULT 'bronze',
  rating INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'waiting',
  matched_session_id UUID REFERENCES public.game_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leagues / ranking
CREATE TABLE public.player_leagues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  league TEXT NOT NULL DEFAULT 'bronze',
  rating INTEGER NOT NULL DEFAULT 1000,
  season INTEGER NOT NULL DEFAULT 1,
  season_wins INTEGER NOT NULL DEFAULT 0,
  season_losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Season pass progress
CREATE TABLE public.season_pass (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  season INTEGER NOT NULL DEFAULT 1,
  tier INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  premium BOOLEAN NOT NULL DEFAULT false,
  claimed_tiers INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_pass ENABLE ROW LEVEL SECURITY;

-- RLS policies for matchmaking_queue
CREATE POLICY "Users can view all queue entries" ON public.matchmaking_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own queue entry" ON public.matchmaking_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue entry" ON public.matchmaking_queue FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own queue entry" ON public.matchmaking_queue FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for player_leagues
CREATE POLICY "Anyone can view leagues" ON public.player_leagues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own league" ON public.player_leagues FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own league" ON public.player_leagues FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for season_pass
CREATE POLICY "Users can view own season pass" ON public.season_pass FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own season pass" ON public.season_pass FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own season pass" ON public.season_pass FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for matchmaking
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;

-- Add league init to handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Jogador'));
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_inventory (user_id, item_type, item_key) VALUES
    (NEW.id, 'monster', 'panther'),
    (NEW.id, 'monster', 'banana');

  INSERT INTO public.daily_rewards (user_id) VALUES (NEW.id);
  
  INSERT INTO public.player_leagues (user_id) VALUES (NEW.id);
  INSERT INTO public.season_pass (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;
