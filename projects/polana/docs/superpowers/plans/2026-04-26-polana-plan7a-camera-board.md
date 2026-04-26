# ПОЛЯНА Plan 7A — 3D Camera + Board Mesh

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Runs in parallel with plan7b. Does NOT touch unit prefab files.**

**Goal:** Configure the main Unity camera for top-down angled view, create a 3D board mesh (8×8 cells) with a visual divider between player half (rows 0–3) and enemy half (rows 4–7).

**Architecture:** Editor bootstrap script `PolanaBoard3DBootstrap.cs` sets up the camera and board via Polana menu — same pattern as existing `PolanaSceneBootstrap.cs`. Board is a procedurally generated `LineRenderer` grid + two flat `Quad` planes (player zone / enemy zone). No game logic touched.

**Unity project path:** `~/Documents/polana/`

**Board coordinate system (established here, used by plan7c):**
- Cell size: `1.1f` Unity units
- Column x: `col * 1.1f`
- Row z (player): `row * 1.1f` (rows 0–3 → z 0..3.3)
- Row z (enemy): `(row + 4) * 1.1f + 0.5f` (rows 0–3 mapped to z 4.9..8.2, 0.5 gap between halves)
- Board center: `(3.85f, 0f, 4.35f)`
- Camera: position `(3.85f, 10f, -1.5f)`, rotation `(58f, 0f, 0f)`

---

## File Map

```
Create:  Assets/Scripts/Editor/PolanaBoard3DBootstrap.cs  — editor menu script
Create:  Assets/Scripts/Visual/BoardMesh3D.cs             — MonoBehaviour: grid lines + zone planes
```

---

## Task 1: BoardMesh3D MonoBehaviour

**Files:**
- Create: `Assets/Scripts/Visual/BoardMesh3D.cs`

- [x] **Step 1: Create BoardMesh3D.cs**

```csharp
using UnityEngine;

// Draws the 3D board: grid lines + zone planes.
// Attach to a GameObject named "Board3D" in the scene.
// Called by PolanaBoard3DBootstrap to configure itself.
public class BoardMesh3D : MonoBehaviour
{
    public const float CellSize   = 1.1f;
    public const int   Cols       = 8;
    public const int   PlayerRows = 4;
    public const int   EnemyRows  = 4;
    public const float HalfGap    = 0.5f; // gap between player and enemy halves

    // World position of the center of cell (col, row) in player half
    public static Vector3 PlayerCellPos(int col, int row) =>
        new Vector3(col * CellSize, 0f, row * CellSize);

    // World position of the center of cell (col, row) in enemy half (row 0 = closest to center)
    public static Vector3 EnemyCellPos(int col, int row) =>
        new Vector3(col * CellSize, 0f, (PlayerRows + row) * CellSize + HalfGap);

    [Header("Materials (assign in inspector or via bootstrap)")]
    public Material playerZoneMat;
    public Material enemyZoneMat;
    public Material gridLineMat;
    public Material dividerMat;

    // Called by PolanaBoard3DBootstrap after materials are assigned
    public void Build()
    {
        foreach (Transform child in transform)
            DestroyImmediate(child.gameObject);

        BuildZonePlane("PlayerZone", playerZoneMat,
            centerX: (Cols - 1) * CellSize / 2f,
            centerZ: (PlayerRows - 1) * CellSize / 2f,
            width:   Cols * CellSize,
            depth:   PlayerRows * CellSize);

        BuildZonePlane("EnemyZone", enemyZoneMat,
            centerX: (Cols - 1) * CellSize / 2f,
            centerZ: (PlayerRows - 1) * CellSize / 2f + PlayerRows * CellSize + HalfGap,
            width:   Cols * CellSize,
            depth:   EnemyRows * CellSize);

        BuildGridLines();
        BuildDivider();
    }

    void BuildZonePlane(string name, Material mat, float centerX, float centerZ, float width, float depth)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Plane);
        go.name = name;
        go.transform.SetParent(transform);
        go.transform.localPosition = new Vector3(centerX, -0.01f, centerZ);
        go.transform.localScale    = new Vector3(width / 10f, 1f, depth / 10f);
        if (mat != null) go.GetComponent<Renderer>().material = mat;
        DestroyImmediate(go.GetComponent<Collider>());
    }

    void BuildGridLines()
    {
        float totalDepth = (PlayerRows + EnemyRows) * CellSize + HalfGap;
        float totalWidth = Cols * CellSize;

        // Vertical lines (along Z)
        for (int c = 0; c <= Cols; c++)
        {
            float x = c * CellSize - CellSize / 2f;
            CreateLine($"VLine_{c}", gridLineMat,
                new Vector3(x, 0.01f, -CellSize / 2f),
                new Vector3(x, 0.01f, totalDepth - CellSize / 2f));
        }

        // Horizontal lines (along X) — skip the gap between halves
        for (int r = 0; r <= PlayerRows + EnemyRows; r++)
        {
            float z = r < PlayerRows + 1
                ? r * CellSize - CellSize / 2f
                : r * CellSize - CellSize / 2f + HalfGap;

            CreateLine($"HLine_{r}", gridLineMat,
                new Vector3(-CellSize / 2f, 0.01f, z),
                new Vector3(totalWidth - CellSize / 2f, 0.01f, z));
        }
    }

    void BuildDivider()
    {
        // Thick line between player and enemy halves
        float z = PlayerRows * CellSize - CellSize / 2f + HalfGap / 2f;
        var go  = CreateLine("Divider", dividerMat,
            new Vector3(-CellSize / 2f, 0.02f, z),
            new Vector3(Cols * CellSize - CellSize / 2f, 0.02f, z));
        go.GetComponent<LineRenderer>().widthMultiplier = 0.12f;
    }

    GameObject CreateLine(string name, Material mat, Vector3 start, Vector3 end)
    {
        var go = new GameObject(name);
        go.transform.SetParent(transform);
        var lr              = go.AddComponent<LineRenderer>();
        lr.useWorldSpace    = false;
        lr.positionCount    = 2;
        lr.SetPosition(0, start);
        lr.SetPosition(1, end);
        lr.widthMultiplier  = 0.03f;
        lr.material         = mat != null ? mat : new Material(Shader.Find("Universal Render Pipeline/Lit"));
        lr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        return go;
    }
}
```

