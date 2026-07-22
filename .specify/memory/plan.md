# Implementation Plan: Reframe MVP

**Branch**: `main` | **Date**: 2026-07-21 | **Spec**: .specify/memory/spec.md

**Input**: Feature specification from .specify/memory/spec.md

---

## Summary

Reframe — приватный голосовой КПТ-дневник для профессионалов под стрессом. Пользователь говорит → распознавание речи → LLM анализирует через призму КПТ (Бёрнс) → streaming-ответ с рефреймингом. Все данные только на устройстве, бэкенд — тонкий прокси с промпт-инжинирингом (КПТ/Бёрнс).

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Clojure (latest stable)
**Primary Dependencies**: React, Vite, Vitest, Playwright, Kit (Ring + Reitit + malli)
**Storage**: localStorage (браузер), без серверной БД
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Веб-браузер (desktop + mobile), бэкенд на JVM
**Project Type**: Full-stack web application (SPA + thin proxy backend)
**Performance Goals**: TTI ≤ 2s, LLM first token ≤ 1s, full response ≤ 5s (целевой)
**Constraints**: Бэкенд без БД и без логирования контента, offline-first невозможен (LLM требует сеть)
**Scale/Scope**: MVP — один пользователь, одно устройство, одна сессия, до ~100 записей

---

## Full Tech Stack

| Слой | Технология |
|---|---|
| Фронтенд | TypeScript 5.x (strict), React 19, Vite 6 |
| Хранение | localStorage (все пользовательские данные) |
| State | React Context + useReducer |
| Unit-тесты | Vitest (environment: jsdom) |
| E2E-тесты | Playwright (моки через page.route) |
| Линтер | ESLint (flat config) |
| Форматер | Prettier |
| Бэкенд | Clojure + Kit (Ring, Reitit, malli) |
| HTTP-сервер | http-kit (Ring adapter, встроен в Kit) |
| HTTP-клиент | clj-http (вызов LLM API) |
| SSE streaming | core.async channel |
| API | REST + SSE |
| Голосовой ввод | Web Speech API (SpeechRecognition) |

| Git hooks | lefthook (pre-commit: lint+types, pre-push: tests) |

---

## Design Tokens

Dark theme (default):

| Token | Value | Usage |
|---|---|---|
| --bg-primary | #0A0E27 | Основной фон (deep navy) |
| --bg-secondary | #111633 | Поверхности, карточки |
| --bg-elevated | #181E3D | Модальные окна, tooltip |
| --text-primary | #F0F0F5 | Основной текст (ivory) |
| --text-secondary | #8890B0 | Вторичный текст (muted lavender) |
| --accent | #E8A850 | Акцентный цвет (amber) |
| --accent-hover | #F0BE6E | Акцент при наведении |
| --accent-glow | rgba(232, 168, 80, 0.15) | Подсветка активных элементов |
| --success | #7EB8A0 | Позитивная дельта (muted teal) |
| --error | #D4786E | Высокая тревога / ошибки (warm coral) |
| --border | #1E2548 | Рамки и разделители |
| --slider-track | #1E2548 | Трек ползунка |
| --slider-fill | #E8A850 | Заполнение ползунка |

Light theme (optional): инвертировать bg/text, accent сохранить.

Spacing & sizing:
- Базовая единица: 4px (шаг сетки)
- CSS-переменные: --space-xs (8px), --space-sm (12px), --space-md (20px), --space-lg (32px), --space-xl (48px)
- Минимальная зона касания: 48×48px (--touch-target)
- Отступы контейнера: 16px mobile / 24px desktop
- Border radius: 16px (--border-radius), 10px (--border-radius-sm)

Typography:
- Font family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif (--font-family)
- Base size: 17px (--font-size-base)
- Heading size: 22px (--font-size-heading), 28px (--font-size-xl)
- Font weights: 400 (normal), 500 (medium), 600 (bold)
- Line height: 1.5 (--line-height)

