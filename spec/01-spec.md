+ cat
+ printf


%s


## Product spec (migrated)
+ cat
spec/product_spec.md
+ printf


%s


## Context / Existing system (archived)
+ cat
spec/spec-existing-application.md
+ cat
spec/product_spec.md
# Product Spec

## Meta
- Project: AI Mimris Dashboard
- Agent: ontology
- Phase: spec
- Source of truth: This document governs WHAT. See `tech_plan.md` for HOW.

## Problem Statement
Users need deterministic generation and visualization of ontologies inside a three-panel agent UI.

## Goals
1. Generate ontology JSON based on current Domain and conforming to `OntologySchema`.
2. Deduplicate concepts (case-insensitive) and relationship triplets.
3. Persist to Redux `model-universe` and visualize with graph diff.
4. Enforce prompt scope and naming rules.

## Non-Goals
- Free-form narrative generation.
- Non-ontology model editing.

## User Stories
- As a modeler, I provide domain text and receive a valid ontology JSON with diffs against current state.
- As a developer, I can re-run generation with a different model/temperature/tokens without changing UX.

## Inputs
- Domain text in Document Panel.
- Controls: model, temperature, max tokens.
- Optional: prior ontology state for diff.

## Outputs
- `application/json` valid against `OntologySchema`.
- UI: graph visualization with new/changed highlighting.
- Export: graph (PNG/SVG) and ontology JSON.

## Constraints
- Generation prefers `POST /api/genmodel` targeting `OntologySchema`.
- Gateway text generation allowed only for exploratory text.
- JSON must validate via Zod before commit to store.

## Acceptance Criteria (UX)
- Keyboard navigation works across controls and graph.
- Errors show concise actionable text and remain visible until dismissed.
- Streaming updates are throttled and never freeze the UI.

## Edge Cases
- Empty or trivial input → return minimal valid ontology `{ nodes: [], edges: [] }`.
- Duplicate concepts differing only by case → merged on commit.
- Cycles: allowed, but flagged in diff panel.

## Metrics
- JSON validation failure rate < 1% across CI runs.
- P95 render time for graph < 200 ms for 1k nodes (test fixture).

## Risks
- Model drift causing schema violations.
- Large graphs impacting responsiveness.

## Compliance
- Prompts scoped to artifact. No PII logging. Secrets never exposed client-side.

## Links
- Tech Plan: `./tech_plan.md#ontology-agent`
- Tasks: `./tasks.yaml#ontology`+ cat
spec/spec-existing-application.md
# Feature Specification: AI Dashboard Application (Existing)

**Feature Branch**: [n/a — documentation]  
**Created**: 2025-09-22  
**Status**: Draft  
**Input**: Existing codebase review and active routes/components

## Execution Flow (main)
```
1. User selects an agent from the sidebar or from the top-bar(Domain, Ontology, Model/IRTV, Modelview, Prompt, Chat) .
2. User adds/edit Markdown context via Document Panel and picks model + temperature
3. For exploratory text → call POST /api/vercel-ai/generate
   → Route normalizes provider output (OpenAI, Mistral, DeepSeek)
4. For structured output → call POST /api/genmodel with {aiModelName, schemaName, prompts}
   → Route streams/buffers JSON and validates/repairs into target schema
5. UI incrementally parses/validates JSON and renders preview (cards/tables/graph/markdown)
6. User saves to library (Redux slice) or applies to current domain/ontology/model
7. Optional export (markdown, SVG/PNG for graphs), and navigation to other agents
```

---

## ⚡ Quick Guidelines
- Use schema‑constrained generation (`/api/genmodel`) for deterministic UI parsing; use gateway (`/api/vercel-ai/generate`) for exploratory text.
- Keep prompts short and scoped; move background to Document Panel to reduce tokens and improve determinism.
- Enforce naming/uniqueness rules in Ontology; dedupe at apply time.
- Persist model and temperature in localStorage (`aiDashboard_selectedModel`, `aiDashboard_temperature`).

### Section Requirements
- Mandatory sections below describe current capabilities and acceptance for the existing app.

---

## User Scenarios & Testing (mandatory)

### Primary User Story
As a modeller, I can use focused agents to produce and refine domain artifacts (domain writeups, ontologies, IR/TV models, model views, and prompts) with shared AI tooling and context, and persist previews to a library for reuse.

### Acceptance Scenarios
1. Given current domain and context, when I enrich the ontology, then the app returns valid `OntologySchema` JSON with deduped concepts and unique `(name, from, to)` relationships, shows a graph with new/changed highlights, and I can apply it and export the diagram.
2. Given context Markdown and a selected model, when I run the IRTV builder, then the app streams valid `ObjectSchema` JSON into preview and I can save it to the library.
3. Given a prompt and context, when I run the Modelview builder, then the app returns valid `ModelviewSchema` JSON, renders a preview, and allows save.
4. Given a prompt in AI Chat, when I set model, temperature, and max tokens, then the gateway returns normalized text across providers.

