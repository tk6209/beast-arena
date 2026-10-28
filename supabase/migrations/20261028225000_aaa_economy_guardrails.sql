-- Beast Arena AAA Gate P0 (reviewable, forward-only; NEVER apply without staging probes).
-- All RPCs are service_role-only, called AFTER validating the player's JWT in game-engine.
-- Never trust client-reported winner, coins, XP, stats or card data.
CREATE TABLE IF NOT EXISTS public.game_economy_config (
  version integer PRIMARY KEY CHECK (version > 0),
  active boolean NOT NULL DEFAULT false,
  rules jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS game_economy_one_active ON public.game_economy_config (active) WHERE active;
INSERT INTO public.game_economy_config(version, active, rules) VALUES
(1, true, '{
  "daily_coins":[50,75,100,125,150,175,200],
  "battle":{"facil":{"win_coins":10,"win_xp":20},
            "medio":{"win_coins":20,"win_xp":30},
            "avancado":{"win_coins":40,"win_xp":50}},
  "loss":{"coins":3,"xp":8},
  "win_streak_bonus_pct":0.25,
  "win_streak_bonus_max":5,
  "season_win_xp":20,
  "season_loss_xp":5,
  "shards_win":10,
  "shards_loss":3
}'::jsonb)
ON CONFLICT (version) DO NOTHING;
COMMENT ON TABLE public.game_economy_config IS
  'v1 snapshots the existing live SERVER values; product owner approval of official balance is pending.';
ALTER TABLE public.game_economy_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_economy_config FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.game_economy_config TO authenticated, service_role;
GRANT ALL ON public.game_economy_config TO service_role;

CREATE TABLE IF NOT EXISTS public.game_reward_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('battle','daily','mission','purchase')),
  coins_delta integer NOT NULL DEFAULT 0,
  xp_delta integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,event_key)
);
CREATE INDEX IF NOT EXISTS game_reward_ledger_user_created
  ON public.game_reward_ledger(user_id, created_at DESC);
ALTER TABLE public.game_reward_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_reward_ledger FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.game_reward_ledger TO authenticated;
GRANT ALL ON public.game_reward_ledger TO service_role;
DROP POLICY IF EXISTS "Users view own reward ledger" ON public.game_reward_ledger;
CREATE POLICY "Users view own reward ledger" ON public.game_reward_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Old sessions were writable by authenticated clients before this migration.
-- They are not eligible for settlement, regardless of their apparent outcome.
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS trust_version integer NOT NULL DEFAULT 0;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_trust_version_nonnegative CHECK (trust_version >= 0);
-- Defense-in-depth: writable game state must be exclusive to the authenticated server.
-- Front-end write flows must be moved to trusted endpoints BEFORE production cutover.
REVOKE INSERT, UPDATE, DELETE ON public.game_sessions, public.game_players, public.game_events
  FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_cards, public.battle_history,
  public.user_inventory, public.user_missions, public.user_stats,
  public.daily_rewards, public.user_monsters, public.season_pass,
  public.player_leagues, public.gem_transactions FROM PUBLIC, anon, authenticated;
-- Prevent coins, gems, XP and levels being changed through profiles.update() or forged inserts.
-- Account creation already occurs via the handle_new_user SECURITY DEFINER trigger.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (display_name, display_name_normalized, name_changed_at, avatar_url) ON public.profiles TO authenticated;
-- Client reads remain supported under existing owner-only RLS policies.

