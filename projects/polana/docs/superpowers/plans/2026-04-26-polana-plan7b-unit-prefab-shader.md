# ПОЛЯНА Plan 7B — Unit Prefab + Flat Shader

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Runs in parallel with plan7a. Does NOT touch camera, board, or GameManager files.**

**Goal:** Create `UnitPrefab3D` — a low-poly 3D unit (capsule body + sphere head) with a World Space HP bar and gang level badge. Create a flat URP material. Create `UnitView3D` script. Create `DeathRagdoll3D` script (Rigidbody physics on death).

**Architecture:** `UnitPrefab3D` is a self-contained prefab. `UnitView3D` owns HP bar + gang badge update. `DeathRagdoll3D` activates on death — enables Rigidbody, applies random impulse, self-destroys after delay. No game logic. No dependency on BoardManager or GameManager.

**Unity project path:** `~/Documents/polana/`

---

## File Map

```
Create:  Assets/Scripts/Visual/UnitView3D.cs            — HP bar + gang badge + faction color
Create:  Assets/Scripts/Visual/DeathRagdoll3D.cs        — Rigidbody ragdoll on death
Create:  Assets/Scripts/Editor/PolanaUnitPrefabBuilder.cs — editor menu: builds UnitPrefab3D
Create:  Assets/Prefabs/UnitPrefab3D.prefab             — created by editor script
Create:  Assets/Materials/UnitFlatMat.mat               — URP Lit, smoothness 0
```

---

## Task 1: UnitView3D script

**Files:**
- Create: `Assets/Scripts/Visual/UnitView3D.cs`

- [ ] **Step 1: Create UnitView3D.cs**

```csharp
using UnityEngine;
using UnityEngine.UI;
using TMPro;

// Attached to UnitPrefab3D root.
// Called by UnitSpawner3D to update visual state each frame/refresh.
[RequireComponent(typeof(DeathRagdoll3D))]
public class UnitView3D : MonoBehaviour
{
    [Header("Body parts (assign in prefab)")]
    [SerializeField] Renderer bodyRenderer;
    [SerializeField] Renderer headRenderer;

    [Header("World Space UI")]
    [SerializeField] Image           hpFill;       // Image type=Filled
    [SerializeField] TextMeshProUGUI hpLabel;
    [SerializeField] TextMeshProUGUI gangBadge;    // "1", "2", "3" (★ style)

    static readonly int ColorProp = Shader.PropertyToID("_BaseColor");

    // Sets faction color on body and head materials (non-shared instance)
    public void SetFactionColor(Color color)
    {
        if (bodyRenderer != null)
        {
            var mat   = bodyRenderer.material; // creates instance
            mat.color = color;
        }
        if (headRenderer != null)
        {
            var mat   = headRenderer.material;
            mat.color = Color.Lerp(color, Color.white, 0.3f); // head slightly lighter
        }
    }

    // Updates HP bar and gang badge. Call after any state change.
    public void SetState(int currentHp, int maxHp, int gangLevel)
    {
        float ratio = maxHp > 0 ? Mathf.Clamp01((float)currentHp / maxHp) : 0f;

        if (hpFill  != null) hpFill.fillAmount = ratio;
        if (hpLabel != null) hpLabel.text       = $"{currentHp}";

        if (gangBadge != null)
            gangBadge.text = gangLevel switch { 2 => "★★", 3 => "★★★", _ => "★" };
    }

    // Called when unit dies. Hides UI, activates ragdoll.
    public void OnDeath()
    {
        if (hpFill    != null) hpFill.transform.parent.gameObject.SetActive(false);
        if (gangBadge != null) gangBadge.gameObject.SetActive(false);
        GetComponent<DeathRagdoll3D>().Activate();
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Documents/polana
git add Assets/Scripts/Visual/UnitView3D.cs
git commit -m "feat: add UnitView3D — HP bar, gang badge, faction color"
git push origin main
```

---

## Task 2: DeathRagdoll3D script

