# AI Dashboard App Roadmap

This roadmap aligns with the Agents Guide and tracks near- and mid-term work across agent UIs, endpoints, schemas, and shared infra.

## Immediate (Next 1–2 Weeks)

- [ ] Route, naming, and navigation normalization
  - Rename `src/app/Irtv-builder` → `src/app/irtv-builder` and update references.
  - Rename `src/components/modelview-bilder` → `src/components/modelview-builder` and fix imports in `src/app/modelview-builder/page.tsx`.
  - Update `src/data/navigationData.ts` to use lowercase `"/irtv-builder"` and verify all sidebar links render via `src/components/nav-main.tsx`.

- [ ] Consolidate model mapping and endpoints
  - Unify model-id mapping (`aiModelName`) and gateway usage across agents.
  - Extract helpers in `src/lib/ai/{generate,genmodel}.ts` to wrap `POST /api/vercel-ai/generate` and `POST /api/genmodel` with consistent request/response handling.
  - Handle unsupported models gracefully; standardize `max_completion_tokens` usage.

- [ ] Normalize endpoint contracts
  - Document payload/response shapes for gateway and genmodel (buffered + streamed JSON).
  - Add shared streamed-JSON parsing with backpressure and error surfacing.

- [ ] Prompts and schemas
  - Co-locate prompts per agent in `prompts.ts` and keep background in Document Panel context.
  - Standardize schema names: `OntologySchema`, `ModelviewSchema`, and `IRTVSchema`.

- [ ] Modelview genmodel flow
  - Implement `/api/genmodel` in `src/components/modelview-bilder/ModelviewBuilder.tsx` targeting `ModelviewSchema`.
  - Stream-parse results and preview in `src/components/modelview-bilder/OutputPanel.tsx` with “Save to Library”.

- [ ] IRTV builder orchestration
  - Wire `src/components/irtv-builder/IrtvBuildercomponent.tsx` to `/api/genmodel` using the project’s IR/TV schema.
  - Align prompts (system + behavior + user) and surface structured preview.

- [ ] Ontology dedupe and apply
  - In `src/app/ontology-builder/page.tsx`, replace name-only dedupe with case-insensitive normalization.
  - Ensure relationship uniqueness by triple `(name, source, target)` prior to save.

- [ ] Unified UI controls
  - Standardize model/temperature/token controls via shared components.
  - Persist temperature in `localStorage` key `aiDashboard_temperature`.

## Near-Term (3–6 Weeks)

- [ ] Ontology graph visualization
  - Render nodes (concepts) and edges (relationships) for suggested and saved ontologies.
  - Highlight new vs existing; link selection to detail panels.

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
  - Strengthen naming/uniqueness checks; add graph view; improve apply/rollback.

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