- [x] **Step 2: Commit**

```bash
cd ~/Documents/polana
git add Assets/Scripts/Visual/BoardMesh3D.cs
git commit -m "feat: add BoardMesh3D — grid lines + zone planes procedural builder"
git push origin main
```

---

## Task 2: Editor Bootstrap Script

**Files:**
- Create: `Assets/Scripts/Editor/PolanaBoard3DBootstrap.cs`

- [x] **Step 1: Create bootstrap script**

```csharp
using UnityEngine;
using UnityEditor;

// Menu: Polana → Setup 3D Board
// Creates or reconfigures the Board3D GameObject and main camera for 3D view.
public static class PolanaBoard3DBootstrap
{
    [MenuItem("Polana/Setup 3D Board")]
    public static void SetupBoard()
    {
        SetupCamera();
        SetupBoard3D();
        Debug.Log("[Polana] 3D board setup complete.");
    }

    static void SetupCamera()
    {
        var cam = Camera.main;
        if (cam == null)
        {
            var go = new GameObject("Main Camera");
            go.tag = "MainCamera";
            cam    = go.AddComponent<Camera>();
        }

        cam.transform.position = new Vector3(3.85f, 10f, -1.5f);
        cam.transform.rotation = Quaternion.Euler(58f, 0f, 0f);
        cam.fieldOfView        = 60f;
        cam.clearFlags         = CameraClearFlags.SolidColor;
        cam.backgroundColor    = new Color(0.08f, 0.08f, 0.10f); // dark background
        cam.nearClipPlane      = 0.1f;
        cam.farClipPlane       = 50f;
    }

    static void SetupBoard3D()
    {
        // Remove old Board3D if exists
        var old = GameObject.Find("Board3D");
        if (old != null) Object.DestroyImmediate(old);

        var go    = new GameObject("Board3D");
        var board = go.AddComponent<BoardMesh3D>();

        // Player zone: dark green-grey
        board.playerZoneMat = CreateColorMaterial("PlayerZoneMat",
            new Color(0.12f, 0.18f, 0.12f));

        // Enemy zone: dark red-grey
        board.enemyZoneMat = CreateColorMaterial("EnemyZoneMat",
            new Color(0.20f, 0.10f, 0.10f));

        // Grid lines: slightly lighter than zones
        board.gridLineMat = CreateColorMaterial("GridLineMat",
            new Color(0.30f, 0.30f, 0.32f));

        // Divider: bright accent line
        board.dividerMat = CreateColorMaterial("DividerMat",
            new Color(0.85f, 0.70f, 0.10f)); // gold

        board.Build();

        // Add ambient light if none exists
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        RenderSettings.ambientLight = new Color(0.5f, 0.5f, 0.55f);

        // Add a directional light if none exists
        if (Object.FindFirstObjectByType<Light>() == null)
        {
            var lightGO = new GameObject("Directional Light");
            var light   = lightGO.AddComponent<Light>();
            light.type  = LightType.Directional;
            light.intensity = 1.2f;
            lightGO.transform.rotation = Quaternion.Euler(45f, 30f, 0f);
        }

        EditorUtility.SetDirty(go);
    }

    static Material CreateColorMaterial(string name, Color color)
    {
        var mat         = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.name        = name;
        mat.color       = color;
        mat.SetFloat("_Smoothness", 0f);
        AssetDatabase.CreateAsset(mat, $"Assets/Materials/{name}.mat");
        return mat;
    }
}
```