**Files:**
- Create: `Assets/Scripts/Visual/DeathRagdoll3D.cs`

- [ ] **Step 1: Create DeathRagdoll3D.cs**

```csharp
using UnityEngine;

// Physics ragdoll on unit death.
// Requires Rigidbody component (set kinematic=true at start, Activate() enables physics).
[RequireComponent(typeof(Rigidbody))]
public class DeathRagdoll3D : MonoBehaviour
{
    [SerializeField] float destroyDelay = 2.5f;
    [SerializeField] float upwardForce  = 3f;
    [SerializeField] float torqueMag    = 4f;

    Rigidbody rb;

    void Awake()
    {
        rb             = GetComponent<Rigidbody>();
        rb.isKinematic = true; // inactive until death
    }

    public void Activate()
    {
        rb.isKinematic = false;

        // Random upward impulse + sideways spread
        var force = new Vector3(
            Random.Range(-1.5f, 1.5f),
            upwardForce,
            Random.Range(-1.5f, 1.5f));
        rb.AddForce(force, ForceMode.Impulse);

        // Random spin
        var torque = new Vector3(
            Random.Range(-1f, 1f),
            Random.Range(-1f, 1f),
            Random.Range(-1f, 1f)).normalized * torqueMag;
        rb.AddTorque(torque, ForceMode.Impulse);

        Destroy(gameObject, destroyDelay);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add Assets/Scripts/Visual/DeathRagdoll3D.cs
git commit -m "feat: add DeathRagdoll3D — physics impulse on death, auto-destroy"
git push origin main
```

---

## Task 3: Editor script to build UnitPrefab3D

**Files:**
- Create: `Assets/Scripts/Editor/PolanaUnitPrefabBuilder.cs`

- [ ] **Step 1: Create PolanaUnitPrefabBuilder.cs**

