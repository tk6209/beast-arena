"""Disposable PostgreSQL 17 regression test for the PR's exact migration.
Never connects to Supabase or reads external credentials. CI-only synthetic identities."""
from concurrent.futures import ThreadPoolExecutor
import json
import os
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DB=os.environ.get("AAA_PG_DATABASE","aaa_economy_ci")
HOST=os.environ.get("AAA_PG_HOST","127.0.0.1")
PORT=os.environ.get("AAA_PG_PORT","55439")
USER=os.environ.get("AAA_PG_USER","aaatest")
PASSWORD=os.environ.get("AAA_PG_PASSWORD","aaatest")
ENV={**os.environ,"PGPASSWORD":PASSWORD}
def run(query=None,path=None,ok=True,db=DB):
    cmd=["psql","-X","-qAt","-v","ON_ERROR_STOP=1","-h",HOST,"-p",PORT,"-U",USER,"-d",db]
    if path: cmd.extend(["-f",str(path)])
    else: cmd.extend(["-c",query])
    p=subprocess.run(cmd,env=ENV,encoding="utf-8",capture_output=True)
    if ok and p.returncode!=0: raise AssertionError("SQL FAILED: "+p.stderr[:1200])
    if not ok and p.returncode==0: raise AssertionError("EXPECTED SQL REJECTION but command succeeded")
    return p.stdout.strip()
def admin(sql):
    return run(sql)
UID="10000000-0000-4000-8000-000000000001"
OTHER="20000000-0000-4000-8000-000000000002"
MISSION="30000000-0000-4000-8000-000000000003"
USERMISSION="40000000-0000-4000-8000-000000000004"
MONSTER="50000000-0000-4000-8000-000000000005"
PACK="60000000-0000-4000-8000-000000000006"
SESSION="70000000-0000-4000-8000-000000000007"
LEGACY="80000000-0000-4000-8000-000000000008"
def rpc(sql,ok=True):
    return run("SET ROLE service_role; "+sql,ok=ok)
def check(name,fn):
    fn()
    print("PASS:",name,flush=True)
def response(sql):
    return json.loads(rpc(sql))
def count(table,where="true"):
    return int(admin("SELECT count(*) FROM "+table+" WHERE "+where))
def balance(uid=UID):
    return int(admin("SELECT coins FROM public.profiles WHERE user_id='"+uid+"'"))
def reject(q):
    run(q,ok=False)

