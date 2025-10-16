# Technical Plan

## Meta
- Project: AI Dashboard
- Module: ai-chat
- Phase: plan
- This document governs HOW. It must satisfy `product_spec.md`.

## Architecture
- Next.js App Router.
- Page: `src/app/ai-chat/page.tsx` using `ThreePanelLayout`.
- Shared panels: `DocumentPanel`, `FileOperations`.
- State: Redux slice `model-universe`.

## Data Flow
1. User edits Document Panel.
2. Orchestrator calls `streamGenmodel` with `mapModelId(model)` and `schemaName="OntologySchema"`.
3. Stream validated incrementally; UI shows diff; throttle updates.
4. Graph view renders mermaid

## Endpoints
### POST `/api/genmodel`
- Request:
  - `modelId: string`
  - `schemaName: "OntologySchema"`
  - `prompt: string`
  - `temperature?: number`
  - `maxTokens?: number`
- Response:
  - `data: ModelSchema`
  - `usage: { promptTokens: number; completionTokens: number }`
  - `error?: { code: string; message: string }`

### POST `/api/vercel-ai/generate`
- Request:
  - `modelId: string`
  - `prompt: string`
- Response:
  - `data: string` (exploratory text only)

## Validation
- Zod schemas in `src/schemas/ontology.ts`.
- Streaming validator: accumulate chunks; on parse error, surface minimal valid JSON fallback and error toast.

## Error Handling
- API returns JSON errors with `code` and actionable `message`.
- UI maps:
  - `SCHEMA_INVALID` → “Output did not match OntologySchema. Review input or lower temperature.”
  - `RATE_LIMIT` → “Too many requests. Retry in 30s.”

## Observability
- Server logs behind `LOG_NON_PII=true`.
- No prompt payloads persisted.

## Performance
- Stream throttle 50–120 ms.
- DOM virtualization for lists > 100 items.
- Graph renderer avoids O(n²) layout paths.

## Security
- Server-only keys read server-side.
- `.env.local.example` lists required vars.

## Contracts Reference
- Keep `docs/endpoint-contracts.md` synchronized with the above shapes.

## Files to Touch


## Test Plan

## Rollback

# Tech Stack

This document captures the **current technology baseline** for the AI Dashboard App.  
It is referenced in `constitution.md` but is **not constitutional**.  
Changes here do not require constitutional amendments, but every change must update this file and ensure corresponding tests/docs are aligned.

---

## 1. Frameworks and Runtime
- **Next.js (App Router)**  
  - Routing and server components.  
  - Module pages live under `src/app/<module>/page.tsx`.  

- **React 18**  
  - UI rendering.  
  - Client components where interactivity is required.  

- **TypeScript**  
  - Full type safety enforced.  
  - `pnpm typecheck` must pass before merge.  

---

## 2. State Management
- **Redux Toolkit**  
  - Centralized state for modules.  
  - Slice: `model-universe` for ontology and schema artifacts.  
  - Persistence configured where structured outputs are committed.  

---

## 3. UI Library
- **ShadCN UI**  
  - Shared components: panels, buttons, dialogs, inputs.  
  - Style consistency across modules.  
  - Accessible by default with ARIA roles/labels.  

---

## 4. Schema Validation
- **Zod**  
  - Runtime schema validation for generated JSON.  
  - Used for `OntologySchema`, `ModelviewSchema`, `ObjectSchema`, `DomainSchema`.  
  - Enforces type safety beyond TypeScript’s static checks.  

---

## 5. Package Manager & Tooling
- **pnpm**  
  - Dependency management.  
  - Scripts:
    - `pnpm install`
    - `pnpm dev`
    - `pnpm build`
    - `pnpm test`
    - `pnpm typecheck`
    - `pnpm lint`

- **ESLint + Prettier**  
  - Code quality and formatting.  
  - Zero errors tolerated; warnings triaged or justified.  

- **Vitest / Jest** (choose one per repo standard)  
  - Unit and integration tests.  
  - Smoke tests for helpers and endpoints.  

---

## 6. Visualization
- **Mermaid**  
  - Graph diff and ontology visualization.  
  - Features: zoom/pan, lasso select, highlighting, and export.  

---

## 7. Infrastructure and Config
- **Environment Configuration**  
  - `.env.local.example` lists all required keys.  
  - Secrets never committed to VCS.  

- **Spec Kit**  
  - `.specify/` folder defines product specs, technical plans, and tasks.  
  - CI gates enforce `specify:spec`, `specify:plan`, and `specify:impl`.  

---

## 8. Observability
- **Logging**  
  - Non-PII logs gated by `LOG_NON_PII=true`.  
  - Errors surfaced with actionable codes/messages.  

---

## 9. Performance
- **Streaming**  
  - `streamGenmodel` with throttled UI updates (50–120 ms).  
  - Prevent runaway DOM growth.  

---

## 10. Governance
- This file must be updated whenever frameworks, state managers, UI kits, or schema validators change.  
- Updates require corresponding test coverage and documentation.  
- Reviewers verify this file stays aligned with implementation.  