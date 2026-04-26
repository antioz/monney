# ПОЛЯНА Plan 7C — UnitSpawner3D + GameManager Wiring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Runs AFTER plan7a AND plan7b are both committed.**
> Start with: `git pull` to get all files from plan7a and plan7b.

**Goal:** Create `UnitSpawner3D` that spawns `UnitPrefab3D` instances at correct 3D board positions. Wire it into `GameManager` so 3D units appear/disappear on buy, sell, move, and battle. Show enemy units in the top half during battle.

**Architecture:** `UnitSpawner3D` is a MonoBehaviour added to the scene. It keeps a `Dictionary<(int col, int row), UnitView3D>` for player units and a `List<UnitView3D>` for enemy units. `GameManager` calls `unitSpawner3D.Refresh(Board)` wherever it currently calls `boardView.Refresh()`. Uses `BoardMesh3D.PlayerCellPos` and `BoardMesh3D.EnemyCellPos` for world positions — no coordinate math duplication.

**Unity project path:** `~/Documents/polana/`

**Prerequisites:**
- `BoardMesh3D.cs` exists (from plan7a) — provides `PlayerCellPos(col, row)` and `EnemyCellPos(col, row)`
- `UnitPrefab3D.prefab` exists at `Assets/Prefabs/UnitPrefab3D.prefab` (from plan7b)
- `UnitView3D.cs` exists (from plan7b)

---

## File Map

```
Create:  Assets/Scripts/Visual/UnitSpawner3D.cs   — spawns/destroys 3D unit GameObjects
Modify:  Assets/Scripts/Game/GameManager.cs        — wire UnitSpawner3D calls alongside boardView
```

---

## Task 1: UnitSpawner3D

**Files:**
- Create: `Assets/Scripts/Visual/UnitSpawner3D.cs`

- [ ] **Step 1: Write UnitSpawner3D.cs**

```csharp
using System.Collections.Generic;
using UnityEngine;

// Manages 3D unit GameObjects on the board.
// Assign UnitPrefab3D in inspector. Wire calls from GameManager.
public class UnitSpawner3D : MonoBehaviour
{
    [SerializeField] GameObject unitPrefab3D; // drag UnitPrefab3D.prefab here

    // Faction colors — index matches FactionBonusType order, keyed by factionCode
    static readonly Dictionary<string, Color> FactionColors = new()
    {
        { "KB",  new Color(0.80f, 0.10f, 0.10f) }, // red-white → red
        { "KS",  new Color(0.75f, 0.10f, 0.55f) }, // red-blue → purple-red
        { "BG",  new Color(0.15f, 0.40f, 0.85f) }, // white-blue → blue
        { "KZ",  new Color(0.85f, 0.50f, 0.10f) }, // red-green → orange
        { "SBG", new Color(0.20f, 0.70f, 0.85f) }, // blue-white-blue → cyan
    };

    readonly Dictionary<(int col, int row), UnitView3D> playerViews = new();
    readonly List<UnitView3D>                            enemyViews  = new();

    // ── Player board ──────────────────────────────────────────────────

    // Syncs 3D state to match BoardManager. Cheap to call every frame.
    public void Refresh(BoardManager board)
    {
        var occupied = new HashSet<(int, int)>();

        for (int c = 0; c < BoardManager.Cols; c++)
        {
            for (int r = 0; r < BoardManager.Rows; r++)
            {
                var unit = board.GetUnit(c, r);
                if (unit == null)
                {
                    RemovePlayerView(c, r);
                    continue;
                }
                occupied.Add((c, r));

                if (!playerViews.TryGetValue((c, r), out var view))
                {
                    view = SpawnView(BoardMesh3D.PlayerCellPos(c, r));
                    playerViews[(c, r)] = view;
                }

                UpdateView(view, unit);
            }
        }

        // Remove stale views (unit was moved/sold)
        var toRemove = new List<(int, int)>();
        foreach (var key in playerViews.Keys)
            if (!occupied.Contains(key)) toRemove.Add(key);
        foreach (var key in toRemove) RemovePlayerView(key.Item1, key.Item2);
    }

    void RemovePlayerView(int col, int row)
    {
        if (playerViews.TryGetValue((col, row), out var view))
        {
            if (view != null) Destroy(view.gameObject);
            playerViews.Remove((col, row));
        }
    }

    // ── Enemy board ───────────────────────────────────────────────────

    public void ShowEnemies(List<UnitInstance> botUnits)
    {
        HideEnemies();
        for (int i = 0; i < botUnits.Count; i++)
        {
            int col = i % BoardManager.Cols;
            int row = i / BoardManager.Cols;
            if (row >= 4) break; // max 4 enemy rows

            var view = SpawnView(BoardMesh3D.EnemyCellPos(col, row));
            UpdateView(view, botUnits[i]);
            enemyViews.Add(view);
        }
    }

    public void HideEnemies()
    {
        foreach (var v in enemyViews)
            if (v != null) Destroy(v.gameObject);
        enemyViews.Clear();
    }

    // ── Helpers ───────────────────────────────────────────────────────

    UnitView3D SpawnView(Vector3 worldPos)
    {
        var go   = Instantiate(unitPrefab3D, worldPos, Quaternion.identity, transform);
        var view = go.GetComponent<UnitView3D>();
        return view;
    }

    void UpdateView(UnitView3D view, UnitInstance unit)
    {
        if (view == null || unit == null) return;

        var color = Color.grey;
        if (unit.data?.faction != null &&
            FactionColors.TryGetValue(unit.data.faction.factionCode, out var fc))
            color = fc;

        view.SetFactionColor(color);
        view.SetState(unit.currentHp > 0 ? unit.currentHp : unit.MaxHp,
                      unit.MaxHp,
                      unit.gangLevel);
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Documents/polana
git add Assets/Scripts/Visual/UnitSpawner3D.cs
git commit -m "feat: add UnitSpawner3D — spawns/removes 3D units on player and enemy board"
git push origin main
```

