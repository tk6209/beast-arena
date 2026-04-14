## Plan: 4 Changes to Improve Game Flow & Add Card Combos

### 1. Skip name screen for logged-in users

**What:** When `user` is logged in, `handleIniciar` should fetch the display name from the profile and skip `TelaNome`, going directly to `TelaMonstro`.
**Files:** `src/pages/Index.tsx`
**Risk:** Low

&nbsp;

A) Revamp the lobby layout using the Mr beast labs reference for layout

### 2. Prevent simultaneous logins

**What:** On auth state change, call `supabase.auth.signOut({ scope: 'others' })` to invalidate all other sessions. This ensures only one active session per account.
**Files:** `src/pages/Index.tsx` (in the auth listener useEffect)
**Risk:** Low

### 3. Remove the 5-round minimum win restriction

**What:** Currently there's no explicit 5-round check in the engine — the "can't win early" feel comes from easy mode damage scaling (`easyDamageMultiplier` returns 0.6 for rounds ≤2, 0.8 for ≤4) and the damage cap of 30 for rounds ≤3. Fix: raise the early-round multipliers and remove the damage cap so games can end naturally in any number of rounds.
**Files:** `supabase/functions/game-engine/index.ts` (lines 48-62), `src/game/easyModeBalance.ts`
**Changes:**

- Rounds 1-2: multiplier 0.6 → 0.85
- Rounds 3-4: multiplier 0.8 → 0.95
- Remove damage cap entirely (return Infinity for all rounds)

### 4. Card combination system (new mechanic)

**What:** Allow players to combine two cards of the same type in one turn for a stronger effect, but receive only 1 card (instead of a full hand) on the next round replenish.

**Mechanics:**

- **Same-type combo:** Two attack cards → combined `valor` × 1.5. Two defense cards → combined shield. Two heal cards → combined heal.
- **Monster + Swarm combo:** If player plays an attack card while having swarms equipped, the swarm ATK bonus is already applied (this already works). No additional change needed — clarify to user this is already functional.
- **Penalty:** Player who combos gets `comboUsed = true` flag. On `advanceTurn`, if `comboUsed`, that player's hand is only 1 card instead of 5.

**Implementation:**

- New action `combo_cards` in edge function accepting two card IDs
- New handler `handleComboCards` that validates both cards are same type, calculates combined effect, applies it, marks `comboUsed` on player
- In `advanceTurn`, check `comboUsed` flag → `novaMao(1, ...)` instead of `novaMao(5, ...)`, then reset flag
- New `serverApi.ts` export: `comboCards(sessionId, slot, cardId1, cardId2)`
- UI in `TelaBatalha.tsx`: when 2 cards of same type are selected, show "⚡ COMBO" button instead of "JOGAR"

**Files:** `supabase/functions/game-engine/index.ts`, `src/game/serverApi.ts`, `src/components/game/screens/TelaBatalha.tsx`
**Risk:** Medium — new game mechanic, needs careful testing

### Execution Order

1. Skip name for logged users (Index.tsx)
2. Prevent simultaneous logins (Index.tsx)
3. Fix easy mode damage scaling (edge function + easyModeBalance.ts)
4. Add combo card system (edge function + serverApi + TelaBatalha)
5. Deploy edge function