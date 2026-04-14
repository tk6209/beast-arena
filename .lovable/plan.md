

# Beast Arena — Polishing Execution Plan

## 1. CURRENT STATE VALIDATION

| Area | Status | Notes |
|------|--------|-------|
| Monster sync (client↔server) | **OK** | 5 new monsters added to edge function |
| Friends UI accessibility | **OK** | Button in lobby sidebar + full TelaAmigos with tabs |
| Invite sending flow | **PARTIAL** | GameInviteNotification receives invites; sending from friends list not wired |
| Invite receiving flow | **OK** | Realtime listener + accept/decline UI |
| PWA manifest | **PARTIAL** | Manifest exists with icons but no service worker, no splash screens |
| Mobile safe-area | **MISSING** | No `env(safe-area-inset-*)` anywhere; `pageBg` uses `min-height: 100vh` not `100dvh` |
| Single-player UX flow | **OK** | Home → name → monster → battle → result works; 3-step friction is acceptable |
| Tutorial | **OK** | Interactive SVG-mask spotlight tutorial on first battle |
| Audio controls | **OK** | SFX/Music/Voice toggles persisted to DB |
| Battle context guards | **OK** | `battleContext.ts` prevents stale audio |
| Profile / public_id | **OK** | Immutable `beast-xxxxxxxx`, name cooldown |

## 2. CRITICAL ISSUES (Priority Order)

1. **No safe-area CSS** — On notched iPhones, content is clipped by the notch and home indicator. `pageBg()` uses `100vh` instead of `100dvh`.
2. **Invite sending missing** — TelaAmigos lists friends but has no "Invite to play" button. The `game_invites` table and notification system exist but can't be triggered from UI.
3. **`MONSTER_GLOW` in styles.ts is stale** — Only 5 original monsters listed; 5 new ones missing. Not critical (fallback works) but causes inconsistent glow effects.
4. **TelaHome is 755 lines** — Coupled intro animation, SFX, ranking, auth, difficulty select all in one file.
5. **No service worker guard** — Manifest declares `standalone` but no registration guard exists in `main.tsx` to prevent SW issues in Lovable preview.

## 3. EXECUTION PHASES

### Phase 1 — Mobile Shell & Safe Areas (Low risk)
**Objective:** Make the app feel native on notched devices.
**Scope:**
- Update `pageBg()` in `styles.ts`: `minHeight: "100dvh"` + `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)`
- Add to `index.css`: `html { height: -webkit-fill-available; }` and safe-area padding utilities
- Update bottom bars in `TelaLobbyPrincipal` and `TelaHome` to respect `safe-area-inset-bottom`
- **Files:** `src/game/styles.ts`, `src/index.css`, `TelaHome.tsx`, `TelaLobbyPrincipal.tsx`
- **Risk:** Low — CSS-only changes
- **Impact:** Immediate visual improvement on all iPhones

### Phase 2 — Social Completion (Medium risk)
**Objective:** Make invite-to-play functional end-to-end.
**Scope:**
- Add "⚔️ Convidar" button next to each friend in TelaAmigos friends list
- On click: create `game_sessions` row via edge function, insert `game_invites` row, navigate inviter to lobby/waiting
- Handle edge cases: already in game, expired invite, self-invite prevention
- **Files:** `TelaAmigos.tsx`, `Index.tsx` (new callback `onInviteFriend`)
- **Risk:** Medium — touches multiplayer flow
- **Impact:** Core social loop completed

### Phase 3 — UI Polish Pass (Low risk)
**Objective:** Tighten visual hierarchy on key screens.
**Scope:**
- Update `MONSTER_GLOW` in `styles.ts` to include all 10 monsters
- Home screen: reduce vertical spacing, tighten ranking card
- Lobby: ensure bottom tab bar has consistent safe-area padding
- Profile: align public_id display and stats layout
- **Files:** `styles.ts`, `TelaHome.tsx`, `TelaLobbyPrincipal.tsx`, `TelaPerfil.tsx`
- **Risk:** Low — visual tweaks only
- **Impact:** Perceived quality increase

### Phase 4 — PWA Hardening (Low risk)
**Objective:** Make installable without breaking preview.
**Scope:**
- Keep current manifest (no service worker needed for installability)
- Add SW registration guard in `main.tsx` to unregister any stale workers in iframe/preview
- Add `apple-touch-startup-image` meta tags for iOS splash
- Validate manifest with Lighthouse checks
- **Files:** `src/main.tsx`, `index.html`
- **Risk:** Low — additive only, guard prevents preview issues
- **Impact:** Clean install experience on iOS/Android

## 4. PWA COMPLETION PLAN

