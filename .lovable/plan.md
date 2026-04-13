

# UX Redesign: Cards as the Hero

## Problem
On a 390px mobile viewport, the current battle screen stacks too many elements vertically: two full monster displays (with avatars, stats, swarms), a VS divider, a log panel, tiny 108x158px cards in a fan, and action buttons. The cards -- the core gameplay element -- end up cramped and unreadable.

## New Layout Concept

```text
┌─────────────────────────────┐
│  ┌─ ENEMY HP BAR ─────────┐ │  <- Compact: emoji + name + HP bar (32px tall)
│  └─────────────────────────┘ │
│                               │
│  ┌─────────────────────────┐ │
│  │                         │ │
│  │    SELECTED CARD        │ │  <- Large card (240x350px), centered
│  │    (full detail view)   │ │     Shows the active/selected card big
│  │                         │ │
│  └─────────────────────────┘ │
│                               │
│  [ ⚡ JOGAR ]  [ ⏭ PASSAR ] │  <- Action buttons
│                               │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │  <- Card thumbnails (scrollable row)
│  │c1│ │c2│ │c3│ │c4│ │c5│  │     ~64px wide mini-cards, tap to select
│  └──┘ └──┘ └──┘ └──┘ └──┘  │
│                               │
│  ┌─ YOUR HP BAR ──────────┐ │  <- Compact: emoji + name + HP bar (32px tall)
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

## Changes

### 1. New `HpBar` component (replaces `MonstroDisplay` in battle)
- Single horizontal row: emoji (24px) + name + inline HP bar + HP numbers
- ATK/DEF as small badges inline
- Swarm dots as tiny colored circles
- Total height: ~36px per player

### 2. Redesigned `Carta.tsx` -- two modes
- **Thumbnail mode** (`mini` prop): 64x90px, shows emoji + type badge + value only
- **Full mode** (default): 260x380px, large emoji art area (120px), readable text, prominent stats
- Selected card renders in full mode in the center stage area

### 3. Redesigned `TelaBatalha.tsx` layout
- Top: enemy compact HP bar
- Center: large selected card (or prompt text "Toque uma carta" if none selected)
- Below center: action buttons
- Bottom: horizontally scrollable row of mini card thumbnails
- Very bottom: player compact HP bar
- Game log becomes a floating toast/overlay on actions (auto-dismiss after 2s) instead of a fixed panel

### 4. GameLog as floating toasts
- Last 2-3 log entries appear as small floating banners at top center
- Fade in/out with animation
- No longer takes vertical space permanently

## Files to modify
- `src/components/game/Carta.tsx` -- add `mini` prop for thumbnail mode, scale up default
- `src/components/game/MonstroDisplay.tsx` -- new `compact` prop for bar-only mode
- `src/components/game/screens/TelaBatalha.tsx` -- new layout with card-centric design
- `src/components/game/GameLog.tsx` -- convert to floating toast style

## What stays the same
- All game logic, server API calls, state management
- Card data structure and palette system
- All mechanics (swarms, evolution, effects)
- Sound/voice narration

