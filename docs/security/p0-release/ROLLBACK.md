# Reversible candidate — NOT applied to production

No balances, old claims, cards or historical rows are reset/backfilled by this candidate.

Before a future application, capture actual table/column ACLs (`pg_class.relacl`,
`pg_attribute.attacl`) and policy definitions. Restore those exact ACLs if reverting;
do **not** blindly restore historic unsafe grants from old migration files.

Deactivate the new caller first. Remove `p0_validate_deck` trigger from player_decks,
then revoke EXECUTE on p0_claim_daily / p0_settle_battle from service_role.
Leave the additive ledger and functions in place (inert); retain ledger audit data.
Restore only reviewed captured safe ACLs. Do not subtract past rewards or delete rows.

This is an operational rollback procedure, not an executed production rollback.
Atomic daily claim cannot be enabled alone while legacy account handlers remain reachable.
The staged boundary currently denies ALL account actions including daily; callers are not switched.