```csharp
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using TMPro;

// Menu: Polana → Build Unit Prefab 3D
// Creates Assets/Prefabs/UnitPrefab3D.prefab
public static class PolanaUnitPrefabBuilder
{
    const string PrefabPath  = "Assets/Prefabs/UnitPrefab3D.prefab";
    const string MatPath     = "Assets/Materials/UnitFlatMat.mat";

    [MenuItem("Polana/Build Unit Prefab 3D")]
    public static void Build()
    {
        EnsureFolders();
        var flatMat = EnsureFlatMaterial();
        var root    = BuildPrefabHierarchy(flatMat);

        // Save as prefab
        bool success;
        PrefabUtility.SaveAsPrefabAsset(root, PrefabPath, out success);
        Object.DestroyImmediate(root);

        if (success) Debug.Log($"[Polana] UnitPrefab3D saved to {PrefabPath}");
        else         Debug.LogError("[Polana] Failed to save UnitPrefab3D prefab");
    }

    static void EnsureFolders()
    {
        if (!AssetDatabase.IsValidFolder("Assets/Prefabs"))
            AssetDatabase.CreateFolder("Assets", "Prefabs");
        if (!AssetDatabase.IsValidFolder("Assets/Materials"))
            AssetDatabase.CreateFolder("Assets", "Materials");
    }

    static Material EnsureFlatMaterial()
    {
        var mat = AssetDatabase.LoadAssetAtPath<Material>(MatPath);
        if (mat != null) return mat;

        mat             = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.name        = "UnitFlatMat";
        mat.color       = new Color(0.7f, 0.7f, 0.7f); // default grey, overridden per-instance
        mat.SetFloat("_Smoothness", 0f);
        mat.SetFloat("_Metallic",   0f);
        AssetDatabase.CreateAsset(mat, MatPath);
        return mat;
    }

    static GameObject BuildPrefabHierarchy(Material flatMat)
    {
        // ── Root ──────────────────────────────────────────────────────
        var root      = new GameObject("UnitPrefab3D");
        var view      = root.AddComponent<UnitView3D>();
        root.AddComponent<DeathRagdoll3D>(); // Rigidbody added by RequireComponent
        root.AddComponent<Rigidbody>();      // explicit so we can configure it
        var rb        = root.GetComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.mass        = 1f;

        // ── Body (Capsule) ────────────────────────────────────────────
        var body      = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        body.name     = "Body";
        body.transform.SetParent(root.transform);
        body.transform.localPosition = Vector3.zero;
        body.transform.localScale    = new Vector3(0.55f, 0.55f, 0.55f);
        body.GetComponent<Renderer>().material = flatMat;
        Object.DestroyImmediate(body.GetComponent<Collider>());

        // ── Head (Sphere) ─────────────────────────────────────────────
        var head      = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        head.name     = "Head";
        head.transform.SetParent(root.transform);
        head.transform.localPosition = new Vector3(0f, 0.75f, 0f);
        head.transform.localScale    = new Vector3(0.38f, 0.38f, 0.38f);
        head.GetComponent<Renderer>().material = flatMat;
        Object.DestroyImmediate(head.GetComponent<Collider>());

        // ── World Space Canvas ────────────────────────────────────────
        var canvasGO  = new GameObject("InfoCanvas");
        canvasGO.transform.SetParent(root.transform);
        canvasGO.transform.localPosition = new Vector3(0f, 1.2f, 0f);
        canvasGO.transform.localScale    = Vector3.one * 0.008f; // scale down for world space

        var canvas            = canvasGO.AddComponent<Canvas>();
        canvas.renderMode     = RenderMode.WorldSpace;
        var rt                = canvasGO.GetComponent<RectTransform>();
        rt.sizeDelta          = new Vector2(120f, 40f);

        // Auto-face camera
        canvasGO.AddComponent<FaceCamera>();

        // HP bar background
        var bgGO       = new GameObject("HPBarBG");
        bgGO.transform.SetParent(canvasGO.transform, false);
        var bgRT       = bgGO.AddComponent<RectTransform>();
        bgRT.anchorMin = new Vector2(0.05f, 0.55f);
        bgRT.anchorMax = new Vector2(0.95f, 0.95f);
        bgRT.offsetMin = bgRT.offsetMax = Vector2.zero;
        var bgImg      = bgGO.AddComponent<Image>();
        bgImg.color    = new Color(0.15f, 0.15f, 0.15f, 0.85f);

        // HP fill
        var fillGO     = new GameObject("HPFill");
        fillGO.transform.SetParent(bgGO.transform, false);
        var fillRT     = fillGO.AddComponent<RectTransform>();
        fillRT.anchorMin = Vector2.zero;
        fillRT.anchorMax = Vector2.one;
        fillRT.offsetMin = fillRT.offsetMax = Vector2.zero;
        var fillImg    = fillGO.AddComponent<Image>();
        fillImg.color  = new Color(0.2f, 0.85f, 0.25f);
        fillImg.type   = Image.Type.Filled;
        fillImg.fillMethod    = Image.FillMethod.Horizontal;
        fillImg.fillOrigin    = (int)Image.OriginHorizontal.Left;
        fillImg.fillAmount    = 1f;

        // HP label (small text on bar)
        var hpLabelGO  = new GameObject("HPLabel");
        hpLabelGO.transform.SetParent(bgGO.transform, false);
        var hpLabelRT  = hpLabelGO.AddComponent<RectTransform>();
        hpLabelRT.anchorMin = Vector2.zero;
        hpLabelRT.anchorMax = Vector2.one;
        hpLabelRT.offsetMin = hpLabelRT.offsetMax = Vector2.zero;
        var hpTMP      = hpLabelGO.AddComponent<TextMeshProUGUI>();
        hpTMP.fontSize = 18f;
        hpTMP.color    = Color.white;
        hpTMP.alignment = TextAlignmentOptions.Center;
        hpTMP.text     = "100";

        // Gang badge
        var badgeGO    = new GameObject("GangBadge");
        badgeGO.transform.SetParent(canvasGO.transform, false);
        var badgeRT    = badgeGO.AddComponent<RectTransform>();
        badgeRT.anchorMin = new Vector2(0.05f, 0.05f);
        badgeRT.anchorMax = new Vector2(0.95f, 0.50f);
        badgeRT.offsetMin = badgeRT.offsetMax = Vector2.zero;
        var badgeTMP   = badgeGO.AddComponent<TextMeshProUGUI>();
        badgeTMP.fontSize  = 16f;
        badgeTMP.color     = new Color(1f, 0.85f, 0.1f); // gold
        badgeTMP.alignment = TextAlignmentOptions.Center;
        badgeTMP.text      = "★";

        // Wire references into UnitView3D via SerializedObject
        var so = new SerializedObject(view);
        so.FindProperty("bodyRenderer").objectReferenceValue = body.GetComponent<Renderer>();
        so.FindProperty("headRenderer").objectReferenceValue = head.GetComponent<Renderer>();
        so.FindProperty("hpFill").objectReferenceValue       = fillImg;
        so.FindProperty("hpLabel").objectReferenceValue      = hpTMP;
        so.FindProperty("gangBadge").objectReferenceValue    = badgeTMP;
        so.ApplyModifiedProperties();

        return root;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add Assets/Scripts/Editor/PolanaUnitPrefabBuilder.cs
git commit -m "feat: add PolanaUnitPrefabBuilder — Polana → Build Unit Prefab 3D"
git push origin main
```

