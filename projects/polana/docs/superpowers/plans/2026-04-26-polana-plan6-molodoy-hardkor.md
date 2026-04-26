# ПОЛЯНА Plan 6 — Молодой & Хардкор archetypes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Молодой (25/50/25 variance) and Хардкор (aura +20% AS) archetypes to the game engine, plus 6 new units (one per archetype per faction).

**Architecture:** Молодой variance wraps `AbilitySystem.TriggerAbility` — refactor the switch into `TriggerAbilityOnce`, add a variance roll wrapper. Хардкор aura is a new `ArchetypeBonusSystem` called from `BattleResolver.Resolve` alongside `FactionBonusSystem.Apply`. `ShopManager` gets tier 4 pool support. New units reuse existing gang assets.

**Tech Stack:** Unity 6, C#, Unity Test Framework (Edit Mode)

**Unity project path:** `~/Documents/polana/`

**Series:**
- Plans 1–5: ✅ Complete (Foundation → UI + Visual)
- **Plan 6 (this): Молодой & Хардкор archetypes**
- Plan 7: 3D Visual Pass — replace UI tile board with actual 3D low-poly scene

---

## File Map

```
Modify:  Assets/Scripts/Data/ArchetypeData.cs          — add Molodoy, Hardkor to enum
Create:  Assets/Scripts/Core/ArchetypeBonusSystem.cs   — Хардкор aura logic
Modify:  Assets/Scripts/Core/AbilitySystem.cs           — variance wrapper + TriggerAbilityOnce refactor
Modify:  Assets/Scripts/Core/BattleResolver.cs          — call ArchetypeBonusSystem.Apply at battle start
Modify:  Assets/Scripts/Core/ShopManager.cs             — add tier 4 pool (12 copies)
Modify:  Assets/Tests/EditMode/BattleTests.cs           — tests for variance distribution + aura

Create:  Assets/Data/Archetypes/Molodoy.asset
Create:  Assets/Data/Archetypes/Hardkor.asset
Create:  Assets/Data/Units/KB_Molodoy.asset             — Кипиш, 2g, KB
Create:  Assets/Data/Units/KS_Molodoy.asset             — Беспредельщик, 2g, KS
Create:  Assets/Data/Units/BG_Molodoy.asset             — Залётный, 2g, BG
Create:  Assets/Data/Units/KB_Hardkor.asset             — Дед, 4g, KB
Create:  Assets/Data/Units/KS_Hardkor.asset             — Прокачанный, 4g, KS
Create:  Assets/Data/Units/BG_Hardkor.asset             — Капитан, 4g, BG
```

---

## Task 1: Add Molodoy and Hardkor to ArchetypeType enum

**Files:**
- Modify: `Assets/Scripts/Data/ArchetypeData.cs`

- [ ] **Step 1: Write failing test**

In `Assets/Tests/EditMode/BattleTests.cs`, add to the test class:

```csharp
[Test]
public void ArchetypeType_HasMolodoyAndHardkor()
{
    Assert.DoesNotThrow(() => { var _ = ArchetypeType.Molodoy; });
    Assert.DoesNotThrow(() => { var _ = ArchetypeType.Hardkor; });
}
```

- [ ] **Step 2: Run test — verify it fails**

Window → Test Runner → Edit Mode → Run All  
Expected: FAIL — `ArchetypeType` does not contain `Molodoy`

- [ ] **Step 3: Add to enum**

Open `Assets/Scripts/Data/ArchetypeData.cs`. Replace the enum:

```csharp
public enum ArchetypeType
{
    Sportik,     // контроль + стабильный дамаг
    Otmorozok,   // АоЕ, может бить своих
    Vyezdnoy,    // бафф союзников
    Molodoy,     // высокая дисперсия: 25% провал / 50% норма / 25% крит ×3
    Hardkor      // дорогой танк, аура +20% AS всем союзникам
}
```

- [ ] **Step 4: Run test — verify it passes**

Test Runner → Run All → PASS

- [ ] **Step 5: Commit**

```bash
cd ~/Documents/polana
git add Assets/Scripts/Data/ArchetypeData.cs Assets/Tests/EditMode/BattleTests.cs
git commit -m "feat: add Molodoy and Hardkor to ArchetypeType enum"
git push origin main
```

---

## Task 2: Refactor AbilitySystem — extract TriggerAbilityOnce

