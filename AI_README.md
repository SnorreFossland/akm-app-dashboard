# AI Features — akm-app-dashboard

This document explains the AI capabilities inside this repository, how to run them locally, how the AI-related pieces are organized, and how to extend or debug AI integrations.

## Goal

Provide a concise, developer-focused reference for the repository's AI-related features (chat, prompt builder, model integrations, streaming endpoints, and front-end components), plus clear setup and extension instructions.

## Quick overview

- Project: `akm-app-dashboard` (AI dashboard to author prompts, models, and interact with AI-driven features).  
- Main AI features found in the codebase:
  - Prompt builder UI (`components/prompt-builder`, `src/app/prompt-builder`)  
  - Chat and streaming UI (`src/app/ai-chat`, `src/app/streaming`)  
  - Model & prompt generation endpoints (`src/app/api/*`, `src/api/*`)  
  - Vercel/Next AI integrations (`vercel-ai` area / server logic)

Note: paths above are indicative — search for `prompt-builder`, `ai-chat`, `vercel-ai` and `model-builder` if you need the exact files.

## Contract (AI endpoints)

- Input: usually a JSON body with `prompt` (string), optional `model` (string), and `context` / `options` (object).  
- Output: JSON with `text` or `choices` (array), `usage` (optional), and `meta` (status, model used).  
- Error modes: missing/invalid API key (401), rate limits (429), model errors (500). Always surface error message and HTTP status.

Edge cases to watch for:
- Empty prompt or prompts exceeding model token limits.  
- Slow/partial streaming responses (connection interruptions).  
- Unauthorized calls due to missing API keys.  
- Large context objects causing performance/regression.

## Environment / secrets

Put local secrets into `.env.local` (not checked into git). Typical vars used by the project:

- `OPENAI_API_KEY` — OpenAI API key (if using OpenAI)  
- `VERCEL_AI_KEY` or `VERCEL_AI_TOKEN` — Vercel AI service token if used  
- `NEXT_PUBLIC_API_BASE` — base URL for front-end API calls (optional)  
- `NEXT_PUBLIC_VERCEL_AI` — if front-end needs a public flag (optional)

Example `.env.local` (do not commit):

```
OPENAI_API_KEY=sk-xxx
VERCEL_AI_KEY=vercel-xxx
NEXT_PUBLIC_API_BASE=http://localhost:3000
```

Search the codebase for `process.env.` references to find additional variables required by specific features.

## Local development

We assume `pnpm` (present in this repo) is the package manager. Replace with `npm` or `yarn` if you prefer.

1. Install dependencies

```bash
pnpm install
```

2. Add `.env.local` with the variables above.

3. Start dev server

```bash
pnpm dev
```

4. Run tests

```bash
pnpm test
```

If `pnpm` isn't available, install it or use `npm install` then `npm run dev`.

## How AI is wired (high-level)

- Front-end components call local API routes (under `src/app/api` or `src/pages/api`) — these routes handle authentication with the external AI provider and proxy requests.
- Prompt builder UI composes prompts and stores templates in the app state or local storage.  
- Model builder/management pages allow switching model settings or selecting provider-specific parameters.  

When adding a new AI provider or model, implement a small adapter in the server layer that:
1. Validates input and required env vars.  
2. Maps internal request shape to provider API.  
3. Normalizes response into the repository's output contract.  

## Adding a new model/provider (practical steps)

1. Create a provider adapter file under `src/lib` or `src/server` (e.g. `src/lib/aiProviders/openai.ts`).  
2. Implement functions: `sendPrompt(prompt, options)`, `streamResponse(stream, options)` if streaming is needed.  
3. Wire the adapter in the API route handling AI requests.  
4. Add tests for the adapter (happy path + auth/failure).  
5. Update UI dropdowns or settings so users can select the provider/model.

## Tests and QA

- Unit tests: repository uses Jest (`jest.config.js`). Look under `components/prompt-builder/PromptBuilder.test.tsx` as an example.  
- Add tests for API adapters (mocking HTTP calls) and for prompt generation logic.

## Troubleshooting

- 401 / missing key: ensure `.env.local` is present and `OPENAI_API_KEY` (or provider key) is set.  
- Slow responses: check provider rate limits and consider adding retries/backoff.  
- Streaming not working: confirm server route uses `event-stream`/SSE or `fetch` streaming and front-end handles chunked data.

## Developer notes & suggestions

- Keep adapters small and pure — side effects (metrics, logging) should be separate.  
- Normalize provider responses so UI code doesn't need provider-specific handling.  
- Add request/response logging in development only to make debugging easier (sanitize tokens).

## Where to look first in this repo

- `components/prompt-builder` — prompt UI and tests  
- `src/app/ai-chat` — chat interface  
- `src/app/streaming` — streaming examples  
- `src/app/api` — API routes that proxy to AI providers  

## Next Steps I can help with

- Wire a new provider adapter (OpenAI / Anthropic / Vercel AI) and add example integration.  
- Add automated tests for AI adapters and CI checks.  
- Generate a short developer onboarding doc or slide deck.

If you'd like, I can commit a small example OpenAI adapter and an accompanying test next — tell me which provider you prefer.

---

File created by AI assistant on request. If you'd like this merged into the main `README.md` or moved to a different location, say so and I will update it.
