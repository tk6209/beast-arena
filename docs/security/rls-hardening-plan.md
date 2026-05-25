# RLS Hardening Matrix and Migration Plan

## Matrix (`authenticated` vs `service_role`)

| Table | authenticated SELECT | authenticated INSERT | authenticated UPDATE | authenticated DELETE | service_role |
|---|---|---|---|---|---|
| `profiles` | Own/public profile | No | Safe fields only (no economy fields) | No | Full |
| `user_stats` | Own row | No | No | No | Full |
| `battle_history` | Own rows | No | No | No | Full |
| `daily_rewards` | Own row | No | No | No | Full |
| `game_players` | Session rows where user participates | Join flow only | Only own slot row | No | Full |
| `game_events` | Session rows where user participates | Only own slot in own session | No | No | Full |
| `gem_transactions` | Own ledger | No | No | No | Full |
| `player_leagues` | Own row / public leaderboard read | No | No | No | Full |
| `rankings` | Public read | No | No | No | Full |
| `weekly_leaderboard` | Public read | No | No | No | Full |
| `season_pass` | Own row | No | No | No | Full |
| `user_achievements` | Own rows | No | No | No | Full |
| `user_cards` | Own rows | No | No | No | Full |
| `user_inventory` | Own rows | No | No | No | Full |
| `user_missions` | Own rows | No | No | No | Full |
| `user_monsters` | Own rows | No | No (server-authoritative progression) | No | Full |
| `friendships` | Own relations | No (only trusted flow) | No | Optional controlled unfriend only | Full |

## Priority execution template

### P0 (immediate)
- Remove permissive client `INSERT/UPDATE` on economy, ranking, and progression tables.
- Restrict `game_events` insert to own slot.
- Restrict `game_players` update to own row.
- Lock sensitive `profiles` fields (`coins`, `gems`, `xp`, `level`, `public_id`).

### P1 (1-3 days)
- Move purchase/reward/progression to server-authoritative RPC/Edge.
- Enforce atomic transactions for purchase + debit + grant + ledger.

### P2 (3-7 days)
- Add anomaly/audit checks and monitoring.
- Re-scan after each wave and close any residual policy gaps.
