
-- ============================================================
-- 1) game_players: add real user_id column, enforce via RLS
-- ============================================================
ALTER TABLE public.game_players
  ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.game_players
SET user_id = (state_json ->> 'user_id')::uuid
WHERE user_id IS NULL
  AND state_json ? 'user_id'
  AND (state_json ->> 'user_id') ~ '^[0-9a-fA-F-]{36}$';

-- Drop rows with no resolvable owner so NOT NULL can be enforced.
DELETE FROM public.game_players WHERE user_id IS NULL;

ALTER TABLE public.game_players
  ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS game_players_user_id_idx
  ON public.game_players(user_id);

-- Replace JSONB-based ownership policies with column-based ones.
DROP POLICY IF EXISTS "Authenticated users can join as game player" ON public.game_players;
DROP POLICY IF EXISTS "Players can update only their own row" ON public.game_players;

CREATE POLICY "Players can join as themselves"
  ON public.game_players
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update only their own row"
  ON public.game_players
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Session-participant helper now uses the column instead of state_json.
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_players gp
    WHERE gp.session_id = _session_id
      AND gp.user_id = auth.uid()
  )
$$;

-- ============================================================
-- 2) profiles: hide economy fields from other players
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Public-facing projection: only safe fields (no coins / gems / xp).
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT
  id,
  user_id,
  display_name,
  public_id,
  avatar_url,
  level
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
