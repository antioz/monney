# ПОЛЯНА — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Форкнуть ChraumaTactics, поднять на Unity 6, заложить архитектуру данных (ScriptableObjects + EventBus) — проект компилируется, данные 9 юнитов и 3 фракций заведены.

**Architecture:** ScriptableObjects как единственный источник данных юнитов/фракций/банд. EventBus для развязки менеджеров. Мультиплеер сразу паркуется в отдельную ветку чтобы не мешал.

**Tech Stack:** Unity 6000.0 LTS, C#, Unity Test Framework (Edit Mode тесты для чистой логики)

**Серия планов:**
- **Plan 1 (этот): Foundation** — форк, данные, EventBus
- Plan 2: Core Loop — сетка, шоп, экономика, слияние 3→1, цикл раунда
- Plan 3: Factions & Archetypes — бонусы фракций, поведение архетипов
- Plan 4: Bot + Win/Loss — простой бот, HP игрока, результат раунда
- Plan 5: UI + Visual — бейджи банд, шоп UI, low-poly модели, ragdoll на смерти

---

## Структура файлов

```
Assets/
├── Scripts/
│   ├── Data/
│   │   ├── UnitData.cs          — ScriptableObject: стат-блок юнита
│   │   ├── FactionData.cs       — ScriptableObject: фракция + бонус
│   │   ├── ArchetypeData.cs     — ScriptableObject: архетип + тип механики
│   │   └── GangData.cs          — ScriptableObject: банда (badge + имя для уровней 1/2/3)
│   └── Core/
│       └── EventBus.cs          — глобальная шина событий (static)
├── Data/
│   ├── Units/                   — 9 .asset файлов юнитов
│   ├── Factions/                — 3 .asset файла фракций
│   ├── Archetypes/              — 3 .asset файла архетипов
│   └── Gangs/                   — 9 .asset файлов банд (3 фракции × 3 уровня)
└── Tests/
    └── EditMode/
        ├── EventBusTests.cs
        └── UnitDataTests.cs
```

---

## Task 1: Проверка лицензии и форк

**Files:**
- Читаем: `github.com/TaillepierreN/ChraumaTactics` → LICENSE файл

- [ ] **Step 1: Открыть LICENSE файл репозитория**

В браузере открыть: `https://github.com/TaillepierreN/ChraumaTactics/blob/main/LICENSE`

Ожидаем: MIT или Apache 2.0 → можно форкать для коммерческого продукта.
Если GPL → нельзя закрывать исходники → нужен другой форк или писать с нуля.

- [ ] **Step 2: Сделать форк через GitHub UI**

1. Открыть `https://github.com/TaillepierreN/ChraumaTactics`
2. Fork → Create fork → название репо: `polana-game`
3. Склонировать локально:

```bash
git clone https://github.com/<your-username>/polana-game.git
cd polana-game
```

- [ ] **Step 3: Запомнить upstream**

```bash
git remote add upstream https://github.com/TaillepierreN/ChraumaTactics.git
git fetch upstream
```

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore: fork ChraumaTactics as POLANA base"
git push origin main
```

---

## Task 2: Парковка мультиплеера

**Files:**
- Ветка: `multiplayer-parked`

- [ ] **Step 1: Создать ветку-архив для мультиплеера**

```bash
git checkout -b multiplayer-parked
git push origin multiplayer-parked
git checkout main
```

- [ ] **Step 2: Найти и отключить сетевые компоненты**

Найти все файлы с Netcode/Mirror/NetworkBehaviour:

```bash
grep -r "NetworkBehaviour\|NetworkManager\|Mirror\|Netcode" Assets/Scripts --include="*.cs" -l
```

Для каждого найденного файла — обернуть класс в `#if MULTIPLAYER_ENABLED`:

```csharp
#if MULTIPLAYER_ENABLED
// весь сетевой код
#endif
```

- [ ] **Step 3: Проверить что проект компилируется**

