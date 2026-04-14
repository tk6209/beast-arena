
-- Daily missions definitions
CREATE TABLE public.daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🎯',
  mission_type text NOT NULL,
  target_value integer NOT NULL DEFAULT 1,
  reward_coins integer NOT NULL DEFAULT 10,
  reward_xp integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view missions" ON public.daily_missions FOR SELECT USING (true);

-- User mission progress
CREATE TABLE public.user_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.daily_missions(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  claimed boolean NOT NULL DEFAULT false,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.user_missions FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_missions_updated_at BEFORE UPDATE ON public.user_missions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Achievements definitions
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🏅',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  rarity text NOT NULL DEFAULT 'comum',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User achievements
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weekly leaderboard
CREATE TABLE public.weekly_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_key text NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  rating_gained integer NOT NULL DEFAULT 0,
  display_name text NOT NULL DEFAULT 'Jogador',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_key)
);

ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly leaderboard" ON public.weekly_leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can insert own weekly entry" ON public.weekly_leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly entry" ON public.weekly_leaderboard FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_weekly_leaderboard_updated_at BEFORE UPDATE ON public.weekly_leaderboard
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed daily missions
INSERT INTO public.daily_missions (title, description, emoji, mission_type, target_value, reward_coins, reward_xp) VALUES
  ('Guerreiro Diário', 'Vença 3 batalhas', '⚔️', 'wins', 3, 30, 20),
  ('Curandeiro', 'Use 5 cartas de cura', '💚', 'heal_cards', 5, 20, 15),
  ('Evolucionista', 'Evolua 2 vezes', '✨', 'evolutions', 2, 25, 15),
  ('Atacante Feroz', 'Cause 200 de dano total', '🔥', 'damage_dealt', 200, 25, 20),
  ('Escudeiro', 'Use 4 cartas de defesa', '🛡️', 'defense_cards', 4, 20, 10),
  ('Invocador', 'Invoque 3 swarms', '🐾', 'swarms_played', 3, 30, 20),
  ('Sobrevivente', 'Vença com menos de 20 HP', '❤️‍🔥', 'low_hp_win', 1, 40, 30),
  ('Maratonista', 'Jogue 5 partidas', '🎮', 'games_played', 5, 20, 15);

-- Seed achievements
INSERT INTO public.achievements (title, description, emoji, requirement_type, requirement_value, rarity) VALUES
  ('Primeiro Sangue', 'Vença sua primeira batalha', '🩸', 'total_wins', 1, 'comum'),
  ('Veterano', 'Vença 50 batalhas', '🎖️', 'total_wins', 50, 'raro'),
  ('Lendário', 'Vença 200 batalhas', '🏆', 'total_wins', 200, 'lendario'),
  ('Sequência de Fogo', 'Consiga 5 vitórias seguidas', '🔥', 'win_streak', 5, 'raro'),
  ('Imparável', 'Consiga 10 vitórias seguidas', '⚡', 'win_streak', 10, 'epico'),
  ('Mestre Bronze', 'Alcance a liga Prata', '🥈', 'rating', 1200, 'comum'),
  ('Mestre Ouro', 'Alcance a liga Ouro', '🥇', 'rating', 1500, 'raro'),
  ('Diamante', 'Alcance a liga Diamante', '💎', 'rating', 1800, 'epico'),
  ('Grão-Mestre', 'Alcance a liga Mestre', '👑', 'rating', 2100, 'lendario'),
  ('Colecionador', 'Possua 5 monstros diferentes', '📚', 'monsters_owned', 5, 'raro'),
  ('Desafiante Avançado', 'Vença no modo avançado', '💀', 'advanced_win', 1, 'epico'),
  ('Rico!', 'Acumule 1000 moedas', '💰', 'coins', 1000, 'raro');
