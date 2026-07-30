# Reframe v2 — Multi-Agent Cognitive Platform

## Vision

**"A lens for thinking"** — a cognitive tool that shows any situation from multiple angles through parallel AI agents.

Not a chatbot. Not a diary. An AI agent orchestration platform for multi-dimensional analysis.

---

## Core Concept

User describes a situation. N AI agents (different roles, different models) analyze it in parallel. Results stream in and converge into a unified insight.

Architecture is extensible: adding a new agent = one line in the registry + one prompt.

---

## Agents (v2.0 — first release)

| ID | Name | Role | Model | Response time |
|----|------|------|-------|---------------|
| `:burns` | Dr. Burns | CBT analyst: finds cognitive distortions, provides factual reframing | `deepseek-chat` (Pro) | 3-5s |
| `:stoic` | Stoic | Stoic philosopher: separates what you control from what you don't | `deepseek-chat` (Pro) | 3-5s |

**Future agents (v2.1+):**
- `:friend` — empathic support (Flash, 1-2s)
- `:skeptic` — Socratic opponent, challenges conclusions (Pro)
- `:analyst` — deep pattern analysis (Reasoner, 10-30s)
- `:consensus` — synthesis agent, finds common ground across all outputs

---

## CJM (Customer Journey Map)

```
1. Main screen: "What's bothering you?"
   - Voice input (Web Speech API, same as v1)
   - Text fallback (non-Chromium browsers)
   - "Analyze" button

2. Analysis (parallel)
   - All agents launch simultaneously (pmap / core.async)
   - Results stream in as they become ready
   - Each agent renders as its own card

3. Output
   - Two cards: Dr. Burns + Stoic
   - "Common ground" section — automatic synthesis
   - "Dig deeper" button → re-run with follow-up context
```

---

## Technical Architecture

### Backend (Clojure)

```
POST /api/reframe  (reuses v1 endpoint, adds :agents param)
Body: { text: "...", agents: [:burns, :stoic] }

Handler:
  1. Read thought from request
  2. For each agent: call LLM with agent-specific prompt
  3. Return all results as SSE stream

Agents registry (agents.clj):
  - Map of agent-id → {:name, :model, :prompt-fn}
  - Adding an agent = one entry in the registry
```

### Agent protocol

```clojure
(defprotocol Agent
  (analyze [this thought context] "Returns analysis string"))

;; Each agent: record implementing Agent + prompt function
;; Parallel execution: pmap or core.async/pipeline-blocking
```

### Prompts (prompts.clj)

- `burns-prompt` — adapted from v1 prompt, keeps JSON output
- `stoic-prompt` — new: "You are a Stoic philosopher. Separate what is within control from what is not..."
- `consensus-prompt` — new: "Analyze these N responses and find the common ground..."

### Frontend (TypeScript + React)

- New component: `AgentCard` — avatar, name, model badge, streaming text
- New component: `ConsensusView` — synthesis of all agent outputs
- Existing: `InputMethod`, voice recording, text fallback — unchanged from v1
- New route: `/studio` — v2 multi-agent flow
- Old route: `/` — v1 MainScreen (stable, unchanged)

---

## Visual Design

```
┌─────────────────────────────────────┐
│  What's bothering you?              │
│  [voice input / text]               │
│         [Analyze]                   │
└─────────────────────────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ 🧠 Dr. Burns     │ │ 🏛️ Stoic         │
│ deepseek-chat    │ │ deepseek-chat    │
│                  │ │                  │
│ "Mind reading.   │ │ "Others' silence │
│  You interpret   │ │  is outside your │
│  silence as      │ │  control. What   │
│  criticism.      │ │  you control is  │
│  That's not      │ │  sending a       │
│  a fact."        │ │  follow-up."     │
└──────────────────┘ └──────────────────┘

┌─────────────────────────────────────┐
│  ▸ Common ground:                   │
│  The problem is in interpretation,  │
│  not reality.                       │
│                                     │
│  [Dig deeper]                       │
└─────────────────────────────────────┘
```

---

## What Stays from v1

- Web Speech API (voice input, streaming text)
- Text input fallback (non-Chromium browsers)
- TDD workflow, Vitest + Playwright
- CI/CD pipeline
- Rate limiting, retry logic
- Dark theme, design tokens

## What Changes from v1

- Single agent → multi-agent orchestration
- JSON response → multi-card SSE stream
- MainScreen → new multi-agent flow
- Vertical Arrow → removed (replaced by "Dig deeper" = re-run with added context)
- Anxiety slider pre/post → optional, not in core flow

## What's New

- Agents registry — extensible by design
- Parallel LLM orchestration (Clojure pmap / core.async)
- Model selection per agent (Pro, Flash, Reasoner)
- Consensus synthesis agent
- Agent cards UI component

---

## Constraints

- Must work on single DeepSeek API key (rate limit ~60 req/min)
- No server-side DB (agents are stateless, history in localStorage)
- No user content logged (constitution §I)
- Backend is thin proxy + orchestrator (no data storage)

---

## Decisions Made

1. **Two agents for v2.0**: Dr. Burns (science) + Stoic (philosophy) — strongest contrast
2. **Both on Pro model**: quality > speed for deep analysis
3. **Single round initially**: parallel analysis, no inter-agent debate (v2.2+)
4. **No agent selection UI in v2.0**: fixed set, selection comes in v2.3
5. **Reuse v1 endpoint**: POST /api/reframe with new :agents param
6. **Extensible architecture**: agent registry = one data structure, add agent = one line

---

## Version Roadmap

| Version | Agents | Models | Rounds | UI |
|---------|--------|--------|--------|----|
| v2.0 | Dr. Burns + Stoic | Pro × 2 | 1 | Fixed, 2 cards + consensus |
| v2.1 | + Friend | + Flash | 1 | 3 cards |
| v2.2 | + Consensus agent | Flash | 2 | Inter-agent debate visible |
| v2.3 | User choice | User choice | configurable | Checkbox UI |
| v3.0 | Custom agents | Custom | Custom | Agent builder |
