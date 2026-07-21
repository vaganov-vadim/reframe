# Tasks Breakdown — Reframe MVP (Final)

**Input**: `.specify/memory/plan.md`
**Decisions**: Leiningen для Clojure, строгий TDD, E2E распределены по фазам, деплой в Phase 7

---

## Phase 1 — Инфраструктура

- [ ] 1.1 Vite + React + TS scaffold (`npm create vite@latest frontend -- --template react-ts`). tsconfig strict.
- [ ] 1.2 ESLint flat config (`eslint.config.js`) + Prettier. Проверить: `eslint .` и `prettier --check .`.
- [ ] 1.3 Lefthook (`lefthook.yml`): pre-commit `tsc --noEmit && eslint .`, pre-push `vitest run`.
- [ ] 1.4 Clojure backend: `lein new kit reframe` в `backend/`. `lein run` стартует.
- [ ] 1.5 CI: `.github/workflows/ci.yml` — lint → unit → e2e → build. Триггер: push (кроме main).
- [ ] 1.6 React Router: `/`, `/history`, `/progress`. TabBar. EmptyState-заглушки.
- [ ] 1.7 CSS tokens: `styles/tokens.css` (12 custom properties), `global.css` (reset + dark default).
- [ ] 1.8 ThemeProvider: React Context + `reframe_theme` localStorage + `data-theme` на `<html>`.

**E2E после Phase 1**: тест переключения темы (тёмная ↔ светлая, localStorage).

---

## Phase 2 — Бэкенд-прокси (параллельно с Phase 3)

- [ ] 2.1 ТЕСТ: `handler_test.clj` — успешный ответ, 429, таймаут, ошибка LLM.
- [ ] 2.2 `prompt.clj`: `build-prompt(text)` — системный промпт + текст пользователя.
- [ ] 2.3 `llm_client.clj`: `call-llm(prompt)` — clj-http POST к LLM API, stream: true.
- [ ] 2.4 `handler.clj`: POST `/api/reframe` → prompt → LLM → core.async → SSE.
- [ ] 2.5 `rate_limiter.clj`: token bucket, atom, Aero config `REFRAFE_RATE_LIMIT`. Middleware: 429 + Retry-After.
- [ ] 2.6 LLM mock: `REFRAFE_MOCK_LLM=true` → случайная фикстура из `mock-responses.json`.
- [ ] 2.7 `resources/config.edn` (Aero) + `core.clj` (запуск сервера с конфигом).
- [ ] 2.8 Прогнать тесты 2.1 → все проходят (Red-Green: сначала падают, потом зелёные).

**E2E после Phase 2**: `curl -X POST /api/reframe -d '{"text":"test"}'` → SSE ответ (с mock LLM).

---

## Phase 3 — Базовый UI (параллельно с Phase 2)

- [ ] 3.1 AnxietySlider: ползунок 1-10, якоря 1-5-10, трек + заполнение `--slider-fill`.
- [ ] 3.2 SUDS Tooltip: `AnxietyTooltip` — 10 уровней при наведении. Используется в AnxietySlider.
- [ ] 3.3 RecordButton: «Говорить» → «Стоп» + «Отмена». 3-минутный автостоп.
- [ ] 3.4 RecordingIndicator: пульсирующая иконка / осциллограмма при записи.
- [ ] 3.5 OnboardingOverlay: модалка первого запуска. `reframe_onboarding` флаг в localStorage.
- [ ] 3.6 ThemeToggle: кнопка переключения темы, иконка солнце/луна, мгновенный переход.

---

## Phase 4 — Голос + Streaming

> Зависит от: Phase 2 (API) + Phase 3 (компоненты).

- [ ] 4.1 ТЕСТ: `speechService.test.ts` — мок SpeechRecognition, проверка start/stop/error/cancel.
- [ ] 4.2 `speechService.ts` / `useSpeechRecognition`: Web Speech API hook, sanitize (trim, empty, 3000).
- [ ] 4.3 BrowserFallback: заглушка для браузеров без Web Speech API.
- [ ] 4.4 `apiService.ts` / `useSSE`: POST `/api/reframe`, EventSource, парсинг JSON, таймаут 10s.
- [ ] 4.5 ResponseView: DistortionList + ReframingText. Streaming render. Partial response handling.
- [ ] 4.6 PostRatingSlider + DeltaDisplay: ползунок «после», дельта с цветом, кнопка «Сохранить».
- [ ] 4.7 ErrorBanner: типы ошибок (сеть, таймаут, распознавание). Кнопка «Повторить».
- [ ] 4.8 MainScreen useReducer: AnxietySlider → Record → Response → PostRate → Save. Связка компонентов.

**E2E после Phase 4**: голосовой ввод → ответ (мок API + мок Speech), ошибка сети (fetch 500), таймаут LLM (≥5s), ошибка распознавания, обрыв streaming.

---

## Phase 5 — Сессия и история

> Зависит от: Phase 4.

- [ ] 5.1 ТЕСТ: `storageService.test.ts` — save, get, list, quota exceeded, corrupt data.
- [ ] 5.2 `storageService.ts`: localStorage CRUD, `reframe_sessions` ключ.
- [ ] 5.3 ТЕСТ: `sessionService.test.ts` — start, complete, id generation.
- [ ] 5.4 `sessionService.ts`: `startSession(before)` → `completeSession(after, response)` → storage.
- [ ] 5.5 Интеграция сохранения в MainScreen: кнопка «Сохранить» → sessionService → сброс UI.
- [ ] 5.6 HistoryTab: SessionList (сортировка: новые сверху) + SessionDetail (искажение, рефрейминг, до/после, дельта).

**E2E после Phase 5**: сохранение сессии → отображение в истории → детали по клику.

---

## Phase 6 — Прогресс и полировка

> Зависит от: Phase 5.

- [ ] 6.1 ProgressTab: AnxietyChart (Recharts, `React.lazy`). 7 дней, до/после, тренд, tooltip.
- [ ] 6.2 ProgressTab EmptyState + HistoryTab EmptyState (тёплый текст, тон «друг»).
- [ ] 6.3 Финальные error states: проверить все сценарии из spec section 7 → UI-реакция.
- [ ] 6.4 Tone of voice: пройти по всем текстам, заменить императивы.
- [ ] 6.5 README: запуск, архитектура, стек, конституция, pre-commit.

**E2E после Phase 6**: график (данные за 7 дней), пустая история, пустой прогресс.

---

## Phase 7 — Деплой

> Зависит от: Phase 6 (все фичи готовы).

- [ ] 7.1 `deploy.sh`: сборка фронта → uberjar → rsync/scp → systemctl restart.
- [ ] 7.2 `.github/workflows/deploy.yml`: push to main → деплой на VDS.
- [ ] 7.3 nginx config на VDS: SPA статика + reverse proxy `/api/` → localhost:3000.
- [ ] 7.4 systemd unit: `reframe-backend.service` (restart always, EnvironmentFile).
- [ ] 7.5 End-to-end smoke test: открыть приложение по IP, записать голос, получить ответ.

---

## Итого: ~45 задач, 7 фаз

```
Phase 1 (8) → Phase 2 (8) ∥ Phase 3 (6) → Phase 4 (8) → Phase 5 (6) → Phase 6 (5) → Phase 7 (5)
                    ↑                   ↑
               E2E после 2          E2E после 4, 5, 6
```
