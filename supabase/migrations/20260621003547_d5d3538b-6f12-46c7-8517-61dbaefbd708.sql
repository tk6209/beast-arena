
-- Remove client-side write policies; service_role bypasses RLS so the
-- game-engine edge function continues to work.

DROP POLICY IF EXISTS "Users can insert own battle history" ON public.battle_history;

DROP POLICY IF EXISTS "Users can insert own daily rewards" ON public.daily_rewards;
DROP POLICY IF EXISTS "Users can update own daily rewards" ON public.daily_rewards;

DROP POLICY IF EXISTS "Session members can create game events" ON public.game_events;

DROP POLICY IF EXISTS "Users can insert own league" ON public.player_leagues;
DROP POLICY IF EXISTS "Users can update own league" ON public.player_leagues;

DROP POLICY IF EXISTS "Authenticated users can insert own rankings" ON public.rankings;
DROP POLICY IF EXISTS "Authenticated users can update own rankings" ON public.rankings;

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;

DROP POLICY IF EXISTS "Users can insert own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.user_cards;

DROP POLICY IF EXISTS "Users can insert own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.user_inventory;

DROP POLICY IF EXISTS "Users can insert own missions" ON public.user_missions;
DROP POLICY IF EXISTS "Users can update own missions" ON public.user_missions;

DROP POLICY IF EXISTS "Users insert own monsters" ON public.user_monsters;
DROP POLICY IF EXISTS "Users update own monsters" ON public.user_monsters;

DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;

DROP POLICY IF EXISTS "Users can insert own weekly entry" ON public.weekly_leaderboard;
DROP POLICY IF EXISTS "Users can update own weekly entry" ON public.weekly_leaderboard;

-- Restrict user_stats reads to the owner; public competitive data lives in
-- public.rankings and public.weekly_leaderboard.
DROP POLICY IF EXISTS "Authenticated can view user stats" ON public.user_stats;
CREATE POLICY "Users can view own stats"
  ON public.user_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
