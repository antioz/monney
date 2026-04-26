# ПОЛЯНА Plan 7 — 3D Visual Pass (Master Orchestrator)

> **REQUIRED SUB-SKILL:** superpowers:dispatching-parallel-agents
>
> **Execution mode: PARALLEL → SEQUENTIAL**
> 1. Read plan7a and plan7b, then dispatch Agent A and Agent B **IN PARALLEL**
> 2. Wait for both agents to push their commits to `~/Documents/polana` git repo
> 3. Agent C does `git pull`, then executes plan7c
>
> Agent A works only in `Assets/Scripts/Visual/` and `Assets/Materials/` (board)
> Agent B works only in `Assets/Scripts/Visual/` and `Assets/Prefabs/` (unit)
> No shared files — parallel execution is safe.

**Goal:** Replace the 2D UI tile board with a real 3D scene. UI Canvas stays for HUD/Shop/click-handling (transparent cells). 3D models render behind the Canvas via camera.

**Unity project path:** `~/Documents/polana/`

**Sub-plans:**
- `plan7a`: Camera + Board Mesh (Agent A)
- `plan7b`: Unit Prefab + Flat Shader (Agent B)
- `plan7c`: UnitSpawner3D + GameManager wiring (Agent C, after A+B)

**Series:**
- Plans 1–6: ✅ Complete
- **Plan 7 (this): 3D Visual Pass**
- Plan 8: TBD (polish, sound, etc.)

---

## How to execute

```
1. Open two terminals in ~/Documents/polana
2. Terminal 1: run plan7a (Camera + Board Mesh)
3. Terminal 2: run plan7b (Unit Prefab + Shader)
4. Wait for both to commit and push
5. Terminal 3 (or reuse): run plan7c (Spawner + Wiring)
```

Sub-plan files:
- `2026-04-26-polana-plan7a-camera-board.md`
- `2026-04-26-polana-plan7b-unit-prefab-shader.md`
- `2026-04-26-polana-plan7c-spawner-wiring.md`
