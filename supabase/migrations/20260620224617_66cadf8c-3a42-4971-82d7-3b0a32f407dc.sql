
-- 1) profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- 2) user_stats: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view user stats" ON public.user_stats;
CREATE POLICY "Authenticated can view user stats"
  ON public.user_stats FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.user_stats FROM anon;

-- 3) gem_transactions: remove client INSERT (service-role only writes)
DROP POLICY IF EXISTS "Users can insert own gem transactions" ON public.gem_transactions;

-- 4) game_players INSERT: remove OR EXISTS bypass branch
DROP POLICY IF EXISTS "Authenticated users can join as game player" ON public.game_players;
CREATE POLICY "Authenticated users can join as game player"
  ON public.game_players FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (state_json ->> 'user_id') = (auth.uid())::text
  );

-- 5) profiles.display_name validation via BEFORE trigger (handles NULLs/normalisation)
CREATE OR REPLACE FUNCTION public.validate_profile_display_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.display_name IS NULL OR length(btrim(NEW.display_name)) = 0 THEN
    RAISE EXCEPTION 'display_name é obrigatório';
  END IF;
  IF length(NEW.display_name) < 3 OR length(NEW.display_name) > 20 THEN
    RAISE EXCEPTION 'display_name deve ter entre 3 e 20 caracteres';
  END IF;
  IF NEW.display_name !~ '^[a-zA-ZÀ-ÿ0-9 _-]+$' THEN
    RAISE EXCEPTION 'display_name contém caracteres inválidos';
  END IF;
  NEW.display_name_normalized := lower(btrim(NEW.display_name));
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validate_profile_display_name() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_validate_profile_display_name ON public.profiles;
CREATE TRIGGER trg_validate_profile_display_name
  BEFORE INSERT OR UPDATE OF display_name ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_display_name();
