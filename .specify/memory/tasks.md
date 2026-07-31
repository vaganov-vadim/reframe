# Tasks Breakdown — Reframe MVP (Final)

**Input**: `.specify/memory/plan.md`
**Decisions**: Leiningen для Clojure, строгий TDD, E2E распределены по фазам, деплой в Phase 7

---

## Phase 1 — Инфраструктура

- [x] 1.1 Vite + React + TS scaffold (`npm create vite@latest frontend -- --template react-ts`). tsconfig strict.
- [x] 1.2 ESLint flat config (`eslint.config.js`) + Prettier. Проверить: `eslint .` и `prettier --check .`.
- [x] 1.3 Lefthook (`lefthook.yml`): pre-commit `tsc --noEmit && eslint .`, pre-push `vitest run`.
- [x] 1.4 Clojure backend: `lein new kit reframe` в `backend/`. `lein run` стартует.
- [x] 1.5 CI: `.github/workflows/ci.yml` — lint → unit → e2e → build. Триггер: push (кроме main).
- [x] 1.6 React Router: `/`, `/history`, `/progress`. TabBar. EmptyState-заглушки.
- [x] 1.7 CSS tokens: `styles/tokens.css` (12 custom properties), `global.css` (reset + dark default).
- [x] 1.8 ThemeProvider: React Context + `reframe_theme` localStorage + `data-theme` на `<html>`.

**E2E после Phase 1**: тест переключения темы (тёмная ↔ светлая, localStorage).

---

## Phase 2 — Бэкенд-прокси (параллельно с Phase 3)

- [x] 2.1 ТЕСТ: `handler_test.clj` — успешный ответ, 429, таймаут, ошибка LLM.
- [x] 2.2 `prompt.clj`: `build-prompt(text)` — системный промпт + текст пользователя.
- [x] 2.3 `llm_client.clj`: `call-llm(prompt)` — clj-http POST к LLM API, stream: true.
- [x] 2.4 `handler.clj`: POST `/api/reframe` → prompt → LLM → core.async → ответ клиенту.
- [x] 2.5 `rate_limiter.clj`: token bucket, atom, Aero config `REFRAFE_RATE_LIMIT`. Middleware: 429 + Retry-After.
- [x] 2.6 LLM mock: `REFRAFE_MOCK_LLM=true` → случайная фикстура из `mock-responses.json`.
- [x] 2.7 `resources/config.edn` (Aero) + `core.clj` (запуск сервера с конфигом).
- [x] 2.8 Прогнать тесты 2.1 → все проходят (Red-Green: сначала падают, потом зелёные).

**E2E после Phase 2**: `curl -X POST /api/reframe -d '{"text":"test"}'` → ответ (с mock LLM).

---

## Phase 3 — Базовый UI (параллельно с Phase 2)

- [x] 3.1 AnxietySlider: ползунок 1-10, якоря 1-5-10, трек + заполнение `--slider-fill`.
- [x] 3.2 SUDS Tooltip: `AnxietyTooltip` — 10 уровней при наведении. Используется в AnxietySlider.
- [x] 3.3 RecordButton: «Говорить» → «Стоп» + «Отмена». 3-минутный автостоп.
- [x] 3.4 RecordingIndicator: пульсирующая иконка / осциллограмма при записи.
- [x] 3.5 OnboardingOverlay: модалка первого запуска. `reframe_onboarding` флаг в localStorage.
- [x] 3.6 ThemeToggle: кнопка переключения темы, иконка солнце/луна, мгновенный переход.

---

## Phase 4 — Голос + Ответ

> Зависит от: Phase 2 (API) + Phase 3 (компоненты).

- [x] 4.1 ТЕСТ: `speechService.test.ts` — мок SpeechRecognition, проверка start/stop/error/cancel.
- [x] 4.2 `speechService.ts` / `useSpeechRecognition`: Web Speech API hook, sanitize (trim, empty, 3000).
- [x] 4.3 BrowserFallback: заглушка для браузеров без Web Speech API.
- [x] 4.4 `apiService.ts` / `useSSE`: POST `/api/reframe`, fetch + ReadableStream, парсинг JSON, таймаут 10s.
- [x] 4.5 ResponseView: DistortionList + ReframingText. Потоковый рендеринг. Partial response handling.
- [x] 4.6 PostRatingSlider + DeltaDisplay: ползунок «после», дельта с цветом, кнопка «Сохранить».
- [x] 4.7 ErrorBanner: типы ошибок (сеть, таймаут, распознавание). Кнопка «Повторить».
- [x] 4.8 MainScreen useReducer: AnxietySlider → Record → Response → PostRate → Save. Связка компонентов.

**E2E после Phase 4**: голосовой ввод → ответ (мок API + мок Speech), ошибка сети (fetch 500), таймаут LLM (≥5s), ошибка распознавания, обрыв ответа.

---

## Phase 5 — Сессия и история

> Зависит от: Phase 4.

