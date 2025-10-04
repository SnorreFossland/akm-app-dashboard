# Agents Guide

This document explains how "agents" are structured and used in this app, and how to build new ones quickly and safely.

## Overview
- Purpose: Task-focused UIs that orchestrate LLMs to produce structured artifacts (domain writeups, ontologies, model views, IR/TV specs, prompts) with shared chat tooling.
- Primary agents:
  - **Ontology Builder** (`/ontology-builder`): Simplified agent with Domain Description + Project Plan tabs (left), Current Ontology chat (middle), and ontology preview (right). Floating "Open AI Assistant" button navigates to full-featured agent.
  - **Ontology Builder AI Assistant** (`/ontology-builder/aiAssistant`): Full-featured agent with Current Domain, Current Ontology, Add. Context tabs (left), AI Ontology Chat (middle), and Suggested Ontology with graph controls (right). Supports multi-select, filters, graph modals, and selection sets.
  - Domain Builder: Curates domain name/description/presentation and supporting docs.
  - Modelview Builder: Produces schema-constrained model views from prompts and context.
  - IRTV Builder: Builds IR/TV structures similarly via the genmodel endpoint.
  - Prompt Builder: Iterates on reusable prompts/templates.
  - AI Chat (shared): Generic chat with model selection, streaming, document context.

## Architecture
- UI layer (pages): Each agent has its own Next.js route under `src/app/<agent>/page.tsx` to assemble panels, wire state, and mount the agent component(s).
- Orchestrator components:
  - Ontology agent: `src/components/ontology-builder/ChatComponent.tsx` issues two kinds of calls:
    - Free-form generation via gateway: `POST /api/vercel-ai/generate` (normalization of output text/choices).
    - Schema-constrained generation: `POST /api/genmodel` with prompts + context to get JSON adhering to a target schema (e.g., `OntologySchema`).
  - Modelview + others follow a similar pattern: UI collects prompt, temperature, max tokens, and context → call `/api/genmodel` and parse streamed or buffered JSON into UI state.
- Shared chat infra: `src/components/ai-chat/ChatComponent.tsx` implements message history, streaming handling, gateway fallback, model/temperature controls, and document-context injection.
- Shared panels & controls:
  - `src/components/ai-chat/DocumentPanel.tsx`: edit/attach Markdown context.
  - `src/components/FileOperations.tsx`: load/save files and library integration.
  - `src/components/ThreePanelLayout.tsx`: left/middle/right layout used across agents. Supports both tab objects (`{ tabs: [...], defaultTab: '...' }`) and plain JSX (React.ReactNode) for panels.
- Prompts & guardrails (ontology): `src/app/ontology-builder/prompts.ts` defines system prompt, behavior guidelines, and user prompt scaffolding used by the genmodel calls.

## Ontology Builder Agents

### Simplified Agent (`/ontology-builder`)
- **Purpose:** Quick access to domain description editing and project plan management with basic ontology chat.
- **Left panel:** Two tabs — "Domain Description" (edits `domain.presentation` in Redux) and "Project Plan" (Redux-backed `project-plan` document via `saveMarkdownDocument`).
- **Middle panel:** Plain JSX for "Current Ontology" chat (no tabs). Uses `ChatComponent` with `projectContent` as context.
- **Right panel:** Plain JSX for ontology preview via `OntologyCard`.
- **Floating buttons:**
  - "Open AI Assistant" → navigates to `/ontology-builder/aiAssistant` (full-featured agent).
  - "Edit Document" → opens left panel (user clicks Project Plan tab).
- **State management:** Local state for `projectDocId`/`projectContent`, Redux for domain and documents.

### Full-Featured Agent (`/ontology-builder/aiAssistant`)
- **Purpose:** Advanced ontology building with graph visualization, multi-select, filters, and selection sets.
- **Left panel:** Three tabs — "Current Domain", "Current Ontology" (with graph modal), "Add. Context" (DocumentPanel).
- **Middle panel:** Multiple tabs — "Current Ontology", "AIOB_old", "AIOC tmp" (experimental).
- **Right panel:** "Suggested Ontology" tab with graph controls (single/multi-select, filter to selection, open graph modal, save/load/export/import selection sets).
- **Graph modals:** Left and right panels can open full-screen graph modals with zoom/pan, lasso selection, and detail views.
- **Selection sets:** Persist concept/relationship selections to localStorage, export/import as JSON.
- **Floating buttons:** "Open AI Assistant" (modal), "Edit Document" (opens left panel + switches to Project tab).
- **State management:** Complex state for graph selections, filters, multi-select, saved sets, and modal visibility.

