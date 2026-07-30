# Tasks — Reframe v2

## Phase 12 — Multi-Agent Core (backend)

- [ ] 12.1 Create `backend/src/reframe/agents.clj` — agent protocol + registry (burns, stoic)
- [ ] 12.2 Create `backend/test/reframe/agents_test.clj` — protocol and registry tests
- [ ] 12.3 Add `stoic-prompt` and `consensus-prompt` to prompt.clj
- [ ] 12.4 Update handler.clj: parallel agent orchestration via pmap
- [ ] 12.5 Update handler.clj: multi-event SSE streaming
- [ ] 12.6 Update config.edn: agent→model mapping
- [ ] 12.7 Adapt handler_test.clj for new contract

## Phase 13 — Multi-Agent UI (frontend)

- [ ] 13.1 Create `AgentCard.tsx` — agent card with streaming text
- [ ] 13.2 Create `ConsensusView.tsx` — synthesis of all agents
- [ ] 13.3 Create `StudioScreen.tsx` — v2 main screen (InputMethod + AgentCard × N + ConsensusView)
- [ ] 13.4 Update `useSSE.ts` — multi-event parsing, state for N agents
- [ ] 13.5 Update `App.tsx` — route `/` → MainScreen (v1), `/studio` → StudioScreen (v2)
- [ ] 13.6 Style AgentCard with navy/amber design system

## Phase 14 — Testing & Polish

- [ ] 14.1 Unit tests: AgentCard rendering
- [ ] 14.2 Unit tests: StudioScreen with 2 agents
- [ ] 14.3 E2E test: full flow — input → 2 agents → consensus
- [ ] 14.4 E2E test: v1 at `/` still works
- [ ] 14.5 Run all tests (lein test + vitest + playwright)
- [ ] 14.6 Update spec.md / plan.md / tasks.md in .specify/memory/