def seed():
    run("CREATE DATABASE "+DB,db="postgres")
    run("""
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    """,db=DB)
    admin("""
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE public.profiles(user_id uuid PRIMARY KEY REFERENCES auth.users(id),display_name text,
      display_name_normalized text,name_changed_at timestamptz,avatar_url text,
      coins integer NOT NULL DEFAULT 0,xp integer NOT NULL DEFAULT 0,
      level integer NOT NULL DEFAULT 1,gems integer DEFAULT 0);
    CREATE TABLE public.daily_rewards(user_id uuid UNIQUE,last_claim_date date DEFAULT CURRENT_DATE,
      streak integer NOT NULL DEFAULT 1);
    CREATE TABLE public.game_sessions(id uuid PRIMARY KEY, status text DEFAULT 'waiting',state_json jsonb,
      current_turn integer DEFAULT 0, updated_at timestamptz DEFAULT now());
    CREATE TABLE public.game_players(session_id uuid,slot integer,user_id uuid,nickname text,
      monster_id text,hp integer,max_hp integer,state_json jsonb,UNIQUE(session_id,slot));
    CREATE TABLE public.game_events(id uuid DEFAULT gen_random_uuid(),session_id uuid,
      event_type text,payload_json jsonb,created_at timestamptz DEFAULT now(),player_slot integer);
    CREATE TABLE public.user_cards(user_id uuid,card_key text,card_data jsonb,raridade text,
      quantity integer, UNIQUE(user_id,card_key));
    CREATE TABLE public.battle_history(user_id uuid,session_id uuid,won boolean,monster_used text,
      opponent_monster text,mode text,dificuldade text,turns integer);
    CREATE TABLE public.user_stats(user_id uuid UNIQUE,total_wins integer DEFAULT 0,
      total_losses integer DEFAULT 0,win_streak integer DEFAULT 0,best_streak integer DEFAULT 0);
    CREATE TABLE public.user_inventory(user_id uuid,item_type text,item_key text,
      quantity integer DEFAULT 1,UNIQUE(user_id,item_type,item_key));
    CREATE TABLE public.user_missions(id uuid PRIMARY KEY,user_id uuid,mission_id uuid,
      progress integer DEFAULT 0,completed boolean DEFAULT false,claimed boolean DEFAULT false,
      assigned_date date DEFAULT CURRENT_DATE);
    CREATE TABLE public.daily_missions(id uuid PRIMARY KEY,mission_type text,target_value integer,
      reward_coins integer,reward_xp integer,active boolean DEFAULT true);
    CREATE TABLE public.user_monsters(user_id uuid,monster_id text,power_level integer DEFAULT 1,
      shards integer DEFAULT 0,total_battles integer DEFAULT 0,UNIQUE(user_id,monster_id));
    CREATE TABLE public.season_pass(user_id uuid UNIQUE,xp integer DEFAULT 0,tier integer DEFAULT 0);
    CREATE TABLE public.player_leagues(user_id uuid);
    CREATE TABLE public.gem_transactions(user_id uuid);
    CREATE TABLE public.shop_items(id uuid PRIMARY KEY,active boolean,item_type text,item_key text,
      price_coins integer,level_required integer);
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role;
    GRANT SELECT ON auth.users TO service_role;
    CREATE POLICY base_owner_select ON public.profiles FOR SELECT TO authenticated USING (auth.uid()=user_id);
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    """)
    run(path=ROOT/"supabase/migrations/20261028225000_aaa_economy_guardrails.sql")
    run(path=ROOT/"supabase/tests/aaa_economy_security.sql")
    admin("INSERT INTO auth.users(id) VALUES('"+UID+"'),('"+OTHER+"')")
    admin("INSERT INTO public.profiles(user_id,coins) VALUES('"+UID+"',100),('"+OTHER+"',100)")
    admin("INSERT INTO public.user_stats(user_id) VALUES('"+UID+"'),('"+OTHER+"')")
    admin("INSERT INTO public.daily_missions(id,mission_type,target_value,reward_coins,reward_xp) VALUES('"+
        MISSION+"','win_battles',1,25,10)")
    admin("INSERT INTO public.shop_items(id,active,item_type,item_key,price_coins,level_required) VALUES('"+
        MONSTER+"',true,'monster_unlock','drako',30,1),('"+
        PACK+"',true,'swarm_pack','swarm_pack_rare',15,1)")
    admin("INSERT INTO public.user_missions(id,user_id,mission_id,completed,progress) VALUES('"+
        USERMISSION+"','"+UID+"','"+MISSION+"',true,1)")

