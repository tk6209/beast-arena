# CAPYNITE CHARACTER SYSTEM ARCHITECTURE

**Canonical Character Operating System (Character OS)**

- **Version:** 1.0
- **Status:** Canonical Foundation
- **Project:** Capynite
- **Purpose:** Define the scalable visual, modular, and implementation architecture for all Capynite characters.

---

## 1. Overview

Capynite characters must not be implemented as isolated static designs.

The project adopts a modular **Character Operating System** approach inspired by:

- Fortnite
- Pixar character pipelines
- Roblox modular avatars
- Stylized game-ready asset systems

The goal is to create:

- visual consistency
- scalable character creation
- reusable assets
- procedural extensibility
- future compatibility with games, animation, AI pipelines, and storytelling systems

---

## 2. Core Principle

A character is **not** a unique model.

A character is:

**Canonical Base Capybara + Accessories + Colors + Expressions + Personality + Animation Style = Final Character**

This means:

- Capivini is not a standalone mesh.
- CapiNinja is not a standalone mesh.
- Every character is a composition recipe built from a shared canonical base.

---

## 3. 3-Layer Architecture

The architecture is divided into three main layers.

### Layer 1 — Canonical Base

**File:** `characters/base/capy_base.json`

**Purpose:** Defines the immutable anatomical and visual foundation of all characters.

**Contains:**

- body proportions
- silhouette
- facial structure
- default palette
- attachment points
- rigging guidelines
- canonical proportions
- turnaround references

**Rules:**

- Must remain stable.
- Must preserve recognizable Capynite identity.
- Variants cannot modify core anatomy unless explicitly approved.

### Layer 2 — Modular Assets

**Folders:**

- `characters/accessories/`
- `characters/materials/`
- `characters/expressions/`
- `characters/animations/`

**Purpose:** Contains all reusable modular components.

**Examples:**

- ninja hood
- tactical vest
- shield potion
- rocket launcher
- backpacks
- belts
- facial expressions
- animation packs

**Rules:**

- Accessories must be reusable.
- Accessories must attach using predefined attachment points.
- Accessories should not permanently alter base geometry.
- Child-friendly readability must always be preserved.

### Layer 3 — Character Recipes

**Files:**

- `characters/variants/capivini.json`
- `characters/variants/capininja.json`
- `characters/variants/capirocket.json`
- `characters/variants/capizozo.json`

**Purpose:** Defines character compositions using the base + modular assets.

**Example recipe:**

```json
{
  "base": "capy_base",
  "accessories": ["ninja_hood", "katana_back"],
  "expression": "determined",
  "animation_style": "agile"
}
```

**Important:** Variants are **not** independent models. Variants are configuration recipes.

---

## 4. Visual Style Guidelines

**Style:**

- stylized 3D cartoon
- Pixar/Fortnite hybrid
- rounded readable silhouettes
- expressive eyes
- soft geometry
- child-safe proportions

**Mood:**

- adventurous
- friendly
- energetic
- playful

**Forbidden:**

- hyper realism
- gore
- realistic violence
- horror aesthetics
- overly sharp geometry

---

## 5. Base Character Anatomy

The canonical capybara base includes:

### Body

- rounded torso
- short legs
- short arms
- oversized readable head
- upright biped posture

### Face

- large rounded nose
- glossy black eyes
- small rounded ears
- expressive brows

### Fur

- warm orange-brown palette
- soft stylized shading
- readable at distance

---

## 6. Required 360 Turnaround Views

Every canonical character must support:

- `front`
- `front_3q_right`
- `right`
- `back_3q_right`
- `back`
- `back_3q_left`
- `left`
- `front_3q_left`
- `top`
- `top_3q_right`
- `top_3q_left`
- `bottom`

Additional closeups:

- `face_front`
- `face_profile`
- `ear`
- `muzzle`
- `nose`
- `eye`
- `front_paw`
- `back_paw`

**Purpose:** Ensure compatibility for modeling, rigging, AI consistency, animation, merchandising, and procedural generation.

---

## 7. Attachment Point System

The base character must expose canonical attachment slots.

**Required slots:**

- `head_slot`
- `face_slot`
- `back_slot`
- `chest_slot`
- `left_hand_slot`
- `right_hand_slot`
- `waist_slot`
- `feet_slot`

**Rules:**

- Accessories must declare compatible slots.
- Slot transforms must remain standardized.
- Accessories should be swappable without geometry edits.

---

## 8. Accessory Specification

Each accessory must declare:

```json
{
  "id": "ninja_hood",
  "attachment_point": "head_slot",
  "scale": [1, 1, 1],
  "rotation": [0, 0, 0],
  "position_offset": [0, 0, 0],
  "compatible_characters": ["all"]
}
```

Accessory categories:

- head
- face
- chest
- back
- hands
- waist
- feet
- props

---

## 9. Character Personality System

Characters are differentiated primarily through:

- accessories
- animation style
- expressions
- voice personality
- pose language

Initial variants:

- **Capivini:** calm, strategic, confident
- **CapiNinja:** agile, stealthy, precise
- **CapiRocket:** explosive energy, heavy movement, action-oriented
- **CapiZozo:** comedic, exaggerated reactions, playful

---

## 10. Animation Guidelines

Animation style:

- exaggerated readability
- smooth arcs
- stylized motion
- cartoon anticipation
- child-friendly pacing

Rules:

- silhouettes must remain readable
- avoid realistic weapon recoil
- prioritize emotional clarity

---

## 11. Future Expansion Targets

This architecture is intentionally designed to support:

### Games

- Unity
- Unreal
- Roblox
- Godot

### Animation

- Blender
- Maya
- Cinema4D

### AI Pipelines

- image generation
- video generation
- procedural character creation

### Merchandising

- toys
- coloring books
- storybooks
- avatars

---

## 12. Critical Design Rule

> “Do not create independent disconnected characters. Create reusable modular compositions from a shared canonical base.”

This is the foundational principle of the Capynite Character OS.

---

## 13. Long-Term Vision

Capynite is not only a visual project.

It is evolving into:

- a scalable character platform
- a modular IP system
- a reusable animation/game ecosystem

The base capybara model becomes:

- the canonical DNA
- the visual constitution
- the interoperability layer for the entire Capynite universe

---

**END OF DOCUMENT**