В Unity Editor: открыть проект, подождать компиляцию, убедиться что Console не показывает ошибок компиляции (warnings — ок).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: park multiplayer behind MULTIPLAYER_ENABLED flag"
git push origin main
```

---

## Task 3: Апгрейд до Unity 6000.0 LTS

**Files:**
- `ProjectSettings/ProjectVersion.txt`

- [ ] **Step 1: Открыть проект в Unity Hub**

1. Unity Hub → Add → выбрать папку `polana-game`
2. Если Hub предлагает выбрать версию — выбрать Unity 6000.0 LTS
3. Нажать Open → дождаться конвертации

- [ ] **Step 2: Починить типичные breaking changes Unity 6**

После открытия в Console будут ошибки. Типичные:

**Input System:**
```csharp
// Старый код:
Input.GetAxis("Horizontal")
// Unity 6 — ок, старый Input работает. Если используется new Input System:
// PlayerInput компонент → проверить Actions asset путь
```

**URP / Render Pipeline:**
```bash
# Если проект на Built-in RP и ругается:
# Edit → Render Pipeline → Upgrade Project Materials to URP
```

**Устаревшие API:**
```csharp
// Если видишь FindObjectOfType warnings — оставь пока, не трогай
// Фиксить будем когда будем переписывать менеджеры
```

- [ ] **Step 3: Убедиться что сцена открывается без ошибок**

В Console должно быть 0 ошибок (красных). Жёлтые warnings — допустимо.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: upgrade to Unity 6000.0 LTS, fix breaking changes"
git push origin main
```

---

## Task 4: Настройка Unity Test Framework

**Files:**
- Create: `Assets/Tests/EditMode/EditModeTests.asmdef`

- [ ] **Step 1: Добавить Test Framework через Package Manager**

Window → Package Manager → Unity Registry → поиск "Test Framework" → Install (если не установлен, обычно уже есть).

- [ ] **Step 2: Создать папку и Assembly Definition для Edit Mode тестов**

```bash
mkdir -p Assets/Tests/EditMode
```

Создать файл `Assets/Tests/EditMode/EditModeTests.asmdef`:

```json
{
    "name": "EditModeTests",
    "references": [
        "UnityEngine.TestRunner",
        "UnityEditor.TestRunner",
        "PolanaCore"
    ],
    "includePlatforms": [
        "Editor"
    ],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": true,
    "precompiledReferences": [
        "nunit.framework.dll"
    ],
    "autoReferenced": false,
    "defineConstraints": [],
    "versionDefines": [],
    "noEngineReferences": false
}
```

- [ ] **Step 3: Создать Assembly Definition для основного кода**

Создать `Assets/Scripts/PolanaCore.asmdef`:

```json
{
    "name": "PolanaCore",
    "references": [],
    "includePlatforms": [],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "precompiledReferences": [],
    "autoReferenced": true,
    "defineConstraints": [],
    "versionDefines": [],
    "noEngineReferences": false
}
```

- [ ] **Step 4: Проверить что Test Runner видит папку**

Window → General → Test Runner → Edit Mode → должна появиться `EditModeTests` сборка.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Unity Test Framework with EditMode assembly"
git push origin main
```

---

## Task 5: GangData ScriptableObject

**Files:**
- Create: `Assets/Scripts/Data/GangData.cs`
- Create: `Assets/Tests/EditMode/UnitDataTests.cs` (первый тест)

- [ ] **Step 1: Написать failing тест**

Создать `Assets/Tests/EditMode/UnitDataTests.cs`:

```csharp
using NUnit.Framework;
using UnityEngine;

public class UnitDataTests
{
    [Test]
    public void GangData_HasNameForEachLevel()
    {
        var gang = ScriptableObject.CreateInstance<GangData>();
        gang.level1Name = "Raion Mob";
        gang.level2Name = "Terror Firm";
        gang.level3Name = "Суперпозиция";

        Assert.AreEqual("Raion Mob", gang.GetNameForLevel(1));
        Assert.AreEqual("Terror Firm", gang.GetNameForLevel(2));
        Assert.AreEqual("Суперпозиция", gang.GetNameForLevel(3));
    }
}
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

Window → Test Runner → Edit Mode → Run All
Ожидаем: FAIL — `GangData` not found

- [ ] **Step 3: Реализовать GangData**

Создать `Assets/Scripts/Data/GangData.cs`:

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewGang", menuName = "Polana/Gang")]
public class GangData : ScriptableObject
{
    public string level1Name;
    public string level2Name;
    public string level3Name;
    public Sprite level1Badge;
    public Sprite level2Badge;
    public Sprite level3Badge;

