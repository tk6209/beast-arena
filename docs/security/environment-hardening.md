# Environment hardening

## Finding

A tracked `.env` file existed in the public repository at the start of the Joshua Edition work.

The implementation intentionally did **not** inspect or reproduce its values. The file has been removed from the feature branch and local environment files are now ignored, with `.env.example` kept as the only committed template.

## Residual risk

Removing a file from the current tree does not remove it from existing Git history. If the historical file ever contained private credentials, those values must be treated as exposed because the repository is public.

## Required operational check

Before production merge:

1. Review the affected provider dashboards without pasting credentials into issues or chat.
2. Rotate any private secret, service-role token, database password or other non-public credential that was ever stored in the tracked file.
3. Public browser configuration such as an intended Supabase anon/publishable key may remain public, but it must rely on correct RLS and authorization controls.
4. Keep new local values in `.env.local` or the deployment platform's secret store.

## Repository controls applied

- `.env` removed from the current branch.
- `.env` and `.env.*` ignored.
- `.env.example` explicitly allowed and contains placeholders only.
- Common private-key/service-role identifiers were searched in repository code; no additional matches were returned by the repository search used during this change.

## History rewrite

A Git history rewrite is not performed automatically by this change because it is destructive for collaborators and does not replace credential rotation. If confirmed secrets existed, rotate first; consider history cleanup separately.