**Files:**
- Modify: `Assets/Scripts/Core/AbilitySystem.cs`

This refactor splits the existing `TriggerAbility` switch into a private `TriggerAbilityOnce`, and makes `TriggerAbility` a public wrapper that handles Молодой variance. No behavior changes for existing units.

- [ ] **Step 1: Write test confirming existing abilities still work after refactor**

In `Assets/Tests/EditMode/BattleTests.cs`, add:

```csharp
[Test]
public void AbilitySystem_Sekundant_HealsLowestHpAlly()
{
    var caster  = MakeUnit("Секундант", 300, 40, 1f, abilityName: "Секундант", abilityCd: 7f);
    var highHp  = MakeUnit("HighHp",   300, 10, 1f);
    var lowHp   = MakeUnit("LowHp",    300, 10, 1f);
    lowHp.TakeDamage(150);

    int hpBefore = lowHp.currentHp;
    AbilitySystem.TriggerAbility(caster,
        new List<UnitInstance> { caster, highHp, lowHp },
        new List<UnitInstance>());

    Assert.Greater(lowHp.currentHp, hpBefore);
}
```

- [ ] **Step 2: Run test — verify it passes (before refactor)**

Test Runner → Run All → PASS (regression check)

- [ ] **Step 3: Refactor AbilitySystem**

Replace the contents of `Assets/Scripts/Core/AbilitySystem.cs` with:

```csharp
using System.Collections.Generic;
using UnityEngine;

public static class AbilitySystem
{
    // Entry point. Handles Молодой variance roll, then dispatches to TriggerAbilityOnce.
    public static void TriggerAbility(UnitInstance caster, List<UnitInstance> allies, List<UnitInstance> enemies)
    {
        if (caster.abilityDisabled) return;
        if (caster.data == null) return;

        int repeatCount = 1;

        if (caster.data.archetype?.archetypeType == ArchetypeType.Molodoy)
        {
            float roll = Random.value;
            if (roll < 0.25f)
            {
                EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "ПРОВАЛ" });
                return;
            }
            if (roll >= 0.75f)
                repeatCount = 3;
        }

        for (int i = 0; i < repeatCount; i++)
            TriggerAbilityOnce(caster, allies, enemies);
    }

    static void TriggerAbilityOnce(UnitInstance caster, List<UnitInstance> allies, List<UnitInstance> enemies)
    {
        switch (caster.data.abilityName)
        {
            case "Нокаут":      Nokaut(caster, enemies);          break;
            case "Шконка":      Shkonka(caster, allies, enemies); break;
            case "Стенка":      Stenka(caster, allies);           break;
            case "Рассечение":  /* пассив — обрабатывается в OnHit */ break;
            case "Факел":       Fakel(caster, enemies);           break;
            case "За встречу":  ZaVstrechu(caster, allies);       break;
            case "Захват":      Zahvat(caster, enemies);          break;
            case "Берсерк":     Berserk(caster);                  break;
            case "Секундант":   Sekundant(caster, allies);        break;
            case "Маховик":     Mahovik(caster, enemies);         break;
            case "Беспредел":   Bespredel(caster, enemies);       break;
            case "Подлянка":    Podlyanka(caster, enemies);       break;
        }
    }

    // ── Existing abilities (unchanged) ─────────────────────────────────

    static void Nokaut(UnitInstance caster, List<UnitInstance> enemies)
    {
        var target = GetFirstAliveEnemy(enemies);
        if (target == null) return;
        target.isStunned        = true;
        target.stunDuration     = 2f;
        target.takesBonusDamage = true;
        target.bonusDmgDuration = 2f;
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Нокаут" });
    }

    static void Shkonka(UnitInstance caster, List<UnitInstance> allies, List<UnitInstance> enemies)
    {
        int dmg = caster.Attack * 2;
        foreach (var e in enemies) e.TakeDamage(dmg, caster.armorPenetration);
        foreach (var a in allies)  if (a != caster) a.TakeDamage(dmg / 2);
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Шконка" });
    }

    static void Stenka(UnitInstance caster, List<UnitInstance> allies)
    {
        var target = GetLowestHpAlly(caster, allies);
        if (target == null) return;
        target.Heal((int)(target.MaxHp * 0.2f));
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Стенка" });
    }

    static void Fakel(UnitInstance caster, List<UnitInstance> enemies)
    {
        int dmg = (int)(caster.Attack * 0.8f);
        foreach (var e in enemies) e.TakeDamage(dmg, caster.armorPenetration);
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Факел" });
    }

    static void ZaVstrechu(UnitInstance caster, List<UnitInstance> allies)
    {
        if (allies.Count == 0) return;
        var target = allies[Random.Range(0, allies.Count)];
        if (Random.Range(0, 2) == 0) target.attackMultiplier *= 1.3f;
        else                         target.attackSpeedMult  *= 1.3f;
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "За встречу" });
    }

    static void Zahvat(UnitInstance caster, List<UnitInstance> enemies)
    {
        var target = GetFirstAliveEnemy(enemies);
        if (target == null) return;
        target.isStunned    = true;
        target.stunDuration = 1.5f;
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Захват" });
    }

    static void Berserk(UnitInstance caster)
    {
        caster.isBerserk        = true;
        caster.berserkDuration  = 4f;
        caster.attackSpeedMult *= 1.5f;
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Берсерк" });
    }

    static void Sekundant(UnitInstance caster, List<UnitInstance> allies)
    {
        var target = GetLowestHpAlly(caster, allies);
        if (target == null) return;
        target.Heal(80);
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Секундант" });
    }

    // ── Молодой abilities ──────────────────────────────────────────────

    // KB Молодой: бьёт первого живого врага за 150% урона
    static void Mahovik(UnitInstance caster, List<UnitInstance> enemies)
    {
        var target = GetFirstAliveEnemy(enemies);
        if (target == null) return;
        target.TakeDamage((int)(caster.Attack * 1.5f), caster.armorPenetration);
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Маховик" });
    }

    // KS Молодой: AoE — наносит 80% урона всем живым врагам
    static void Bespredel(UnitInstance caster, List<UnitInstance> enemies)
    {
        int dmg = (int)(caster.Attack * 0.8f);
        foreach (var e in enemies) e.TakeDamage(dmg, caster.armorPenetration);
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Беспредел" });
    }

    // BG Молодой: оглушает первого врага на 1 сек
    static void Podlyanka(UnitInstance caster, List<UnitInstance> enemies)
    {
        var target = GetFirstAliveEnemy(enemies);
        if (target == null) return;
        target.isStunned    = true;
        target.stunDuration = Mathf.Max(target.stunDuration, 1f); // не сокращаем уже активный стан
        EventBus.Publish(new AbilityFiredEvent { casterName = caster.data.unitName, abilityName = "Подлянка" });
    }

    // ── Passive (called from BattleResolver) ──────────────────────────

    public static void OnHit_Rassechenie(UnitInstance caster, UnitInstance target)
    {
        caster.rassechenieStacks++;
        if (caster.rassechenieStacks >= 4)
        {
            target.isStunned    = true;
            target.stunDuration = 1.5f;
            caster.rassechenieStacks = 0;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    static UnitInstance GetFirstAliveEnemy(List<UnitInstance> enemies)
    {
        foreach (var e in enemies) if (e.IsAlive) return e;
        return null;
    }

    static UnitInstance GetLowestHpAlly(UnitInstance caster, List<UnitInstance> allies)
    {
        UnitInstance lowest = null;
        foreach (var a in allies)
        {
            if (a == caster || !a.IsAlive) continue;
            if (lowest == null || a.currentHp < lowest.currentHp) lowest = a;
        }
        return lowest;
    }
}
```

- [ ] **Step 4: Run all tests — verify they still pass**

Test Runner → Run All → all PASS

- [ ] **Step 5: Commit**

```bash
git add Assets/Scripts/Core/AbilitySystem.cs
git commit -m "refactor: split AbilitySystem into TriggerAbility + TriggerAbilityOnce, add Молодой variance and 3 new abilities"
git push origin main
```

---

## Task 3: Tests for Молодой variance distribution

**Files:**
- Modify: `Assets/Tests/EditMode/BattleTests.cs`

- [ ] **Step 1: Add variance distribution test**

In `Assets/Tests/EditMode/BattleTests.cs`, add:

