"""Disposable database ONLY. Explicit host/port/database; never read production credentials.
Run after local initdb; creates synthetic fixtures, NOT a production schema clone.
"""
import concurrent.futures
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BASE = ['psql', '-h', '127.0.0.1', '-p', '55439', '-U', 'lovable', '-d', 'host=127.0.0.1 port=55439 user=lovable dbname=postgres sslmode=disable', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1']
def sql(query, ok=True):
    out = subprocess.run(BASE + ['-c', query], capture_output=True, text=True)
    if ok and out.returncode: raise AssertionError(out.stderr)
    if not ok: assert out.returncode != 0, 'Expected database rejection'
    return out.stdout.strip()

sql('''CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE profiles(user_id uuid PRIMARY KEY,coins integer NOT NULL DEFAULT 0,xp integer DEFAULT 0,level integer DEFAULT 1,display_name text DEFAULT 'Jogador',display_name_normalized text,name_changed_at timestamptz,avatar_url text);
CREATE TABLE daily_rewards(user_id uuid UNIQUE,last_claim_date date,streak integer);
CREATE TABLE user_cards(user_id uuid,card_key text,card_data jsonb,quantity integer,UNIQUE(user_id,card_key));
CREATE TABLE user_monsters(user_id uuid,monster_id text);
CREATE TABLE player_decks(user_id uuid,monster_id text,cards jsonb);
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT ALL ON profiles,daily_rewards,user_cards,user_monsters,player_decks TO anon,authenticated,service_role;
''')
tables = ['battle_history','user_inventory','user_missions','user_stats','user_achievements','season_pass','gem_transactions','player_leagues','weekly_leaderboard','rankings','game_events','game_players','game_sessions']
for table in tables:
    sql(f'CREATE TABLE {table}(user_id uuid); GRANT ALL ON {table} TO anon,authenticated,service_role;')
candidate = ROOT / 'docs/security/p0-release/001_quarantine_and_daily.sql'
sql(candidate.read_text())
UID = '00000000-0000-4000-8000-000000000001'
OTHER = '00000000-0000-4000-8000-000000000002'
checks = []
def report(name, observed):
    checks.append({'scenario': name, 'observed': observed, 'conclusion': 'PASS'})
sql(f"INSERT INTO profiles(user_id,coins) VALUES ('{UID}',100),('{OTHER}',200)")
for n in [2,10]:
    # Reset synthetic fixtures ONLY, not production balances.
    sql(f"DELETE FROM p0_economy_ledger WHERE user_id='{UID}'; DELETE FROM daily_rewards WHERE user_id='{UID}'; UPDATE profiles SET coins=100 WHERE user_id='{UID}'")
    def claim(_): return json.loads(sql(f"SET ROLE service_role; SELECT p0_claim_daily('{UID}')"))
    with concurrent.futures.ThreadPoolExecutor(max_workers=n) as pool: receipts=list(pool.map(claim,range(n)))
    assert all(r == receipts[0] for r in receipts)
    assert sql(f"SELECT coins FROM profiles WHERE user_id='{UID}'") == '110'
    assert sql(f"SELECT count(*) FROM p0_economy_ledger WHERE user_id='{UID}'") == '1'
    report(f'{n} concurrent daily claims', {'before':100,'after':110,'ledger':1,'identical_receipts':n})
for day,amount in enumerate([10,15,20,30,40,50,75],1):
    sql(f"DELETE FROM p0_economy_ledger WHERE user_id='{UID}'; DELETE FROM daily_rewards WHERE user_id='{UID}'; UPDATE profiles SET coins=100 WHERE user_id='{UID}'")
    if day>1: sql(f"INSERT INTO daily_rewards VALUES ('{UID}',(now() AT TIME ZONE 'UTC')::date-1,{day-1})")
    receipt=json.loads(sql(f"SET ROLE service_role; SELECT p0_claim_daily('{UID}')"))
    assert receipt['coins']==amount and receipt['balance']==100+amount
    assert receipt['streak']==day
report('daily canonical proposal days 1–7', [10,15,20,30,40,50,75])
before=sql(f"SELECT coins FROM profiles WHERE user_id='{UID}'")
for bad in [f"SET ROLE authenticated; SELECT p0_claim_daily('{OTHER}')", 'SET ROLE service_role; SELECT p0_claim_daily(NULL)', f"SET ROLE service_role; SELECT p0_claim_daily('00000000-0000-4000-8000-999999999999')"]:
    sql(bad,ok=False)
assert sql(f"SELECT coins FROM profiles WHERE user_id='{UID}'")==before
report('RPC grants, guest, missing owner', 'Rejected, balance unchanged')
for table in tables+['daily_rewards','user_cards','user_monsters','p0_economy_ledger']:
    for verb in ['INSERT','UPDATE','DELETE']:
        assert sql(f"SELECT has_table_privilege('authenticated','public.{table}','{verb}')")=='f'
report('direct monetary/session writes', 'All tested authenticated INSERT/UPDATE/DELETE grants revoked')
sql(f"SET ROLE authenticated; UPDATE profiles SET coins=500 WHERE user_id='{UID}'",ok=False)
sql(f"SET ROLE authenticated; UPDATE profiles SET display_name='Vinicius' WHERE user_id='{UID}'")
report('profile name versus coins', 'Name update allowed; coin update denied (fixture lacks production name trigger)')
before=sql(f"SELECT coins FROM profiles WHERE user_id='{UID}'")
for session in ['00000000-0000-4000-8000-000000000003', OTHER]:
    for _ in range(2): sql(f"SET ROLE service_role; SELECT p0_settle_battle('{UID}','{session}')",ok=False)
assert sql(f"SELECT coins FROM profiles WHERE user_id='{UID}'")==before
assert sql('SELECT count(*) FROM battle_history')=='0'
report('replayed/stale/cross-user battle settlement', 'Always denied; no balance/history mutation')
# New deck writes: five owned canonical cards, two copies each. No balance/progression grants.
sql(f"INSERT INTO user_monsters VALUES ('{UID}','panther')")
deck=[]
for i in range(5):
    card={'id':i+1,'tipo':'ataque','valor':10}
    sql(f"INSERT INTO user_cards VALUES ('{UID}','card{i}','{json.dumps(card)}',2)")
    deck.extend([{**card,'card_key':f'card{i}'}]*2)
def write_deck(cards,owner=UID,ok=True):
    return sql(f"SET ROLE authenticated; SET request.jwt.claim.sub='{UID}'; INSERT INTO player_decks VALUES ('{owner}','panther','{json.dumps(cards)}')",ok=ok)
write_deck(deck)
write_deck(deck[:8],ok=False)
write_deck([deck[0]]*3+deck[3:],ok=False)
forged=[{**deck[0],'valor':500}]+deck[1:]
write_deck(forged,ok=False)
write_deck(deck,owner=OTHER,ok=False)
sql(f"UPDATE user_cards SET quantity=1 WHERE user_id='{UID}' AND card_key='card0'")
write_deck(deck,ok=False)
report('deck ownership/canonical data/10 cards/max 2 copies', 'Valid owned deck accepted; 8 cards, 3 copies, forged data, cross-user, over-inventory denied')
# Property sweep: for all synthetic starting balances 0..20, the one-shot daily operation is nonnegative.
for starting in range(21):
    sql(f"DELETE FROM p0_economy_ledger WHERE user_id='{UID}'; DELETE FROM daily_rewards WHERE user_id='{UID}'; UPDATE profiles SET coins={starting} WHERE user_id='{UID}'")
    a=json.loads(sql(f"SET ROLE service_role; SELECT p0_claim_daily('{UID}')"))
    b=json.loads(sql(f"SET ROLE service_role; SELECT p0_claim_daily('{UID}')"))
    assert a==b and a['balance']==starting+10 and a['balance']>=0
    assert sql(f"SELECT count(*) FROM p0_economy_ledger WHERE user_id='{UID}'")=='1'
report('property sweep nonnegative/exactly-once daily', '21 starting balances, 42 calls, one ledger per fixture')
# Force a late SQL error to prove the profile update rolls back with the claim and ledger.
sql(f"DELETE FROM p0_economy_ledger WHERE user_id='{UID}'; DELETE FROM daily_rewards WHERE user_id='{UID}'")
sql("CREATE FUNCTION fail_ledger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected server error'; END $$; CREATE TRIGGER fail_ledger BEFORE INSERT ON p0_economy_ledger FOR EACH ROW EXECUTE FUNCTION fail_ledger();")
before=sql(f"SELECT coins FROM profiles WHERE user_id='{UID}'")
sql(f"SET ROLE service_role; SELECT p0_claim_daily('{UID}')",ok=False)
assert sql(f"SELECT coins FROM profiles WHERE user_id='{UID}'")==before
assert sql(f"SELECT count(*) FROM daily_rewards WHERE user_id='{UID}'")=='0'
assert sql(f"SELECT count(*) FROM p0_economy_ledger WHERE user_id='{UID}'")=='0'
report('late server failure ACID rollback', {'before':before,'after':before,'claims':0,'ledger':0})
print(json.dumps({'target':'disposable PostgreSQL 17, synthetic schema','checks':checks},indent=2))