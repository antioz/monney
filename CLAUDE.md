# CLAUDE.md

Монорепо со статическими веб-проектами. Деплой — GitHub Pages, репозиторий `antioz/monney`.

## Правила работы

- После любых изменений — сразу коммит и пуш на `main`
- Язык общения — русский
- Все проекты статические (кроме chrono-soul-backend), сборки нет
- Запуск: Live Server или `python3 -m http.server`, открывать нужный `index.html`

## Структура репозитория

Все проекты — учебные, **заморожены**. Новая активная разработка в них не ведётся.

```
projects/
├── chrono-soul-archive/  — [заморожен] Telegram Mini App "ChronoSoul" (фронтенд)
├── chrono-soul-backend/  — [заморожен] backend для ChronoSoul (Node.js + Express + SQLite)
├── dushi-gadov/          — [заморожен] веб-игра "ДУШИ ГАДОВ"
├── poproshaika/          — [заморожен] лендинг с монетизацией
├── afa-portfolio/        — [заморожен] портфолио "Штаб-квартира Иннотех — АФА"
└── vagon/                — [заморожен] "Автоматический конвертор"
```

## URLs (GitHub Pages)

- ДУШИ ГАДОВ: https://antioz.github.io/monney/projects/dushi-gadov/
- Попрошайка: https://antioz.github.io/monney/projects/poproshaika/
- Ваgон: https://antioz.github.io/monney/projects/vagon/

---

## chrono-soul-archive

Telegram Mini App с генерацией «прошлых жизней» по профилю пользователя.

**Запуск:** открыть `index.html`. Для сброса state — добавить `?reset=1` к URL `learn.html`.

**Три страницы:**
- `index.html` — лендинг
- `learn.html` + `app.js` — основной сценарий: дисклеймер → форма → генерация жизней → монетизация
- `description.html` — описание концепции

**State** в `localStorage` под ключом `chronoSoulArchiveStateV1`:
`disclaimerAccepted`, `profile`, `lives[]`, `shareUnlocked`, `paidLives`

**Генерация жизней** (`data/generator.js`): детерминированная через `hashText(birthDate|city|name|lifeNumber)`. Жизнь #1 всегда в XX веке. Контент из констант (`data/constants.js`) через `pick(list, seed)`.

**Монетизация (MVP/демо — платежи ненастоящие):**
- #1–2: бесплатно
- #3: через кнопку шэра (`state.shareUnlocked = true`)
- #4+: `state.paidLives += 1`

`window.Telegram.WebApp` используется опционально.

---

## chrono-soul-backend

Backend для ChronoSoul. **Стек:** Node.js, Express 5, better-sqlite3, node-telegram-bot-api.

**Запуск:** `node index.js` из папки `chrono-soul-backend/`.

**Production-требования (не реализовано в MVP):**
- Генерация жизней с seed от `telegram_user_id` (не от полей формы)
- БД: таблицы `users`, `life_results`, `entitlements`, `payments`
- Версионирование алгоритма (`generator_version`) при изменении логики
- Верификация шэра и реальные платежи Telegram Stars через webhook

---

## dushi-gadov

Веб-игра "ДУШИ ГАДОВ". **Заморожена.**

**Структура:** `index.html` (лендинг), `game.html` (игра), `js/`, `assets/`, `styles.css`.

---

## poproshaika

Лендинг с воронкой монетизации. Три страницы: `index.html`, `money.html`, `startup.html`.

---

## afa-portfolio

Одностраничный портфолио-сайт "Штаб-квартира Иннотех — АФА". Файл: `project-12.html`.

---

## vagon

"Автоматический конвертор". Файлы: `index.html`, `app.js`, `assets/`.
