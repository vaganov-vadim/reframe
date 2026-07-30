# Implementation Plan — Reframe v2

## Summary

Reframe v2 transforms the single-agent CBT diary into a multi-agent cognitive platform. Two AI agents (Dr. Burns + Stoic) analyze the same thought in parallel. Both versions coexist in same SPA + same jar: v1 at `/`, v2 at `/studio`. Zero infra changes.

---

## Folder Structure

```
frontend/src/
├── components/
│   ├── shared/                      # reused by both versions
│   │   ├── InputMethod.tsx, TextInput.tsx, AnxietySlider.tsx
│   │   ├── ErrorBanner.tsx, ThemeToggle.tsx, TabBar.tsx, TopicPrompt.tsx
│   │
│   ├── v1/                          # v1-specific (moved from root)
│   │   ├── MainScreen.tsx, ResponseView.tsx
│   │   ├── VerticalArrow.tsx, PostRatingSlider.tsx
│   │   ├── HistoryTab.tsx, ProgressTab.tsx
│   │
│   └── v2/                          # v2-specific (new)
│       ├── StudioScreen.tsx
│       ├── AgentCard.tsx
│       └── ConsensusView.tsx
│
├── hooks/
│   ├── useSSE.ts                    # shared, extended for multi-agent
│   ├── useSpeechRecognition.ts      # shared
│
└── App.tsx                          # / → v1, /studio → v2
```

**Rule**: component used by both → `shared/`. One version only → `v1/` or `v2/`.

## Backend Structure

```
backend/src/reframe/
├── handler.clj        # extended: checks :agents param, branches v1/v2
├── prompt.clj          # extended: burns-prompt + stoic-prompt + consensus-prompt
├── agents.clj          # NEW: agent protocol + registry
├── llm_client.clj      # shared (unchanged)
├── rate_limiter.clj    # shared (unchanged)
└── logging.clj         # shared (unchanged)
```

## Route Map

| Route | Version | Component | Status |
|-------|---------|-----------|--------|
| `/` | v1 | MainScreen | Stable |
| `/history` | v1 | HistoryTab | Stable |
| `/progress` | v1 | ProgressTab | Stable |
| `/studio` | v2 | StudioScreen | New |

---

## Backend Changes

### New file: `backend/src/reframe/agents.clj`
- Agent protocol: `(analyze [this thought context])`
- Agent registry: vector of agent records
- Two initial agents: `burns-agent`, `stoic-agent`

### Modified: `backend/src/reframe/prompt.clj`
- Rename `build-prompt` → `burns-prompt`
- Add `stoic-prompt`: "You are a Stoic philosopher. Separate what is within control from what is not..."
- Add `consensus-prompt`: "Analyze these N responses and find the common ground"

### Modified: `backend/src/reframe/handler.clj`
```clojure
(defn- reframe-handler [config request]
  (let [body   (parse-body request)
        text   (:text body)
        agents (:agents body)]  ;; nil for v1, [:burns :stoic] for v2
    (if agents
      ;; v2: parallel orchestration
      (->> agents
           (pmap #(call-agent % text))
           (sse-body {:agents % :consensus (consensus-agent %)}))
      ;; v1: unchanged
      (try ...))))
```

### Modified: `backend/resources/config.edn`
- Add agent model mapping: `{:burns "deepseek-chat" :stoic "deepseek-chat"}`

---

## API Contract — Extended

v1 (unchanged):
```json
POST /api/reframe
{ "text": "..." }
→ SSE: { "distortions": [...], "reframing": "...", "question": "..." }
```

v2 (new, backward compatible):
```json
POST /api/reframe
{ "text": "...", "agents": ["burns", "stoic"] }
→ SSE events:
  { "agent": "burns", "text": "..." }
  { "agent": "stoic", "text": "..." }
  { "agent": "consensus", "text": "..." }
```

If `:agents` is missing, behaves exactly like v1. Backward compatible.

---

## Frontend Changes

### New: `frontend/src/components/v2/AgentCard.tsx`
Avatar, name, model badge, streaming text, loading skeleton.

### New: `frontend/src/components/v2/ConsensusView.tsx`
Synthesis card with "Common ground" heading.

### New: `frontend/src/components/v2/StudioScreen.tsx`
Voice/text input (reuses shared InputMethod), agent cards grid, consensus section.

### Modified: `frontend/src/hooks/useSSE.ts`
Multi-event SSE parsing. State: `{agents: AgentResult[], consensus: string|null}`.

### Modified: `frontend/src/App.tsx`
- `/` → v1 MainScreen (unchanged)
- `/studio` → v2 StudioScreen (new)

---

## Testing

- Backend (clojure.test): agent protocol, pmap correctness, SSE ordering
- Frontend (Vitest): AgentCard rendering, StudioScreen with N agents
- E2E (Playwright): `/studio` flow, `/` v1 preserved

---

## Timeout Chain

| Layer | Timeout | Notes |
|-------|---------|-------|
| Frontend fetch | 25s | unchanged |
| Nginx | 30s | unchanged |
| Backend socket | 30s per agent | parallel, total ≈ max |
| DeepSeek Pro | 3-5s | parallel calls |

## Deploy

Single SPA + single jar. Same CI/CD pipeline. Zero infra changes.

## Risks

1. **DeepSeek rate limit**: 2-4 parallel requests. Limit ~60/min → safe
2. **SSE complexity**: multi-event parsing discipline needed
3. **Prompt quality**: Stoic tone must feel distinct from clinical Burns
4. **Folder migration**: moving v1 components to `v1/` must preserve all imports
