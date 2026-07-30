# Constitution Amendments for v2

## What Changes

### Principle I — Privacy (unchanged)
Multi-agent calls stay within the same privacy boundary. Backend receives thought, orchestrates agents, returns results — no storage.

### Principle II — Simplicity (unchanged)
v2 keeps simplicity despite added complexity: one input → one button → result. The complexity is in the architecture, not the UI.

### Principle VI — Contract-First (amended)
The backend defines LLM interaction contracts for each agent independently. Replacing one agent does not affect other agents or the frontend. Adding a new agent = one registry entry + one prompt, no changes to the rest of the system.

### New: Principle VII — Extensible Architecture
The agent architecture is open for extension. New agents are added through the registry without modifying the core system. The frontend dynamically renders any number of agents.

## What's Removed
- Principles III (Speed) — relaxed for v2: Reasoner model can take 10-30s, user sees streaming progress
- Performance targets ≤ 3s — replaced with "streaming feedback, no blank waiting"

## What's Added
- Principle VII: Extensible agent architecture

## Version
v2.0 draft | 2026-07-30
