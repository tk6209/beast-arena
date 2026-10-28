/** Staged server boundary: no request reaches the legacy read/modify/write handlers. */
export interface BoundaryResult { status: number; body: { error: string; code: string } }
const actions = new Set(['record_battle_result', 'settle_battle', 'save_card_drop',
  'claim_daily_reward', 'claim_mission_reward', 'purchase_item', 'init_game']);
export function guardUnactivatedAccountAction(action: unknown, verifiedUserId: string | null): BoundaryResult {
  if (!verifiedUserId) return { status: 401, body: { error: 'Autenticação necessária', code: 'AUTH_REQUIRED' } };
  if (typeof action !== 'string' || !actions.has(action)) {
    return { status: 422, body: { error: 'Ação inválida', code: 'INVALID_ACTION' } };
  }
  return { status: 503, body: { error: 'Economia não ativada; nenhum saldo alterado', code: 'ECONOMY_NOT_ACTIVATED' } };
}