- [x] **Step 2: Create Materials folder**

```bash
mkdir -p ~/Documents/polana/Assets/Materials
```

- [x] **Step 3: Commit**

```bash
git add Assets/Scripts/Editor/PolanaBoard3DBootstrap.cs Assets/Materials/
git commit -m "feat: add PolanaBoard3DBootstrap — Polana → Setup 3D Board menu item"
git push origin main
```

---

## Task 3: Run bootstrap and verify in editor

- [ ] **Step 1: In Unity Editor, create Materials folder if not visible**

Right-click in Project → `Assets` → Create → Folder → name it `Materials`

- [ ] **Step 2: Run the bootstrap**

Unity Editor menu bar → **Polana → Setup 3D Board**

Expected: Board3D GameObject appears in Hierarchy with player/enemy zone planes and grid lines visible in Scene view.

- [ ] **Step 3: Verify camera angle**

Click `Main Camera` in Hierarchy → in Scene view click "Align View to Selected" (or press Ctrl+Shift+F). Camera should show the board angled from above with both player (dark green) and enemy (dark red) zones visible, separated by a gold divider line.

- [ ] **Step 4: Verify grid lines**

In Game view: board should show 8 columns × 8 rows of cells with thin grey lines separating them.

- [ ] **Step 5: Save scene**

File → Save (Cmd+S)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: save scene after 3D board setup (camera + board mesh)"
git push origin main
```

---

## Task 4: Make UI Canvas transparent in board area

The existing `BoardView` Canvas must not block the 3D view. We hide the board background while keeping buttons/cells interactive.

**Files:**
- Modify: `Assets/Scripts/UI/BoardCell.cs`

- [x] **Step 1: Open BoardCell.cs and make cell background transparent**

Open `Assets/Scripts/UI/BoardCell.cs`. Find where the cell background Image color is set. Add a method `SetTransparent()` that clears the background:

In the `Setup(int col, int row)` method (or Awake), add after finding the Image component:

```csharp
// Make background transparent — 3D board renders behind UI
var bg = GetComponent<Image>();
if (bg != null) bg.color = new Color(0, 0, 0, 0);
```

- [ ] **Step 2: Verify in Play mode**

Press Play. The board area should show the 3D board through the transparent UI cells. Click cells to verify selection still works (invisible button is still clickable).

- [x] **Step 3: Commit**

```bash
git add Assets/Scripts/UI/BoardCell.cs
git commit -m "feat: make BoardCell background transparent — 3D board visible behind UI"
git push origin main
```

---

## Result (Plan 7A complete)

- ✅ Camera positioned for top-down angled view (58° down, centered on board)
- ✅ Board3D GameObject: 8×8 grid lines, player zone (dark green), enemy zone (dark red), gold divider
- ✅ Materials: PlayerZoneMat, EnemyZoneMat, GridLineMat, DividerMat
- ✅ BoardCell background transparent — 3D board visible, click handling intact
- ✅ **Coordinate constants defined in BoardMesh3D** (CellSize, PlayerCellPos, EnemyCellPos) — used by plan7c
- ⏭ Next: plan7c (UnitSpawner3D wiring) — requires plan7b to be complete too
