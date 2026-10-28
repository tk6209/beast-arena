/** No remote economy requests until the isolated P0 release is verified and activated. */
export class EconomyUnavailableError extends Error {
  readonly status = 503;
  readonly code = 'ECONOMY_NOT_ACTIVATED';
  constructor() {
    super('Recompensas e compras temporariamente indisponíveis. Nenhum saldo foi alterado.');
  }
}
export function requireVerifiedEconomy(): never {
  throw new EconomyUnavailableError();
}