```csharp
[Test]
public void Molodoy_Variance_FailRateRoughly25Percent()
{
    // Молодой unit with Маховик ability
    var data           = ScriptableObject.CreateInstance<UnitData>();
    data.unitName      = "Кипиш";
    data.baseHealth    = 400;
    data.baseAttack    = 60;
    data.attackSpeed   = 1f;
    data.abilityName   = "Маховик";
    data.abilityCooldown = 6f;
    var arch           = ScriptableObject.CreateInstance<ArchetypeData>();
    arch.archetypeType = ArchetypeType.Molodoy;
    data.archetype     = arch;
    var caster         = new UnitInstance(data);

    int failCount  = 0;
    int critCount  = 0;
    int normalCount = 0;
    int trials     = 400;

    for (int i = 0; i < trials; i++)
    {
        // Build fresh enemy each trial to count hits
        var enemy = MakeUnit("Enemy", 99999, 10, 1f);
        int hpBefore = enemy.currentHp;

        AbilitySystem.TriggerAbility(caster,
            new List<UnitInstance> { caster },
            new List<UnitInstance> { enemy });

        int dmgDealt = hpBefore - enemy.currentHp;
        int expectedNormal = (int)(caster.Attack * 1.5f);
        // Armor=0, so damage is exact
        // expectedNormal ≈ 60*1.5 = 90 each hit
        if   (dmgDealt == 0)                     failCount++;
        else if (dmgDealt >= expectedNormal * 2) critCount++;   // 3× triggers = 3 hits = ~270
        else                                     normalCount++;
    }

    // Allow ±10% tolerance on 400 trials
    Assert.Greater(failCount,   trials * 0.15f, "fail rate too low");
    Assert.Less   (failCount,   trials * 0.35f, "fail rate too high");
    Assert.Greater(critCount,   trials * 0.15f, "crit rate too low");
    Assert.Less   (critCount,   trials * 0.35f, "crit rate too high");
}
```

- [ ] **Step 2: Run test — verify it passes**

Test Runner → Run All → PASS (may take a moment — 400 trials)

- [ ] **Step 3: Commit**

```bash
git add Assets/Tests/EditMode/BattleTests.cs
git commit -m "test: add Молодой variance distribution test (400 trials, ±10% tolerance)"
git push origin main
```

---

## Task 4: ArchetypeBonusSystem — Хардкор aura

**Files:**
- Create: `Assets/Scripts/Core/ArchetypeBonusSystem.cs`
- Modify: `Assets/Scripts/Core/BattleResolver.cs`

- [ ] **Step 1: Write failing test**

In `Assets/Tests/EditMode/BattleTests.cs`, add:

```csharp
[Test]
public void Hardkor_Aura_IncreasesAllyAttackSpeed()
{
    var hardkorData     = ScriptableObject.CreateInstance<UnitData>();
    hardkorData.unitName  = "Дед";
    hardkorData.baseHealth = 1600;
    hardkorData.baseAttack = 100;
    hardkorData.attackSpeed = 0.7f;
    hardkorData.tier      = 4;
    var hardkorArch       = ScriptableObject.CreateInstance<ArchetypeData>();
    hardkorArch.archetypeType = ArchetypeType.Hardkor;
    hardkorData.archetype = hardkorArch;
    var hardkor           = new UnitInstance(hardkorData);

    var ally              = MakeUnit("Ally", 500, 50, 1.0f);

    ArchetypeBonusSystem.Apply(new List<UnitInstance> { hardkor, ally });

    Assert.AreEqual(1.2f, ally.attackSpeedMult, 0.001f,
        "Хардкор aura should give ally +20% attack speed");
}

[Test]
public void Hardkor_Aura_DoesNotBuffSelf()
{
    var data           = ScriptableObject.CreateInstance<UnitData>();
    data.unitName      = "Дед";
    data.baseHealth    = 1600;
    data.baseAttack    = 100;
    data.attackSpeed   = 0.7f;
    var arch           = ScriptableObject.CreateInstance<ArchetypeData>();
    arch.archetypeType = ArchetypeType.Hardkor;
    data.archetype     = arch;
    var hardkor        = new UnitInstance(data);

    ArchetypeBonusSystem.Apply(new List<UnitInstance> { hardkor });

    Assert.AreEqual(1f, hardkor.attackSpeedMult, 0.001f,
        "Хардкор aura should not buff itself");
}
```

- [ ] **Step 2: Run tests — verify they fail**

Test Runner → Run All → FAIL (`ArchetypeBonusSystem` not found)

- [ ] **Step 3: Create ArchetypeBonusSystem**

Create `Assets/Scripts/Core/ArchetypeBonusSystem.cs`:

```csharp
using System.Collections.Generic;

// Applies archetype-based passive bonuses before each battle.
// Called from BattleResolver.Resolve alongside FactionBonusSystem.Apply.
public static class ArchetypeBonusSystem
{
    public static void Apply(List<UnitInstance> units)
    {
        foreach (var u in units)
        {
            if (u.data?.archetype?.archetypeType != ArchetypeType.Hardkor) continue;
            if (!u.IsAlive) continue;

            // Хардкор aura: +20% attack speed to all allies (everyone except self)
            foreach (var ally in units)
            {
                if (ally != u)
                    ally.attackSpeedMult *= 1.20f;
            }
        }
    }
}
```

- [ ] **Step 4: Wire ArchetypeBonusSystem into BattleResolver**

Open `Assets/Scripts/Core/BattleResolver.cs`. Find the two `FactionBonusSystem.Apply` calls (one for player, one for enemy). Add `ArchetypeBonusSystem.Apply` directly after each:

```csharp
FactionBonusSystem.Apply(playerUnits);
ArchetypeBonusSystem.Apply(playerUnits);

FactionBonusSystem.Apply(enemyUnits);
ArchetypeBonusSystem.Apply(enemyUnits);
```

- [ ] **Step 5: Run tests — verify they pass**

Test Runner → Run All → all PASS

- [ ] **Step 6: Commit**

```bash
git add Assets/Scripts/Core/ArchetypeBonusSystem.cs Assets/Scripts/Core/BattleResolver.cs Assets/Tests/EditMode/BattleTests.cs
git commit -m "feat: add ArchetypeBonusSystem with Хардкор +20% AS aura for all allies"
git push origin main
```

---

## Task 5: ShopManager — add tier 4 pool

**Files:**
- Modify: `Assets/Scripts/Core/ShopManager.cs`

Tier 4 (Хардкор) units are expensive — standard autochess uses 12 copies for tier 4.

- [ ] **Step 1: Write failing test**

In `Assets/Tests/EditMode/CoreLoopTests.cs`, add:

```csharp
[Test]
public void Shop_CanPurchaseTier4Unit()
{
    var data           = ScriptableObject.CreateInstance<UnitData>();
    data.unitName      = "Дед";
    data.tier          = 4;
    var gold           = new GoldManager();
    gold.AddGold(10);   // enough for tier 4
    var shop           = new ShopManager(gold, new[] { data });

    // Force slot 0 to have the tier 4 unit (pool check — it must be in the pool)
    // We can't control which slot it fills, but we can check that Purchase works if it appears
    // Test: pool was initialized with tier-4 copies (no KeyNotFoundException on purchase)
    Assert.DoesNotThrow(() => shop.Purchase(0));
}
```

- [ ] **Step 2: Run test — verify it passes already (tier 4 falls through to default 10 copies)**

Test Runner → Run All

If passes: tier 4 already works via the default `10` copies fallback in `ShopManager`. Proceed to Step 3 to make the pool size explicit.

- [ ] **Step 3: Add tier 4 to TierPoolSize**

Open `Assets/Scripts/Core/ShopManager.cs`. Change:

```csharp
static readonly Dictionary<int, int> TierPoolSize = new() { {1,29}, {2,22}, {3,16} };
```

to:

```csharp
static readonly Dictionary<int, int> TierPoolSize = new() { {1,29}, {2,22}, {3,16}, {4,12} };
```

- [ ] **Step 4: Run all tests — verify they pass**

Test Runner → Run All → PASS

- [ ] **Step 5: Commit**

```bash
git add Assets/Scripts/Core/ShopManager.cs Assets/Tests/EditMode/CoreLoopTests.cs
git commit -m "feat: add tier 4 pool (12 copies) to ShopManager for Хардкор units"
git push origin main
```

---

## Task 6: Create Archetype assets in Unity Editor

**Files:**
- Create: `Assets/Data/Archetypes/Molodoy.asset`
- Create: `Assets/Data/Archetypes/Hardkor.asset`

- [ ] **Step 1: Create Molodoy archetype asset**

In Unity Editor: Project → `Assets/Data/Archetypes` → right-click → Create → Polana → Archetype

**Molodoy.asset:**
- archetypeType: `Molodoy`
- description: `Высокая дисперсия на способность: 25% провал (0 эффект), 50% норма, 25% крит (×3 эффект).`

- [ ] **Step 2: Create Hardkor archetype asset**

