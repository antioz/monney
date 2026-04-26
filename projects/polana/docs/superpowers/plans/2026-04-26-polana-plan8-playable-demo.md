# ПОЛЯНА Plan 8 — Playable Demo (Underlords-level UX)

> **Цель:** Сделать игру реально играбельной — как Underlords. Игрок должен понимать что он делает, видеть что происходит в бою, и хотеть сыграть ещё раз.

**Unity project path:** `~/Documents/polana/`

**Ориентир:** Дота Андерлордс / TFT. Не графика — а ясность. Игрок смотрит и понимает без объяснений.

---

## Что сейчас не так (честный диагноз)

| Проблема | Почему критично |
|----------|-----------------|
| Бой невидим — 1.5с ожидания, потом результат | Игрок не понимает почему выиграл/проиграл |
| Юниты — красные капсулы без различий | Непонятно кого покупать и зачем |
| Механики фракций невидимы | Стратегии не существует визуально |
| Магазин — имена без контекста | Непонятно чем "Дед" отличается от "Кипиша" |
| HUD нечитаем при игре | Игрок теряет нить происходящего |

---

## Приоритеты

```
Блокирует игру → должно быть в первую очередь:
  1. Бой с анимацией (иначе игра — набор кнопок)
  2. Читаемые карточки юнитов в магазине
  3. Видимые HP юнитов на доске

Делает игру понятной:
  4. Панель фракций (активные бонусы)
  5. Итог боя с объяснением (кто кого убил)

Делает игру приятной:
  6. Полировка UI (цвета, читаемость)
  7. Звуки (удар, покупка, победа)
```

---

## Plan 8A — Бой с анимацией (КРИТИЧНО)

**Файлы:**
- Modify: `Assets/Scripts/Visual/UnitSpawner3D.cs`
- Create: `Assets/Scripts/Visual/BattleAnimator.cs`
- Modify: `Assets/Scripts/Game/GameManager.cs`

**Что делаем:**

Сейчас бой — мгновенный `BattleResolver.Resolve()`, потом 1.5с ожидания. Нужно сделать пошаговую анимацию:

1. Юниты смотрят друг на друга (Quaternion.LookAt к ближайшему врагу)
2. Каждый "тик" боя — юнит движется к врагу, атакует, враг теряет HP
3. HP bar обновляется в реальном времени
4. Мёртвый юнит — ragdoll (DeathRagdoll3D.Activate())
5. После боя — результат

**Схема:**

```
GameManager.StartBattle()
  → BattleAnimator.RunAnimatedBattle(playerUnits, botUnits, onComplete)
      → каждые 0.8с: один юнит атакует ближайшего врага
      → HP bar обновляется
      → мёртвые юниты — ragdoll + исчезновение
      → когда одна сторона мертва → вызвать onComplete(result)
  → GameManager получает результат, начисляет урон
```

**Задачи:**

- [x] **Task 1: BattleAnimator.cs**
  - MonoBehaviour, запускается корутиной
  - `RunBattle(List<UnitView3D> players, List<UnitView3D> enemies, Action<bool> onDone)`
  - Каждые 0.8с — случайный живой юнит атакует случайного живого противника
  - Атакующий движется к цели (Lerp за 0.3с), возвращается обратно
  - Урон = простая формула (сила атаки юнита из UnitData)
  - Когда все с одной стороны dead → onDone(playerWon)

- [x] **Task 2: Wire в GameManager**
  - Вместо `yield return new WaitForSeconds(1.5f)` — запускаем BattleAnimator
  - BattleAnimator работает с UnitView3D объектами (уже есть в UnitSpawner3D)

- [x] **Task 3: Commit**
  ```bash
  git add -A
  git commit -m "feat: battle animation — units move and attack, HP bars update live"
  git push origin main
  ```

---

## Plan 8B — Карточки в магазине (КРИТИЧНО)

**Файлы:**
- Modify: `Assets/Scripts/UI/ShopSlot.cs`
- Modify: `Assets/Scripts/Editor/PolanaSceneBootstrap.cs`

**Что делаем:**

Сейчас слот магазина — имя + цена. Нужно:
- Фоновый цвет слота = цвет фракции юнита
- Тир (★ / ★★) виден как пояс снизу
- Фракция написана мелко под именем
- Стоимость — жёлтой монетой справа сверху

**Схема слота (160×120px):**
```
┌────────────────────┐
│ [Фракция]    [3g] ←│ — золотой бейдж стоимости
│                    │
│   Кипиш Гром       │ — имя крупно
│   Беспредел        │ — фракция мелко
│                    │
│ ★★                 │ — тир (уровень)
└────────────────────┘
  Фон = цвет фракции (тёмный)
```

**Задачи:**

- [x] **Task 1: Расширить ShopSlot.cs**
  - Добавить поля: `factionLabel`, `tierLabel`, `costBadge`
  - `SetUnit(UnitData)` — устанавливает фон = faction color (тёмный), имя, фракцию, тир, цену