## Key Endpoints
- Gateway text generation: `POST /api/vercel-ai/generate`
  - Request: `{ prompt: string, model: string, temperature?: number, max_completion_tokens?: number }`
  - Response: Normalized to provide assistant content from a variety of provider shapes.
- Schema-constrained generation: `POST /api/genmodel`
  - Typical payload (example for ontology):
    - `aiModelName`: mapped model id (e.g., `gpt-5-mini`, `mistral`, `deepseek-chat`).
    - `schemaName`: target schema ID (e.g., `OntologySchema`).
    - `systemPrompt`, `systemBehaviorGuidelines`, `userPrompt`: curated prompt set.
    - `userInput`: user’s instruction/topic.
    - `contextItems`: Markdown context from Document Panel.
    - Optional: `contextOntology`, `contextMetamodel` for alignment.
  - Response: JSON (streamed or buffered) with typed fields consumed by the agent UI.

## Prompt Conventions (Ontology)
- System prompt: Expert role, narrow scope, and explicit “no domain advice” guidance.
- Behavior guidelines: Naming rules, uniqueness checks, relationship conventions, and required presentation block.
- User prompt: Validation rules and JSON output contract.
- Location: `src/app/ontology-builder/prompts.ts:1` for system message, further exports for behavior and user prompts.

## State & Data Flow
- Agents keep local UI state (prompt, temperature, tokens, progress) and may persist outputs into the Redux model-universe slice when appropriate (e.g., saving suggested ontology to library).
- Example: Ontology builder holds `suggestedOntologyData`, validates uniqueness, then dispatches to store for persistence and preview.
- **Project Plan persistence:** Both ontology agents use `saveMarkdownDocument(doc)` to create/update the Redux-backed `project-plan` document. The document is found/created on mount via `documents.find(d => d.type === 'project-plan')`.

## Adding a New Agent
1) Create a route:
   - Add `src/app/<agent-name>/page.tsx` using `ThreePanelLayout` with left (context), middle (chat/generation), and right (preview) panels.
2) Create an orchestrator component:
   - Under `src/components/<agent-name>/`, build a React component that collects prompt + parameters and calls `/api/vercel-ai/generate` for free-form text or `/api/genmodel` for structured output.
3) Reuse shared panels:
   - Use `DocumentPanel` for Markdown context, and `FileOperations` for file/library actions.
4) Define prompts & schema:
   - Add a `prompts.ts` alongside the page if the agent needs role/guideline/user scaffolding.
   - If using `/api/genmodel`, define `schemaName` and ensure the UI can parse/validate the JSON it returns.
5) Navigation:
   - Add a link in `src/components/nav-main.tsx` so the agent is reachable in the sidebar.
6) Persistence & preview:
   - Decide what to persist in Redux and what to render in a preview panel (Markdown, cards, tables, diagrams, etc.).

## Model Controls
- Selection: Components commonly expose a `model` selector (e.g., `gpt-5-mini`, `mistral`, `deepseek-chat`).
- Temperature: Saved to localStorage (`aiDashboard_temperature`) and used on requests.
- Tokens: `max_completion_tokens` and other limits are user-configurable per agent.

## Safety & Guardrails
- Prompts explicitly restrict scope (e.g., ontology modeling only) and enforce naming/uniqueness rules.
- Prefer schema-constrained endpoints when possible for deterministic parsing and validation.

## Troubleshooting
- 4xx/5xx from endpoints:
  - Check request payload shape and required fields (`schemaName`, prompts, context).
  - Confirm API keys and provider configuration in environment (`.env.local`).
- Empty/odd responses:
  - Inspect network tab/logs and the normalization logic in chat components.
  - Reduce temperature and/or simplify prompts and context.

## Tips
- Keep prompts short, specific, and scoped; move background into the Document Panel.
- Start with free-form generation to explore ideas, then switch to `/api/genmodel` once the target structure is clear.
- Log payloads and map model ids carefully; mismatch can cause provider errors.
- **ThreePanelLayout flexibility:** Pass either `{ tabs: [...], defaultTab: '...' }` for tabbed panels, or plain JSX (React.ReactNode) for single-content panels. The layout component auto-detects and renders accordingly.

## Do
- use Next.js where possible
- use redux toolkit for state management with useLocalStore
- use shadcn for layout components

## Glossary
- Agent: A focused UI + prompt + endpoint orchestration for a specific artifact.
- Gateway: Provider-agnostic text generation endpoint (`/api/vercel-ai/generate`).
- Genmodel: Schema-constrained structured generation endpoint (`/api/genmodel`).
- Context: User-managed Markdown content injected into prompts.
- Presentation: Human-readable markdown summary stored alongside structured output.
- Selection sets: Named collections of graph selections (concepts/relationships) persisted to localStorage for reuse.