---

## Task 2: Wire UnitSpawner3D into GameManager

**Files:**
- Modify: `Assets/Scripts/Game/GameManager.cs`

Add `UnitSpawner3D` as a serialized field and call `Refresh`/`ShowEnemies`/`HideEnemies` at the same points where `boardView` is updated.

- [ ] **Step 1: Add field and Awake call**

In `GameManager.cs`, add the field after the existing `boardView` field:

```csharp
[SerializeField] UnitSpawner3D   unitSpawner3D;
```

- [ ] **Step 2: Add Refresh calls**

In every method that calls `boardView.Refresh()`, add `unitSpawner3D?.Refresh(Board);` directly after. The `?.` guard handles the case where the field isn't yet assigned in the inspector.

Methods to update (4 locations):

**BeginPrep():**
```csharp
public void BeginPrep()
{
    Round.StartPrep();
    if (!Shop.Frozen) Shop.Reroll(free: true);
    shopPanel.Refresh();
    hudPanel.Refresh();
    boardView.Refresh();
    unitSpawner3D?.Refresh(Board);   // ← add
}
```

**BuyFromShop() — after the final boardView.Refresh():**
```csharp
shopPanel.Refresh();
hudPanel.Refresh();
boardView.Refresh();
unitSpawner3D?.Refresh(Board);       // ← add
```

**SellFromBoard():**
```csharp
public void SellFromBoard(int col, int row)
{
    var unit = Board.RemoveUnit(col, row);
    if (unit == null) return;
    merge.RemoveUnit(unit.data.unitName, unit.gangLevel);
    Shop.Sell(unit.data);
    hudPanel.Refresh();
    boardView.Refresh();
    unitSpawner3D?.Refresh(Board);   // ← add
}
```

**SelectCell() — after boardView.Refresh() in the method body:**
```csharp
boardView.Refresh();
unitSpawner3D?.Refresh(Board);       // ← add
```

- [ ] **Step 3: Add ShowEnemies and HideEnemies calls in RunBattle coroutine**