    public string GetNameForLevel(int level)
    {
        return level switch
        {
            1 => level1Name,
            2 => level2Name,
            3 => level3Name,
            _ => level1Name
        };
    }

    public Sprite GetBadgeForLevel(int level)
    {
        return level switch
        {
            1 => level1Badge,
            2 => level2Badge,
            3 => level3Badge,
            _ => level1Badge
        };
    }
}
```

- [ ] **Step 4: Запустить тест — убедиться что проходит**

Test Runner → Run All → PASS

- [ ] **Step 5: Commit**

```bash
git add Assets/Scripts/Data/GangData.cs Assets/Tests/EditMode/UnitDataTests.cs
git commit -m "feat: add GangData ScriptableObject with level name/badge support"
git push origin main
```

---

## Task 6: ArchetypeData ScriptableObject

**Files:**
- Create: `Assets/Scripts/Data/ArchetypeData.cs`

- [ ] **Step 1: Добавить тест**

В `Assets/Tests/EditMode/UnitDataTests.cs` добавить:

```csharp
[Test]
public void ArchetypeData_HasCorrectType()
{
    var archetype = ScriptableObject.CreateInstance<ArchetypeData>();
    archetype.archetypeType = ArchetypeType.Sportik;
    Assert.AreEqual(ArchetypeType.Sportik, archetype.archetypeType);
}
```

- [ ] **Step 2: Запустить — убедиться что падает**

Test Runner → Run All → FAIL

- [ ] **Step 3: Реализовать ArchetypeData**

Создать `Assets/Scripts/Data/ArchetypeData.cs`:

```csharp
using UnityEngine;

public enum ArchetypeType
{
    Sportik,     // контроль + стабильный дамаг
    Otmorozok,   // АоЕ, может бить своих
    Vyezdnoy     // бафф союзников
}

[CreateAssetMenu(fileName = "NewArchetype", menuName = "Polana/Archetype")]
public class ArchetypeData : ScriptableObject
{
    public ArchetypeType archetypeType;
    [TextArea] public string description;
}
```

- [ ] **Step 4: Запустить — убедиться что проходит**

Test Runner → Run All → PASS

- [ ] **Step 5: Commit**

```bash
git add Assets/Scripts/Data/ArchetypeData.cs Assets/Tests/EditMode/UnitDataTests.cs
git commit -m "feat: add ArchetypeData ScriptableObject with ArchetypeType enum"
git push origin main
```

---

## Task 7: FactionData ScriptableObject

**Files:**
- Create: `Assets/Scripts/Data/FactionData.cs`

- [ ] **Step 1: Добавить тест**

В `Assets/Tests/EditMode/UnitDataTests.cs` добавить:

```csharp
[Test]
public void FactionData_HasCodeAndColor()
{
    var faction = ScriptableObject.CreateInstance<FactionData>();
    faction.factionCode = "KB";
    faction.primaryColor = Color.red;

    Assert.AreEqual("KB", faction.factionCode);
    Assert.AreEqual(Color.red, faction.primaryColor);
}
```

- [ ] **Step 2: Запустить — убедиться что падает**

Test Runner → Run All → FAIL

- [ ] **Step 3: Реализовать FactionData**

Создать `Assets/Scripts/Data/FactionData.cs`:

```csharp
using UnityEngine;

public enum FactionBonusType
{
    FriendlyFireSustain,   // КБ: удар по союзнику → реген + броня
    BruteForce,            // КС: отключить способности, +AD +AS
    DirtyFight,            // БГ: +AD + armor penetration
    LightFeet,             // КЗ: dodge + damage reduction
    PiterStuff             // СБГ: +attack speed + initiative
}