Animations (defined in tokens.css):
- `@keyframes breathe` — breathing-анимация кнопки записи (scale + box-shadow)
- `@keyframes recording-pulse` — пульсация индикатора записи
- `@keyframes spin` — вращение (индикатор загрузки)

---

## Performance Targets

| Показатель | Цель MVP | Измерение |
|---|---|---|
| Первый токен LLM | ≤ 1 секунда | Время от запроса до первого SSE-события |
| Полный ответ LLM | ≤ 5 секунд (целевой) | Время от запроса до закрытия SSE-потока |
| Time to Interactive | ≤ 2 секунды | Lighthouse TTI |
| Распознавание речи | ≤ 2 секунды после остановки записи | Web Speech API onresult |
| Сохранение сессии | ≤ 50ms | localStorage setItem |

Для MVP допустимы эпизодические превышения при высокой нагрузке LLM-провайдера.

---

## System Prompt (backend: prompt.clj)

```
Ты — Reframe, КПТ-коуч для профессионалов, испытывающих стресс. Твоя задача — помочь увидеть мысли объективно через призму КПТ Дэвида Бёрнса.

РОЛЬ: эмпатичный, но строгий наблюдатель. Не оцениваешь, не осуждаешь, не жалеешь. Помогаешь дистанцироваться от эмоций и увидеть факты.

10 КОГНИТИВНЫХ ИСКАЖЕНИЙ (Бёрнс):
1. Мышление «всё или ничего» (All-or-Nothing Thinking)
2. Сверхобобщение (Overgeneralization)
3. Негативный фильтр (Mental Filter)
4. Обесценивание позитивного (Discounting the Positive)
5. Поспешные выводы — чтение мыслей / предсказание будущего (Jumping to Conclusions)
6. Катастрофизация (Magnification / Catastrophizing)
7. Эмоциональное обоснование (Emotional Reasoning)
8. Долженствование (Should Statements)
9. Навешивание ярлыков (Labeling)
10. Персонализация (Personalization)

ФОРМАТ РАБОТЫ:
Ты получаешь текст пользователя и даёшь ОДИН анализ. Не начинай с приветствия — сразу к делу.

ОТВЕТ ВСЕГДА В JSON (без markdown-обёртки):
{
  "distortions": [
    {
      "type": "Катастрофизация",
      "thought": "конкретная фраза из текста пользователя",
      "why": "почему это искажение"
    }
  ],
  "reframing": "короткий рефрейминг (≤ 50 слов) от лица наблюдателя: факты, без оценки, без 'всё будет хорошо'",
  "question": "краткий вопрос для закрепления (например: 'Что бы ты сказал другу в похожей ситуации?')"
}

СТИЛЬ:
- Тон: спокойный, нейтральный, безоценочный
- Без банальных советов и токсичного позитива
- Без психологических терминов (или с кратким пояснением)
- Рефрейминг: только факты, без «ты должен» и «тебе нужно»

ПРИМЕР ЗАПРОСА:
"Я опоздал на встречу на 5 минут. Все теперь думают, что я безответственный. Меня уволят."

ПРИМЕР ОТВЕТА:
{
  "distortions": [
    {"type": "Чтение мыслей", "thought": "все теперь думают, что я безответственный", "why": "ты не знаешь, что они думают на самом деле"},
    {"type": "Предсказание будущего", "thought": "меня уволят", "why": "ты не можешь знать этого наверняка"}
  ],
  "reframing": "Ты опоздал на 5 минут — это факт. Всё остальное — интерпретации. Компетентность определяется сотнями решений, а не одним опозданием. Возможно, команда даже не заметила.",
  "question": "Что бы ты сказал другу, если бы он оказался в такой же ситуации?"
}
```

---

## API Contract

**POST /api/reframe**

Request:
```json
{
  "text": "string (распознанный текст, до 3000 символов)"
}
```

Response: SSE stream (Content-Type: text/event-stream).
Frontend: fetch + ReadableStream → parse SSE events

Каждое событие — одна JSON-строка:
```
data: {"distortions": [...], "reframing": "...", "question": "..."}
```

При ошибке:
```
data: {"error": "string"}
```