-- SQL functions run in the same DB transaction as the caller's RPC, with all
-- changes rolled back if any step fails. No direct client EXECUTE permissions.
CREATE OR REPLACE FUNCTION public.game_apply_progress(p_uid uuid,p_coins integer,p_xp integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_coins integer; v_xp integer; v_level integer;
BEGIN
  IF p_coins IS NULL OR p_xp IS NULL OR abs(p_coins) > 100000 OR p_xp < 0 OR p_xp > 100000
  THEN RAISE EXCEPTION 'invalid_progress_amount'; END IF;
  SELECT coins,xp,level INTO STRICT v_coins,v_xp,v_level
    FROM public.profiles WHERE user_id=p_uid FOR UPDATE;
  IF v_coins+p_coins < 0 THEN RAISE EXCEPTION 'insufficient_coins'; END IF;
  v_coins:=v_coins+p_coins;
  v_xp:=v_xp+p_xp;
  WHILE v_xp >= v_level*100 LOOP
    v_xp:=v_xp-v_level*100;
    v_level:=v_level+1;
    IF v_level > 10000 THEN RAISE EXCEPTION 'invalid_level'; END IF;
  END LOOP;
  UPDATE public.profiles SET coins=v_coins,xp=v_xp,level=v_level WHERE user_id=p_uid;
  RETURN jsonb_build_object('coins',v_coins,'xp',v_xp,'level',v_level);
END $$;

CREATE OR REPLACE FUNCTION public.game_claim_daily(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_today date := (now() AT TIME ZONE 'UTC')::date;
        v_prev date; v_streak int; v_amount int; v_rules jsonb; v_profile jsonb; v_existing public.game_reward_ledger%ROWTYPE;
BEGIN
  -- Serializes ALL currency operations by profile row lock.
  PERFORM 1 FROM public.profiles WHERE user_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_missing'; END IF;
  SELECT * INTO v_existing FROM public.game_reward_ledger
    WHERE user_id=p_uid AND event_key='daily:'||v_today::text;
  IF FOUND THEN
    RETURN jsonb_build_object('alreadyClaimed',true,'coins',0,
      'streak',coalesce((v_existing.metadata->>'streak')::int,1));
  END IF;
  SELECT last_claim_date, streak INTO v_prev,v_streak FROM public.daily_rewards
    WHERE user_id=p_uid FOR UPDATE;
  v_streak:=CASE WHEN v_prev=v_today-1 THEN least(coalesce(v_streak,0)+1,7) ELSE 1 END;
  SELECT rules INTO STRICT v_rules FROM public.game_economy_config WHERE active;
  v_amount:=(v_rules->'daily_coins'->>(v_streak-1))::int;
  IF v_amount IS NULL OR v_amount<0 THEN RAISE EXCEPTION 'invalid_daily_economy'; END IF;
  INSERT INTO public.game_reward_ledger(user_id,event_key,kind,coins_delta,metadata)
    VALUES(p_uid,'daily:'||v_today::text,'daily',v_amount,
      jsonb_build_object('streak',v_streak,'config_version',(SELECT version FROM public.game_economy_config WHERE active)));
  INSERT INTO public.daily_rewards(user_id,last_claim_date,streak)
    VALUES(p_uid,v_today,v_streak)
    ON CONFLICT(user_id) DO UPDATE SET last_claim_date=excluded.last_claim_date,streak=excluded.streak;
  v_profile:=public.game_apply_progress(p_uid,v_amount,0);
  RETURN jsonb_build_object('alreadyClaimed',false,'coins',v_amount,'streak',v_streak,'profile',v_profile);
END $$;

CREATE OR REPLACE FUNCTION public.game_claim_mission(p_uid uuid,p_mission uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_um public.user_missions%ROWTYPE; v_m public.daily_missions%ROWTYPE; v_existing public.game_reward_ledger%ROWTYPE; v_profile jsonb;
BEGIN
  PERFORM 1 FROM public.profiles WHERE user_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_missing'; END IF;
  SELECT * INTO v_existing FROM public.game_reward_ledger
    WHERE user_id=p_uid AND event_key='mission:'||p_mission::text;
  IF FOUND THEN RETURN jsonb_build_object('alreadyClaimed',true,'coins',0,'xp',0); END IF;
  SELECT * INTO v_um FROM public.user_missions
    WHERE id=p_mission AND user_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'mission_not_found'; END IF;
  SELECT * INTO STRICT v_m FROM public.daily_missions WHERE id=v_um.mission_id;
  IF v_um.claimed THEN RAISE EXCEPTION 'already_claimed'; END IF;
  IF NOT v_um.completed OR v_um.progress < v_m.target_value
  THEN RAISE EXCEPTION 'mission_incomplete'; END IF;
  IF v_m.reward_coins<0 OR v_m.reward_xp<0 OR v_m.reward_coins>100000 OR v_m.reward_xp>100000
  THEN RAISE EXCEPTION 'invalid_mission_reward'; END IF;
  INSERT INTO public.game_reward_ledger(user_id,event_key,kind,coins_delta,xp_delta)
    VALUES(p_uid,'mission:'||p_mission::text,'mission',v_m.reward_coins,v_m.reward_xp);
  UPDATE public.user_missions SET claimed=true,completed=true WHERE id=p_mission;
  v_profile:=public.game_apply_progress(p_uid,v_m.reward_coins,v_m.reward_xp);
  RETURN jsonb_build_object('alreadyClaimed',false,'coins',v_m.reward_coins,'xp',v_m.reward_xp,'profile',v_profile);
END $$;

CREATE OR REPLACE FUNCTION public.game_purchase(p_uid uuid,p_item uuid,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_item public.shop_items%ROWTYPE; v_balance integer; v_level integer;
        v_type text; v_existing public.game_reward_ledger%ROWTYPE; v_profile jsonb; v_owned int;
BEGIN
  IF p_request IS NULL THEN RAISE EXCEPTION 'request_id_required'; END IF;
  SELECT coins,level INTO STRICT v_balance,v_level FROM public.profiles WHERE user_id=p_uid FOR UPDATE;
  SELECT * INTO v_existing FROM public.game_reward_ledger
    WHERE user_id=p_uid AND event_key='purchase:'||p_request::text;
  IF FOUND THEN
    IF v_existing.metadata->>'item_id' <> p_item::text THEN RAISE EXCEPTION 'idempotency_key_reused'; END IF;
    RETURN jsonb_build_object('alreadyProcessed',true,'coins',v_balance,'itemId',p_item);
  END IF;
  SELECT * INTO v_item FROM public.shop_items WHERE id=p_item AND active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'item_unavailable'; END IF;
  IF v_item.price_coins < 0 OR v_item.price_coins>100000
  THEN RAISE EXCEPTION 'invalid_price'; END IF;
  IF v_level<v_item.level_required THEN RAISE EXCEPTION 'level_required'; END IF;
  IF v_balance<v_item.price_coins THEN RAISE EXCEPTION 'insufficient_coins'; END IF;
  v_type:=CASE WHEN v_item.item_type='monster_unlock' THEN 'monster' ELSE v_item.item_type END;
  SELECT quantity INTO v_owned FROM public.user_inventory
    WHERE user_id=p_uid AND item_type=v_type AND item_key=v_item.item_key FOR UPDATE;
  IF v_item.item_type='monster_unlock' AND v_owned IS NOT NULL THEN
    RAISE EXCEPTION 'already_owned';
  END IF;
  INSERT INTO public.game_reward_ledger(user_id,event_key,kind,coins_delta,metadata)
    VALUES(p_uid,'purchase:'||p_request::text,'purchase',-v_item.price_coins,
      jsonb_build_object('item_id',p_item,'item_key',v_item.item_key,'item_type',v_type));
  INSERT INTO public.user_inventory(user_id,item_type,item_key,quantity)
    VALUES(p_uid,v_type,v_item.item_key,1)
    ON CONFLICT(user_id,item_type,item_key)
    DO UPDATE SET quantity=public.user_inventory.quantity+1;
  v_profile:=public.game_apply_progress(p_uid,-v_item.price_coins,0);
  RETURN jsonb_build_object('alreadyProcessed',false,'coins',(v_profile->>'coins')::int,
    'itemId',p_item,'profile',v_profile);
END $$;

CREATE OR REPLACE FUNCTION public.game_settle_battle(p_uid uuid,p_session uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_session public.game_sessions%ROWTYPE; v_slot integer; v_won boolean; v_rules jsonb;
        v_diff text; v_coins integer; v_xp integer; v_streak integer; v_bonus integer;
        v_card jsonb; v_card_key text; v_profile jsonb; v_existing public.game_reward_ledger%ROWTYPE;
        v_meta jsonb;
BEGIN
  IF p_session IS NULL THEN RAISE EXCEPTION 'session_required'; END IF;
  -- Lock authoritative game state. The browser cannot INSERT/UPDATE this table.
  SELECT * INTO v_session FROM public.game_sessions WHERE id=p_session FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'session_not_found'; END IF;
  IF v_session.trust_version<>1 OR v_session.status::text<>'finished'
     OR coalesce(v_session.state_json->>'fase','')<>'resultado'
     OR coalesce(v_session.state_json->>'modo','')<>'ai'
     OR coalesce(v_session.state_json->>'vencedor','') !~ '^[01]$'
  THEN RAISE EXCEPTION 'battle_not_settleable'; END IF;
  SELECT slot INTO v_slot FROM public.game_players
    WHERE session_id=p_session AND user_id=p_uid;
  IF NOT FOUND OR v_slot<>0 THEN RAISE EXCEPTION 'not_session_owner'; END IF;
  PERFORM 1 FROM public.profiles WHERE user_id=p_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_missing'; END IF;
  SELECT * INTO v_existing FROM public.game_reward_ledger
    WHERE user_id=p_uid AND event_key='battle:'||p_session::text;
  IF FOUND THEN RETURN jsonb_build_object('alreadyProcessed',true,'coins',v_existing.coins_delta,
    'xp',v_existing.xp_delta,'streak',coalesce((v_existing.metadata->>'streak')::int,0)); END IF;
  v_diff:=v_session.state_json->>'dificuldade';
  SELECT rules INTO STRICT v_rules FROM public.game_economy_config WHERE active;
  IF v_diff NOT IN ('facil','medio','avancado') OR NOT (v_rules->'battle' ? v_diff)
  THEN RAISE EXCEPTION 'invalid_difficulty'; END IF;
  v_won:=(v_session.state_json->>'vencedor')::int = v_slot;
  INSERT INTO public.user_stats(user_id) VALUES(p_uid) ON CONFLICT(user_id) DO NOTHING;
  SELECT win_streak INTO v_streak FROM public.user_stats WHERE user_id=p_uid FOR UPDATE;
  v_streak:=CASE WHEN v_won THEN least(coalesce(v_streak,0)+1,100000) ELSE 0 END;
  v_coins:=CASE WHEN v_won THEN (v_rules->'battle'->v_diff->>'win_coins')::int
                        ELSE (v_rules->'loss'->>'coins')::int END;
  v_xp:=CASE WHEN v_won THEN (v_rules->'battle'->v_diff->>'win_xp')::int
                     ELSE (v_rules->'loss'->>'xp')::int END;
  v_bonus:=CASE WHEN v_won THEN
    round(v_coins*coalesce((v_rules->>'win_streak_bonus_pct')::numeric,0)*
      greatest(0,least(v_streak,coalesce((v_rules->>'win_streak_bonus_max')::int,5))-1))::int
    ELSE 0 END;
  v_coins:=v_coins+v_bonus;
  IF v_coins<0 OR v_xp<0 THEN RAISE EXCEPTION 'invalid_battle_economy'; END IF;
  v_meta:=jsonb_build_object('session_id',p_session,'won',v_won,'streak',v_streak,
    'difficulty',v_diff,'bonus',v_bonus,'config_version',(SELECT version FROM public.game_economy_config WHERE active));
  INSERT INTO public.game_reward_ledger(user_id,event_key,kind,coins_delta,xp_delta,metadata)
    VALUES(p_uid,'battle:'||p_session::text,'battle',v_coins,v_xp,v_meta);
  UPDATE public.user_stats SET
    total_wins=coalesce(total_wins,0)+CASE WHEN v_won THEN 1 ELSE 0 END,
    total_losses=coalesce(total_losses,0)+CASE WHEN v_won THEN 0 ELSE 1 END,
    win_streak=v_streak,
    best_streak=greatest(coalesce(best_streak,0),v_streak)
    WHERE user_id=p_uid;
  INSERT INTO public.battle_history(user_id,session_id,won,monster_used,opponent_monster,mode,dificuldade,turns)
    VALUES(p_uid,p_session,v_won,
      coalesce(v_session.state_json->'players'->0->'monstro'->>'id','panther'),
      v_session.state_json->'players'->1->'monstro'->>'id',
      'ai',v_diff,coalesce((v_session.state_json->>'turno')::int,0));
  UPDATE public.season_pass SET xp=xp+CASE WHEN v_won
    THEN coalesce((v_rules->>'season_win_xp')::int,20) ELSE coalesce((v_rules->>'season_loss_xp')::int,5) END
    WHERE user_id=p_uid;
  INSERT INTO public.user_monsters(user_id,monster_id,power_level,shards,total_battles)
    VALUES(p_uid,coalesce(v_session.state_json->'players'->0->'monstro'->>'id','panther'),1,
      CASE WHEN v_won THEN (v_rules->>'shards_win')::int ELSE (v_rules->>'shards_loss')::int END,1)
    ON CONFLICT(user_id,monster_id) DO UPDATE
    SET shards=public.user_monsters.shards+excluded.shards,
      total_battles=public.user_monsters.total_battles+1;
  -- Only server-generated events may yield a card; game_events client writes are revoked.
  IF v_won THEN
    SELECT ge.payload_json->'card' INTO v_card FROM public.game_events ge
    WHERE ge.session_id=p_session AND ge.event_type='card_drop' AND (ge.payload_json->>'slot')::int=v_slot
    ORDER BY ge.created_at DESC LIMIT 1;
    IF v_card IS NOT NULL AND v_card ? 'nome' AND v_card ? 'tipo' THEN
      v_card_key:=left(v_card->>'nome'||':'||v_card->>'tipo',80);
      INSERT INTO public.user_cards(user_id,card_key,card_data,raridade,quantity)
        VALUES(p_uid,v_card_key,v_card,coalesce(v_card->>'raridade','comum'),1)
        ON CONFLICT(user_id,card_key) DO UPDATE SET quantity=public.user_cards.quantity+1;
    END IF;
  END IF;
  -- Update only battle-count missions; event-level stats must come from verified game events.
  UPDATE public.user_missions um SET
    progress=least(dm.target_value,um.progress+CASE WHEN dm.mission_type='play_battles' THEN 1
      WHEN dm.mission_type='win_battles' AND v_won THEN 1 ELSE 0 END),
    completed=um.completed OR um.progress+CASE WHEN dm.mission_type='play_battles' THEN 1
      WHEN dm.mission_type='win_battles' AND v_won THEN 1 ELSE 0 END>=dm.target_value
    FROM public.daily_missions dm
    WHERE um.user_id=p_uid AND um.mission_id=dm.id
      AND um.assigned_date=(now() AT TIME ZONE 'UTC')::date AND NOT um.claimed
      AND dm.mission_type IN ('play_battles','win_battles');
  v_profile:=public.game_apply_progress(p_uid,v_coins,v_xp);
  RETURN jsonb_build_object('alreadyProcessed',false,'coins',v_coins,'xp',v_xp,
    'bonus',v_bonus,'streak',v_streak,'won',v_won,'profile',v_profile);
END $$;

REVOKE ALL ON FUNCTION public.game_apply_progress(uuid,integer,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.game_claim_daily(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.game_claim_mission(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.game_purchase(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.game_settle_battle(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.game_apply_progress(uuid,integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.game_claim_daily(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.game_claim_mission(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.game_purchase(uuid,uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.game_settle_battle(uuid,uuid) TO service_role;
