
-- 1) Security definer helper to check session membership without recursion
CREATE OR REPLACE FUNCTION public.is_session_member(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN auth.users u ON u.id = _user_id
    WHERE gp.session_id = _session_id
      AND gp.nickname IS NOT NULL
      AND (
        -- match by stored user metadata if present
        gp.state_json->>'user_id' = _user_id::text
      )
  )
$$;

-- Simpler membership: store user_id in state_json on insert (clients already do).
-- For backwards safety, also allow the creator of the session (first inserter) via game_events.

-- 2) game_sessions: tighten INSERT/UPDATE
DROP POLICY IF EXISTS "Authenticated users can create game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Authenticated users can update game sessions" ON public.game_sessions;

CREATE POLICY "Authenticated users can create game sessions"
ON public.game_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Session members can update game sessions"
ON public.game_sessions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.session_id = game_sessions.id
      AND gp.state_json->>'user_id' = auth.uid()::text
  )
);

-- 3) game_players: tighten INSERT/UPDATE
DROP POLICY IF EXISTS "Authenticated users can join as game player" ON public.game_players;
DROP POLICY IF EXISTS "Authenticated users can update game players" ON public.game_players;

CREATE POLICY "Authenticated users can join as game player"
ON public.game_players FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (state_json->>'user_id' = auth.uid()::text)
);

CREATE POLICY "Session members can update game players"
ON public.game_players FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_players gp2
    WHERE gp2.session_id = game_players.session_id
      AND gp2.state_json->>'user_id' = auth.uid()::text
  )
);

-- 4) game_events: tighten INSERT
DROP POLICY IF EXISTS "Authenticated users can create game events" ON public.game_events;

CREATE POLICY "Session members can create game events"
ON public.game_events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.session_id = game_events.session_id
      AND gp.state_json->>'user_id' = auth.uid()::text
  )
);

-- 5) Revoke public EXECUTE on handle_new_user (it runs via auth trigger only)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