LLM provider configuration (server-side env vars):
- `LLM_API_KEY` — API-ключ
- `LLM_API_URL` — эндпоинт (по умолчанию DeepSeek)
- `LLM_MODEL` — модель (по умолчанию deepseek-chat)

Timeout: 10s на полный ответ. При превышении — закрыть поток, вернуть `{"error": "timeout"}`.

---

## Rate Limiting

Алгоритм: token bucket, in-memory (Clojure atom)
- Лимит: 3 запроса в минуту (20 req/час для одного пользователя MVP)
- Storage: атом в неймспейсе бэкенда (сбрасывается при перезапуске)
- При превышении: HTTP 429 + Retry-After заголовок

Конфигурация через Aero (`config.edn`):
```clojure
{:rate-limit {:requests-per-minute #long #or [#env REFRAME_RATE_LIMIT 3]
              :algorithm :token-bucket}}
```
Меняется через env var `REFRAME_RATE_LIMIT` без перекомпиляции.

---

## Data Schema (localStorage)

```typescript
// src/types/session.ts — canonical Session interface and STORAGE_KEYS
interface Session {
  id: string;              // crypto.randomUUID()
  date: string;            // ISO 8601
  distortion: string;      // тип когнитивного искажения
  anxietyBefore: number;   // 1-10
  anxietyAfter: number;    // 1-10
  delta: number;           // anxietyBefore - anxietyAfter
  reframing: string;       // текст рефрейминга (≤ 50 слов)
}

// localStorage keys
const STORAGE_KEYS = {
  sessions: 'reframe_sessions',          // Session[]
  onboarding: 'reframe_onboarding',      // boolean
  theme: 'reframe_theme',                // 'dark' | 'light'
} as const;
```

The LLM response may include a transient `pattern` field (наиболее частое искажение) — not persisted to localStorage, shown inline during streaming only.

---

## Component Tree

```
App (ThemeProvider + Router)
├── OnboardingOverlay       # первый запуск (localStorage flag)
├── TabBar                  # навигация: Главная | История | Прогресс
│
├── MainScreen              # главный экран
│   ├── AnxietySlider       # ползунок 1-10 (SUDS anchors)
│   │   └── AnxietyTooltip  # tooltip с 10 уровнями при наведении
│   ├── RecordButton        # кнопка «Говорить» / «Стоп» / «Отмена»
│   │   └── RecordingIndicator  # визуальная обратная связь при записи
│   ├── ResponseView        # streaming-ответ
│   │   ├── DistortionList  # список искажений
│   │   └── ReframingText   # текст рефрейминга
│   ├── PostRatingSlider    # оценка «после» (тот же AnxietySlider)
│   └── DeltaDisplay        # дельта тревоги
│
├── HistoryTab              # вкладка «История»
│   ├── SessionList         # список сессий (дата, искажение, дельта)
│   ├── SessionDetail       # детали по клику (искажение, рефрейминг, оценки)
│   └── EmptyState          # «Здесь появятся твои сессии...»
│
├── ProgressTab             # вкладка «Прогресс»
│   ├── SummaryCards         # сводка: сессии, дельта, тренд
│   ├── DistortionCloud      # облако тегов искажений
│   └── EmptyState           # «Твой прогресс появится здесь...»
│
├── ThemeToggle             # переключатель тёмная/светлая
├── ErrorBanner             # ошибки сети / LLM
└── BrowserFallback         # заглушка для браузеров без Web Speech API
```

---

## Data Flow

```
Пользователь говорит
    ↓
Web Speech API (SpeechRecognition)
    ↓
Распознанный текст
    ↓
POST /api/reframe {"text": "..."}
    ↓
Clojure handler (handler.clj)
    ├── Rate limit check (token bucket, 3 req/min)
    ├── Prompt formatting (prompt.clj — Burns methodology)
    ├── LLM API call (clj-http → DeepSeek/LLM provider)
    └── SSE stream back (core.async channel)
    ↓
Frontend: POST /api/reframe → fetch + ReadableStream → parse SSE events
    ├── Parse JSON: {distortions, reframing, question, pattern}
    ├── DistortionList: render each distortion
    └── ReframingText: render reframing
    ↓
Пользователь оценивает тревогу «после» (1-10)
    ↓
DeltaDisplay: anxietyBefore - anxietyAfter
    ↓
Сохранение в localStorage:
    Session {id, date, distortion, anxietyBefore, anxietyAfter, delta, reframing}
    ↓
История / Прогресс: чтение из localStorage
```