- [x] 5.1 ТЕСТ: `storageService.test.ts` — save, get, list, quota exceeded, corrupt data.
- [x] 5.2 `storageService.ts`: localStorage CRUD, `reframe_sessions` ключ.
- [x] 5.3 ТЕСТ: `sessionService.test.ts` — start, complete, id generation.
- [x] 5.4 `sessionService.ts`: `startSession(before)` → `completeSession(after, response)` → storage.
- [x] 5.5 Интеграция сохранения в MainScreen: кнопка «Сохранить» → sessionService → сброс UI.
- [x] 5.6 HistoryTab: SessionList (сортировка: новые сверху) + SessionDetail (искажение, рефрейминг, до/после, дельта).

**E2E после Phase 5**: сохранение сессии → отображение в истории → детали по клику.

---

## Phase 6 — Прогресс и полировка

> Зависит от: Phase 5.

- [x] 6.1 ProgressTab: AnxietyChart (Recharts, `React.lazy`). 7 дней, до/после, тренд, tooltip.
- [x] 6.2 ProgressTab EmptyState + HistoryTab EmptyState (тёплый текст, тон «друг»).
- [x] 6.3 Финальные error states: проверить все сценарии из spec section 7 → UI-реакция.
- [x] 6.4 Tone of voice: пройти по всем текстам, заменить императивы.
- [x] 6.5 README: запуск, архитектура, стек, конституция, pre-commit.

**E2E после Phase 6**: график (данные за 7 дней), пустая история, пустой прогресс.

---

## Phase 7 — Деплой

> Зависит от: Phase 6 (все фичи готовы).

- [x] 7.1 `deploy.sh`: сборка фронта → uberjar → rsync/scp → systemctl restart.
- [x] 7.2 Deploy job в `.github/workflows/ci.yml`: push to main → деплой на VDS.
- [x] 7.3 nginx config на VDS: SPA статика + reverse proxy `/api/` → localhost:3000.
- [x] 7.4 systemd unit: `reframe-backend.service` (restart always, EnvironmentFile).
- [x] 7.5 End-to-end smoke test: открыть приложение по IP, записать голос, получить ответ.

---

## Phase 8 — E2E-тесты (Playwright)

- [x] 8.1 Playwright install + config (`playwright.config.ts`)
- [x] 8.2 Тест: тема (тёмная ↔ светлая, localStorage)
- [x] 8.3 Тест: главный экран (слайдер, кнопка, BrowserFallback)
- [x] 8.4 Тест: онбординг (первый запуск, повторный)
- [x] 8.5 Тест: флоу записи (мок Speech API + мок LLM → ответ)
- [x] 8.6 Тест: ошибка сети (fetch 500 → ErrorBanner)
- [x] 8.7 Тест: таймаут LLM (задержка → предупреждение)
- [x] 8.8 Тест: сохранение → история (localStorage + HistoryTab)
- [x] 8.9 Тест: график + пустые состояния (ProgressTab, HistoryTab)
- [x] 8.10 Удалить Recharts: `npm uninstall recharts`
- [x] 8.11 Переписать ProgressTab: сводка + тренд + облако тегов
- [x] 8.12 Обновить E2E-тест прогресса

---

## Phase 9 — Vertical Arrow (Бёрнс)

- [x] 9.1 Backend: Vertical Arrow prompt variant в prompt.clj
- [x] 9.2 Backend: поддержка deeper-режима в handler.clj
- [x] 9.3 Frontend: кнопка «Копнуть глубже» в MainScreen
- [x] 9.4 Frontend: VerticalArrow компонент (визуальная лестница)
- [x] 9.5 Frontend: интеграция флоу в MainScreen useReducer
- [x] 9.6 Frontend: стилизация под navy/amber дизайн
- [x] 9.7 E2E: тест Vertical Arrow флоу

## Phase 10 — Мониторинг и статус

- [x] 10.1 Beszel: установка hub + agent через Docker
- [x] 10.2 nginx: прокси /monitoring/ → Beszel, /api/health защита
- [x] 10.3 Health endpoint: /api/health с LLM статусом, счётчиками, памятью
- [x] 10.4 Статус-панель: /status в SPA с карточками метрик
- [x] 10.5 Telegram алертинг: cron → health check → бот
- [x] 10.6 Документация: MONITORING.md
- [x] 10.7 Rate limit UX: эмпатичное сообщение, таймер из Retry-After заголовка

---

## Phase 11 — Операционное логирование (timbre)

- [x] 11.1 `project.clj`: добавить `com.taoensso/timbre "6.5.0"`
- [x] 11.2 ТЕСТ: `logging_test.clj` — инициализация без ошибок, ротация, очистка старых логов
- [x] 11.3 `logging.clj`: конфигурация timbre, консольный (INFO+) и файловый (DEBUG+) аппендеры
- [x] 11.4 `logging.clj`: ежедневная ротация (`reframe.YYYY-MM-DD.log`), автоочистка >7 дней
- [x] 11.5 `core.clj`: вызов `logging/init!` при старте, замена `println` на `timbre/info`
- [x] 11.6 `handler.clj`: `timbre/error` с exception и stack trace в catch-блоке
- [x] 11.7 `llm_client.clj`: логирование retry (WARN), успеха (INFO), исчерпания (ERROR), времени ответа (DEBUG), режима mock/real (DEBUG)
- [x] 11.8 `.gitignore`: добавить `logs/`
- [x] 11.9 Прогнать `lein test` — все тесты проходят
- [x] 11.10 `useSSE.ts`: `console.error` для HTTP ошибок, таймаутов, обрывов; `console.warn` для частичных ответов и SSE-ошибок
- [x] 11.11 `MainScreen.tsx`: `console.error` в обработчиках ошибок (ERROR dispatch)
- [x] 11.12 Прогнать `tsc --noEmit && eslint . && vitest run` — всё чисто

