# Agents Guide

This document explains how "agents" are structured and used in this app, and how to build new ones quickly and safely.

## Overview
- Purpose: Task-focused UIs that orchestrate LLMs to produce structured artifacts (domain writeups, ontologies, model views, IR/TV specs, prompts) with shared chat tooling.
- Primary agents:
  - **AI Chat** (`/ai-chat`): Multi-mode interface with three modes:
    - **View Mode**: Document viewing and library management with preview and metadata.
    - **Chat Mode**: AI chat with General (basic) and Advanced (multi-model, experiments) sub-modes.
    - **Edit Mode**: Focused document editing with live preview and metadata controls.
  - **Domain Builder**: Curates domain name/description/presentation.
  - **Model Builder**: Builds Model structures based on a Metamodel similarly via the genmodel endpoint.
  - **Modelview Builder**: Produces schema-constrained model views of the model objects and relships from prompts and context.
  - **Ontology Builder** (`/ontology-builder`): Full-featured agent with Current Domain, Current Ontology, Add. Context tabs (left), AI Ontology Chat (middle), and Suggested Ontology with graph controls (right). Supports multi-select, filters, graph modals, and selection sets.
  - Prompt Builder: Iterates on reusable prompts/templates.

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

## AI Chat Agent (Multi-Mode)

### Architecture
- **Single-page multi-mode design:** One route (`/ai-chat`) with three modes controlled by state and URL params.
- **Mode switching:** Uses `useAIChatMode` hook to manage mode state, sync with URL (`?mode=view|chat|edit&sub=general|advanced`), and persist to localStorage.
- **Mode-specific layouts:** Each mode configures left/middle/right panels differently via `ThreePanelLayout`.
- **Legacy support:** Old URLs (`/ai-chat/aiAssistant`, `/ai-chat/edit`) redirect to new mode system.
- **Layout structure:** 
  - Uses `ThreePanelLayout` component with `middlePanelHeader` prop for mode controls
  - `ModeHeader` component rendered in middle panel between hide panel buttons
  - `FileOperations` component at top of page above all panels
  - **Default tab initialization:** `ThreePanelLayout` must initialize activeTab state from `defaultTab` prop on mount using `useEffect` to ensure tabs display content immediately without requiring user clicks.

### View Mode (`/ai-chat?mode=view`)
- **Purpose:** Browse, preview, and manage document library.
- **Left panel:** Tabs — "Domain", "Library" (document list with search/filter).
- **Middle panel:** Tab — "Current Document" showing the document preview with metadata display (name, type) and quick actions (Edit, Chat, Delete).
- **Right panel:** Tab — "Document Info" displaying current document metadata (name, type, created/updated dates) and statistics (characters, words, lines).
- **Navigation:** Click document in library to view in middle panel, action buttons to switch modes.
- **Current document display:** Shows name and type from selected document metadata, or "Current Document" / "Markdown" as fallback when viewing unsaved content.

### Chat Mode (`/ai-chat?mode=chat`)
- **Purpose:** AI-powered chat with document context.
- **Sub-modes:** Toggle between "General" and "Advanced" via `ChatSubModeToggle`.
- **Context controls:** Checkboxes for "Include Domain" (auto-inject domain presentation) and "Refine document" (current document refinement mode).

#### General Sub-Mode (`?mode=chat&sub=general`)
- **Left panel:** Tabs — "Domain" (default), "Current Document".
- **Middle panel:** Tab — "AI Chat" (default, single tab).
- **Right panel:** Tabs — "Preview" (default), "Library".
- **Tab initialization:** All three panels must have their defaultTab content visible on page load/reload.
- **Preview panel features:**
  - Displays document name and type at top (synchronized with Current Document tab metadata)
  - Name/type are passed from page-level `documentName`/`documentType` state
  - When "Save to Library" is clicked, saves with the current name/type values
  - Edit button to modify preview content
  - Clear button to remove preview
  - Save to Library button with DiffModal confirmation
- **Save workflow:** 
  1. User edits name/type in Current Document tab metadata header
  2. Changes update page-level `documentName`/`documentType` state
  3. Preview panel displays these same values
  4. "Save to Library" creates document with current name/type
  5. DiffModal shows confirmation
  6. After save, switches to View Mode and selects the saved document
- **Context injection:** Domain presentation automatically included when "Include Domain" is checked (default: true).

#### Advanced Sub-Mode (`?mode=chat&sub=advanced`)
- **Left panel:** Tabs — "Domain", "Current Ontology", "Context Docs", "Additional Context".
- **Middle panel:** Tabs — "AI Chat", "Multi-Model Compare", "Experiments".
- **Right panel:** Tabs — "Suggestions", "Analysis", "Tools".

### Edit Mode (`/ai-chat?mode=edit`)
- **Purpose:** Focused document editing with live preview.
- **Left panel:** Tabs — "Domain", "Context Docs" (default: "Domain").
- **Middle panel:** Plain JSX — Document metadata header (name/type dropdown) + TextareaAutosize for direct editing. Auto-populates document name from first line of content if empty.
- **Right panel:** Plain JSX — Live preview showing current document name and type at top, character count, and save-to-library button.
- **Header styling:** Orange border to indicate focused edit session.
- **State management:** Local state for `documentName`, `documentType`, `previewContent`, and `currentDocument`.
- **Live preview:** Updates in real-time as you type using local state in `EditModeMiddlePanel`.
- **Live preview display:** Right panel shows the name and type from the middle panel's metadata inputs, reflecting the current document being edited.
- **Document name auto-fill:** When `documentName` is empty, automatically extracts and uses the first line of `currentDocument` (strips markdown heading markers).
- **Document type selector:** Dropdown with predefined types (markdown, project-plan, roadmap, domain, prompt, specification, requirements).
- **Save functionality:** When "Save to Library" is clicked, the `handleSaveToLibrary` function in `page.tsx` creates a `MarkdownDocument` object using the current `documentName`, `documentType`, and `currentDocument` content, then shows the DiffModal for confirmation before saving to Redux store.
- **DiffModal:** Shows line-by-line diff before saving to library, with added lines (green), removed lines (red), and unchanged lines (gray).

### Mode Components
- **ModeHeader:** Mode switcher, ChatSubModeToggle, and close button - rendered in `middlePanelHeader` of `ThreePanelLayout`
- **ModeSwitcher:** Three-button toggle (View/Chat/Edit) with icons
- **ChatSubModeToggle:** Two-button toggle (General/Advanced) for chat mode
- **useAIChatMode hook:** Manages mode state, URL sync, localStorage persistence
- **DiffModal:** Shows git-style diff view with line-by-line changes, used when saving documents to library from edit mode.

### State Management
- **Shared state:** `contextContent`, `currentDocument`, `documents`, `domain`, `metis/models` (Redux).
- **Mode-specific state:** View mode (selected doc), Chat mode (messages), Edit mode (name/type/preview).
- **Persistence:** Mode and sub-mode saved to localStorage, restored on mount.

### Migration Notes
- Old three-page structure consolidated into single page
- Mode switching happens instantly without page reload
- State persists across mode changes
- URL params enable bookmarking specific modes
- Redirect pages maintain backward compatibility

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
- **Tabs not showing default content:**
  - Check that `defaultTab` values in panel configs match actual tab `key` values exactly.
  - Verify `ThreePanelLayout` initializes `activeTab` state from `defaultTab` on mount.
  - Ensure `useEffect` in `ThreePanelLayout` runs when panel content/defaultTab changes.
  - Common issue: `activeTab` state initialized to empty string instead of `defaultTab` value.

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