[CreateAssetMenu(fileName = "NewFaction", menuName = "Polana/Faction")]
public class FactionData : ScriptableObject
{
    public string factionCode;
    public string factionName;
    public Color primaryColor;
    public Color secondaryColor;
    public FactionBonusType bonusType;
    [TextArea] public string bonusDescription;
    public GangData[] gangs; // банды этой фракции (массив)
}
```

- [ ] **Step 4: Запустить — убедиться что проходит**

Test Runner → Run All → PASS

- [ ] **Step 5: Commit**

```bash
git add Assets/Scripts/Data/FactionData.cs Assets/Tests/EditMode/UnitDataTests.cs
git commit -m "feat: add FactionData ScriptableObject with FactionBonusType enum"
git push origin main
```

---

## Task 8: UnitData ScriptableObject

**Files:**
- Create: `Assets/Scripts/Data/UnitData.cs`

- [ ] **Step 1: Добавить тест**

В `Assets/Tests/EditMode/UnitDataTests.cs` добавить:

```csharp
[Test]
public void UnitData_TierMatchesCost()
{
    var unit = ScriptableObject.CreateInstance<UnitData>();
    unit.unitName = "МСМК по боксу";
    unit.tier = 3;
    unit.baseAttack = 80;
    unit.baseHealth = 600;

    Assert.AreEqual(3, unit.tier);
    Assert.AreEqual(80, unit.baseAttack);
}

[Test]
public void UnitData_HasFactionAndArchetype()
{
    var unit = ScriptableObject.CreateInstance<UnitData>();
    var faction = ScriptableObject.CreateInstance<FactionData>();
    var archetype = ScriptableObject.CreateInstance<ArchetypeData>();
    unit.faction = faction;
    unit.archetype = archetype;

    Assert.IsNotNull(unit.faction);
    Assert.IsNotNull(unit.archetype);
}
```

- [ ] **Step 2: Запустить — убедиться что падает**

Test Runner → Run All → FAIL

- [ ] **Step 3: Реализовать UnitData**

Создать `Assets/Scripts/Data/UnitData.cs`:

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewUnit", menuName = "Polana/Unit")]
public class UnitData : ScriptableObject
{
    [Header("Идентификация")]
    public string unitName;
    public int tier;                  // 1, 2 или 3 (стоимость в шопе)
    public FactionData faction;
    public ArchetypeData archetype;
    public GangData gang;             // банда этого юнита (3 уровня прокачки)

    [Header("Базовые статы")]
    public int baseHealth;
    public int baseAttack;
    public float attackSpeed;         // атак в секунду
    public int armor;
    public float attackRange;         // в клетках борда

    [Header("Способность")]
    public string abilityName;
    [TextArea] public string abilityDescription;
    public float abilityCooldown;

    [Header("Визуал")]
    public GameObject prefab;
    public Sprite portrait;
}
```

- [ ] **Step 4: Запустить — убедиться что проходит**

Test Runner → Run All → PASS

- [ ] **Step 5: Commit**

```bash
git add Assets/Scripts/Data/UnitData.cs Assets/Tests/EditMode/UnitDataTests.cs
git commit -m "feat: add UnitData ScriptableObject with full stat block"
git push origin main
```

---

## Task 9: EventBus

**Files:**
- Create: `Assets/Scripts/Core/EventBus.cs`
- Create: `Assets/Tests/EditMode/EventBusTests.cs`

- [ ] **Step 1: Написать failing тесты**

Создать `Assets/Tests/EditMode/EventBusTests.cs`:

```csharp
using NUnit.Framework;

public class EventBusTests
{
    [SetUp]
    public void Setup()
    {
        EventBus.Clear();
    }

    [Test]
    public void Subscribe_AndPublish_CallsHandler()
    {
        bool called = false;
        EventBus.Subscribe<UnitPurchasedEvent>(_ => called = true);
        EventBus.Publish(new UnitPurchasedEvent());
        Assert.IsTrue(called);
    }

    [Test]
    public void Unsubscribe_StopsReceivingEvents()
    {
        int count = 0;
        System.Action<UnitPurchasedEvent> handler = _ => count++;
        EventBus.Subscribe(handler);
        EventBus.Publish(new UnitPurchasedEvent());
        EventBus.Unsubscribe(handler);
        EventBus.Publish(new UnitPurchasedEvent());
        Assert.AreEqual(1, count);
    }

    [Test]
    public void Publish_WithNoSubscribers_DoesNotThrow()
    {
        Assert.DoesNotThrow(() => EventBus.Publish(new UnitSoldEvent()));
    }
}
```

- [ ] **Step 2: Запустить — убедиться что падает**

Test Runner → Run All → FAIL

- [ ] **Step 3: Реализовать EventBus и события**

