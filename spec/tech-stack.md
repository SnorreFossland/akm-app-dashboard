# Tech Stack

This document captures the **current technology baseline** for the AI Dashboard App.  
It is referenced in `constitution.md` but is **not constitutional**.  
Changes here do not require constitutional amendments, but every change must update this file and ensure corresponding tests/docs are aligned.

---

## 1. Frameworks and Runtime
- **Next.js (App Router)**  
  - Routing and server components.  
  - Agent pages live under `src/app/<agent>/page.tsx`.  

- **React 18**  
  - UI rendering.  
  - Client components where interactivity is required.  

- **TypeScript**  
  - Full type safety enforced.  
  - `pnpm typecheck` must pass before merge.  

---

## 2. State Management
- **Redux Toolkit**  
  - Centralized state for agents.  
  - Slice: `model-universe` for ontology and schema artifacts.  
  - Persistence configured where structured outputs are committed.  

---

## 3. UI Library
- **ShadCN UI**  
  - Shared components: panels, buttons, dialogs, inputs.  
  - Style consistency across agents.  
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
- **React Flow or D3 (TBD by implementation)**  
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