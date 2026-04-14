
-- Shop items table (predefined items)
CREATE TABLE public.shop_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type text NOT NULL, -- 'monster_unlock', 'swarm_pack', 'card_pack', 'xp_boost'
  item_key text NOT NULL, -- monster id, pack id, etc.
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_coins integer NOT NULL DEFAULT 100,
  level_required integer NOT NULL DEFAULT 1,
  emoji text NOT NULL DEFAULT '📦',
  rarity text NOT NULL DEFAULT 'comum',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop items"
ON public.shop_items FOR SELECT USING (true);

-- User inventory table
CREATE TABLE public.user_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_type text NOT NULL, -- 'monster', 'swarm', 'skin'
  item_key text NOT NULL, -- the specific id
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_key)
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- Daily rewards table
CREATE TABLE public.daily_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  last_claim_date date NOT NULL DEFAULT CURRENT_DATE,
  streak integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily rewards"
ON public.daily_rewards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily rewards"
ON public.daily_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily rewards"
ON public.daily_rewards FOR UPDATE USING (auth.uid() = user_id);

-- Seed shop items: starter monsters (panther, banana free; macaco, morcego, sprouts unlockable)
INSERT INTO public.shop_items (item_type, item_key, name, description, price_coins, level_required, emoji, rarity) VALUES
('monster_unlock', 'macaco', 'Macaco', 'Desbloqueie o Macaco! 50% chance de atacar 2x.', 150, 3, '🐒', 'raro'),
('monster_unlock', 'morcego', 'Morcego', 'Desbloqueie o Morcego! Evita 1 ataque por jogo.', 200, 5, '🦇', 'raro'),
('monster_unlock', 'sprouts', 'Sprouts', 'Desbloqueie o Sprouts! +5 ataque por turno.', 300, 7, '🌱', 'epico'),
('swarm_pack', 'pack_comum', 'Pack Comum', '3 swarms aleatórios (comum/raro).', 50, 1, '📦', 'comum'),
('swarm_pack', 'pack_raro', 'Pack Raro', '3 swarms garantidos raro+.', 150, 3, '💎', 'raro'),
('swarm_pack', 'pack_lendario', 'Pack Lendário', '3 swarms com chance lendário!', 400, 8, '🌟', 'lendario'),
('xp_boost', 'xp_2x', 'Boost XP 2x', 'Próximas 5 partidas com XP dobrado.', 100, 1, '⚡', 'raro');

-- Auto-give starter monsters on signup via trigger update
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Jogador'));
  
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  -- Give starter monsters
  INSERT INTO public.user_inventory (user_id, item_type, item_key) VALUES
    (NEW.id, 'monster', 'panther'),
    (NEW.id, 'monster', 'banana');

  -- Initialize daily rewards
  INSERT INTO public.daily_rewards (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;
