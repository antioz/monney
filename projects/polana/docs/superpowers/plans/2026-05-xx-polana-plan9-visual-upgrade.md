# ПОЛЯНА Plan 9 — Visual Upgrade (от схемы к игре)

> **Цель:** Превратить прототип-сетку в игру которая выглядит живой.
> Ориентир — не Underlords по качеству арта, а Underlords по ощущению:
> борд как место, юниты как персонажи, бой как событие.

**Unity project path:** `~/Documents/polana/`

---

## Контекст и состояние после Plan 8

После Plan 8 в игре есть:
- Рабочий авточесс-цикл (покупка → расстановка → бой → итог)
- BattleAnimator: юниты двигаются к цели (Lerp), HP bars обновляются
- FactionPanel, ShopSlot с цветами фракций, BoardCell с HP bar
- Юниты — красные/синие капсулы. Борд — плоская сетка. Нет фона, нет арта.

**Главная проблема:** игра выглядит как схема, а не как игра.

---

## Пайплайн арта (важно понять до кода)

```
Meshy.ai → экспорт FBX/GLB
    ↓
Mixamo (mixamo.com) — авто-риг + анимации:
    idle (Breathing Idle)
    walk (Walk)
    attack (Punch / Sword Slash / любая)
    death (Dying)
    ↓
Unity Import:
    Rig → Humanoid
    Animator Controller с 4 состояниями
    Prefab заменяет текущий UnitPrefab3D (capsule)
```

---

## Plan 9A — Окружение (без арта, только Unity)

> Результат: борд выглядит как место, а не как сетка.
> Делается без моделей — только встроенные Unity инструменты.

**Файлы:**
- Modify: `Assets/Scripts/Editor/PolanaBoard3DBootstrap.cs`
- Create: `Assets/Materials/BoardMat.mat`, `Assets/Materials/SkyMat.mat`

**Что делаем:**

1. **Борд — текстура вместо голой сетки**
   - Plane под сеткой: `Material` с текстурой (асфальт / трава / бетон)
   - Можно использовать бесплатную tileable texture из Unity Asset Store
   - Или: Shader Graph — простой checkerboard с тёмными и светлыми клетками
   - Граница борда: 4 куба по периметру (бордюр/забор/бетон)

