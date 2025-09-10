# AI Dashboard App Roadmap

This roadmap captures the near-term and mid-term plan to evolve agents, endpoints, and shared UI/infra.

## Immediate (Next 1–2 Weeks)

- [ ] Consolidate model mapping and endpoints
  - Unify model-id mapping and gateway usage across agents.
  - Centralize map logic used in `src/components/ontology-builder/ChatComponent.tsx` and `src/components/modelview-bilder/ModelviewBuilder.tsx`.
  - Handle "Unsupported model" gracefully and standardize `max_completion_tokens` usage.

- [ ] Normalize endpoint contracts
  - Document and align payload/response shapes for `POST /api/vercel-ai/generate` and `POST /api/genmodel`.
  - Add shared helpers for buffered and streamed JSON parsing.

- [ ] Prompts and schemas
  - Co-locate prompts per agent in `prompts.ts` and keep background in context documents, not in prompts.
  - Standardize schema names with `src/modelviewSchema.ts` and `src/ontologySchema.ts`.

- [ ] Modelview genmodel flow
  - Implement `POST /api/genmodel` in `src/components/modelview-bilder/ModelviewBuilder.tsx` targeting `ModelviewSchema`.
  - Stream-parse results and preview in `src/components/modelview-bilder/OutputPanel.tsx`.

- [ ] Ontology dedupe and apply
  - In `src/app/ontology-builder/page.tsx`, replace name-only concept dedupe with case-insensitive normalization.
  - Ensure relationship uniqueness is checked on the triple `(name, source, target)` before save.

- [ ] Unified UI controls
  - Standardize model/temperature/token controls across agents using `ModelSelector` and `TemperatureSelector`.
  - Persist temperature in `localStorage` key `aiDashboard_temperature`.

## Near-Term (3–6 Weeks)

- [ ] Ontology graph visualization
  - Render nodes (concepts) and edges (relationships) for suggested and saved ontologies.
  - Highlight new vs existing; link selection to details panel (`OntologyCard`).

- [ ] Context library + versioning
  - Enhance `src/components/ai-chat/DocumentPanel.tsx` and file operations to support version history, diff, and restore.
  - Expose a changelog and quick-apply snippets to prompts.

- [ ] Persistence and conflict resolution
  - Define merge semantics for ontology/domain/modelview artifacts in Redux (model-universe slice).
  - Add “Apply suggestions” with preview and rollback of changes.

- [ ] Validation and error handling
  - JSON schema validation before save; user-facing errors for 4xx/5xx, JSON parse failures, and rate-limit surfacing.
  - Reuse/extend patterns from `src/components/ai-chat/ChatComponent.tsx`.

- [ ] Tests (unit + integration)
  - Unit: prompt builders, model mapping, endpoint response normalization.
  - Integration: genmodel roundtrips for each schema (ontology, modelview, ir/tv).

- [ ] Navigation & naming
  - Normalize folder naming `modelview-bilder` → `modelview-builder` and fix imports.
  - Ensure all agents have explicit entries in `src/components/nav-main.tsx`.

## Foundations (Ongoing)

- [ ] Telemetry and logging
  - Structured `console.group` logs around payloads/responses; counters for failures/timeouts.
  - Make logging consistent across agents (see `ChatComponent.tsx` patterns).

- [ ] Performance and UX
  - Debounce inputs, control streaming flush cadence, limit large previews with expandable sections.
  - Keep layout responsive; avoid scroll-jank by reserving input bar height dynamically (pattern already used in ontology builder).

- [ ] Documentation
  - Link `agents.md` from `README.md`.
  - Add quickstart for adding a new agent, with payload examples for both endpoints.

## Targeted File Touchpoints

- `src/components/modelview-bilder/ModelviewBuilder.tsx`
  - Add `/api/genmodel` flow for `ModelviewSchema`, streaming parser, and error handling.
- `src/components/modelview-bilder/OutputPanel.tsx`
  - Render typed preview; provide "Save to Library" action.
- `src/components/ontology-builder/ChatComponent.tsx`
  - Reuse shared model mapping and schema request helper; align logging format.
- `src/app/ontology-builder/page.tsx`
  - Update dedupe to case-insensitive concept set and relationship triple uniqueness.
- `src/app/ontology-builder/prompts.ts`
  - Keep prompts minimal, push background into Document Panel context.
- `src/components/ai-chat/ChatComponent.tsx`
  - Reuse endpoint helper; unify temperature/token; surface rate-limits consistently.

## Sequencing & Acceptance

1) Consolidate model mapping + endpoint helpers
   - Acceptance: All agents call a common helper and handle errors uniformly; mapping covers supported providers with tests.
2) Implement Modelview genmodel flow
   - Acceptance: Returns parsed modelview output; user can preview and save.
3) Dedupe + validation pass
   - Acceptance: No duplicates on concepts; relationships unique by triple; schema validation prevents invalid save.
4) Navigation + naming normalization
   - Acceptance: No broken imports; sidebar shows all agents.
5) Tests + docs
   - Acceptance: Green unit tests for helpers; basic integration for genmodel; README links to `agents.md` and this roadmap.

## Notes
- Prefer schema-constrained `/api/genmodel` where possible for deterministic parsing, but keep `/api/vercel-ai/generate` for exploratory text.
- Keep prompts scoped; move most context into the Document Panel to reduce token churn and increase determinism.

