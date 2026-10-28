-- Read-only staging gate for Beast Arena AAA P0.
-- Execute as a trusted migration reviewer AFTER applying migration in isolated staging.
-- This script never credits a player and never writes production data.
DO $$
DECLARE required_func text;
BEGIN
  IF to_regclass('public.game_reward_ledger') IS NULL OR
     to_regclass('public.game_economy_config') IS NULL
  THEN RAISE EXCEPTION 'RED: ledger/config tables absent'; END IF;
  FOREACH required_func IN ARRAY ARRAY[
    'public.game_settle_battle(uuid,uuid)',
    'public.game_claim_daily(uuid)',
    'public.game_claim_mission(uuid,uuid)',
    'public.game_purchase(uuid,uuid,uuid)',
    'public.game_apply_progress(uuid,integer,integer)'
  ] LOOP
    IF NOT has_function_privilege('service_role',required_func,'EXECUTE')
       OR has_function_privilege('authenticated',required_func,'EXECUTE')
       OR has_function_privilege('anon',required_func,'EXECUTE')
    THEN RAISE EXCEPTION 'RED: insecure RPC grants for %',required_func; END IF;
  END LOOP;
  IF has_column_privilege('authenticated','public.profiles','coins','UPDATE')
     OR has_column_privilege('authenticated','public.profiles','xp','UPDATE')
     OR has_column_privilege('authenticated','public.profiles','level','UPDATE')
     OR has_column_privilege('authenticated','public.profiles','gems','UPDATE')
  THEN RAISE EXCEPTION 'RED: client can mutate profile economy'; END IF;
  IF NOT has_column_privilege('authenticated','public.profiles','display_name','UPDATE')
  THEN RAISE EXCEPTION 'RED: legitimate display name editing broken'; END IF;
  IF has_table_privilege('authenticated','public.game_sessions','UPDATE')
     OR has_table_privilege('authenticated','public.game_events','INSERT')
     OR has_table_privilege('authenticated','public.game_players','INSERT')
     OR has_table_privilege('authenticated','public.user_cards','INSERT')
     OR has_table_privilege('authenticated','public.user_cards','UPDATE')
     OR has_table_privilege('authenticated','public.user_inventory','INSERT')
     OR has_table_privilege('authenticated','public.battle_history','INSERT')
     OR has_table_privilege('authenticated','public.user_missions','UPDATE')
  THEN RAISE EXCEPTION 'RED: client can forge game state, loot or rewards'; END IF;
  IF NOT EXISTS(
     SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='game_reward_ledger'
       AND indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%user_id%' AND indexdef LIKE '%event_key%'
  ) THEN RAISE EXCEPTION 'RED: reward ledger uniqueness not established'; END IF;
  IF (SELECT count(*) FROM public.game_economy_config WHERE active) <> 1
  THEN RAISE EXCEPTION 'RED: expected exactly one active economy version'; END IF;
  RAISE NOTICE 'GREEN: read-only structural permission and ledger checks passed (runtime probes still required)';
END $$;