2. **Освещение**
   - `Directional Light`: угол 45°, тёплый белый (#FFF5E0), intensity 1.2
   - `Ambient Color` (Lighting Settings): тёмно-синий (#1A1A2E)
   - Тени включить: Shadow Type = Soft Shadows

3. **Skybox**
   - Window → Rendering → Lighting → Skybox Material
   - Использовать бесплатный skybox из Asset Store (городской/парковый вечер)
   - ИЛИ встроенный Procedural Skybox с настройкой:
     - Sun Size: 0.04
     - Atmosphere Thickness: 0.8
     - Sky Tint: #2A3A5A (тёмно-синий)
     - Ground: #1A1A14

4. **Камера**
   - Угол: 50–55° по X (сейчас вероятно 30°)
   - Позиция: чуть дальше, охватывает весь борд
   - Clear Flags: Skybox (не Solid Color)

**Задачи:**

- [ ] Task 1: Настроить освещение и Skybox через Editor script
- [ ] Task 2: Добавить текстурированный Plane под борд
- [ ] Task 3: Добавить бордюр по периметру (4 куба)
- [ ] Task 4: Commit + push

---

## Plan 9B — Импорт 3D героев (Meshy.ai → Mixamo → Unity)

> Результат: капсулы заменены на реальных персонажей с анимациями.

**Пайплайн пошагово:**

### Шаг 1: Meshy.ai
- Генерируешь модель персонажа
- Экспорт: **FBX** (предпочтительно) или GLB
- Важно: модель должна быть в T-pose

### Шаг 2: Mixamo (mixamo.com — бесплатно)
1. Upload Character → загрузить FBX
2. Авто-риг — расставить точки (подбородок, запястья, колени, пах)
3. Скачать риггированную модель: Download → FBX for Unity
4. Зайти во вкладку Animations, найти и скачать отдельно:
   - `Breathing Idle` (без скина, In Place)
   - `Walking` (In Place)
   - `Punch` или `Sword And Shield Slash` (In Place)
   - `Dying` (любой death)
   - Скачивать каждую как FBX for Unity, Without Skin

### Шаг 3: Unity Import
```
Assets/Characters/[UnitName]/
    [UnitName].fbx          ← модель с риггом
    Idle.fbx
    Walk.fbx
    Attack.fbx
    Death.fbx
    [UnitName]_Controller.controller
    [UnitName]_Prefab.prefab
```

**Настройка модели:**
- Model FBX → Rig → Animation Type: **Humanoid**
- Каждый анимационный FBX → Rig → Humanoid → Avatar Definition: **Copy From Other Avatar** (указать на основной)

**Animator Controller:**
```
States:
  Idle   (default)
  Walk   → trigger: "Walk"
  Attack → trigger: "Attack"
  Death  → trigger: "Die"

Transitions:
  Any State → Death (trigger Die, не прерываться)
  Idle ↔ Walk (trigger)
  Idle → Attack → Idle (trigger, has exit time)
```

**Файлы для изменения в коде:**
- Modify: `Assets/Scripts/Visual/UnitView3D.cs` — добавить `Animator` поле, вызовы триггеров
- Modify: `Assets/Scripts/Visual/BattleAnimator.cs` — вызывать `Attack` и `Die` триггеры
- Modify: `Assets/Prefabs/UnitPrefab3D.prefab` — заменить capsule на character mesh

**Задачи:**

- [ ] Task 1: Импортировать первого персонажа, настроить Humanoid rig
- [ ] Task 2: Создать Animator Controller с 4 состояниями
- [ ] Task 3: Обновить UnitView3D — добавить Animator, методы PlayAttack() / PlayDeath()
- [ ] Task 4: Обновить BattleAnimator — вызывать анимации в MoveAndStrike
- [ ] Task 5: Обновить UnitPrefab3D prefab — заменить capsule на character
- [ ] Task 6: Commit + push

---

## Plan 9C — Движение по клеткам в бою

> Сейчас: юниты делают Lerp к цели и обратно (lunge).
> Нужно: юниты реально идут по сетке к ближайшему врагу, останавливаются рядом, бьют, враг падает.

**Файлы:**
- Modify: `Assets/Scripts/Visual/BattleAnimator.cs`
- Modify: `Assets/Scripts/Visual/BoardMesh3D.cs` — получить world pos клетки по (col, row)

**Что делаем:**

Вместо Lerp к произвольной точке — движение по клеткам:
1. Определить клетку рядом с целью (adjacent cell)
2. Юнит идёт туда через `BoardMesh3D.PlayerCellPos(col, row)` шаг за шагом
3. `Walk` анимация во время движения
4. Когда стоит рядом — `Attack` анимация, урон, HP bar падает
5. Возврат на исходную клетку (или остаётся на новой — как в TFT)

**Задачи:**

- [ ] Task 1: Добавить в BattleAnimator логику нахождения клетки рядом с целью
- [ ] Task 2: Движение через промежуточные позиции (coroutine по waypoints)
- [ ] Task 3: Walk / Idle / Attack триггеры в нужные моменты
- [ ] Task 4: Commit + push

---

## Plan 9D — HP бары над головами (World Space)

> Сейчас: hpFill есть в UnitView3D но может не быть настроен в prefab.
> Нужно: зелёная полоска над каждым юнитом, всегда повёрнута к камере.

**Файлы:**
- Modify: `Assets/Prefabs/UnitPrefab3D.prefab`
- Modify: `Assets/Scripts/Visual/UnitView3D.cs`
- Проверить: `Assets/Scripts/Visual/FaceCamera.cs` — уже есть, нужно назначить

**Структура prefab:**
```
UnitPrefab3D (root)
  ├── Body (MeshRenderer — character mesh)
  ├── HPCanvas (Canvas, World Space, 0.01 scale)
  │     └── HPBar (Image, Filled Horizontal, зелёный)
  │           └── HPBackground (Image, тёмно-серый, за HPBar)
  └── NameCanvas (опционально — имя юнита над головой)
```

**Задачи:**

- [ ] Task 1: Настроить World Space Canvas на prefab, добавить FaceCamera
- [ ] Task 2: Убедиться что hpFill и hpLabel назначены в UnitView3D
- [ ] Task 3: Commit + push

---

## Plan 9E — VFX атаки

> Простые particle burst при ударе — даёт ощущение что бой происходит.

**Файлы:**
- Create: `Assets/VFX/HitEffect.prefab` — Particle System
- Modify: `Assets/Scripts/Visual/BattleAnimator.cs` — Instantiate при ударе

**HitEffect настройки (Particle System):**
```
Duration: 0.3, Looping: false
Start Lifetime: 0.2
Start Speed: 2–4
Start Size: 0.1–0.3
Start Color: белый → оранжевый (gradient)
Emission: Burst, Count 8–12
Shape: Sphere, Radius 0.1
```

**Задачи:**

- [ ] Task 1: Создать HitEffect prefab через Editor script
- [ ] Task 2: BattleAnimator.DealDamage() → Instantiate(hitEffect, defView.position)
- [ ] Task 3: Commit + push

---

## Plan 9F — Звуки

> Поля sfxBuy/Fight/Victory/Defeat уже есть в GameManager.
> Нужно только добавить аудио-файлы и назначить в инспекторе.

**Источники бесплатных звуков:**
- freesound.org
- pixabay.com/sound-effects
- mixkit.co

**Что нужно:**
```
sfxBuy      — звук монеты / кассы (0.5–1 сек)
sfxFight    — удар гонга / свисток боя
sfxVictory  — короткий победный джингл (2–3 сек)
sfxDefeat   — глухой удар / провальный звук
sfxHit      — удар кулака (для HitEffect)
```

**Задачи:**

- [ ] Task 1: Скачать и импортировать 4–5 AudioClip
- [ ] Task 2: Назначить в инспекторе GameManager
- [ ] Task 3: Добавить sfxHit в BattleAnimator (PlayOneShot при ударе)
- [ ] Task 4: Commit + push

---

## Plan 9G — Карточки юнитов (дизайн шопа)

> Сейчас: имя + тир + цвет фракции. 
> Нужно: портрет юнита (рендер модели или спрайт), читаемая карточка.

**Два пути:**
1. **Быстрый:** RenderTexture — снимок 3D модели в Runtime, показывается в UI Image
2. **Медленный но правильный:** нарисовать/сгенерировать иконки (128×128) для каждого юнита

**Файлы:**
- Modify: `Assets/Scripts/UI/ShopSlot.cs` — добавить Image для портрета
- Modify: `Assets/Scripts/Editor/PolanaSceneBootstrap.cs` — место для портрета в слоте

**Задачи:**

- [ ] Task 1: Добавить UnitData.portrait (Sprite) — уже есть в UnitData
- [ ] Task 2: ShopSlot показывает portrait если назначен, иначе цветной блок
- [ ] Task 3: Назначить портреты в ScriptableObject каждого юнита
- [ ] Task 4: Commit + push

---

## Порядок выполнения

```
9A (окружение/борд) — можно прямо сейчас, без арта
    ↓
9D (HP бары) — параллельно, не зависит от арта
    ↓
9B (импорт первого героя) — когда будет первая модель из Meshy.ai
    ↓
9C (движение по клеткам) — после 9B
    ↓
9E (VFX) — после 9B
    ↓
9F (звуки) — в любой момент
    ↓
9G (карточки с портретами) — после 9B
```

---

## Критерий готовности Plan 9

Запусти игру и покажи человеку который не знает проект. Если он скажет
"о, это игра про банды" — а не "это какая-то схема" — план выполнен.

---

## Технические детали для следующей сессии

**Структура проекта:**
- Unity project: `~/Documents/polana/`
- Repo: `https://github.com/antioz/polana-game.git`, branch `main`
- Monorepo docs: `/Users/imac/Documents/новый/projects/polana/docs/`

**Ключевые скрипты:**
- `Assets/Scripts/Visual/UnitView3D.cs` — визуал одного юнита (цвет, HP, смерть)
- `Assets/Scripts/Visual/UnitSpawner3D.cs` — спавн/удаление 3D юнитов на борде
- `Assets/Scripts/Visual/BattleAnimator.cs` — анимация боя (движение, урон)
- `Assets/Scripts/Visual/BoardMesh3D.cs` — world-space позиции клеток
- `Assets/Scripts/Editor/PolanaBoard3DBootstrap.cs` — собирает 3D сцену
- `Assets/Scripts/Editor/PolanaSceneBootstrap.cs` — собирает UI

**После любых изменений:**
```bash
git add -A
git commit -m "описание"
git push origin main
```
