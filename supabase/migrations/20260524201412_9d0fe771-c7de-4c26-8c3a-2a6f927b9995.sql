-- user_monsters: power level + shards + selected perks per monster
CREATE TABLE public.user_monsters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  monster_id TEXT NOT NULL,
  power_level INTEGER NOT NULL DEFAULT 1,
  shards INTEGER NOT NULL DEFAULT 0,
  selected_gadget TEXT,
  selected_star_power TEXT,
  selected_hyper TEXT,
  selected_gear TEXT,
  total_battles INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, monster_id)
);

ALTER TABLE public.user_monsters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own monsters"
  ON public.user_monsters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own monsters"
  ON public.user_monsters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own monsters"
  ON public.user_monsters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_monsters_updated_at
  BEFORE UPDATE ON public.user_monsters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_monsters_user ON public.user_monsters(user_id);

-- Backfill: create user_monsters rows for every monster currently owned in inventory
INSERT INTO public.user_monsters (user_id, monster_id, power_level, shards)
SELECT DISTINCT ui.user_id, ui.item_key, 1, 0
FROM public.user_inventory ui
WHERE ui.item_type = 'monster'
ON CONFLICT (user_id, monster_id) DO NOTHING;

-- Extend handle_new_user to also seed default monsters in user_monsters
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, public_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Jogador'),
    'beast-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  );

  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);

  INSERT INTO public.user_inventory (user_id, item_type, item_key) VALUES
    (NEW.id, 'monster', 'panther'),
    (NEW.id, 'monster', 'banana');

  INSERT INTO public.user_monsters (user_id, monster_id) VALUES
    (NEW.id, 'panther'),
    (NEW.id, 'banana')
  ON CONFLICT (user_id, monster_id) DO NOTHING;

  INSERT INTO public.daily_rewards (user_id) VALUES (NEW.id);
  INSERT INTO public.player_leagues (user_id) VALUES (NEW.id);
  INSERT INTO public.season_pass (user_id) VALUES (NEW.id);
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$function$;