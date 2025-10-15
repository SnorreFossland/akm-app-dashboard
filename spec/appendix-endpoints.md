+ cat
+ printf


%s


## Endpoint Contracts (migrated)


## Endpoint Contracts (migrated)

+ cat
spec/endpoint-contracts.md
# Endpoint Contracts

This document describes the normalized request/response shapes used by the AI endpoints and the shared helpers.

## Gateway Text Generation
- Route: `POST /api/vercel-ai/generate`
- Helper: `callGateway(payload)` from `src/lib/ai/generate.ts`

Request
- `prompt: string` — Fully constructed prompt text
- `model: string` — Mapped model id (via `mapModelId`)
- `temperature?: number` — Optional
- `max_completion_tokens?: number` — Optional cap for completion size

Response (normalized by the route and helper)
- Returns `string` content from common provider shapes (Vercel AI, OpenAI-like, etc.).
- The helper retries without `temperature` when providers reject that param.

## Schema-Constrained Generation
- Route: `POST /api/genmodel`
- Helper: `streamGenmodel(payload, onChunk)` from `src/lib/ai/genmodel.ts`

Request
- `aiModelName: string` — Mapped model id (via `mapModelId`)
- `schemaName: 'OntologySchema' | 'ModelviewSchema' | 'ObjectSchema'` — Supported schemas
- `systemPrompt?: string` — System instructions
- `developerPrompt?: string` — Behavior guidelines / development-time constraints
- `userPrompt?: string` — User instructions and context (merged where applicable)

Streaming Response
- Body streams a single JSON object. The helper:
  - Calls `onChunk(text)` as raw text arrives
  - Returns the final concatenated JSON string

Client Parsing Pattern
- Accumulate text, attempt `JSON.parse` opportunistically, validate via zod schema (`OntologySchema`, `ModelviewSchema`, `ObjectSchema`), and update preview incrementally when valid.
- On final completion, parse + validate again before commit.

## Model Mapping
- Use `mapModelId(id)` from `src/lib/ai/modelMap.ts` across agents.
- Maps common aliases (e.g., `gpt-4o`) to supported ids (e.g., `gpt-5-mini`) and falls back safely.

## Error Surfacing
- Gateway: helper throws with HTTP status + text; caller displays user-facing message.
- Genmodel: helpers throw on non-OK; callers show actionable messages. Providers that don’t stream return full JSON; route ensures a well-formed JSON body.

