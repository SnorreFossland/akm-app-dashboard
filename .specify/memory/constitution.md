# AI Dashboard App Constitution
<!-- Codifies architectural principles from agents.md and shared infra. -->

## Core Principles

### I. Agent‑Oriented Architecture
Each feature surfaces as an agent with a dedicated Next.js route under `src/app/<agent>/page.tsx`. Pages assemble left/middle/right panels, wire state, and mount orchestrator components. Reuse shared chat infrastructure and shared panels across agents to ensure consistency.
<!-- Derived from agents.md: UI layer per agent, shared chat infra, shared panels. -->

### II. Schema‑Constrained by Default
Prefer schema‑constrained generation via `POST /api/genmodel` targeting `OntologySchema`, `ModelviewSchema`, `ObjectSchema`, or `DomainSchema` for deterministic parsing and validation. Use gateway text generation (`POST /api/vercel-ai/generate`) only for exploratory text.
<!-- Derived from agents.md: prefer /api/genmodel, deterministic parsing. -->

### III. Prompt Guardrails & Scope
Prompts must be concise, scoped to the artifact, and enforce naming/uniqueness rules (e.g., ontology naming conventions, relationship triplets). Move background/domain material into the Document Panel rather than the prompt body.
<!-- Derived from agents.md: Prompt conventions and tips. -->

### IV. Unified Model Mapping & Endpoints
Use centralized model mapping (`mapModelId`) and shared helpers (`callGateway`, `streamGenmodel`). Maintain normalized endpoint payloads/responses with consistent error surfacing. Persist model/temperature/tokens in localStorage for a uniform UX.
<!-- Derived from agents.md + docs/endpoint-contracts.md. -->

### V. Persistence & Visualization
Persist structured outputs into the Redux model‑universe slice when appropriate. Apply ontology dedupe on commit (case‑insensitive concept uniqueness; relationship triple uniqueness). Visualize ontologies with graph diff (new/changed), selection, zoom/pan, lasso, and export.
<!-- Derived from agents.md and roadmap. -->

## Bare Minimum Requirements

- Single-command setup and run
  - Provide `pnpm install`, `pnpm dev`, `pnpm build`, and `pnpm test` scripts in `package.json`.

- Type-safety and linting
  - `pnpm typecheck` passes (`tsc --noEmit`).
  - `pnpm lint` passes with no errors; warnings triaged or justified.

- Tests present and runnable
  - At least smoke tests for critical helpers and endpoints (e.g., `mapModelId`, `callGateway`, `streamGenmodel`, `/api/genmodel`).
  - Schema outputs validated by shape (zod) or snapshot where appropriate.

- Documentation essentials
  - README includes purpose and Quickstart (install, run, test).
  - Endpoint contracts maintained in `docs/endpoint-contracts.md`.
  - Application spec maintained in `docs/spec-existing-application.md`.

- Secrets and configuration
  - `.env.local` template lists required keys; no secrets committed to VCS.
  - Server-only keys referenced server-side; never exposed to client bundles.

- Error handling baseline
  - API routes return clear 4xx/5xx JSON errors with actionable messages.
  - UI surfaces errors succinctly with recovery tips.

- Accessibility basics
  - Keyboard navigation works for interactive controls; labels/roles provided as needed.

- Observability/dev logging
  - Non-PII logs behind env flags for server routes; avoid leaking secrets.

- Performance/UX minima
  - Streaming UIs throttle updates to remain responsive; avoid runaway DOM growth.

- Governance coupling
  - Changes to endpoints or schemas must update related docs and tests in the same PR.

## Additional Constraints
1. Shared Panels & Controls
   - Use `DocumentPanel`, `FileOperations`, and `ThreePanelLayout` for consistency.
2. Model Controls
   - Expose model selection (e.g., `gpt-5-mini`, `mistral`, `deepseek-chat`), temperature, and tokens in agent UIs.
3. Endpoint Contracts
   - Follow `docs/endpoint-contracts.md` for payload/response shapes. Update docs on contract changes.
4. Navigation
   - Add new agents to `src/data/navigationData.ts` and ensure route naming normalization (lowercase, kebab‑case).
5. Safety
   - Keep prompts aligned with artifact scope; prefer structured generation; validate JSON (zod) before save.

## Development Workflow
1) Add a New Agent
   - Create `src/app/<agent>/page.tsx` using `ThreePanelLayout`.
   - Create orchestrator under `src/components/<agent>/` to call gateway or genmodel.
   - Define `prompts.ts` and `schemaName` when using genmodel.
   - Wire navigation in `navigationData.ts`.
   - Decide persistence and preview format; validate outputs before commit.
2) Adopt Shared Helpers
   - Use `mapModelId`, `callGateway`, and `streamGenmodel` consistently.
3) Error Handling & Streaming
   - Surface actionable errors; throttle streamed UI updates; fall back to minimal valid JSON where necessary.

## Governance
The constitution codifies agent architecture and shared infra. Changes to endpoints, schemas, or prompts must include:
- Updated docs (`agents.md`, `docs/endpoint-contracts.md`, relevant specs)
- Updated tests for helpers and schema validation
- Navigation and route consistency checks
- Backwards‑compatibility notes or migration steps when applicable

**Version**: 1.0.0 | **Ratified**: 2025-09-22 | **Last Amended**: 2025-09-22
<!-- Keep dates in ISO format (YYYY-MM-DD). -->
