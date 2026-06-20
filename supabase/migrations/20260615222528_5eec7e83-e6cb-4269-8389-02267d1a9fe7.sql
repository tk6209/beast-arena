
-- ── Protect profiles economy columns ──────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_profile_economy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is non-null only for client-side (PostgREST) calls.
  -- Server-side service-role writes have auth.uid() = NULL and pass through.
  IF auth.uid() IS NOT NULL THEN
    NEW.coins := OLD.coins;
    NEW.gems  := OLD.gems;
    NEW.xp    := OLD.xp;
    NEW.level := OLD.level;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_economy ON public.profiles;
CREATE TRIGGER trg_protect_profile_economy
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_economy();

-- ── Protect season_pass progression columns ───────────────────────
CREATE OR REPLACE FUNCTION public.protect_season_pass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.premium        := OLD.premium;
    NEW.tier           := OLD.tier;
    NEW.xp             := OLD.xp;
    NEW.claimed_tiers  := OLD.claimed_tiers;
    NEW.season         := OLD.season;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_season_pass ON public.season_pass;
CREATE TRIGGER trg_protect_season_pass
BEFORE UPDATE ON public.season_pass
FOR EACH ROW EXECUTE FUNCTION public.protect_season_pass();

-- ── Raffle entry: validate sorteio tipo vs user role ──────────────
DROP POLICY IF EXISTS part_insert_own ON public.sorteio_participacoes;
CREATE POLICY part_insert_own
ON public.sorteio_participacoes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.sorteios s
    WHERE s.id = sorteio_participacoes.sorteio_id
      AND s.status = 'aberto'
      AND (
        s.tipo = 'publico'
        OR (s.tipo = 'vip'
            AND (public.has_role(auth.uid(), 'jogador_vip'::app_role)
                 OR public.has_role(auth.uid(), 'admin'::app_role)))
        OR (s.tipo = 'exclusivo'
            AND public.has_role(auth.uid(), 'admin'::app_role))
      )
  )
);

-- ── Tighten matchmaking_queue read access to own row ──────────────
DROP POLICY IF EXISTS "Authenticated users can view queue" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Anyone can view matchmaking queue" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Users can view own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can view own queue entry"
ON public.matchmaking_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
