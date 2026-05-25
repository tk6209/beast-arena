BEGIN;

-- Freeze client-side writes for economy/progression tables.
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own battle history" ON public.battle_history;
DROP POLICY IF EXISTS "Users can update own daily rewards" ON public.daily_rewards;
DROP POLICY IF EXISTS "Users can insert own gem transactions" ON public.gem_transactions;
DROP POLICY IF EXISTS "Users can insert own league" ON public.player_leagues;
DROP POLICY IF EXISTS "Users can update own league" ON public.player_leagues;
DROP POLICY IF EXISTS "Authenticated users can insert own rankings" ON public.rankings;
DROP POLICY IF EXISTS "Authenticated users can update own rankings" ON public.rankings;
DROP POLICY IF EXISTS "Users can insert own season pass" ON public.season_pass;
DROP POLICY IF EXISTS "Users can update own season pass" ON public.season_pass;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can update own missions" ON public.user_missions;
DROP POLICY IF EXISTS "Users update own monsters" ON public.user_monsters;
DROP POLICY IF EXISTS "Authenticated users can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can insert own weekly entry" ON public.weekly_leaderboard;
DROP POLICY IF EXISTS "Users can update own weekly entry" ON public.weekly_leaderboard;

-- Restrict game_players updates so users can only update their own row in-session.
DROP POLICY IF EXISTS "Authenticated users can update game players" ON public.game_players;
CREATE POLICY "Authenticated users can update own game player row"
ON public.game_players
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.game_players gp
    WHERE gp.session_id = game_players.session_id
      AND gp.player_slot = game_players.player_slot
      AND gp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.game_players gp
    WHERE gp.session_id = game_players.session_id
      AND gp.player_slot = game_players.player_slot
      AND gp.user_id = auth.uid()
  )
);

-- Restrict game event insertion to the authenticated player's own slot.
DROP POLICY IF EXISTS "Authenticated users can create game events" ON public.game_events;
CREATE POLICY "Authenticated users can create game events only for own slot"
ON public.game_events
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.game_players gp
    WHERE gp.session_id = game_events.session_id
      AND gp.player_slot = game_events.player_slot
      AND gp.user_id = auth.uid()
  )
);

-- Restrict profile updates to non-economy fields only.
DROP POLICY IF EXISTS "Users can update own profile but not public_id" ON public.profiles;
CREATE POLICY "Users can update own profile safe fields"
ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND coins = (SELECT p.coins FROM public.profiles p WHERE p.user_id = auth.uid())
  AND gems = (SELECT p.gems FROM public.profiles p WHERE p.user_id = auth.uid())
  AND xp = (SELECT p.xp FROM public.profiles p WHERE p.user_id = auth.uid())
  AND level = (SELECT p.level FROM public.profiles p WHERE p.user_id = auth.uid())
  AND public_id = (SELECT p.public_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

COMMIT;
