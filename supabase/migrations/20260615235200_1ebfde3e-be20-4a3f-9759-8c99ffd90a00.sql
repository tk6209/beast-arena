
DROP POLICY IF EXISTS "Anyone can view game events" ON public.game_events;
DROP POLICY IF EXISTS "Anyone can view game players" ON public.game_players;
DROP POLICY IF EXISTS "Anyone can view game sessions" ON public.game_sessions;

CREATE POLICY "Authenticated users can view game events"
  ON public.game_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view game players"
  ON public.game_players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view game sessions"
  ON public.game_sessions FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.game_events, public.game_players, public.game_sessions FROM anon;
