+ cat
+ printf


%s


## Immediate (extracted from ROADMAP)
+ cat
/var/folders/2j/rvtm6ghd6tz75bl7kf6zfssr0000gn/T/tmp.AMaMergZPv
+ cat
/var/folders/2j/rvtm6ghd6tz75bl7kf6zfssr0000gn/T/tmp.qqLiZ0nhZh
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
  - Wired `src/components/model-builder/ModelBuilder.tsx` to `/api/genmodel` using `ObjectSchema` via `streamGenmodel`.
  - Aligns prompts (system + behavior + user) and surfaces structured preview.

- [x] Ontology dedupe and apply
  - Implemented in `src/app/ontology-builder/page.tsx`: case-insensitive, trimmed concept dedupe and relationship uniqueness on `(name, from, to)` with normalization; replaces domain ontology to avoid duplicate appends.

 - [x] Unified UI controls
  - Standardized model and temperature controls via shared `ModelSelector` and `TemperatureSelector` in Chat, Ontology, and IRTV; Chat adds max tokens control.
  - Persist temperature in `localStorage` key `aiDashboard_temperature`.
  - Modelview Builder still uses an inline temperature control; switch to shared `TemperatureSelector` is pending.

## Near-Term (3–6 Weeks)

 - [x] Ontology graph visualization (in progress)
  - Initial graph done and used in `src/app/ontology-builder/page.tsx`.
  - Implemented: node/edge selection + details, baseline vs suggested diff highlighting, visual selection highlighting, table row highlighting, “New Only” and “Changed Only” filters, zoom controls (+/−/fit/reset and ctrl/cmd+wheel), drag-to-pan, keyboard navigation (Tab toggles node/edge, arrows navigate), auto-fit on container resize, SVG/PNG export, deep-linked selections across graphs, multi-select mode (accumulate selections), table filtering to selection, marquee lasso selection (Alt+drag), save/load selection sets (localStorage), and export/import sets to/from JSON. Lasso hit-testing includes labels and approx midpoints.

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
