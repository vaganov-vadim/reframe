# Reframe

Приватный голосовой КПТ-дневник для профессионалов под стрессом.
Голос → анализ через КПТ (Бёрнс) → рефрейминг. Все данные на устройстве.

## Быстрый старт

```bash
# Фронтенд
cd frontend && npm install && npm run dev

# Бэкенд
cd backend && lein run
```

Открыть http://localhost:5173 в Chrome (Web Speech API).

### Переменные окружения

Создать `backend/config.env`:

```
LLM_API_KEY=your-key
```

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

## Документация

- [Конституция](.specify/memory/constitution.md)
- [Спецификация](.specify/memory/spec.md)
- [План](.specify/memory/plan.md)
