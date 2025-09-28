## Summary
- Problem:
- Scope:
- Related Issue(s): #<id>

## Spec Mapping
- Product Spec Section: `.specify/product_spec.md#<section>`
- Tech Plan Section: `.specify/tech_plan.md#<section>`
- Tasks: `.specify/tasks.yaml` → IDs: [ <TASK-ID-1>, <TASK-ID-2> ]

## Changes
- Modules Touched:
  - `src/...`
  - `src/...`
- Endpoints/Schemas:
  - Endpoint(s): `/api/...` (request/response shape)
  - Schema(s): `OntologySchema | ModelviewSchema | ObjectSchema | DomainSchema` (what changed and why)

## Acceptance Criteria
- User-visible outcomes confirmed against Product Spec acceptance criteria.
- Edge cases verified (list).

## Tests
- Unit: list files.
- Integration/Contract: list files.
- UI smoke: scenarios covered.
- Snapshots/Zod validation updated where applicable.

## Risks and Mitigations
- Risk:
- Mitigation:

## Backwards Compatibility / Migration
- Breaking change: yes/no
- Migration steps or fallback behavior:

## Documentation
- Updated:
  - `docs/endpoint-contracts.md` (if any API shape changed)
  - `docs/spec-kit.md` (if workflow changed)
  - `docs/tech-stack.md` (if stack changed)

## CI Status (must be green before merge)
- [ ] `specify:spec`
- [ ] `specify:plan`
- [ ] `specify:impl`
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`

## Checklist
- [ ] `.specify/product_spec.md` updated where required
- [ ] `.specify/tech_plan.md` updated where required
- [ ] `.specify/tasks.yaml` includes new or updated tasks
- [ ] Error messages are actionable and coded
- [ ] Accessibility: keyboard focus and ARIA labels verified
- [ ] Observability: no PII in logs; guarded by env flags
- [ ] Performance: streaming throttled; no runaway DOM growth

## Reviewer Notes
- How to validate locally:
  ```bash
  pnpm install
  pnpm typecheck && pnpm lint && pnpm test
  pnpm spec:spec && pnpm spec:plan && pnpm spec:impl