**Hardkor.asset:**
- archetypeType: `Hardkor`
- description: `Дорогой фронтлайнер. +60% HP, ×0.8 урон от базы. Аура: +20% attack speed всем союзникам. Нет активной способности.`

- [ ] **Step 3: Commit**

```bash
git add Assets/Data/Archetypes/
git commit -m "data: add Molodoy and Hardkor archetype assets"
git push origin main
```

---

## Task 7: Create 6 new unit assets — Молодой (one per faction)

**Files:**
- Create: `Assets/Data/Units/KB_Molodoy.asset`
- Create: `Assets/Data/Units/KS_Molodoy.asset`
- Create: `Assets/Data/Units/BG_Molodoy.asset`

Each Молодой unit is tier 2g. They reuse existing gang assets.

- [ ] **Step 1: Create KB Молодой — Кипиш**

Project → `Assets/Data/Units` → Create → Polana → Unit

**KB_Molodoy.asset:**
- unitName: `Кипиш`
- tier: `2`
- faction: `KB.asset`
- archetype: `Molodoy.asset`
- gang: `KB_Gang1.asset` (Raion Mob → Terror Firm → Суперпозиция)
- baseHealth: `400`
- baseAttack: `60`
- attackSpeed: `1.1`
- armor: `10`
- attackRange: `1`
- abilityName: `Маховик`
- abilityDescription: `Наносит 150% урона первому живому врагу. Дисперсия Молодого: 25% провал, 25% ×3.`
- abilityCooldown: `6`

- [ ] **Step 2: Create KS Молодой — Беспредельщик**

**KS_Molodoy.asset:**
- unitName: `Беспредельщик`
- tier: `2`
- faction: `KS.asset`
- archetype: `Molodoy.asset`
- gang: `KS_Gang1.asset` (Line → Young GS → Gulf Stream)
- baseHealth: `380`
- baseAttack: `65`
- attackSpeed: `1.0`
- armor: `8`
- attackRange: `1`
- abilityName: `Беспредел`
- abilityDescription: `Наносит 80% урона всем живым врагам. Дисперсия Молодого: 25% провал, 25% ×3 (AoE × 3 = очень больно).`
- abilityCooldown: `8`

- [ ] **Step 3: Create BG Молодой — Залётный**

**BG_Molodoy.asset:**
- unitName: `Залётный`
- tier: `2`
- faction: `BG.asset`
- archetype: `Molodoy.asset`
- gang: `BG_Gang1.asset` (Пидотки → Crazy Garage → Capitals)
- baseHealth: `370`
- baseAttack: `55`
- attackSpeed: `1.2`
- armor: `5`
- attackRange: `1`
- abilityName: `Подлянка`
- abilityDescription: `Оглушает первого врага на 1 сек. Дисперсия Молодого: 25% провал (враг не оглушён), 25% ×3 (оглушение применяется 3 раза подряд — 3 сек).`
- abilityCooldown: `7`

- [ ] **Step 4: Commit**

```bash
git add Assets/Data/Units/KB_Molodoy.asset Assets/Data/Units/KS_Molodoy.asset Assets/Data/Units/BG_Molodoy.asset
git commit -m "data: add 3 Молодой units (Кипиш, Беспредельщик, Залётный)"
git push origin main
```

---

## Task 8: Create 3 Хардкор unit assets (one per faction)

**Files:**
- Create: `Assets/Data/Units/KB_Hardkor.asset`
- Create: `Assets/Data/Units/KS_Hardkor.asset`
- Create: `Assets/Data/Units/BG_Hardkor.asset`

Хардкор units are tier 4g. High HP (+60% vs comparable base), reduced damage (×0.8), no active ability (abilityCooldown = 0).

Base stats reference: tier 3 units have ~600-700 HP, ~85-100 attack.  
Tier 4 base before archetype modifier: ~900 HP, ~120 attack.  
Хардкор: +60% HP = **1440 HP**, ×0.8 attack = **96 attack**.

- [ ] **Step 1: Create KB Хардкор — Дед**

**KB_Hardkor.asset:**
- unitName: `Дед`
- tier: `4`
- faction: `KB.asset`
- archetype: `Hardkor.asset`
- gang: `KB_Gang2.asset` (Дружина → Kindergarten → Школа)
- baseHealth: `1440`
- baseAttack: `96`
- attackSpeed: `0.7`
- armor: `50`
- attackRange: `1`
- abilityName: *(empty)*
- abilityDescription: `Аура: +20% attack speed всем союзникам на поле. Нет активной способности.`
- abilityCooldown: `0`

