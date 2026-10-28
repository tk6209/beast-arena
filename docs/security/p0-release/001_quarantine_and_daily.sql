-- RELEASE CANDIDATE ONLY. Not in migration discovery; NEVER applied to shared production this cycle.
-- Atomic daily slice only. Battle/mission/store remain closed in the staged boundary.
CREATE TABLE public.p0_economy_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_key text NOT NULL,
  reward_type text NOT NULL,
  config_version text NOT NULL,
  coins integer NOT NULL,
  receipt jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_key)
);
GRANT SELECT ON public.p0_economy_ledger TO authenticated;
GRANT ALL ON public.p0_economy_ledger TO service_role;
ALTER TABLE public.p0_economy_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY p0_ledger_owner_read ON public.p0_economy_ledger FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Explicit table privileges: policies alone do not stop client FOR ALL grants.
REVOKE INSERT, UPDATE, DELETE ON public.battle_history, public.user_cards,
 public.user_inventory, public.user_monsters, public.user_missions,
 public.daily_rewards, public.user_stats, public.user_achievements,
 public.season_pass, public.gem_transactions, public.player_leagues,
 public.weekly_leaderboard, public.rankings, public.game_events,
 public.game_players, public.game_sessions FROM anon, authenticated;
-- Keep name settings without allowing insert-based currency injection.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE(display_name, display_name_normalized, name_changed_at, avatar_url) ON public.profiles TO authenticated;

CREATE FUNCTION public.p0_economy_config()
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,public AS $$
SELECT '{"version":"p0-initial-proposal-v1","approval":"initial-proposal","daily":[10,15,20,30,40,50,75],"battle":{"facil":{"win":{"coins":10,"xp":20},"loss":{"coins":3,"xp":8}},"medio":{"win":{"coins":20,"xp":30},"loss":{"coins":3,"xp":8}},"avancado":{"win":{"coins":40,"xp":50},"loss":{"coins":3,"xp":8}}},"streak":{"maximumRewardedWins":5,"bonusBasisPointsPerWin":2500},"deck":{"size":10,"maxCopies":2}}'::jsonb;
$$;
REVOKE ALL ON FUNCTION public.p0_economy_config() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.p0_economy_config() TO service_role;

CREATE FUNCTION public.p0_claim_daily(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  p public.profiles%ROWTYPE;
  d public.daily_rewards%ROWTYPE;
  prior jsonb;
  day date := (statement_timestamp() AT TIME ZONE 'UTC')::date;
  key text;
  streak_day integer;
  amount integer;
  result jsonb;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000'; END IF;
  -- Lock profile FIRST for every future account RPC: common lock ordering serializes one user's economy.
  SELECT * INTO p FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROFILE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF p.coins < 0 THEN RAISE EXCEPTION 'INVALID_BALANCE' USING ERRCODE='22023'; END IF;
  key := 'daily:' || day::text;
  SELECT receipt INTO prior FROM public.p0_economy_ledger WHERE user_id=_user_id AND event_key=key;
  IF FOUND THEN RETURN prior; END IF;
  SELECT * INTO d FROM public.daily_rewards WHERE user_id=_user_id FOR UPDATE;
  -- Do not back-credit claims recorded by the old system, including the signup default.
  IF FOUND AND d.last_claim_date >= day THEN
    RETURN jsonb_build_object('alreadyClaimed', true, 'coins', 0, 'streak', d.streak,
      'eventKey', key, 'configVersion', 'p0-initial-proposal-v1', 'balance', p.coins);
  END IF;
  streak_day := CASE WHEN d.last_claim_date=day-1 THEN least(greatest(d.streak,1)+1,7) ELSE 1 END;
  amount := (public.p0_economy_config()->'daily'->>(streak_day-1))::integer;
  UPDATE public.profiles SET coins=coins+amount WHERE user_id=_user_id;
  INSERT INTO public.daily_rewards(user_id,last_claim_date,streak) VALUES (_user_id,day,streak_day)
    ON CONFLICT(user_id) DO UPDATE SET last_claim_date=EXCLUDED.last_claim_date,streak=EXCLUDED.streak;
  result := jsonb_build_object('alreadyClaimed', false, 'coins', amount, 'streak', streak_day,
    'eventKey', key, 'configVersion', 'p0-initial-proposal-v1', 'balance', p.coins+amount);
  INSERT INTO public.p0_economy_ledger(user_id,event_key,reward_type,config_version,coins,receipt)
    VALUES (_user_id,key,'daily','p0-initial-proposal-v1',amount,result);
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.p0_claim_daily(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.p0_claim_daily(uuid) TO service_role;

-- No incomplete settlement: zero write operations, even for a legacy finished session.
CREATE FUNCTION public.p0_settle_battle(_user_id uuid, _session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public
AS $$
BEGIN
  RAISE EXCEPTION 'AUTHORITATIVE_SESSION_PIPELINE_NOT_ACTIVATED' USING ERRCODE='55000';
END;
$$;
REVOKE ALL ON FUNCTION public.p0_settle_battle(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.p0_settle_battle(uuid,uuid) TO service_role;

-- Existing deck JSON is not canonical: block forged card stats and over-owned quantities.
-- No backfill; validates new/changed deck writes only. Legacy deck sizes remain readable.
CREATE FUNCTION public.p0_validate_deck()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public
AS $$
DECLARE card jsonb; owned public.user_cards%ROWTYPE; copies integer; k text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> NEW.user_id THEN
    RAISE EXCEPTION 'DECK_OWNER_REQUIRED' USING ERRCODE='42501';
  END IF;
  IF jsonb_typeof(NEW.cards)<>'array' OR jsonb_array_length(NEW.cards)<>10 THEN
    RAISE EXCEPTION 'DECK_REQUIRES_10_CARDS' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_monsters WHERE user_id=NEW.user_id AND monster_id=NEW.monster_id) THEN
    RAISE EXCEPTION 'MONSTER_NOT_OWNED' USING ERRCODE='42501';
  END IF;
  FOR card IN SELECT value FROM jsonb_array_elements(NEW.cards) LOOP
    k := card->>'card_key';
    IF k IS NULL THEN RAISE EXCEPTION 'CARD_KEY_REQUIRED' USING ERRCODE='22023'; END IF;
    SELECT * INTO owned FROM public.user_cards WHERE user_id=NEW.user_id AND card_key=k;
    IF NOT FOUND THEN RAISE EXCEPTION 'CARD_NOT_OWNED' USING ERRCODE='42501'; END IF;
    IF card-'card_key' IS DISTINCT FROM owned.card_data THEN
      RAISE EXCEPTION 'FORGED_CARD_DATA' USING ERRCODE='22023';
    END IF;
    SELECT count(*) INTO copies FROM jsonb_array_elements(NEW.cards) AS e WHERE e->>'card_key'=k;
    IF copies>2 OR copies>owned.quantity THEN
      RAISE EXCEPTION 'CARD_COPY_LIMIT' USING ERRCODE='22023';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.p0_validate_deck() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER p0_validate_deck BEFORE INSERT OR UPDATE ON public.player_decks
FOR EACH ROW EXECUTE FUNCTION public.p0_validate_deck();