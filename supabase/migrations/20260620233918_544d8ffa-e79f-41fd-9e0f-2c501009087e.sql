
-- Helper: is the caller a participant in a given session
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.session_id = _session_id
      AND (gp.state_json ->> 'user_id') = auth.uid()::text
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_session_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_session_participant(uuid) TO authenticated, service_role;

-- game_sessions: restrict SELECT to participants; remove client UPDATE
DROP POLICY IF EXISTS "Authenticated users can view game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Session members can update game sessions" ON public.game_sessions;

CREATE POLICY "Participants can view their game sessions"
ON public.game_sessions
FOR SELECT
TO authenticated
USING (public.is_session_participant(id));

-- No client UPDATE policy: only service_role (edge functions) may mutate session state.

-- game_players: restrict SELECT to participants of same session; restrict UPDATE to own row
DROP POLICY IF EXISTS "Authenticated users can view game players" ON public.game_players;
DROP POLICY IF EXISTS "Session members can update game players" ON public.game_players;

CREATE POLICY "Participants can view players in their sessions"
ON public.game_players
FOR SELECT
TO authenticated
USING (public.is_session_participant(session_id));

CREATE POLICY "Players can update only their own row"
ON public.game_players
FOR UPDATE
TO authenticated
USING ((state_json ->> 'user_id') = auth.uid()::text)
WITH CHECK ((state_json ->> 'user_id') = auth.uid()::text);

-- game_events: restrict SELECT to participants
DROP POLICY IF EXISTS "Authenticated users can view game events" ON public.game_events;

CREATE POLICY "Participants can view events in their sessions"
ON public.game_events
FOR SELECT
TO authenticated
USING (public.is_session_participant(session_id));

-- Revoke public EXECUTE on internal trigger function (not meant to be called via API)
REVOKE EXECUTE ON FUNCTION public.validate_profile_display_name() FROM PUBLIC, anon, authenticated;
