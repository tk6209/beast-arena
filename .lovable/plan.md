

## Move Ranking Above Game Mode Buttons

**What:** Reorder the TelaHome layout so the Ranking block appears before the "Duelo vs IA" and "Multijogador" buttons.

**How:** In `src/components/game/screens/TelaHome.tsx` (lines 600-740), move the Ranking block (lines 660-703) to appear before the Buttons block (lines 622-658). The final order will be:

1. Monster name
2. Shop button (if logged in)
3. **🏆 RANKING** ← moved up
4. ⚔️ DUELO vs IA / 🌐 MULTIJOGADOR buttons
5. 🔑 LOGIN / CADASTRO

**Changes:** Single file edit — swap the position of two JSX blocks. Adjust `marginTop` on ranking to `0` and add `marginBottom: 12` instead.

