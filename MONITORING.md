# Мониторинг

## Системный (Beszel)
- URL: https://reframe.vaganov-vadim.ru/monitoring/
- Агент: Docker, localhost:45876
- Метрики: CPU, RAM, диск, сеть, контейнеры
- Доступ: email + пароль

## Прикладной (Health API)
- URL: https://reframe.vaganov-vadim.ru/api/health (внутренний)
- Формат: JSON
- Алертинг: cron каждую минуту → Telegram бот

## Метрики
| Метрика | Источник | Видимость |
|---------|----------|-----------|
| CPU, RAM, диск | Beszel | /monitoring/ |
| Статус бэкенда | /api/health | /status (SPA) |
| Статус LLM | /api/health | /status (SPA) |
| Счётчик запросов | /api/health | /status (SPA) |
| Счётчик ошибок | /api/health | /status (SPA) |
| Uptime сервиса | /api/health | /status (SPA) |
