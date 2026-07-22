# AGENTS.md — Reframe

> Инструкция для AI-агентов, работающих с проектом. Прочитай перед любыми изменениями.

## О проекте

**Reframe** — приватный голосовой КПТ-дневник для профессионалов под стрессом. Пользователь говорит → LLM анализирует через призму когнитивно-поведенческой терапии (Бёрнс) → рефрейминг.

Все данные — только на устройстве пользователя. Бэкенд — тонкий прокси к LLM без хранения.

## Методология: Spec-Driven Development (Speckit)

Мы НЕ пишем код до спецификации. Работаем по циклу:

```
constitution → specify → plan → tasks → implement
```

### Артефакты (всегда актуальны)

| Файл | Что определяет | Когда читать |
|---|---|---|
| `.specify/memory/constitution.md` | Принципы, архитектура, границы, стек | Перед любым решением |
| `.specify/memory/spec.md` | Функциональные требования, сценарии | Перед plan и implement |
| `.specify/memory/plan.md` | Технический план, структура, CI, pre-commit | Перед implement |
| `.omo/POST-MVP.md` | Что осознанно отложено до v2 | Чтобы не предлагать отложенное |
| `AGENTS.md` | Этот файл | При входе в проект |

### Порядок работы

1. **Перед любым изменением** — прочитай constitution.md. Если предлагаемое решение противоречит конституции — остановись, предложи изменить конституцию.
2. **Новая фича** — `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`
3. **Баг или правка** — проверь, не противоречит ли исправление конституции. Если нет — правь, с тестами.
4. **Сомнения** — смотри POST-MVP.md: возможно, это осознанно отложено.

## Технический стек

| Слой | Технология |
|---|---|
| Фронтенд | TypeScript (strict), React, Vite |
| Хранение | localStorage |
| Unit-тесты | Vitest |
| E2E-тесты | Playwright |
| Бэкенд | Clojure + Kit (прокси + промпт-инжиниринг) |
| API | REST + SSE streaming |

## Ключевые правила

### Код
- **TypeScript strict mode** — никаких `any`
- **TDD** — сначала тест, потом код
- **Pre-commit gates** — перед коммитом: `tsc --noEmit` (чисто), `eslint` (чисто), `vitest run` (зелено)
- **Никакого мёртвого кода**, закомментированных блоков, TODO без issue

### Архитектура
- **Бэкенд НЕ хранит данные** — ни тексты, ни логи с содержимым
- **Фронтенд НЕ содержит API-ключей** и не обращается к LLM напрямую
- **LLM-провайдер заменяем** без изменения фронтенда (контракт на бэкенде)
- **Промпт-инжиниринг** (методология Бёрнса) — на бэкенде
- **Бизнес-логика клиента**: валидация, сессии, история, UX

### Приватность
- Все пользовательские данные ТОЛЬКО в localStorage
- История сессий НЕ содержит текст записей или рефрейминга — только метаданные
- Никакой телеметрии с содержимым

### Дизайн
- Тёплая нейтральная палитра, тёмная тема по умолчанию
- Минимальная зона касания 48px
- Ориентиры: Calm, Headspace, Nivra
- Максимум 2–3 действия на экране

## Структура проекта

```
reframe/
├── frontend/          # TypeScript + React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/  # Бизнес-логика клиента
│   │   ├── store/
│   │   └── types/
│   └── tests/
│       ├── unit/      # Vitest
│       └── e2e/       # Playwright
├── backend/           # Clojure + Kit прокси
│   ├── src/
│   └── test/
├── .specify/          # Speckit артефакты
│   └── memory/
│       ├── constitution.md
│       ├── spec.md
│       └── plan.md
└── .omo/              # Планы и отложенные требования
    ├── constitution-updates.md
    └── POST-MVP.md
```

## Инфраструктура

### CI/CD (ci.yml)
```
push → frontend-lint-types → frontend-test → frontend-build → frontend-e2e
                         ↘ backend-test ↗          ↕ (parallel)
                                                    ↓
                                               deploy (main only)
```
- PR: lint + test + build + e2e
- Merge to main: всё выше + деплой на VDS
- Все проверки обязательны перед деплоем

### Сервер
- VDS Ubuntu 20.04, nginx + systemd
- `/opt/reframe/` — бэкенд JAR + config.env + fixtures
- `/var/www/reframe/dist/` — SPA статика
- `reframe` user — ограниченные права (только systemctl restart своего сервиса)
- Wireguard VPN — НЕ ТРОГАТЬ

### Секреты (никогда не коммитить)
- API-ключи и пароли — только в GitHub Secrets и `/opt/reframe/config.env`
- CI/CD SSH-ключ — `VDS_SSH_KEY` в GitHub Secrets

## Что НЕ надо предлагать (уже решено)

- ❌ Заменить Clojure на Node.js — осознанный выбор
- ❌ Добавить серверную БД — противоречит приватности
- ❌ Текстовый ввод вместо голоса (v1) — осознанно voice-only, будет в v2
- ❌ Server-side rendering, сложный роутинг — противоречит простоте
- ❌ Мобильное приложение (native) — веб-приложение достаточно

## Git

### Commit style
Стандартный GitHub-стиль: [Conventional Commits](https://www.conventionalcommits.org/).

```
type(scope): краткое описание в повелительном наклонении
```

**Типы**: `docs`, `feat`, `fix`, `chore`, `refactor`, `test`, `style`.

**Примеры**:
- `docs: add project constitution and spec-kit artifacts`
- `feat(frontend): add voice recording via Web Speech API`
- `chore: remove copilot-specific artifacts from repo`

### Workflow (PR-based)

Все изменения — через ветки и Pull Request:

1. `git checkout -b feature/xxx` или `fix/xxx`
2. Изменения + коммиты
3. `git push origin feature/xxx`
4. Создать PR в main
5. CI проходит (lint, test, build) → мёрдж
6. После мёрджа в main — деплой (deploy.yml)

**Прямой пуш в main запрещён.** Исключение: hotfix (с пометкой `fix:`).

### Что НЕ коммитить
`.clj-kondo/`, `.lsp/`, `.omo/`, `.github/`, `.vscode/` — в `.gitignore`.

### Что коммитить
`.specify/` — проектные артефакты (конституция, spec, plan).