- [x] **Task 2: Пересобрать слоты в PolanaSceneBootstrap**
  - Слоты теперь высотой 120px вместо текущего flex
  - Добавить TMP labels для фракции и тира
  - Шоп-панель: высота 160px

- [x] **Task 3: Commit**
  ```bash
  git add -A
  git commit -m "feat: shop slots show faction color, name, tier, cost badge"
  git push origin main
  ```

---

## Plan 8C — HP bar и имя юнита на доске

**Файлы:**
- Modify: `Assets/Scripts/UI/BoardCell.cs`
- Modify: `Assets/Scripts/Editor/PolanaSceneBootstrap.cs` (цвет клетки по фракции)

**Что делаем:**

Сейчас 2D-карточка на доске показывает имя+тир, но плохо. Нужно:
- Клетка с юнитом: фоновый цвет = фракция (как в Underlords)
- Имя — читаемо (размер 12–14)
- HP bar прямо на 2D клетке (не только в World Space 3D)
- Тир — правый верхний угол

Это важнее чем 3D HP bar над головой — 2D всегда читаемо с любого угла.

**Задачи:**

- [x] **Task 1: Добавить HP bar в BoardCell**
  - Дочерний Image (filled horizontal) внизу клетки
  - BoardCell.SetUnit() и SetHp(int current, int max) обновляют его

- [x] **Task 2: Цвет клетки по фракции**
  - GameManager передаёт faction code при Refresh
  - BoardCell получает цвет = FactionColors[code] с alpha 0.7

- [x] **Task 3: Commit**
  ```bash
  git add -A
  git commit -m "feat: board cell shows HP bar + faction color per unit"
  git push origin main
  ```

---

## Plan 8D — Панель фракций

**Файлы:**
- Create: `Assets/Scripts/UI/FactionPanel.cs`
- Modify: `Assets/Scripts/Editor/PolanaSceneBootstrap.cs`
- Modify: `Assets/Scripts/Game/GameManager.cs`

**Что делаем:**

Справа или сверху — вертикальный список активных фракций:
```
БГ ●●○  +20 HP          ← 2 из 3 нужных юнитов
КБ ●○○  (нужно 2)       ← 1 из 2 (неактивно, серое)
```

Обновляется каждый раз при Refresh.

**Задачи:**

- [ ] **Task 1: FactionPanel.cs**
  - Список строк FactionRow (icon + count dots + label)
  - `Refresh(BoardManager board)` — пересчитывает сколько юнитов каждой фракции

- [ ] **Task 2: Добавить в сцену**
  - Правая колонка, ширина 160px, поверх BoardArea

- [ ] **Task 3: Commit**
  ```bash
  git add -A
  git commit -m "feat: faction panel shows active synergies on right side"
  git push origin main
  ```

---

## Plan 8E — Итог боя с объяснением

**Файлы:**
- Modify: `Assets/Scripts/UI/HudPanel.cs`

**Что делаем:**

Сейчас итог — "ТЫ ВЫИГРАЛ" / "ТЫ ПРОИГРАЛ". Нужно:
```
✓ ПОБЕДА!
Нанесено урона: 12
Раунд 3 → следующий раунд
```
или
```
✗ ПОРАЖЕНИЕ
Потеряно HP: -15 (осталось 35)
Выжившие враги: Громила (тир 2), Кипиш
```

- [ ] **Task 1: Расширить ShowResult() в HudPanel**
  - Принимает BattleResult с деталями (выжившие враги, урон)
  - Показывает читаемый текст

- [ ] **Task 2: BattleResolver возвращает детали**
  - `survivingEnemies: List<UnitData>` — кто выжил у врага
  - `damageDealt: int` — сколько HP снято

- [ ] **Task 3: Commit**
  ```bash
  git add -A
  git commit -m "feat: battle result shows damage, surviving enemies"
  git push origin main
  ```

---

## Plan 8F — Полировка (после всего выше)

- [ ] Звук: удар, покупка, победа (AudioClip + AudioSource)
- [ ] Переход между раундами плавный (fade или текст "РАУНД 4...")
- [ ] Пустой магазин = кнопка РЕРОЛЛ подсвечена
- [ ] Нельзя нажать БОЙ без юнитов — кнопка серая
- [ ] Камера слегка качается в начале боя (cinemachine impulse)

---

## Порядок выполнения

```
8A (бой) → 8B (магазин) → 8C (HP на доске) → 8D (фракции) → 8E (итог) → 8F (полировка)
```

8A — самое важное. Без видимого боя всё остальное теряет смысл.

---

## Критерий готовности демо

Дай поиграть человеку который не знает проект. Если он через 5 минут понял:
- Зачем покупать юнитов
- Почему фракции важны  
- Что происходит в бою
- Почему он выиграл или проиграл

— демо готово.
