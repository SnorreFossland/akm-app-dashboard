# AI Dashboard App Constitution

## 1. Core Principles

### 1.1 Agent-Oriented Architecture
- Each feature is an **agent** with its own Next.js route: `src/app/<agent>/page.tsx`.
- Pages assemble `ThreePanelLayout` (left/middle/right panels).
- Orchestrators mounted in `src/components/<agent>`.
- Shared infra: `DocumentPanel`, `FileOperations`, and chat infrastructure reused across agents.

### 1.2 Schema-Constrained by Default
- Primary generation: `POST /api/genmodel` targeting `OntologySchema`, `ModelviewSchema`, `ObjectSchema`, or `DomainSchema`.
- Secondary generation: `POST /api/vercel-ai/generate` for exploratory free-text only.
- All JSON validated with Zod before persistence.

### 1.3 Prompt Guardrails
- Prompts must be concise and scoped to a single artifact.
- Enforce naming and uniqueness rules.
- Domain background material lives in DocumentPanel, not in prompt body.

### 1.4 Unified Model Mapping & Endpoints
- Use `mapModelId`, `callGateway`, and `streamGenmodel`.
- Endpoints use normalized payloads/responses with consistent error codes.
- Persist `model`, `temperature`, and `tokens` in localStorage for uniform UX.

### 1.5 Persistence & Visualization
- Commit structured outputs to Redux `model-universe`.
- Deduplicate ontologies (case-insensitive concepts; unique relationship triples).
- Visualization: graph diff (new/changed), selection, zoom/pan, lasso, and export.

---

## 2. Engineering Baselines

- **Setup:** single command (`pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`).
- **Type Safety:** `pnpm typecheck` must pass.
- **Linting:** `pnpm lint` must pass; warnings justified.
- **Tests:** smoke tests for critical helpers and endpoints.
- **Validation:** schema outputs checked with Zod or snapshot.
- **Documentation:**
  - `README.md`: purpose + quickstart.
  - `docs/endpoint-contracts.md`: up-to-date endpoint contracts.
  - `docs/spec-existing-application.md`: application spec.
- **Secrets:** `.env.local.example` lists required vars; no secrets committed.
- **Error Handling:** APIs return clear JSON errors; UI surfaces actionable recovery.
- **Accessibility:** keyboard navigation and ARIA compliance.
- **Observability:** non-PII logs gated by env flags.
- **Performance:** throttle stream updates; avoid DOM runaway.

---

## 3. Spec-Driven Workflow

### 3.1 Workflow Phases
1. **Specify** → product spec defines WHAT.  
2. **Plan** → technical plan defines HOW.  
3. **Implement** → code satisfies plan.

### 3.2 Spec Files
- `.specify/product_spec.md` → scenarios, goals, acceptance criteria.
- `.specify/tech_plan.md` → data flows, endpoints, contracts, files to touch.
- `.specify/tasks.yaml` → task list with IDs, phases, and dependencies.

### 3.3 Enforcement
- CI enforces phase gates with required checks:
  - `specify:spec`
  - `specify:plan`
  - `specify:impl`
- PRs cannot merge unless all gates are green.
- Any endpoint or schema change must update `.specify/*` and `docs/endpoint-contracts.md`.

### 3.4 Ownership
- CODEOWNERS defines approvers for `.specify/*`.
- Changes to specs require approval from designated owners.

---

## 4. Development Workflow

### 4.1 Adding a New Agent
- Create `src/app/<agent>/page.tsx` using `ThreePanelLayout`.
- Create orchestrator under `src/components/<agent>/`.
- Define `prompts.ts` and `schemaName` if using genmodel.
- Wire into `src/data/navigationData.ts`.
- Update `.specify/product_spec.md`, `.specify/tech_plan.md`, and `.specify/tasks.yaml`.
- Validate outputs before commit.

### 4.2 Shared Helpers
- Always use `mapModelId`, `callGateway`, and `streamGenmodel`.

### 4.3 Error Handling & Streaming
- Surface actionable errors with codes.
- Throttle stream updates to avoid UI lockups.
- Fallback to minimal valid JSON if parse fails.

---

## 5. Governance & Compliance

- **Ratification:** Constitution is versioned.
- **Change Requirements:**
  - Update docs and specs in same PR.
  - Update tests for helpers and schemas.
  - Maintain navigation and route consistency.
  - Provide backwards-compatibility notes or migrations.
- **Amendment Log:** version/date updated at bottom on every amendment.

---

## 6. References

- Tech stack documented in `docs/tech-stack.md`.
- Spec Kit usage documented in `docs/spec-kit.md`.
- Endpoint contracts in `docs/endpoint-contracts.md`.

---

## 7. Versioning

- **Current Version:** 1.1.0  
- **Ratified:** 2025-09-22  
- **Last Amended:** 2025-09-25