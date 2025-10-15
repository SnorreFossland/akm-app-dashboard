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
