# Reframe

Приватный голосовой КПТ-дневник для профессионалов под стрессом.
Голос → анализ через КПТ (Бёрнс) → рефрейминг. Все данные на устройстве.

## Быстрый старт

### Требования

- **Node.js** 20+
- **Java** 21+ (для Clojure)
- **Leiningen** (менеджер зависимостей Clojure)
- **Chrome** (для Web Speech API)

### Запуск

```bash
# 1. Фронтенд
cd frontend && npm install && npm run dev

# 2. Бэкенд (в отдельном терминале)
cd backend && lein deps && REFRAME_MOCK_LLM=true lein run
```

### Проверка

Открыть http://localhost:5173 в Chrome (Web Speech API).

### Режимы работы

| Режим | Команда | Что делает |
|-------|---------|------------|
| **Mock (по умолчанию)** | `REFRAME_MOCK_LLM=true lein run` | Возвращает предопределённые КПТ-ответы. Не требует API-ключа. |
| **Real LLM** | `lein run` | Отправляет запросы к DeepSeek. Требует `LLM_API_KEY` в `backend/config.env`. |

### Переменные окружения

Создать `backend/config.env` (только для реального LLM):

```
LLM_API_KEY=your-key
```

### Сеть

- Фронтенд: http://localhost:5173 (Vite dev server)
- Бэкенд: http://localhost:3000 (Clojure/Kit)
- Прокси: Vite перенаправляет `/api/*` на `localhost:3000`

## Архитектура

```
Chrome → React SPA → POST /api/reframe → Clojure прокси → LLM API → SSE streaming → localStorage
```

## Стек

| Слой | Технология |
|------|-----------|
| Фронтенд | TypeScript (strict) + React + Vite |
| Хранение | localStorage |
| Бэкенд | Clojure + Kit |
| LLM | DeepSeek (заменяем) |
| Тесты | Vitest + Playwright |

## Разработка

TDD, Lefthook pre-commit, CI/CD GitHub Actions, деплой на VDS.

## Приватность

Все данные только в localStorage. Бэкенд без БД. История — только метаданные.

## Деплой

Приложение развёрнуто на VDS (Ubuntu 20.04):
- **Фронтенд**: nginx → статика `/var/www/reframe/dist/`
- **Бэкенд**: systemd-сервис `reframe-backend`, порт 3000
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)

### Пайплайн
```
push в main → lint → test → build → e2e → deploy
```
Деплой только после прохождения всех проверок.

### Переменные
| Переменная | Назначение | Где |
|---|---|---|
| `LLM_API_KEY` | Ключ LLM-провайдера | `/opt/reframe/config.env` |
| `REFRAFE_RATE_LIMIT` | Лимит запросов/мин | `/opt/reframe/config.env` |
| `VDS_SSH_KEY` | CI/CD ключ | GitHub Secrets |
| `VDS_HOST` | IP сервера | GitHub Secrets |

### Полезное
- Статус сервиса: `sudo systemctl status reframe-backend`
- Логи: `sudo journalctl -u reframe-backend -f`
- Перезапуск: `sudo systemctl restart reframe-backend`
- Перезагрузка nginx: `sudo systemctl reload nginx`

## Документация

- [Конституция](.specify/memory/constitution.md)
- [Спецификация](.specify/memory/spec.md)
- [План](.specify/memory/plan.md)