Создать `Assets/Scripts/Core/EventBus.cs`:

```csharp
using System;
using System.Collections.Generic;

public static class EventBus
{
    private static readonly Dictionary<Type, List<Delegate>> handlers = new();

    public static void Subscribe<T>(Action<T> handler)
    {
        var type = typeof(T);
        if (!handlers.ContainsKey(type))
            handlers[type] = new List<Delegate>();
        handlers[type].Add(handler);
    }

    public static void Unsubscribe<T>(Action<T> handler)
    {
        var type = typeof(T);
        if (handlers.ContainsKey(type))
            handlers[type].Remove(handler);
    }

    public static void Publish<T>(T evt)
    {
        var type = typeof(T);
        if (!handlers.ContainsKey(type)) return;
        foreach (var handler in handlers[type].ToArray())
            ((Action<T>)handler)(evt);
    }

    public static void Clear()
    {
        handlers.Clear();
    }
}

// События — добавлять по мере роста проекта
public struct UnitPurchasedEvent { public UnitData unit; }
public struct UnitSoldEvent     { public UnitData unit; }
public struct UnitMergedEvent   { public UnitData unit; public int newLevel; }
public struct RoundStartedEvent { public int roundNumber; }
public struct RoundEndedEvent   { public bool playerWon; public int damageDealt; }
public struct PlayerHealthChangedEvent { public int currentHp; }
```

- [ ] **Step 4: Запустить — убедиться что проходит**

Test Runner → Run All → PASS

- [ ] **Step 5: Commit**

```bash
git add Assets/Scripts/Core/EventBus.cs Assets/Tests/EditMode/EventBusTests.cs
git commit -m "feat: add static EventBus with subscribe/publish/unsubscribe + core events"
git push origin main
```

---

## Task 10: Наполнение данных — Архетипы и Фракции

**Files:**
- Create: `Assets/Data/Archetypes/Sportik.asset`
- Create: `Assets/Data/Archetypes/Otmorozok.asset`
- Create: `Assets/Data/Archetypes/Vyezdnoy.asset`
- Create: `Assets/Data/Factions/KB.asset`
- Create: `Assets/Data/Factions/KS.asset`
- Create: `Assets/Data/Factions/BG.asset`

- [ ] **Step 1: Создать папки**

```bash
mkdir -p Assets/Data/Archetypes
mkdir -p Assets/Data/Factions
mkdir -p Assets/Data/Gangs
mkdir -p Assets/Data/Units
```

- [ ] **Step 2: Создать ScriptableObjects архетипов в Unity Editor**

В Project окне → правый клик на `Assets/Data/Archetypes` → Create → Polana → Archetype

Создать три файла со следующими значениями:

**Sportik.asset:**
- archetypeType: Sportik
- description: Контроль + стабильный качественный дамаг. Стан, нокдаун, блок.

**Otmorozok.asset:**
- archetypeType: Otmorozok
- description: АоЕ урон, может бить своих. Хаотичный, непредсказуемый.

**Vyezdnoy.asset:**
- archetypeType: Vyezdnoy
- description: Бафф союзников. Щит, лечение, поддержка.

- [ ] **Step 3: Создать ScriptableObjects фракций**

В `Assets/Data/Factions` → Create → Polana → Faction

**KB.asset:**
- factionCode: KB
- factionName: Красно-Белые
- primaryColor: #CC0000 (красный)
- secondaryColor: #FFFFFF (белый)
- bonusType: FriendlyFireSustain
- bonusDescription: Удар по союзнику (только автоатака) → реген HP атакующему + стек брони

**KS.asset:**
- factionCode: KS
- factionName: Красно-Синие
- primaryColor: #CC0000 (красный)
- secondaryColor: #0000CC (синий)
- bonusType: BruteForce
- bonusDescription: Конская тупость — отключает атакующие способности юнитов КС, взамен +60% AD +40% AS. Бафф-способности Выездных НЕ отключаются.

**BG.asset:**
- factionCode: BG
- factionName: Бело-Голубые
- primaryColor: #FFFFFF (белый)
- secondaryColor: #0066CC (голубой)
- bonusType: DirtyFight
- bonusDescription: Дерьмо — +40% AD + 25 armor penetration (игнорируют часть брони врага)

