
-- =============================================
-- FIX: rankings table - scope to authenticated + owner
-- =============================================
DROP POLICY IF EXISTS "Anyone can insert rankings" ON public.rankings;
DROP POLICY IF EXISTS "Anyone can update rankings" ON public.rankings;

CREATE POLICY "Authenticated users can insert own rankings"
ON public.rankings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own rankings"
ON public.rankings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- FIX: game_events - require authentication for INSERT
-- =============================================
DROP POLICY IF EXISTS "Anyone can create game events" ON public.game_events;

CREATE POLICY "Authenticated users can create game events"
ON public.game_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- FIX: game_sessions - require authentication
-- =============================================
DROP POLICY IF EXISTS "Anyone can create game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Anyone can update game sessions" ON public.game_sessions;

CREATE POLICY "Authenticated users can create game sessions"
ON public.game_sessions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update game sessions"
ON public.game_sessions FOR UPDATE
TO authenticated
USING (true);

-- =============================================
-- FIX: game_players - require authentication
-- =============================================
DROP POLICY IF EXISTS "Anyone can join as game player" ON public.game_players;
DROP POLICY IF EXISTS "Anyone can update game players" ON public.game_players;

CREATE POLICY "Authenticated users can join as game player"
ON public.game_players FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update game players"
ON public.game_players FOR UPDATE
TO authenticated
USING (true);
