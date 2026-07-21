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
| График | Чистый SVG, 0 зависимостей |
| Git hooks | lefthook (pre-commit: lint+types, pre-push: tests) |

---

## Design Tokens

Dark theme (default):

| Token | Value | Usage |
|---|---|---|
| --bg-primary | #1C1917 | Основной фон (warm dark) |
| --bg-secondary | #252220 | Поверхности, карточки |
| --bg-elevated | #2D2A28 | Модальные окна, tooltip |
| --text-primary | #EDE4D8 | Основной текст (warm cream) |
| --text-secondary | #A89880 | Вторичный текст (muted sand) |
| --accent | #C8A87C | Акцентный цвет (warm gold) |
| --accent-hover | #D4BA96 | Акцент при наведении |
| --success | #8BA88A | Позитивная дельта (muted sage) |
| --error | #C8847A | Высокая тревога / ошибки (warm terra cotta) |
| --border | #3A3530 | Рамки и разделители |
| --slider-track | #3A3530 | Трек ползунка |
| --slider-fill | #C8A87C | Заполнение ползунка |

Light theme (optional): инвертировать bg/text, accent сохранить.

Spacing & sizing:
- Базовая единица: 4px (шаг сетки)
- Минимальная зона касания: 48×48px
- Отступы контейнера: 16px mobile / 24px desktop
- Border radius: 12px (soft, friendly)

Typography:
- Font family: system-ui, -apple-system, sans-serif
- Base size: 16px
- Heading size: 20px (h1), 18px (h2)
- Line height: 1.5

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

Response: SSE stream (Content-Type: text/event-stream)

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

---

## Data Schema (localStorage)

```typescript
// src/types/session.ts
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
  onboardingSeen: 'reframe_onboarding',   // boolean
  theme: 'reframe_theme',                // 'dark' | 'light'
} as const;
```

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
│   ├── AnxietyChart        # линейный SVG-график за 7 дней
│   └── EmptyState          # «Твой прогресс появится здесь...»
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
Frontend: EventSource onmessage
    ├── Parse JSON: {distortions, reframing, question}
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

## Frontend Services

```
src/services/
├── speechService.ts     # Web Speech API: start/stop/cancel, browser check, error handling
├── apiService.ts        # fetch → POST /api/reframe, SSE EventSource, abort/timeout
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

Mock switch: env `REFRAFE_MOCK_LLM=true` → backend returns fixture instead of calling LLM.

---

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
- LLM mock switch (REFRAFE_MOCK_LLM)
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
- apiService.ts: POST /api/reframe, SSE EventSource
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
- ProgressTab: AnxietyChart (SVG, 7 дней, до/после, тренд)
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
│   │   ├── hooks/             # React hooks (useSpeech, useLLM)
│   │   ├── services/          # Бизнес-логика (reframing, storage, prompts)
│   │   ├── store/             # Клиентское состояние (история записей)
│   │   ├── styles/            # CSS / дизайн-токены
│   │   └── types/             # TypeScript-типы (включая контракты API)
│   ├── tests/
│   │   ├── unit/              # Vitest — ключевые сценарии
│   │   └── e2e/               # Playwright — критические пользовательские пути
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
│
├── .specify/                  # Spec-kit артефакты
│   └── memory/
│       ├── constitution.md    # Принципы и границы
│       ├── spec.md            # Функциональные требования
│       └── plan.md            # Этот файл
│
└── README.md
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

Настроить через `husky` + `lint-staged` или `lefthook`:

```json
// package.json → lint-staged
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "tsc --noEmit"],
    "*.{ts,tsx,json,css}": "prettier --write"
  }
}
```

Pre-push hook: `vitest run` (быстрее, чем на pre-commit, чтобы не замедлять коммиты).

### Бэкенд

```bash
# Тесты
lein test
```

---

## E2E-тесты (Playwright)

Критические пользовательские сценарии (внешние зависимости мокаются):

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

---

## Инструменты и конфигурация

| Инструмент | Назначение | Ключевая настройка |
|---|---|---|
| TypeScript | Типизация | `strict: true` в tsconfig.json |
| ESLint | Линтинг | Flat config (`eslint.config.js`) |
| Prettier | Форматирование | Интеграция с ESLint |
| Vitest | Unit-тесты | `environment: 'jsdom'`, coverage-порог |
| Playwright | E2E-тесты | Моки через `page.route()`, три браузера |
| Husky/Lefthook | Git hooks | Pre-commit: lint + types, Pre-push: tests |
| Vite | Сборка | Code splitting, lazy loading, bundle analysis |

---

## CI Pipeline (MVP)

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

## Complexity Tracking

> На данный момент нарушений конституции нет. Все решения укладываются в минималистичный стек.