- [ ] **Step 4: Commit**

```bash
git add Assets/Data/
git commit -m "data: add 3 archetype and 3 faction ScriptableObjects"
git push origin main
```

---

## Task 11: Наполнение данных — Банды КБ

**Files:**
- Create: `Assets/Data/Gangs/KB_Gang1.asset` (Raion Mob → Terror Firm → Суперпозиция)
- Create: `Assets/Data/Gangs/KB_Gang2.asset` (Дружина → Kindergarten → Школа)
- Create: `Assets/Data/Gangs/KB_Gang3.asset` (Vodokachka Family → U2 → U)

- [ ] **Step 1: Создать банды для КБ**

В `Assets/Data/Gangs` → Create → Polana → Gang

**KB_Gang1.asset:**
- level1Name: Raion Mob
- level2Name: Terror Firm
- level3Name: Суперпозиция

**KB_Gang2.asset:**
- level1Name: Дружина
- level2Name: Kindergarten
- level3Name: Школа

**KB_Gang3.asset:**
- level1Name: Vodokachka Family
- level2Name: U2
- level3Name: U

- [ ] **Step 2: Создать банды для КС**

**KS_Gang1.asset:**
- level1Name: Line
- level2Name: Young GS
- level3Name: Gulf Stream

**KS_Gang2.asset:**
- level1Name: Burunduki
- level2Name: YY
- level3Name: Pereyaslavka Zalesskaya

- [ ] **Step 3: Создать банды для БГ**

**BG_Gang1.asset:**
- level1Name: Пидотки
- level2Name: Crazy Garage
- level3Name: Capitals

**BG_Gang2.asset:**
- level1Name: Bich2
- level2Name: P2
- level3Name: Patriots

- [ ] **Step 4: Commit**

```bash
git add Assets/Data/Gangs/
git commit -m "data: add gang ScriptableObjects for KB, KS, BG factions"
git push origin main
```

---

## Task 12: Наполнение данных — 9 юнитов демо

**Files:**
- Create: 9 файлов в `Assets/Data/Units/`

- [ ] **Step 1: Создать юниты КБ**

В `Assets/Data/Units` → Create → Polana → Unit

**KB_MsmbBoks.asset** (МСМК по боксу):
- unitName: МСМК по боксу
- tier: 3
- faction: KB.asset
- archetype: Sportik.asset
- gang: KB_Gang1.asset
- baseHealth: 700
- baseAttack: 90
- attackSpeed: 0.8
- armor: 30
- attackRange: 1
- abilityName: Нокаут
- abilityDescription: Оглушает одного врага на 2 сек, тот не атакует и получает +30% урона
- abilityCooldown: 6

**KB_Sidyavshiy.asset** (Сидевший):
- unitName: Сидевший
- tier: 2
- faction: KB.asset
- archetype: Otmorozok.asset
- gang: KB_Gang2.asset
- baseHealth: 500
- baseAttack: 70
- attackSpeed: 1.0
- armor: 15
- attackRange: 2
- abilityName: Шконка
- abilityDescription: Прыгает в центр толпы, АоЕ урон радиус 2 клетки включая союзников
- abilityCooldown: 8

**KB_BoevojUltras.asset** (Боевой ультрас):
- unitName: Боевой ультрас
- tier: 1
- faction: KB.asset
- archetype: Vyezdnoy.asset
- gang: KB_Gang3.asset
- baseHealth: 350
- baseAttack: 40
- attackSpeed: 0.9
- armor: 10
- attackRange: 1
- abilityName: Стенка
- abilityDescription: Даёт щит ближайшему союзнику на 3 сек
- abilityCooldown: 7

- [ ] **Step 2: Создать юниты КС**

**KS_ChempionBellatora.asset** (Чемпион Беллатура):
- unitName: Чемпион Беллатура
- tier: 3
- faction: KS.asset
- archetype: Sportik.asset
- gang: KS_Gang1.asset
- baseHealth: 650
- baseAttack: 100
- attackSpeed: 1.1
- armor: 25
- attackRange: 1
- abilityName: Рассечение
- abilityDescription: Каждая атака накапливает стак, на 4-м стаке враг падает в нокдаун на 1.5 сек
- abilityCooldown: 0 (пассивная, триггер на 4 стака)