**Already done:** manifest.webmanifest with 192/512 icons, standalone display, theme color, apple-touch-icon.

**Missing:**
1. **SW guard in main.tsx** — Add iframe/preview detection to unregister stale workers (code from PWA skill docs)
2. **iOS splash images** — Not critical; can add `apple-touch-startup-image` link tags for common sizes
3. **No offline support needed** — Game requires network for Supabase; skip `vite-plugin-pwa`
4. **Manifest `id` field** — Add `"id": "/"` for stable app identity

**Do NOT add:** vite-plugin-pwa, workbox, or any service worker registration. The manifest alone provides Add-to-Home-Screen.

## 5. MOBILE UX / APP SHELL PLAN

| Issue | Fix |
|-------|-----|
| `100vh` causes bottom cut on iOS Safari | Change to `100dvh` in `pageBg()` |
| No safe-area insets | Add `padding: env(safe-area-inset-*)` to page containers |
| Bottom bar overlaps home indicator | Add `padding-bottom: max(14px, env(safe-area-inset-bottom))` to bottom tabs |
| Scroll bounce shows white bg | Add `overscroll-behavior: none` to body |
| No status bar blending | Already handled by `black-translucent` meta tag |

## 6. SINGLE PLAYER UX IMPROVEMENT PLAN

Current flow: Tap → Intro → Home → Choose mode → Name → Monster → Battle. **6 taps to first battle.**

**Quick wins (no restructuring):**
- Remember last used name in localStorage; auto-fill on TelaNome
- Remember last monster choice; pre-select it on TelaMonstro
- Skip intro animation on return visits (check localStorage flag)
- **Result: 3 taps to battle for returning players**

**Do NOT change:** The Name/Monster selection flow is core to identity. Don't skip it.

## 7. SOCIAL / INVITES COMPLETION PLAN

**Working:** Friend requests (send/accept/decline), friends list, realtime updates, invite notification popup.

**Missing piece:** "Invite to play" button in friends list.

**Implementation:**
1. In `TelaAmigos.tsx`, add button per friend row
2. On click: call edge function to create session + insert invite
3. Navigate inviter to waiting screen (TelaLobby or new waiting state)
4. Invitee sees `GameInviteNotification` popup (already working)
5. On accept: both enter battle

**Edge cases to handle:**
- Friend offline → invite expires (2min TTL already set in DB default)
- Multiple pending invites → show most recent only (already implemented)
- Inviter cancels → delete invite row

## 8. UI POLISH TARGETS

| Screen | Issue | Fix |
|--------|-------|-----|
| TelaHome | Too much vertical scroll on small phones | Reduce spacing, compact ranking |
| TelaRanking | Basic list, no visual differentiation | Add league badges, row highlighting |
| TelaAuth | Generic form | Add Beast Arena branding, monster silhouette bg |
| TelaLobbyPrincipal bottom bar | No safe-area padding | Add env() padding |

## 9. TECHNICAL REFACTOR NEEDS

| Item | Priority | Notes |
|------|----------|-------|
| `TelaBatalha.tsx` (950 lines) | **Recommended** | Extract `useBattleEngine`, `useBattleAudio`, `useTurnTimer` hooks. Not blocking but makes future work harder. |
| `TelaHome.tsx` (755 lines) | **Optional** | Extract IntroOverlay and TapGate to separate files. Low urgency. |
| `MONSTER_GLOW` stale data | **Recommended** | Add 5 missing monsters to `styles.ts`. Quick fix. |
| Inline styles everywhere | **Optional** | Current approach works for this project size. Not worth migrating. |
| Duplicated monster data (client vs server) | **Recommended** | Consider shared JSON imported by both. Not critical now since sync was done manually. |

## 10. FINAL PRIORITIZED EXECUTION LIST

1. **Fix safe-area + dvh** in `styles.ts`, `index.css`, `TelaHome`, `TelaLobbyPrincipal` bottom bars
2. **Add SW guard** in `main.tsx` to prevent stale service workers in preview
3. **Update `MONSTER_GLOW`** in `styles.ts` with all 10 monsters
4. **Add "Invite to play" button** in `TelaAmigos.tsx` friend rows
5. **Wire invite flow** in `Index.tsx` — new `onInviteFriend` callback creating session + invite
6. **Auto-fill returning player name** — localStorage cache in `TelaNome.tsx`
7. **Skip intro on revisit** — localStorage flag in `TelaHome.tsx`
8. **Add safe-area bottom padding** to all bottom navigation bars
9. **Compact TelaHome layout** — reduce spacing for small viewports
10. **Add `overscroll-behavior: none`** to body in `index.css`