---

### Custom Hooks

- `useSpeechRecognition.ts` — React-хук (обёртка над Web Speech API): start/stop/cancel, browser support check, recognition events
- `useSSE.ts` — React-хук (SSE-клиент): connect via POST /api/reframe + fetch + ReadableStream, parse streaming JSON, handle disconnect/timeout

---

## Frontend Services

```
src/services/
├── storageService.ts    # localStorage CRUD: sessions, theme, onboarding flag
└── sessionService.ts    # session lifecycle: start → analyze → rate → save
```

---

## Clojure Backend Dependencies (project.clj)

```clojure
:dependencies [
  ;; Kit framework (Ring + Reitit + malli included)
  [kit "2.0"]
  ;; HTTP client for LLM API calls
  [clj-http "3.13.0"]
  ;; Async streaming via SSE
  [org.clojure/core.async "1.6.681"]
  ;; JSON encoding (Cheshire)
  [cheshire "5.13.0"]
  ;; Configuration from env vars (rate limit, etc.)
  [aero "1.1.6"]
]
```

Backend files:
- `src/reframe/handler.clj` — HTTP routes, rate limiting, SSE streaming
- `src/reframe/prompt.clj` — system prompt text, Burns methodology
- `test/reframe/handler_test.clj` — proxy layer tests

---

## LLM Mock Strategy

Для разработки без реального LLM:

1. Собрать 5 реальных ответов LLM во время dev-сессий → сохранить как fixtures
2. До этого — 3 ручных фикстуры на основе примеров Бёрнса:

```json
// fixtures/mock-responses.json
[
  {
    "input": "Я опоздал на встречу, все теперь думают что я безответственный",
    "output": {
      "distortions": [
        {"type": "Чтение мыслей", "thought": "все думают что я безответственный", "why": "..."},
        {"type": "Сверхобобщение", "thought": "я безответственный", "why": "..."}
      ],
      "reframing": "Опоздание на 5 минут — это факт. Всё остальное — интерпретации...",
      "question": "Что бы ты сказал другу в похожей ситуации?"
    }
  }
]
```

Mock switch: env `REFRAME_MOCK_LLM=true` → backend returns fixture instead of calling LLM.

---

## Application Flow

```
[Открытие] → Onboarding? → [Главный экран]
                                 ├── TabBar → История
                                 │            ├── Пусто? → EmptyState
                                 │            └── Список → Детали сессии
                                 ├── TabBar → Прогресс
                                 │            ├── Пусто? → EmptyState  
                                 │            └── График 7 дней
                                 └── [Основной флоу]
                                      ├── Слайдер тревоги (до)
                                      ├── Кнопка "Говорить" → Запись (interim текст)
                                      │   ├── Стоп → Текст → Отправка
                                      │   └── Отмена → Сброс
                                      ├── Streaming ответ
                                      │   ├── Искажения + рефрейминг
                                      │   └── Ошибка? → ErrorBanner + retry
                                      ├── Слайдер тревоги (после)
                                      ├── Дельта
                                      └── Сохранить → localStorage
```

## Customer Journey Map

```
1. Открытие → 2. Оценка тревоги (до) → 3. Запись речи → 4. Отправка → 5. Ожидание (streaming) → 6. Просмотр результата → 7. Оценка тревоги (после) → 8. Сохранение → 9. История / Прогресс

На каждом шаге:
- Позитивный сценарий
- Сценарий ошибки (речь не распознана, сеть недоступна, LLM timeout, пустой текст)
- Состояние UI (что видит пользователь)
```

