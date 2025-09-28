# Product Spec

## Meta
- Project: AI Dashboard
- Agent: ontology
- Phase: spec
- Source of truth: This document governs WHAT. See `tech_plan.md` for HOW.

## Problem Statement
Users need deterministic generation and visualization of ontologies inside a three-panel agent UI.

## Goals
1. Generate ontology JSON conforming to `OntologySchema`.
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
- Tasks: `./tasks.yaml#ontology`