Find `boardView.ShowEnemies(botUnits)` → add line after:
```csharp
boardView.ShowEnemies(botUnits);
unitSpawner3D?.ShowEnemies(botUnits);   // ← add
```

Find `boardView.HideEnemies()` → add line after:
```csharp
boardView.HideEnemies();
unitSpawner3D?.HideEnemies();           // ← add
```

- [ ] **Step 4: Commit**

```bash
git add Assets/Scripts/Game/GameManager.cs
git commit -m "feat: wire UnitSpawner3D into GameManager — 3D units sync with board state"
git push origin main
```

---

## Task 3: Add UnitSpawner3D to scene and assign references

- [ ] **Step 1: Open main game scene**

File → Open Scene → find the main game scene (the one with GameManager in Hierarchy)

- [ ] **Step 2: Create UnitSpawner3D GameObject**

Hierarchy → right-click → Create Empty → rename to `UnitSpawner3D`

- [ ] **Step 3: Add UnitSpawner3D component**

With `UnitSpawner3D` selected → Inspector → Add Component → search `UnitSpawner3D`

- [ ] **Step 4: Assign prefab**

In Inspector, drag `Assets/Prefabs/UnitPrefab3D.prefab` into the `Unit Prefab 3D` field.

- [ ] **Step 5: Assign to GameManager**

Click `GameManager` in Hierarchy → in Inspector, drag the `UnitSpawner3D` GameObject into the `Unit Spawner 3D` field.

- [ ] **Step 6: Save scene**

Cmd+S

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add UnitSpawner3D to scene, assign prefab and GameManager reference"
git push origin main
```

---

## Task 4: Smoke test in Play mode

- [ ] **Step 1: Press Play**

- [ ] **Step 2: Buy a unit from shop**

Click a unit in the shop. Expected: a 3D capsule+sphere appears on the board in the correct cell, colored by faction (red for KB, blue for BG, etc.), with HP bar above its head.

- [ ] **Step 3: Move a unit**

Click the unit on board (select), then click another cell (swap). Expected: 3D model moves to new position.

- [ ] **Step 4: Sell a unit**

Click unit → click the sell button (or X button on cell). Expected: 3D model disappears.

- [ ] **Step 5: Start battle**

Click БОЙНЯ button. Expected:
- Enemy 3D units appear in the top half (dark red zone) of the board
- After 1.5 seconds, result shown
- Enemy 3D units disappear after battle ends

- [ ] **Step 6: Verify HP bars update (optional)**

If BattleResolver exposes live state during battle — HP bars update. For MVP (instant sim), HP bars show max HP during battle and that's fine.

- [ ] **Step 7: Commit if no issues**

```bash
git add -A
git commit -m "chore: verify 3D board working in play mode"
git push origin main
```

---

## Task 5: Update PLAN.md in monorepo

- [ ] **Step 1: Mark Plan 7 complete in monorepo PLAN.md**

In `~/Documents/новый/projects/polana/docs/PLAN.md`, update item 11:

```
    - Plan 7: 3D Visual Pass (`2026-04-26-polana-plan7*.md`) ✅ выполнен
```

- [ ] **Step 2: Commit monorepo**

```bash
cd ~/Documents/новый
git add projects/polana/docs/PLAN.md
git commit -m "docs: mark Plan 7 complete in PLAN.md"
git push origin main
```

---

## Result (Plan 7 complete)

- ✅ 3D camera: top-down angled view, dark background
- ✅ Board mesh: 8×8 grid lines, player zone (dark green), enemy zone (dark red), gold divider
- ✅ UnitPrefab3D: capsule + sphere, faction color, World Space HP bar + gang badge
- ✅ DeathRagdoll3D: physics impulse on death, auto-destroy 2.5s
- ✅ UnitSpawner3D: syncs 3D units to BoardManager state on every Refresh
- ✅ Enemy units appear in 3D during battle, disappear after
- ✅ UI overlay (shop, HUD) still works on top of 3D scene
- ⏭ Next: replace capsule/sphere primitives with actual low-poly Blender meshes (separate art task)