---

---

## Phase 12 — Multi-Agent Core (backend, v2)

- [x] 12.1 ТЕСТ: `agents_test.clj` — реестр burns/stoic, lookup, analyze contract
- [x] 12.2 Создать `agents.clj` — реестр + `analyze-agent` + `orchestrate!` (futures + completion queue)
- [x] 12.3 Добавить `stoic-prompt` и `consensus-prompt` в prompt.clj (`burns-prompt` = alias `build-prompt`)
- [x] 12.4 Обновить handler.clj: `:agents` → agent-complete SSE (http-kit channel), v1 path без изменений
- [x] 12.5 Partial failure: error-event на агента; consensus только при ≥2 ok
- [x] 12.6 config.edn: `:agents {:burns "deepseek-chat" :stoic "deepseek-chat" :consensus "deepseek-chat"}`
- [x] 12.7 Адаптировать handler_test.clj: drain channel, v2 multi-event, v1 regression
- [x] 12.8 Mock fixtures для stoic/consensus в mock-responses / agents mock path

## Phase 13 — Multi-Agent UI (frontend, v2)

- [x] 13.1 ТЕСТ: AgentCard (loading / ok structured / ok text / error)
- [x] 13.2 Создать `AgentCard.tsx` в `components/v2/`
- [x] 13.3 Создать `ConsensusView.tsx` в `components/v2/`
- [x] 13.4 Создать `StudioScreen.tsx` — InputMethod + cards + consensus; ссылка «К дневнику»
- [x] 13.5 `useSSE.sendToAgents` — multi-event agent-complete parser (timeout 45s)
- [x] 13.6 App.tsx: `/studio` → StudioScreen; TabBar скрыт на studio
- [x] 13.7 MainScreen: discovery-ссылка «Другой угол зрения» → `/studio`
- [x] 13.8 Types: AgentEvent / AgentResult в session.ts

## Phase 14 — Тестирование и полировка (v2)

- [x] 14.1 E2E: `/studio` — text input → 2 карточки → consensus
- [x] 14.2 E2E: `/` (v1) работает после v2
- [x] 14.3 Прогнать `lein test` + `vitest run` + studio playwright
- [x] 14.4 Синхронизация ROADMAP (v2 multi-agent как ближайшее)

---

## Phase 15 — DeepSeek V4 models + per-agent wiring

- [x] 15.1 ТЕСТ: `llm_client_test.clj` — `call-llm` шлёт `model` + `thinking.type` из opts; дефолт thinking disabled
- [x] 15.2 `llm_client.clj`: opts merge, body с explicit thinking; дефолт model `deepseek-v4-flash`
- [x] 15.3 ТЕСТ: `agents_test` — analyze/consensus вызывают `call-llm` с model/thinking из `:agents`
- [x] 15.4 `agents.clj`: resolve agent opts из config (map или legacy string)
- [x] 15.5 `config.edn`: V4 flash defaults; consensus thinking enabled; env overrides
- [x] 15.6 Обновить spec/plan (модели, env); `lein test` зелёный

## Phase 16 — Studio CJM UX (v2.1)

- [x] 16.1 Spec/plan: CJM hierarchy «Что унести» → линзы; зафиксированный копирайт
- [x] 16.2 ТЕСТ: AgentCard — role subtitle; Burns reframing→distortions→question
- [x] 16.3 AgentCard + ConsensusView («Что унести», hero)
- [x] 16.4 StudioScreen: title/subtitle/prompt/example; result order; CTA «Понял · ещё раз»
- [x] 16.5 MainScreen discovery: «Два взгляда на ситуацию →»
- [x] 16.6 E2E/unit обновлены; vitest + playwright studio зелёные

## Phase 17 — Studio Quiet UI + один follow-up (v2.2)

- [x] 17.1 Spec/plan/ROADMAP: Quiet UI + `mode: studio-followup`
- [x] 17.2 Quiet UI: убрать subtitle/example; Burns «ещё»; один CTA
- [x] 17.3 ТЕСТ backend: follow-up 200 + 400 missing fields
- [x] 17.4 `studio-followup-prompt` + handler + mock
- [x] 17.5 `useSSE.sendStudioFollowup` + StudioScreen фазы follow-up/skip
- [x] 17.6 E2E: quiet input, follow-up updates takeaway, skip → Понял

## Итого: Phase 12–17 (вкл. Quiet UI + follow-up v2.2) выполнены