def tests():
    def legacy_daily():
        admin("INSERT INTO public.daily_rewards(user_id,last_claim_date,streak) VALUES('"+UID+"',CURRENT_DATE,1)")
        before=balance()
        r=response("SELECT public.game_claim_daily('"+UID+"')")
        assert r["alreadyClaimed"] and r["coins"]==0 and balance()==before
        assert count("public.game_reward_ledger","user_id='"+UID+"'")==0
    check("Prior daily claim cannot be double-paid after migration",legacy_daily)
    def ten_daily():
        before=balance(OTHER)
        def call(_): return response("SELECT public.game_claim_daily('"+OTHER+"')")
        with ThreadPoolExecutor(max_workers=10) as pool: result=list(pool.map(call,range(10)))
        assert sum(not x["alreadyClaimed"] for x in result)==1
        assert balance(OTHER)-before==50
        assert count("public.game_reward_ledger","user_id='"+OTHER+"' AND kind='daily'")==1
    check("10 simultaneous daily claims produce exactly one credit",ten_daily)
    def mission_provenance():
        before=balance()
        reject("SET ROLE service_role; SELECT public.game_claim_mission('"+UID+"','"+USERMISSION+"')")
        assert balance()==before
        admin("UPDATE public.user_missions SET trusted_progress_at=now() WHERE id='"+USERMISSION+"'")
        out=response("SELECT public.game_claim_mission('"+UID+"','"+USERMISSION+"')")
        again=response("SELECT public.game_claim_mission('"+UID+"','"+USERMISSION+"')")
        assert out["coins"]==25 and again["alreadyClaimed"] and balance()==before+25
    check("Pre-migration mission flags cannot mint rewards",mission_provenance)
    def purchase():
        before=balance()
        key="90000000-0000-4000-8000-000000000009"
        q="SELECT public.game_purchase('"+UID+"','"+MONSTER+"','"+key+"')"
        first=response(q);again=response(q)
        assert first["coins"]==before-30 and again["alreadyProcessed"] and balance()==before-30
        assert count("public.user_inventory","user_id='"+UID+"' AND item_key='drako'")==1
        reject("SET ROLE service_role; SELECT public.game_purchase('"+UID+"','"+MONSTER+"','a0000000-0000-4000-8000-00000000000a')")
        assert balance()==before-30
        reject("SET ROLE service_role; SELECT public.game_purchase('"+UID+"','"+PACK+"','b0000000-0000-4000-8000-00000000000b')")
        assert balance()==before-30
    check("Purchase retry, duplicate ownership and unavailable fulfillment",purchase)
    def battle():
        state=json.dumps({"fase":"resultado","modo":"ai","vencedor":0,
             "dificuldade":"medio","turno":3,"players":[{"monstro":{"id":"panther"}},{"monstro":{"id":"banana"}}]})
        admin("INSERT INTO public.game_sessions(id,status,state_json,trust_version) VALUES('"+
           SESSION+"','finished','"+state+"',1),('"+LEGACY+"','finished','"+state+"',0)")
        admin("INSERT INTO public.game_players(session_id,slot,user_id) VALUES('"+SESSION+"',0,'"+UID+"'),('"+LEGACY+"',0,'"+UID+"')")
        reject("SET ROLE service_role; SELECT public.game_settle_battle('"+OTHER+"','"+SESSION+"')")
        reject("SET ROLE service_role; SELECT public.game_settle_battle('"+UID+"','"+LEGACY+"')")
        before=balance()
        def one(_):return response("SELECT public.game_settle_battle('"+UID+"','"+SESSION+"')")
        with ThreadPoolExecutor(max_workers=10) as pool: result=list(pool.map(one,range(10)))
        assert sum(not x["alreadyProcessed"] for x in result)==1
        assert balance()==before+20
        assert count("public.game_reward_ledger","user_id='"+UID+"' AND kind='battle'")==1
        assert count("public.battle_history","user_id='"+UID+"'")==1
        assert count("public.user_monsters","user_id='"+UID+"' AND monster_id='panther'")==1
    check("10 simultaneous AI battles: one ledger and one battle history",battle)
    def permissions():
        reject("SET ROLE authenticated; SET request.jwt.claim.sub='"+UID+
           "'; UPDATE public.profiles SET coins=999 WHERE user_id='"+UID+"'")
        reject("SET ROLE authenticated; SET request.jwt.claim.sub='"+UID+
           "'; INSERT INTO public.game_events(session_id,event_type) VALUES('"+SESSION+"','card_drop')")
        assert balance() >= 0
        assert run("SELECT has_function_privilege('authenticated','public.game_settle_battle(uuid,uuid)','EXECUTE')")=="f"
    check("Authenticated caller cannot change coins, drop or execute privileged settlement",permissions)
    print("ALL DISPOSABLE POSTGRES GATES PASSED; live JWT/HTTP and real staging still mandatory",flush=True)
if __name__=="__main__":
    seed()
    tests()
