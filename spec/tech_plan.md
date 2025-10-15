# Technical Plan

## Meta
- Project: AI Dashboard
- Agent: ontology
- Phase: plan
- This document governs HOW. It must satisfy `product_spec.md`.

## Architecture
- Next.js App Router.
- Page: `src/app/ontology-builder/page.tsx` using `ThreePanelLayout`.
- Orchestrator: `src/components/ontology/Orchestrator.tsx`.
- Shared panels: `DocumentPanel`, `FileOperations`.
- State: Redux slice `model-universe`.

## Data Flow
1. User edits Document Panel.
2. Orchestrator calls `streamGenmodel` with `mapModelId(model)` and `schemaName="OntologySchema"`.
3. Stream validated incrementally; UI shows diff; throttle updates.
4. On success, commit to `model-universe` with ontology dedupe.
5. Graph view renders with zoom/pan/lasso.

## Endpoints
### POST `/api/genmodel`
- Request:
  - `modelId: string`
  - `schemaName: "OntologySchema"`
  - `prompt: string`
  - `temperature?: number`
  - `maxTokens?: number`
- Response:
  - `data: OntologySchema`
  - `usage: { promptTokens: number; completionTokens: number }`
  - `error?: { code: string; message: string }`

### POST `/api/vercel-ai/generate` (fallback)
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
- `src/app/ontology/page.tsx`
- `src/components/ontology/Orchestrator.tsx`
- `src/schemas/ontology.ts`
- `src/store/modelUniverseSlice.ts`
- `docs/endpoint-contracts.md` (amend if shape changes)

## Test Plan
- Unit: `mapModelId`, `callGateway`, `streamGenmodel`.
- Contract: zod parse success/failure cases.
- UI smoke: render page, run keyboard nav, simulate stream.

## Rollback
- Feature flag `FEATURE_ONTOLOGY_AGENT`.