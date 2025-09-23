# AI Dashboard App Roadmap

This roadmap aligns with the Agents Guide and tracks near- and mid-term work across agent UIs, endpoints, schemas, and shared infra.

## Immediate (Next 1–2 Weeks)

- [x] Route, naming, and navigation normalization
  - Modelview components renamed: `modelview-bilder` → `modelview-builder` with import fixes.
  - IRTV route renamed to lowercase; uppercase route removed; navigation updated to `/irtv-builder`.
  - Sidebar navigation verified via `src/components/nav-main.tsx`.

- [x] Consolidate model mapping and endpoints
  - Unified model-id mapping via `mapModelId` in `src/lib/ai/modelMap.ts` and gateway usage across agents.
  - Helpers in `src/lib/ai/{generate,genmodel}.ts` adopted across Chat (gateway), IRTV/Model Builder, and Ontology (Chat/Builder); Modelview Builder adoption pending.
  - Added optional `max_completion_tokens` control (Chat) and pass-through in gateway helper.

 - [x] Normalize endpoint contracts
  - Documented payload/response shapes in `docs/endpoint-contracts.md` for gateway and genmodel (streamed JSON).
  - Shared helpers (`callGateway`, `streamGenmodel`) provide uniform error surfacing; clients implement incremental parse patterns.

 - [x] Prompts and schemas
  - Co-located prompts per agent: `src/app/ontology-builder/prompts.ts`, `src/app/modelview-builder/prompts.ts`, and `src/app/irtv-builder/prompts.ts`; background remains in Document Panel context.
  - Schemas standardized in usage: `OntologySchema`, `ModelviewSchema`, `ObjectSchema`; `IRTVSchema` can be added in a future pass.

- [x] Modelview genmodel flow
  - Implemented `/api/genmodel` in `src/components/modelview-builder/ModelviewBuilder.tsx` targeting `ModelviewSchema` (uses inline streaming today; refactor to `streamGenmodel` pending).
  - Stream-parses results and previews in `src/components/modelview-builder/OutputPanel.tsx` with “Save to Library”.

- [x] IRTV builder orchestration
  - Wired `src/components/irtv-builder/IrtvBuildercomponent.tsx` to `/api/genmodel` using `ObjectSchema` via `streamGenmodel`.
  - Aligns prompts (system + behavior + user) and surfaces structured preview.

- [x] Ontology dedupe and apply
  - Implemented in `src/app/ontology-builder/page.tsx`: case-insensitive, trimmed concept dedupe and relationship uniqueness on `(name, from, to)` with normalization; replaces domain ontology to avoid duplicate appends.

 - [x] Unified UI controls
  - Standardized model and temperature controls via shared `ModelSelector` and `TemperatureSelector` in Chat, Ontology, and IRTV; Chat adds max tokens control.
  - Persist temperature in `localStorage` key `aiDashboard_temperature`.
  - Modelview Builder still uses an inline temperature control; switch to shared `TemperatureSelector` is pending.

## Near-Term (3–6 Weeks)

 - [ ] Ontology graph visualization (in progress)
  - Initial graph done and used in `src/app/ontology-builder/page.tsx`.
  - Implemented: node/edge selection + details, baseline vs suggested diff highlighting, visual selection highlighting, table row highlighting, “New Only” and “Changed Only” filters, zoom controls (+/−/fit/reset and ctrl/cmd+wheel), drag-to-pan, keyboard navigation (Tab toggles node/edge, arrows navigate), auto-fit on container resize, SVG/PNG export, deep-linked selections across graphs, multi-select mode (accumulate selections), table filtering to selection, marquee lasso selection (Alt+drag), save/load selection sets (localStorage), and export/import sets to/from JSON. Lasso hit-testing includes labels and approx midpoints.
  - Next: precise lasso hit-testing via path sampling + CTM; shareable URL encoding for selection state.

- [ ] Modelview helper adoption
  - Replace inline fetch/streaming with `streamGenmodel` and use `mapModelId` from `src/lib/ai/modelMap.ts`.

- [ ] Context library + versioning
  - Enhance `src/components/ai-chat/DocumentPanel.tsx` and FileOperations to support version history, diff, and restore.
  - Expose a changelog and quick-apply snippets to prompts.