## Acceptance Criteria

### Основной флоу (запись → ответ)
- [ ] Пользователь может начать запись, говорить, остановить запись
- [ ] Распознанный текст отображается в реальном времени
- [ ] После отправки ответ приходит в течение 5 секунд
- [ ] Ответ содержит: искажения (с цитатами), рефрейминг, вопрос
- [ ] Оценка «после» сохраняется вместе с сессией
- [ ] При пустом тексте — сообщение об ошибке, а не пустой экран

### История
- [ ] Сохранённые сессии отображаются в списке (новые сверху)
- [ ] При клике на сессию — детали: искажения, рефрейминг, дельта
- [ ] При отсутствии сессий — тёплая заглушка
- [ ] Расшифровка голоса НЕ сохраняется в истории

### Прогресс
- [ ] График отображает данные за последние 7 дней
- [ ] Несколько сессий в один день усредняются
- [ ] При отсутствии данных — заглушка
- [ ] График стилизован под navy-палитру

### Навигация и UI
- [ ] TabBar показывает активную вкладку
- [ ] При наведении на иконку TabBar — tooltip
- [ ] Тёмная/светлая тема переключается и сохраняется
- [ ] Онбординг показывается при первом запуске, затем скрыт
- [ ] Страница адаптивна (320px — 480px+)

### Обработка ошибок
- [ ] При отсутствии сети — ErrorBanner с кнопкой «Повторить»
- [ ] При таймауте LLM — предупреждение через 10 секунд
- [ ] При обрыве streaming — показана полученная часть + предупреждение
- [ ] При ошибке распознавания речи — сообщение и возврат к началу
- [ ] При 429 (rate limit) — сообщение «Слишком много запросов»
- [ ] Браузер без Speech API — заглушка с инструкцией открыть Chrome

## Edge Cases

| Сценарий | Ожидаемое поведение |
|---|---|
| Пользователь нажал «Говорить» и сразу «Стоп» | Пустой текст → сообщение об ошибке |
| Пользователь говорил, но микрофон не уловил | Пустой текст → сообщение об ошибке |
| Пользователь закрыл вкладку во время записи | Сессия не сохраняется (всё в памяти) |
| Пользователь нажал «Отмена» во время записи | Возврат к начальному экрану |
| Пользователь обновил страницу после ответа | Сессия не сохранилась → начать заново |
| Два быстрых нажатия «Говорить» | Второе игнорируется (уже в режиме записи) |
| localStorage заполнен (quota exceeded) | Данные не сохраняются, пользователь не видит ошибку (MVP) |
| LLM вернул JSON неожиданной структуры | ErrorBanner + кнопка «Повторить» |
| Пользователь сменил вкладку во время streaming | Streaming продолжается, ответ отображается при возврате |

## Implementation Phases

**Phase 1 — Инфраструктура**
- Vite + React + TypeScript strict scaffold
- ESLint flat config + Prettier
- Lefthook (pre-commit: lint+types, pre-push: vitest)
- Clojure + Kit scaffold (handler, prompt)
- CI: GitHub Actions (lint, test, build)
- Empty states: заглушки для всех вкладок

**Phase 2 — Бэкенд-прокси**
- POST /api/reframe → prompt formatting → LLM → SSE
- Rate limiting (token bucket, 3 req/min)
- LLM mock switch (REFRAME_MOCK_LLM)
- Backend tests (handler_test.clj)
- API contract validation (malli)

**Phase 3 — Базовый UI**
- Главный экран: AnxietySlider (SUDS 1-10) + RecordButton
- ThemeProvider: CSS custom properties, темная/светлая тема
- OnboardingOverlay: первый запуск, флаг в localStorage
- ThemeToggle
- Адаптивная вёрстка (320px+)

**Phase 4 — Голос + Streaming**
- speechService.ts: Web Speech API integration
- useSSE.ts: POST /api/reframe, fetch + ReadableStream
- ResponseView: DistortionList + ReframingText (streaming render)
- PostRatingSlider + DeltaDisplay
- BrowserFallback: заглушка для браузеров без Web Speech API
- RecordingIndicator: визуальная обратная связь при записи
- ErrorBanner + retry logic

