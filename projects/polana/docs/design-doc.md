# ПОЛЯНА — Game Design Document

**Version:** 0.1 (Demo scope)  
**Date:** 2026-04-26  
**Engine:** Unity 6 (6000.0 LTS), C#  
**Platform:** PC  

---

## 1. Overview

**Genre:** Autochess (Dota Underlords reference)  
**Setting:** Organized football hooligan fight ("забив") in a city park  
**Demo goal:** Playable single-player demo with bots. 3 factions, 9 units, full economy loop  
**Phase 2 (out of scope for demo):** PvP multiplayer, additional factions and units  

---

## 2. Setting

**Battlefield:** A clearing ("поляна") in a city park. Grass, trees at the edges.

**Background characters (non-interactive, atmosphere only):**
- Old man on a bench
- Mother with a stroller
- Cyclist passing by
- 2 people filming from opposite sides (mandatory)
- "Coaches" and "observers" at the edges

**Visual tone:** Realistic aesthetic referencing real fight footage. Units wear matching team colors, sport clothing (Adidas, Nike), distinguishable by details.

---

## 3. Game Loop

```
Round start
  → Shop phase (buy, sell, reroll, freeze)
  → Placement phase (arrange units on your half of the board)
  → Combat phase (auto-battle, 60 sec max)
  → Round result (damage applied to losing player)
  → Gold income
  → Next round
```

**Board size:** 8×4 (each player controls their half)  
**Unit limit:** Equal to player level (1–10)  

---

## 4. Economy

| Parameter | Value | Note |
|---|---|---|
| Base gold per round | 5g | — |
| Общак (interest) | +1g per 10g held, max +5g | Flavor name for interest |
| Win streak bonus | +1g (3 wins), +2g (5+ wins) | "Моральный дух" |
| Loss streak bonus | +1g (3 losses), +2g (5+), +3g (7+) | — |
| Reroll shop | 2g | — |
| Freeze shop | Free | Keeps current shop for next round |
| Sell unit | Equal to unit tier cost | — |

**Player HP:** 50  
**Damage on loss:** `2 + sum of tiers of surviving enemy units`  
Example: enemy has 3g + 2g + 1g units alive → 2 + 6 = **8 damage**  

**Level upgrade cost:** Increases from 4g (level 2) to 36g (level 10)  

---

## 5. Factions

Three factions active in demo. Others passive (grayed out, future content).

### Active

| Code | Colors | Bonus name | Mechanic |
|---|---|---|---|
| КБ | Red-white | — | Hitting an ally unit triggers HP regen + armor stack for the attacker. Grows stronger through friendly fire |
| КС | Red-blue | «Конская тупость» | Disables active abilities of all КС units; in exchange: large AD bonus + attack speed bonus |
| БГ | White-blue | «Дерьмо» | +AD + armor penetration (ignore a portion of enemy armor) |

**Important:** КС bonus disables *attacking* abilities but does NOT disable buff abilities of Выездной units.

### Inactive (future content, shown grayed out in UI)

| Code | Colors |
|---|---|
| КЗ | Red-green |
| СБГ | Blue-white-blue |
| LP | Lech Poznan (foreign faction) |
| ЧБ | Black-white |

---

## 6. Archetypes

Five archetypes. Each unit belongs to exactly one archetype.

| Archetype | Role | Mechanic |
|---|---|---|
| Подписной спортик | Control + consistent damage | Reliable CC + quality damage output |
| Отморозок | AoE damage, chaotic | AoE abilities, may hit allies |
| Выездной | Support, buffer | Buffs allies; abilities work even under КС faction bonus |
| Молодой | High-variance specialist | Special ability rolls on each cast: 25% fail (0 effect), 50% normal (×1), 25% crit (×3). Applied only to the unit's special ability. EV = 1.25× vs same-tier stable unit |
| Хардкор | Frontline anchor | 4g. +60% HP vs base, ×0.8 damage vs base. Aura: +20% attack speed to all adjacent allies (1-cell radius). No ability variance — fully stable. Placement-dependent: value scales with number of neighbors |


---

## 7. Demo Units (9 total — 3 factions × 3 archetypes)

### КБ (Red-white)

| Unit | Tier | Archetype | Ability | Detail |
|---|---|---|---|---|
| МСМК по боксу | 3g | Спортик | **Нокаут** | Stuns one enemy for 2 sec; target cannot attack and takes +30% damage during stun |
| Сидевший | 2g | Отморозок | **Шконка** | Jumps to center of the largest cluster, deals AoE damage in 2-cell radius including allies |
| Боевой ультрас | 1g | Выездной | **Стенка** | Grants a shield to the nearest ally lasting 3 sec |

**КБ balance rule:** Faction bonus (regen + armor stack) triggers only from auto-attacks, not from abilities.

### КС (Red-blue)