---

## Task 4: FaceCamera utility script

The World Space Canvas on each unit should always face the camera.

**Files:**
- Create: `Assets/Scripts/Visual/FaceCamera.cs`

- [ ] **Step 1: Create FaceCamera.cs**

```csharp
using UnityEngine;

// Rotates the GameObject to always face the main camera.
// Attach to the World Space Canvas on unit prefabs.
public class FaceCamera : MonoBehaviour
{
    void LateUpdate()
    {
        if (Camera.main == null) return;
        transform.LookAt(transform.position + Camera.main.transform.rotation * Vector3.forward,
                         Camera.main.transform.rotation * Vector3.up);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add Assets/Scripts/Visual/FaceCamera.cs
git commit -m "feat: add FaceCamera — World Space Canvas always faces main camera"
git push origin main
```

---

## Task 5: Run bootstrap and verify prefab

- [ ] **Step 1: Run the builder**

Unity Editor menu → **Polana → Build Unit Prefab 3D**

Expected: `Assets/Prefabs/UnitPrefab3D.prefab` and `Assets/Materials/UnitFlatMat.mat` created.

- [ ] **Step 2: Drag prefab into scene to preview**

Drag `UnitPrefab3D` from Project into Scene view. Should appear as:
- Grey capsule (body) + grey sphere (head)
- Small World Space Canvas above head with HP bar + ★ badge

- [ ] **Step 3: Verify faction color API**

In Play mode, create a temporary test script (or use the Console) to verify:
```csharp
// Temporary test — paste in any MonoBehaviour Start():
var view = FindFirstObjectByType<UnitView3D>();
if (view != null) view.SetFactionColor(new Color(0.8f, 0.1f, 0.1f)); // red = KB
```
Expected: body turns red, head turns slightly lighter red.

- [ ] **Step 4: Delete test instance from scene**

Delete the manually dragged instance from Hierarchy before saving.

- [ ] **Step 5: Save and commit**

```bash
git add -A
git commit -m "chore: save scene after UnitPrefab3D build verification"
git push origin main
```

---

## Result (Plan 7B complete)

- ✅ `UnitView3D` — faction color, HP bar, gang badge, OnDeath() hook
- ✅ `DeathRagdoll3D` — Rigidbody physics on death, auto-destroy after 2.5s
- ✅ `FaceCamera` — World Space Canvas always faces camera
- ✅ `UnitPrefab3D.prefab` — capsule body + sphere head + World Space Canvas
- ✅ `UnitFlatMat.mat` — URP Lit, smoothness 0 (low-poly flat aesthetic)
- ⏭ Next: plan7c uses UnitPrefab3D and UnitView3D to spawn units on the board