**Phase 5 — Сессия и история**
- storageService.ts: localStorage CRUD
- sessionService.ts: session lifecycle
- HistoryTab: SessionList + SessionDetail + EmptyState
- Сохранение сессии после оценки «после»

**Phase 6 — Прогресс и полировка**
- ProgressTab: AnxietyChart (Recharts, 7 дней, до/после, тренд)
- Error states: recognition failure, LLM timeout, network error
- Tone of voice: все тексты в стиле «друг»
- SUDS tooltip с 10 уровнями
- README с инструкцией по запуску

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Статус | Примечание |
|---|---|---|
| I. Приватность | ✅ | localStorage, бэкенд без БД |
| II. Простота | ✅ | Один экран, 2–3 действия |
| III. Скорость | ✅ | SSE streaming, lazy loading |
| IV. Человекоцентричность | ✅ | Тёплая палитра, 48px зоны, тёмная тема |
| V. TDD | ✅ | Vitest + Playwright |
| VI. Контракт-Фёрст | ✅ | API-контракт на бэкенде |
| Процесс разработки | ✅ | Lefthook, CI, pre-commit gates |

---

## Project Structure

```
reframe/
├── frontend/                  # TypeScript + React SPA
│   ├── src/
│   │   ├── components/        # UI-компоненты
│   │   ├── hooks/             # React hooks (useSpeechRecognition, useSSE)
│   │   ├── services/          # Бизнес-логика (reframing, storage)
│   │   ├── store/             # Зарезервировано для будущего state-менеджмента (.gitkeep)
│   │   ├── styles/            # CSS / дизайн-токены
│   │   └── types/             # TypeScript-типы (включая контракты API)
│   │       └── session.ts       # Session interface + STORAGE_KEYS
│   ├── tests/
│   │   ├── unit/              # Vitest — ключевые сценарии
│   │   └── e2e/               # Playwright — критические пользовательские пути
│   ├── fixtures/                  # Mock data for development
│   │   └── mock-responses.json # LLM response fixtures
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json          # strict: true
│   ├── eslint.config.js
│   └── package.json
│
├── backend/                   # Clojure + Kit — тонкий прокси
│   ├── src/
│   │   ├── handler.clj        # HTTP-обработчик: принять → промпт → LLM → stream
│   │   └── prompt.clj         # Форматирование КПТ-промптов (Бёрнс)
│   ├── test/
│   │   └── handler_test.clj   # Тесты прокси-слоя
│   └── project.clj
│   ├── resources/
│   │   └── config.edn       # Aero конфигурация (rate limit, LLM params)
│   └── src/
│       └── reframe/
│           └── core.clj     # Инициализация приложения (server start)
│
├── .specify/                  # Spec-kit артефакты
│   └── memory/
│       ├── constitution.md    # Принципы и границы
│       ├── spec.md            # Функциональные требования
│       └── plan.md            # Этот файл
│
├── README.md
└── deploy.sh                # Деплой-скрипт (фронтенд + бэкенд)
```

---

## Pre-commit Gates (настройка)

Конкретные инструменты и команды, реализующие процесс разработки (pre-commit gates):

### Фронтенд

```bash
# Проверка типов (без ошибок)
tsc --noEmit

# Линтер (без ошибок)
eslint .

# Unit-тесты (все проходят)
vitest run
```

Настроить через `lefthook`:

Корневой `lefthook.yml` — авторитативный, с директивами `root: frontend` для всех команд. Файл `frontend/lefthook.yml` — дубликат без `root:` (для совместимости с IDE).

Pre-push hook: `vitest run` (быстрее, чем на pre-commit, чтобы не замедлять коммиты).

### Бэкенд

Бэкенд в lefthook не включён. Pre-commit gates для бэкенда — ручные (`lein test`).

---

## E2E-тесты (Playwright)

Критические пользовательские сценарии (внешние зависимости мокаются). Всего 9 тестов:

1. **Голосовой ввод → ответ**
   - Мок Web Speech API → эмуляция распознавания текста
   - Мок LLM-провайдера → эмуляция streaming-ответа
   - Проверка: текст ответа отображается на экране

2. **Ошибка сети**
   - Мок fetch → 500 / timeout
   - Проверка: пользователь видит понятное сообщение об ошибке, кнопка «повторить»

3. **Переключение темы**
   - Клик по переключателю темы
   - Проверка: тёмная ↔ светлая, выбор сохраняется в localStorage

4. **Таймаут LLM (≥ 5 секунд)**
   - Мок задержки ответа 5 секунд
   - Проверка: отображается индикатор ожидания, через 5 секунд — предупреждение

5. **Ошибка распознавания речи**
   - Мок Web Speech API → onerror / пустой результат
   - Проверка: сообщение «Не удалось распознать речь», кнопка «Записать заново»

6. **Обрыв streaming**
   - Мок SSE → закрытие соединения после частичного ответа
   - Проверка: показана полученная часть + предупреждение «Ответ получен не полностью»

7. **Сохранение → история**
   - Мок localStorage с данными сессии
   - Проверка: сессия отображается в HistoryTab, детали по клику

8. **График прогресса**
   - Мок localStorage с 7 днями данных
   - Проверка: график Recharts с линиями «до»/«после», tooltip, тренд

9. **Пустые состояния**
   - Мок localStorage без данных
   - Проверка: EmptyState на вкладках История и Прогресс

---

## CI Pipeline (MVP) — ci.yml

```yaml
# GitHub Actions / аналог
stages:
  - lint-types:
      - tsc --noEmit
      - eslint .
  - unit-tests:
      - vitest run --coverage
  - e2e-tests:
      - playwright test
  - build-check:
      - vite build
```

---

## Deployment (VDS Ubuntu 20.04)

### Architecture
```
Интернет → VDS (Ubuntu 20.04)
├── nginx (порт 80/443)
│   ├── / → SPA статика (/var/www/reframe/dist)
│   └── /api/ → reverse proxy localhost:3000
├── systemd: reframe-backend.service (Clojure uberjar, порт 3000)
└── Let's Encrypt: отложен до post-MVP (MVP на IP)
```

### nginx config
```nginx
server {
    listen 80;
    server_name _;  # IP-based for MVP

    root /var/www/reframe/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 15s;  # LLM может думать до 10s
    }
}
```

### systemd unit
```
# /etc/systemd/system/reframe-backend.service
[Unit]
Description=Reframe Backend
After=network.target

[Service]
Type=simple
User=reframe
WorkingDirectory=/opt/reframe
ExecStart=/usr/bin/java -jar /opt/reframe/reframe.jar
Restart=always
RestartSec=5
EnvironmentFile=/opt/reframe/config.env

[Install]
WantedBy=multi-user.target
```

### Deploy script (deploy.sh)

```bash
#!/bin/bash
set -e
# Скрипт содержит подробные инструкции по ручной настройке VDS
# (nginx, systemd, директории, конфиг) в комментариях перед выполнением.
# Основная логика:
#   VDS_HOST="${VDS_HOST:?Set VDS_HOST env var}"
#   VDS_USER="${VDS_USER:-reframe}"
#   frontend: cd frontend && npm ci && npm run build → rsync to VDS
#   backend:  cd backend && lein uberjar → scp to VDS
#   restart:  ssh "$VDS_USER@$VDS_HOST" "sudo systemctl restart reframe-backend"
```

### CI/CD Deploy (job в ci.yml)

Деплой — отдельная job внутри `.github/workflows/ci.yml`. Триггер: push в main (после прохождения lint, test, build, e2e).
Отдельного `deploy.yml` нет.

### Post-MVP (SSL)
- certbot + Let's Encrypt для домена
- nginx: редирект HTTP → HTTPS
- Авто-обновление сертификатов

---

## Complexity Tracking

> На данный момент нарушений конституции нет. Все решения укладываются в минималистичный стек.

