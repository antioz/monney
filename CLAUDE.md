# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Запуск

Статический проект без сборки. Запускай через любой локальный сервер (Live Server, `python3 -m http.server`, etc.) и открывай `index.html` в браузере. Для сброса состояния добавь `?reset=1` к URL `learn.html`.

## Архитектура

Telegram Mini App, три HTML-страницы с общим `styles.css` и модульным JS (`type="module"`):

- `index.html` — лендинг, ведёт на `learn.html` и `description.html`
- `learn.html` + `app.js` — основной сценарий: дисклеймер → форма → генерация жизней → монетизация
- `description.html` — статичная страница с описанием концепции

**Состояние** хранится в `localStorage` под ключом `chronoSoulArchiveStateV1` (объект: `disclaimerAccepted`, `profile`, `lives[]`, `shareUnlocked`, `paidLives`). Загружается в `loadState()` при старте.

**Генерация жизней** (`data/generator.js`): детерминированная — `generateLife(profile, lifeNumber)` использует `hashText` от `birthDate|city|name|lifeNumber` как seed. Жизнь #1 всегда фиксируется в XX веке. Контент тянется из массивов-констант в `data/constants.js` через `pick(list, seed)`.

**Монетизация (MVP/демо):**
- Жизни #1–2: бесплатно
- Жизнь #3: разблокируется кнопкой шэра (`state.shareUnlocked = true`)
- Жизнь #4+: `state.paidLives += 1` (без реального платежа)

`window.Telegram.WebApp` используется опционально — проект работает и без него.

## Структура репозитория

```
projects/
├── poproshaika/          — лендинг/монетизация (index.html, money.html, startup.html)
├── chrono-soul-archive/  — фронтенд Telegram Mini App (ChronoSoul)
├── chrono-soul-backend/  — backend Telegram Mini App
└── dushi-gadov/          — веб-игра "ДУШИ ГАДОВ" (в разработке)
```

## Production-требования (не реализовано в MVP)

Согласно `REQUIREMENTS.md`, для production обязательны:
- Backend-генерация с seed от `telegram_user_id` (не от полей формы)
- БД: таблицы `users`, `life_results`, `entitlements`, `payments`
- Версионирование алгоритма (`generator_version`) при изменении логики генерации
- Верификация шэра и реальные платежи Telegram Stars через webhook
