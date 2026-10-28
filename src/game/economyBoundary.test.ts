import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: vi.fn() }, from: vi.fn() } }));
import { supabase } from '@/integrations/supabase/client';
import { recordBattleResult, saveCardDrop, claimDailyReward, claimMissionReward, purchaseShopItem } from './serverApi';

describe('P0 quarantine: no unverified monetary request leaves the device', () => {
  it.each([
    ['tampered won', () => recordBattleResult({ won: true } as never)],
    ['coinBase=500', () => recordBattleResult({ coinBase: 500 } as never)],
    ['xpGain=500', () => recordBattleResult({ xpGain: 500 } as never)],
    ['forged card', () => saveCardDrop('forged-user', { id: 'fake', valor: 999 })],
    ['guest settlement', () => recordBattleResult({ sessionId: null } as never)],
    ['cross-user settlement', () => recordBattleResult({ sessionId: 'other' } as never)],
    ['daily', () => claimDailyReward()],
    ['mission', () => claimMissionReward({ userMissionId: 'mission' })],
    ['purchase', () => purchaseShopItem({ itemId: 'item', eventKey: 'event' })],
  ])('%s fails closed without auth reads or writes', async (_, call) => {
    vi.mocked(supabase.auth.getSession).mockClear();
    await expect(call()).rejects.toMatchObject({ code: 'ECONOMY_NOT_ACTIVATED', status: 503 });
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});