- [ ] Persistence and conflict resolution
  - Define merge semantics for ontology/domain/modelview artifacts in Redux (model-universe slice).
  - Add “Apply suggestions” with preview and rollback.

- [ ] Validation and error handling
  - JSON schema validation before save; user-facing errors for 4xx/5xx, JSON parse failures, and rate-limit surfacing.
  - Reuse/extend patterns from `src/components/ai-chat/ChatComponent.tsx`.

- [ ] Tests (unit + integration)
  - Unit: prompt builders, model mapping, endpoint normalization, stream parser.
  - Integration: genmodel roundtrips for ontology, modelview, and IR/TV.

- [ ] Accessibility and UX polish
  - Keyboard navigation in editors, focus management during streaming, and responsive layouts in `ThreePanelLayout`.

## Agent-Specific Enhancements

- [ ] Domain Builder
  - Curate domain name/description/presentation; persist to library; preview markdown.

 - [ ] Ontology Builder
  - Enhance graph view (selection highlighting, table sync, filters); strengthen naming/uniqueness checks; improve apply/rollback.

- [ ] Modelview Builder
  - Implement schema-constrained generation; render cards/tables; save to Redux.

- [ ] IRTV Builder
  - Implement IR/TV schema generation; scenario/criteria previews; export to markdown.

- [ ] Prompt Builder
  - Template catalog with placeholders; quick insert into other agents; save/load.

## Foundations (Ongoing)

- [ ] Telemetry and logging
  - Structured logs around payloads/responses; counters for failures/timeouts.
  - Make logging consistent across agents.

- [ ] Performance and streaming UX
  - Debounce inputs, control streaming flush cadence, and limit large previews with expandable sections.

- [ ] Documentation
  - Link `agents.md` from `README.md`.
  - Add quickstart for adding a new agent with payload examples for both endpoints.

## Targeted File Touchpoints

- `src/app/Irtv-builder/page.tsx` → `src/app/irtv-builder/page.tsx`
  - Route rename and import path fixes. Update `src/data/navigationData.ts` URL.
- `src/components/modelview-bilder/*` → `src/components/modelview-builder/*`
  - Directory rename and all import updates.
- `src/components/ontology-builder/ChatComponent.tsx`
  - Reuse shared model mapping and schema request helper; align logging format.
- `src/app/ontology-builder/page.tsx`
  - Update dedupe to case-insensitive concept set and relationship triple uniqueness.
- `src/app/ontology-builder/prompts.ts`
  - Keep prompts minimal; push background into Document Panel context.
- `src/components/ai-chat/ChatComponent.tsx`
  - Reuse endpoint helper; unify temperature/token; surface rate-limits consistently.
- `src/lib/ai/{generate,genmodel}.ts`
  - New helpers wrapping gateway/genmodel with typed responses and streaming support.
- `src/components/ontology-graph.tsx`
  - Add node/edge selection callbacks and baseline-diff styling; wire to details panels in ontology page.
 - `src/components/ontology-builder/{concept-table,relship-table}.tsx`, `src/components/ontology-card.tsx`
   - Add row highlight + click-to-select to sync with graph selection; forward callbacks from OntologyCard.

## Sequencing & Acceptance

1) Route/rename + navigation pass
   - Acceptance: No broken imports; sidebar shows Domain, Ontology, Model (IR/TV), Modelview, Prompt.
2) Consolidate model mapping + endpoint helpers
   - Acceptance: All agents call a common helper and handle errors uniformly; mapping covers supported providers with tests.
3) Implement Modelview + IRTV genmodel flows
   - Acceptance: Returns parsed output; users can preview and save.
4) Dedupe + validation pass
   - Acceptance: No duplicate concepts; relationships unique by triple; schema validation blocks invalid saves.
5) Tests + docs
   - Acceptance: Green unit tests for helpers; basic integration for genmodel; README links to `agents.md` and this roadmap.

## Notes
- Prefer schema-constrained `/api/genmodel` where possible for deterministic parsing; keep `/api/vercel-ai/generate` for exploratory text.
- Keep prompts short and scoped; move background into the Document Panel to reduce token churn and increase determinism.
