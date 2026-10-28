import { describe, expect, it } from 'vitest';
import { guardUnactivatedAccountAction } from '../../docs/security/p0-release/accountBoundary';
import { ECONOMY_CONFIG } from '../../docs/security/p0-release/economyConfig';
import { readFileSync } from 'node:fs';
import { initGame, choosePower, passTurn } from './serverApi';
import { vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: vi.fn() }, from: vi.fn() } }));

describe('P0 unactivated server boundary', () => {
  it.each(['record_battle_result','settle_battle','save_card_drop','claim_daily_reward','claim_mission_reward','purchase_item','init_game'])('%s denies persisted economy', action => {
    expect(guardUnactivatedAccountAction(action,'verified-user').status).toBe(503);
    expect(guardUnactivatedAccountAction(action,null).status).toBe(401);
  });
  it.each([2,10])('%i concurrent mission/purchase requests are all closed (not successful settlement tests)', async n => {
    for (const action of ['claim_mission_reward','purchase_item']) {
      const results=await Promise.all(Array.from({length:n},async()=>guardUnactivatedAccountAction(action,'owner')));
      expect(results.filter(r=>r.status===503)).toHaveLength(n);
    }
  });
  it('uses proposed daily values exactly and keeps typed/SQL config identical', () => {
    expect(ECONOMY_CONFIG.daily).toEqual([10,15,20,30,40,50,75]);
    const sql=readFileSync('docs/security/p0-release/001_quarantine_and_daily.sql','utf8');
    const config=sql.match(/SELECT '(\{"version"[^\n]+)'::jsonb/);
    expect(config).not.toBeNull();
    expect(JSON.parse(config?.[1] || '{}')).toEqual(ECONOMY_CONFIG);
  });
  it('has a finite proposed streak cap and no negative proposed rewards', () => {
    expect(ECONOMY_CONFIG.streak.maximumRewardedWins).toBe(5);
    for(const difficulty of Object.values(ECONOMY_CONFIG.battle)) {
      for(const reward of [difficulty.win,difficulty.loss]) {
        expect(reward.coins).toBeGreaterThanOrEqual(0);
        expect(reward.xp).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('preserves a guest AI round with no remote request and non-eligible session', async () => {
    const result=await initGame(null,'ai',[{slot:0,nome:'Guest',monstroId:'panther',powerLevel:500}],'medio');
    expect(result.sessionId).toMatch(/^demo:/);
    expect(result.rewardEligible).toBe(false);
    const powered=await choosePower(result.sessionId,0,'fogo');
    expect(powered.state.players).toHaveLength(2);
    const turn=await passTurn(result.sessionId,0);
    expect(turn.state.turno).toBeGreaterThanOrEqual(1);
  });
});