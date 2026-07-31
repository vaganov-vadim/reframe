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
Chrome → React SPA → POST /api/reframe → Clojure прокси → LLM API → localStorage
```

## Стек

| Слой | Технология |
|------|-----------|
| Фронтенд | TypeScript 6.0 (strict) + React 19.2 + Vite 8 |
| Хранение | localStorage |
| Бэкенд | Clojure + Kit |
| LLM | DeepSeek (заменяем) |
| Тесты | Vitest + Playwright |

## Ключевые фичи

- **КПТ-рефрейминг**: 10 когнитивных искажений по Бёрнсу с цитатами и контраргументами
- **Vertical Arrow**: техника выявления глубинных убеждений (поверхностная мысль → промежуточная → глубинное убеждение)
- **Голосовой ввод**: Web Speech API, real-time транскрипция, авто-перезапуск при обрыве Chrome
- **Темы-подсказки**: 10+ тем по 5 категориям (работа, отношения, здоровье, самооценка, будущее)
- **Дыхательное упражнение**: 4-4-4 при высокой тревоге (9-10)
- **Справка по искажениям**: ℹ️ при каждом типе, справочный экран со всеми 10 типами
- **Прогресс**: сводка, тренд, облако тегов

## Разработка

- **TDD**: тесты перед кодом
- **Pre-commit**: Lefthook (типы, линтер, тесты)
- **CI/CD**: GitHub Actions — авто-деплой на VDS после мёрджа в main

### Деплой: рестарт бэкенда

CI заливает `frontend/dist` и `reframe.jar`, затем перезапускает сервис. На VDS сломанный `/etc/sudoers.d/reframe` ломает `sudo systemctl restart` — фронт обновляется, а старый JVM-процесс продолжает работать. Studio тогда получает v1-ответ без поля `agent` и показывает ошибку.

Разово на сервере (под root):

```bash
# Починить sudoers (одна строка, без синтаксических ошибок):
echo 'reframe ALL=(root) NOPASSWD: /bin/systemctl restart reframe-backend, /bin/systemctl status reframe-backend' > /etc/sudoers.d/reframe
chmod 440 /etc/sudoers.d/reframe
visudo -cf /etc/sudoers.d/reframe

# Поднять новый jar, уже залитый CI:
sudo systemctl restart reframe-backend
sudo systemctl status reframe-backend
```

Либо без sudo — user-level unit / скрипт `/opt/reframe/restart.sh` (см. deploy job в `.github/workflows/ci.yml`).

## Приватность

Все данные только в localStorage. Бэкенд без БД. История — только метаданные.

## Документация

- [Конституция](.specify/memory/constitution.md)
- [Спецификация](.specify/memory/spec.md)
- [План](.specify/memory/plan.md)