- [ ] **Step 2: Create KS Хардкор — Прокачанный**

**KS_Hardkor.asset:**
- unitName: `Прокачанный`
- tier: `4`
- faction: `KS.asset`
- archetype: `Hardkor.asset`
- gang: `KS_Gang2.asset` (Burunduki → YY → Pereyaslavka Zalesskaya)
- baseHealth: `1440`
- baseAttack: `96`
- attackSpeed: `0.7`
- armor: `45`
- attackRange: `1`
- abilityName: *(empty)*
- abilityDescription: `Аура: +20% attack speed всем союзникам на поле. Нет активной способности.`
- abilityCooldown: `0`

- [ ] **Step 3: Create BG Хардкор — Капитан**

**BG_Hardkor.asset:**
- unitName: `Капитан`
- tier: `4`
- faction: `BG.asset`
- archetype: `Hardkor.asset`
- gang: `BG_Gang2.asset` (Bich2 → P2 → Patriots)
- baseHealth: `1440`
- baseAttack: `96`
- attackSpeed: `0.7`
- armor: `40`
- attackRange: `1`
- abilityName: *(empty)*
- abilityDescription: `Аура: +20% attack speed всем союзникам на поле. Нет активной способности.`
- abilityCooldown: `0`

- [ ] **Step 4: Commit**

```bash
git add Assets/Data/Units/KB_Hardkor.asset Assets/Data/Units/KS_Hardkor.asset Assets/Data/Units/BG_Hardkor.asset
git commit -m "data: add 3 Хардкор units (Дед, Прокачанный, Капитан) tier 4"
git push origin main
```

---

## Task 9: Wire new units into GameManager

New units must be in the `allUnits` array in GameManager inspector to appear in the shop.

- [ ] **Step 1: Open the game scene in Unity**

File → Open Scene → `Assets/Scenes/` (or wherever the main scene is)

- [ ] **Step 2: Select GameManager in Hierarchy**

Click on the `GameManager` GameObject in the Hierarchy panel.

- [ ] **Step 3: Add new units to allUnits array in Inspector**

In the Inspector, find the `All Units` array. Click `+` six times and assign:
- `KB_Molodoy`
- `KS_Molodoy`
- `BG_Molodoy`
- `KB_Hardkor`
- `KS_Hardkor`
- `BG_Hardkor`

- [ ] **Step 4: Save scene**

Ctrl+S / Cmd+S

- [ ] **Step 5: Play the game**

Press Play → verify the new units appear in the shop (check by rerolling until you see Кипиш, Беспредельщик, Залётный, Дед, Прокачанный, or Капитан).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: register 6 new units (Молодой × 3, Хардкор × 3) in GameManager"
git push origin main
```

---

## Task 10: Final test run and plan PLAN.md update

- [ ] **Step 1: Run all tests**

Window → Test Runner → Edit Mode → Run All  
Expected: all tests PASS (no regressions)

- [ ] **Step 2: Smoke test in Play mode**

Press Play:
- Buy a Молодой unit → watch ability sometimes fail, sometimes hit harder
- Buy a Хардкор unit → start battle → verify Хардкор is tanky and allies attack faster

- [ ] **Step 3: Update PLAN.md in monorepo**

In `~/Documents/новый/projects/polana/docs/PLAN.md`, update item 11:

```
11. ✅ Plan 6: Молодой & Хардкор archetypes (2026-04-26)
```

- [ ] **Step 4: Commit plan update**

```bash
cd ~/Documents/новый
git add projects/polana/docs/PLAN.md
git commit -m "docs: mark Plan 6 complete in PLAN.md"
git push origin main
```

---

## Result

After all tasks:
- ✅ Молодой archetype in enum + variance (25% fail / 50% normal / 25% ×3) in AbilitySystem
- ✅ 3 Молодой abilities: Маховик (КБ), Беспредел (КС), Подлянка (БГ)
- ✅ Хардкор archetype in enum + aura +20% AS in ArchetypeBonusSystem
- ✅ Tier 4 pool in ShopManager
- ✅ 6 new units in Data/Units + wired into GameManager
- ✅ Tests: variance distribution + aura coverage
- ⏭ Next: Plan 7 — 3D Visual Pass (replace UI tile board with 3D low-poly scene)