| Unit | Tier | Archetype | Ability | Detail |
|---|---|---|---|---|
| Чемпион Беллатура | 3g | Спортик | **Рассечение** | Each attack adds a stack; on the 4th stack, enemy is knocked down for 1.5 sec |
| Бешеный торч | 1g | Отморозок | **Факел** | Sets surrounding cells on fire; DoT for 1.5 sec to everyone nearby. DoT damage is minimal |
| Пьянь | 2g | Выездной | **За встречу** | Grants a random buff (attack / armor / speed) to a random ally |

### БГ (White-blue)

| Unit | Tier | Archetype | Ability | Detail |
|---|---|---|---|---|
| Двоюродный брат из спецназа | 3g | Спортик | **Захват** | Locks down one enemy; all allies focus that target |
| Детдомовец | 2g | Отморозок | **Берсерк** | For 4 sec attacks the nearest unit regardless of team, +50% attack speed |
| Знакомый боксерчик | 1g | Выездной | **Секундант** | Heals the ally with the lowest current HP |

---

## 8. Unit Merging (Gang System)

**Mechanic:** 3 × ★1 → 1 × ★2 → 3 × ★2 → 1 × ★3 (standard autochess merge)

**Visual flavor:** Instead of stars, merged units receive a **gang badge** with a gang name. Badge and name change at each merge tier.

### Gang names by faction

| Faction | ★1 | ★2 | ★3 |
|---|---|---|---|
| КБ — A | Raion Mob | Terror Firm | Суперпозиция |
| КБ — B | Дружина | Kindergarten | Школа |
| КБ — C | Vodokachka Family | U2 | U |
| КС — A | Line | Young GS | Gulf Stream |
| КС — B | Burunduki | YY | Pereyaslavka Zalesskaya |
| БГ — A | Пидотки | Crazy Garage | Capitals |
| БГ — B | Bich2 | P2 | Patriots |
| КЗ — A | Подшипник | Трамваи | Тепловозы |
| КЗ — B | Кондукторы | Контролеры | НАЧАЛЬНИКИ ПОЕЗДА |
| СБГ — A | Глисты | Ужи | Змеи |
| СБГ — B | Невский просмотр | Банда Теплого | Банда Холодного |

**Gang logos:** To be provided by the user.

---

## 9. Combat — Win/Loss Condition

**Round ends when:**
- All units of one side are eliminated → other side wins
- Timer expires (60 sec) → winner by total remaining unit HP

**Damage to losing player:**
```
damage = 2 + sum of tiers of all surviving enemy units
```

**Ragdoll:** Physics ragdoll triggers on unit death only. No active ragdoll during combat.

---

## 10. Visual Style

**Direction:** Low-poly, realistic human proportions  
**Tone:** Neutral-serious. Not comedic, not photorealistic. Readable indie aesthetic.

**Character models:**
- Normal human proportions (not cartoonishly exaggerated)
- Low polygon count — faceted surfaces, no smooth normals
- No textures in MVP — flat colors + minimal detail geometry
- Replace placeholder meshes with final models later without touching game logic

**Animation:**
- Key pose animations for: idle, attack, stun, death
- Ragdoll on death only (not active ragdoll during combat)
- No motion capture required

**Development approach:**
- Start with primitive meshes (capsule body, sphere head) — mechanics first
- Replace with low-poly meshes once gameplay is validated
- Shader: Unity URP Lit with flat shading (no smoothing groups)

**Unit differentiation via model details (all readable at grid card size):**

| Element | Encodes |
|---|---|
| Face shape (square / narrow / wide) | Archetype |
| Scars, tattoos | Unit class |
| Brand patch (fictional analogs of Stone Island / Burberry / Fred Perry) | Faction |
| Stripe pattern (Adidas-style / swoosh-style) | Gang / merge tier |
| Shirt color | Faction color |

---

## 11. Technical Stack

| Layer | Choice |
|---|---|
| Engine | Unity 6 (6000.0 LTS) |
| Language | C# |
| Rendering | URP |
| Data architecture | ScriptableObject per unit / faction / archetype |
| Event system | EventBus (decoupled game events) |
| Code base | Built from scratch (no fork — ChraumaTactics has no commercial license) |
| MCP integration | CoderGamester/mcp-unity or Unity official MCP |
| Target platform | PC (Steam potential) |

---

## 12. Out of Scope (Demo)

- Multiplayer (PvP online)
- Real payments
- Foreign factions (LP, ЧБ, etc.)
- Units beyond the 9 defined
- Молодой and Хардкор unit classes (archetypes defined, unit classes TBD)
- Gang logos (awaiting assets from user)

---

## 13. Open Questions (block implementation)

| Question | Owner |
|---|---|
| Gang logos | User will provide |
| Молодой ability: variance percentages | ✅ 25% fail / 50% normal / 25% crit (×3) |
| Хардкор parameters | ✅ 4g, +60% HP, ×0.8 dmg, aura +20% AS radius 1 |
| Visual style | ✅ Low-poly realistic proportions, flat shading, ragdoll on death only |
