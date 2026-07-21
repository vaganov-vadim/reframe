# Implementation Plan: Reframe MVP

**Branch**: `main` | **Date**: 2026-07-21 | **Spec**: [pending — /speckit.specify]

**Input**: Feature specification from constitution (`.specify/memory/constitution.md`)

---

## Summary

Reframe — приватный голосовой КПТ-дневник для профессионалов под стрессом. Пользователь говорит → распознавание речи → LLM анализирует через призму КПТ (Бёрнс) → streaming-ответ с рефреймингом. Все данные только на устройстве, бэкенд — тонкий прокси без хранения.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Clojure (latest stable)
**Primary Dependencies**: React, Vite, Vitest, Playwright, Kit (Ring + Reitit + malli)
**Storage**: localStorage (браузер), без серверной БД
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Веб-браузер (desktop + mobile), бэкенд на JVM
**Project Type**: Full-stack web application (SPA + thin proxy backend)
**Performance Goals**: TTI ≤ 2s, LLM first token ≤ 1s, full response ≤ 3s, bundle ≤ 150KB gzipped
**Constraints**: Бэкенд без БД и без логирования контента, offline-first невозможен (LLM требует сеть)
**Scale/Scope**: MVP — один пользователь, одно устройство, одна сессия, до ~100 записей

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
| VII. Pre-commit gates | ⏳ | Настроить в плане |

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
│   ├── memory/
│   │   └── constitution.md
│   └── templates/
│
└── README.md
```

---

## Pre-commit Gates (настройка)

Конкретные инструменты и команды, реализующие принцип VII конституции:

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

4. **Таймаут LLM (> 3 секунды)**
   - Мок задержки ответа 5 секунд
   - Проверка: отображается индикатор ожидания, через 3 секунды — предупреждение

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
      - check bundle size ≤ 150KB gzipped
```

---

## Complexity Tracking

> На данный момент нарушений конституции нет. Все решения укладываются в минималистичный стек.