**KS_BeshenyTorch.asset** (Бешеный торч):
- unitName: Бешеный торч
- tier: 1
- faction: KS.asset
- archetype: Otmorozok.asset
- gang: KS_Gang2.asset
- baseHealth: 300
- baseAttack: 45
- attackSpeed: 1.2
- armor: 5
- attackRange: 1
- abilityName: Факел
- abilityDescription: Поджигает клетки вокруг себя, DoT урон 1.5 сек всем рядом
- abilityCooldown: 9

**KS_Pyan.asset** (Пьянь):
- unitName: Пьянь
- tier: 2
- faction: KS.asset
- archetype: Vyezdnoy.asset
- gang: KS_Gang1.asset
- baseHealth: 400
- baseAttack: 50
- attackSpeed: 0.7
- armor: 20
- attackRange: 1
- abilityName: За встречу
- abilityDescription: Даёт случайный бафф случайному союзнику (атака / броня / скорость). Не отключается КС-бонусом.
- abilityCooldown: 8

- [ ] **Step 3: Создать юниты БГ**

**BG_DvoyrodniyBrat.asset** (Двоюродный брат из спецназа):
- unitName: Двоюродный брат из спецназа
- tier: 3
- faction: BG.asset
- archetype: Sportik.asset
- gang: BG_Gang1.asset
- baseHealth: 600
- baseAttack: 85
- attackSpeed: 0.9
- armor: 35
- attackRange: 1
- abilityName: Захват
- abilityDescription: Блокирует одного врага — тот не двигается, союзники фокусируют его
- abilityCooldown: 7

**BG_Detdomovets.asset** (Детдомовец):
- unitName: Детдомовец
- tier: 2
- faction: BG.asset
- archetype: Otmorozok.asset
- gang: BG_Gang2.asset
- baseHealth: 550
- baseAttack: 65
- attackSpeed: 1.0
- armor: 20
- attackRange: 1
- abilityName: Берсерк
- abilityDescription: 4 сек атакует ближайшего независимо от команды, +50% attack speed
- abilityCooldown: 10

**BG_ZnakomiyBoksercik.asset** (Знакомый боксерчик):
- unitName: Знакомый боксерчик
- tier: 1
- faction: BG.asset
- archetype: Vyezdnoy.asset
- gang: BG_Gang1.asset
- baseHealth: 320
- baseAttack: 38
- attackSpeed: 0.9
- armor: 8
- attackRange: 1
- abilityName: Секундант
- abilityDescription: Лечит союзника с наименьшим HP на 80 единиц
- abilityCooldown: 7

- [ ] **Step 4: Commit**

```bash
git add Assets/Data/Units/
git commit -m "data: add all 9 demo unit ScriptableObjects with stats and abilities"
git push origin main
```

---

## Task 13: Финальная проверка

- [ ] **Step 1: Запустить все тесты**

Window → Test Runner → Edit Mode → Run All

Ожидаем: все тесты PASS (GangData, ArchetypeData, FactionData, UnitData, EventBus)

- [ ] **Step 2: Проверить что данные корректно связаны**

В Unity Editor: открыть любой UnitData asset (например KB_MsmbBoks) → убедиться что поля faction, archetype, gang ссылаются на нужные .asset файлы (не null).

- [ ] **Step 3: Проверить Console**

0 ошибок (красных). Warnings — ок.

- [ ] **Step 4: Финальный коммит**

```bash
git add -A
git commit -m "chore: foundation complete — data architecture + EventBus verified"
git push origin main
```

---

## Результат плана

После выполнения всех задач:
- ✅ Форк ChraumaTactics на Unity 6000.0 LTS, компилируется
- ✅ Мультиплеер запаркован в отдельную ветку
- ✅ Unity Test Framework настроен, все тесты зелёные
- ✅ ScriptableObject схемы: UnitData, FactionData, ArchetypeData, GangData
- ✅ EventBus с событиями: UnitPurchased, UnitSold, UnitMerged, RoundStarted, RoundEnded, PlayerHealthChanged
- ✅ 3 архетипа, 3 фракции, 7 банд, 9 юнитов заведены как assets
- ⏭ Следующий план: Core Loop (сетка, шоп, экономика, слияние 3→1)