### Edge Cases
- Missing/invalid API keys: routes surface actionable errors (500 with clear message).
- Provider rejects parameters (e.g., temperature): gateway helper retries without the param.
- Non‑JSON or partially streamed JSON: genmodel route cleans/repairs and falls back to minimal valid structures; clients update only when JSON validates.
- Duplicates in ontology suggestions: apply logic dedupes (case‑insensitive names; relationship triple uniqueness).
- Large outputs: previews remain responsive; graph supports zoom/pan and lasso selection.

---

## Requirements (mandatory)

### Functional Requirements
- FR-001: Provide agent pages for Domain, Ontology, Model/IRTV, Modelview, Prompt, and Chat with a consistent three‑panel layout.
- FR-002: Support free‑form text generation via `POST /api/vercel-ai/generate` with model selection, temperature, and token controls.
- FR-003: Support schema‑constrained generation via `POST /api/genmodel` targeting `OntologySchema`, `ObjectSchema`, `ModelviewSchema`, and `DomainSchema`.
- FR-004: Stream structured JSON, incrementally parse/validate, and render previews in the middle/right panels.
- FR-005: Allow saving generated artifacts to the Redux‑backed library and loading context documents.
- FR-006: Enforce ontology dedupe: concept names are case‑insensitive unique; relationships are unique by `(name, from, to)`.
- FR-007: Visualize ontology graphs with baseline vs suggestion diff, selection, filters, zoom/pan, keyboard navigation, lasso select, and SVG/PNG export.
- FR-008: Persist user settings (model, temperature, tokens) locally and restore on load.
- FR-009: Provide consistent error surfacing for 4xx/5xx and malformed provider responses.
- FR-010: Navigation exposes all agents and resources (Agents Guide, Roadmap) in the sidebar.

### Key Entities (data)
- Domain: name, description, presentation; current ontology and documents.
- Ontology: concepts (UpperCamelCase, unique) and relationships (verb‑phrase names, excluding concept names in the relationship name).
- Object/IRTV Model: objects (id, name, typeRef/proposedType, properties) and relationships.
- Modelview: objectviews and relshipviews with layout/metadata.
- Document: Markdown context saved in library; selectable per agent.
- Metamodel/Model: current model focus and metamodel selection for IRTV flows.

---

## Review & Acceptance Checklist

### Content Quality
- [x] Clear description of current capabilities and flows
- [x] Organized for non‑implementation review (what/why oriented)
- [x] All mandatory sections completed

### Requirement Completeness
- [x] Requirements are testable and unambiguous
- [x] Success criteria captured in acceptance scenarios
- [x] Scope bounded to the existing application
- [x] Dependencies/assumptions called out (endpoints, schemas, localStorage)

---

## Execution Status
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Appendix A — Agents
- Ontology Builder: Enrich and apply ontology; graph diff visualization and export.
- IRTV Builder: Generate `ObjectSchema` (IR/TV) from prompts/context; preview and save.
- Modelview Builder: Generate `ModelviewSchema` from prompts/context; preview and save.
- Domain Builder: Curate domain name/description/presentation and persist.
- Prompt Builder: Draft and reuse prompts/templates.
- AI Chat: Gateway‑based free‑form chat with model controls and templates.

## Appendix B — Endpoints & Helpers
- Gateway: `POST /api/vercel-ai/generate` — normalized provider output; helper `callGateway` retries without temperature on provider rejection.
- Genmodel: `POST /api/genmodel` — streams JSON matching a schema; helpers `callGenmodel` and `streamGenmodel` for buffered/streamed usage.
- Model mapping: `mapModelId` centralizes aliases (e.g., `gpt-4o` → `gpt-5-mini`).

## Appendix C — Visualization
- Mermaid‑based graph with selection, diff highlighting, filters (All/New/Changed), zoom/pan, keyboard navigation, lasso selection (Alt+drag), and SVG/PNG export.

## Appendix D — Safety & Guardrails
- Prompts restrict scope (ontology naming rules, uniqueness checks, relationship conventions, and required presentation block).
- Genmodel route normalizes/repairs JSON; fallbacks ensure valid structures for rendering.

```
Key file references (for maintainers):
- Ontology page: src/app/ontology-builder/page.tsx
- IRTV page: src/app/irtv-builder/page.tsx
- Ontology graph: src/components/ontology-graph.tsx
- Gateway route/helper: src/app/api/vercel-ai/generate/route.ts, src/lib/ai/generate.ts
- Genmodel route/helper: src/app/api/genmodel/route.ts, src/lib/ai/genmodel.ts
- Model mapping: src/lib/ai/modelMap.ts
- Navigation data: src/data/navigationData.ts
```

