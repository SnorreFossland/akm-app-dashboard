# Pages and Modules Guide

This document explains how pages and modules are structured and used in this app, and how to build new ones quickly and safely.

## Overview
- Purpose: Task-focused UIs that orchestrate LLMs to produce structured artifacts (domain writeups, models, modelviews, Metamodel specs, prompts) with shared chat tooling.

## Architecture
- UI layer (pages): Each page has its own Next.js route under `src/app/<modules>/page.tsx` to assemble panels, wire state, and mount the module component(s).
- Orchestrator components:
    - Free-form generation via gateway: `POST /api/vercel-ai/generate` (normalization of output text/choices).
    - Schema-constrained generation: `POST /api/genmodel` with prompts + context to get JSON adhering to a target schema.
  - Models + others follow a similar pattern: UI collects prompt, temperature, max tokens, and context → call `/api/genmodel` and parse streamed or buffered JSON into UI state.
- Shared chat infra: `src/components/ai-chat/ChatComponent.tsx` implements message history, streaming handling, gateway fallback, model/temperature controls, and document-context injection.
- Shared panels & controls:
  - `src/components/ai-chat/DocumentPanel.tsx`: edit/attach Markdown context.
  - `src/components/FileOperations.tsx`: load/save files and library integration.
  - `src/components/ThreePanelLayout.tsx`: left/middle/right layout used across s. Supports both tab objects (`{ tabs: [...], defaultTab: '...' }`) and plain JSX (React.ReactNode) for panels.

## Domain Builder 

### Architecture
- **Single-page design:** One route (`/domain-builder`) with three-panel layout.
- **Header controls:** Edit Document and AI Assistant buttons in AppHeader via `middlePanelHeader` prop (matches AI Chat pattern).
- **Mode system:** Three modes - Normal (view), Edit Domain, AI Assistant.
- **Layout structure:**
  - Uses `ThreePanelLayout` component with `middlePanelHeader` prop for action buttons
  - `DomainBuilderHeader` component rendered in middle panel header
  - `FileOperations` component at top of page above all panels
  - DiffModal for save confirmations

### Panel Modes

#### Normal Mode (Default)
- **Left panel:** "Projects" tab - DocumentPanel with document list
- **Middle panel:** "Current Domain" tab (default) - Shows domain presentation, "Current Model Suite" tab - Shows UniverseComponent
- **Right panel:** "Preview" tab - DocumentPanel for markdown preview from AI Assistant

#### Edit Domain Mode
- **Left panel:** Same as Normal mode
- **Middle panel:** "Edit Domain" tab (default) - Form with name, description, presentation textarea; "Preview" tab - Live preview of markdown; "Current Model Suite" tab
- **Right panel:** "Live Preview" - Shows document header (name, type), Save to Library button, rendered markdown preview, character count

#### AI Assistant Mode
- **Left panel:** Same as Normal mode
- **Middle panel:** "AI Domain Builder" tab (default) - ChatComponent for domain generation; "Current Domain" tab; "Current Model Suite" tab
- **Right panel:** Same as Normal mode

### Header Controls
- **Edit Document button** (Blue, Edit icon):
  - Toggles Edit Domain mode on/off
  - Active state: lighter blue (`bg-blue-500`)
  - Shows textarea editor for domain name, description, and presentation
  - Right panel shows live preview with Save to Library button
- **AI Assistant button** (Purple, Sparkles icon):
  - Toggles AI Assistant mode on/off
  - Active state: lighter purple (`bg-purple-500`)
  - Shows ChatComponent in middle panel for AI-powered domain generation
  - Uses domain-specific ChatComponent with model selection

### Save Workflow (Edit Mode)
1. User edits domain name, description, or presentation in middle panel
2. Changes auto-save to Redux `domain` state via `handleFieldChange`
3. Live preview updates in right panel in real-time
4. User clicks "Save to Library" button in right panel preview
5. System creates/updates MarkdownDocument with type 'domain'
6. DiffModal shows before/after comparison
7. User confirms or cancels save
8. On confirm, document saved to Redux documents array via `saveMarkdownDocument`

### State Management
- **Redux state:** `domain` object with `name`, `description`, `presentation` fields; `documents` array for library
- **Local state:** 
  - `showDomainEditor` - toggles Edit Domain mode
  - `showAIAssistant` - toggles AI Assistant mode
  - `showDiffModal` - controls diff modal visibility
  - `pendingSave` - holds document data pending save confirmation
- **Persistence:** Domain changes auto-save to Redux on edit; library documents persist via Redux

### Visual Design
- **Button styles:** Match AI Chat pattern (`bg-blue-600`, `bg-purple-600`)
- **Active states:** Lighter shades (`bg-blue-500`, `bg-purple-500`)
- **Button sizing:** `px-3 py-1.5 text-sm`
- **Icons:** `h-4 w-4` Lucide icons (Edit, Sparkles)
- **Hover effects:** Lighter shade on hover
- **Mode exclusivity:** Edit and AI Assistant modes are mutually exclusive

### Components
- **DomainBuilderHeader:** Header with Edit Document and AI Assistant toggle buttons, panel visibility hints
- **ChatComponent (domain-specific):** Handles AI-powered domain generation with model selection
- **DiffModal:** Shows line-by-line diff before saving to library



## AI Chat Component (Multi-Mode)

### Architecture
- **Single-page multi-mode design:** One route (`/ai-chat`) with three modes controlled by state and URL params.
- **Mode switching:** Uses `useAIChatMode` hook to manage mode state, sync with URL (`?mode=view|chat|edit&sub=general|advanced`), and persist to localStorage.
- **Mode-specific layouts:** Each mode configures left/middle/right panels differently via `ThreePanelLayout`.
- **Layout structure:** 
  - Uses `ThreePanelLayout` component with `middlePanelHeader` prop for mode controls
  - `ModeHeader` component rendered in middle panel header with mode switcher
  - `FileOperations` component at top of page above all panels
  - Default tab initialization via lazy state initialization in `ThreePanelLayout`

### View Mode (`/ai-chat?mode=view`)
- **Purpose:** Browse, preview, and manage document library.
- **Left panel:** Tabs — "Domain", "Focus Project" (shows Redux focusProject document), "Library" (document list with search/filter). Default tab: "Library".
- **Middle panel:** Tab — "Current Document" showing the document preview with metadata display (name, type) and quick actions (Edit, Chat, Delete).
- **Right panel:** Tab — "Document Info" displaying current document metadata (name, type, created/updated dates) and statistics (characters, words, lines).
- **Navigation:** Click document in library to view in middle panel, action buttons to switch modes.
- **Current document display:** Shows name and type from selected document metadata, or "Current Document" / "Markdown" as fallback when viewing unsaved content.
- **Focus Project:** Displayed in left panel "Focus Project" tab. Set via "Focus" button in MarkdownLibrary. Stored in Redux as `focusProject` (contains id, name). Full document fetched by matching `focusProject.id` with documents array.

### Chat Mode (`/ai-chat?mode=chat`)
- **Purpose:** AI-powered chat with document context.
- **Sub-modes:** General and Advanced (toggle currently hidden in UI, controlled via URL param `?sub=general|advanced`).
- **Context controls:** Checkboxes for "Include Domain" (auto-inject domain presentation) and "Refine document" (current document refinement mode).

#### General Sub-Mode (`?mode=chat&sub=general`)
- **Left panel:** Tabs — "Domain" (default), "Current Document". Default tab: "Domain".
- **Middle panel:** Single tab — "AI Chat" (no tab bar, plain JSX).
- **Right panel:** Tabs — "Preview" (default), "Library". Default tab: "Preview".
- **Tab initialization:** All three panels have their defaultTab content visible on page load without requiring clicks (fixed via lazy state initialization).
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
- **Middle panel:** Single tab — "AI Chat".
- **Right panel:** Tabs — "Suggestions", "Analysis", "Tools".
- **Note:** Full implementation pending. Currently accessible via URL param but UI incomplete.

### Edit Mode (`/ai-chat?mode=edit`)
- **Purpose:** Focused document editing with live preview.
- **Left panel:** Tabs — "Domain", "Focus Project", "Context Docs". Default tab: prioritizes "Focus Project" if set, otherwise "Domain".
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
- **ModeHeader:** Mode switcher rendered in `middlePanelHeader` of `ThreePanelLayout`. Contains `ModeSwitcher` component.
- **ModeSwitcher:** Three-button toggle (View/Chat/Edit) with icons and active state styling (blue background for selected mode).
- **ChatSubModeToggle:** Two-button toggle (General/Advanced) for chat mode — **currently hidden in UI** but functionality intact via URL params.
- **useAIChatMode hook:** Manages mode state, URL sync (`?mode=...&sub=...`), localStorage persistence.
- **DiffModal:** Shows git-style diff view with line-by-line changes, used when saving documents to library from edit mode.

### Focus Project Feature
- **Purpose:** Pin a project document for easy access across all modes.
- **Setting focus project:** Click "Focus" button (orange) in MarkdownLibrary on any document.
- **Storage:** Saved to Redux `focusProject` state with `{ id, name, type, createdAt, updatedAt }`.
- **Display:** 
  - Left panel "Focus Project" tab in View/Edit modes
  - Shows full document content by fetching from documents array using `focusProject.id`
  - Three states: project content shown, project not found, no project set
- **Default tab behavior:** When focus project is set, left panel defaults to "Focus Project" tab instead of "Domain".

### State Management
- **Shared state:** `contextContent`, `currentDocument`, `documents`, `domain`, `focusProject`, `ontology` (Redux).
- **Mode-specific state:** View mode (selected doc, projectDocument), Chat mode (messages, preview), Edit mode (name/type/preview, originalContent).
- **Persistence:** Mode and sub-mode saved to localStorage, restored on mount.
- **Focus project sync:** `useEffect` watches `focusProject` and `documents`, updates local `projectDocument` state when either changes.

### Legacy URL Support
- **Old URLs removed:** `/ai-chat/aiAssistant` and `/ai-chat/edit` redirect pages have been **deleted** (breaking change).
- **Migration:** Users must update bookmarks to use new URL structure:
  - `/ai-chat/aiAssistant` → `/ai-chat?mode=chat&sub=general`
  - `/ai-chat/edit` → `/ai-chat?mode=edit`
- **Rationale:** Cleaner codebase, single source of truth, URL params enable flexible state management.

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
  - Response: JSON (streamed or buffered) with typed fields consumed by the module UI.

## Prompt Conventions (Ontology)
- System prompt: Expert role, narrow scope, and explicit “no domain advice” guidance.
- Behavior guidelines: Naming rules, uniqueness checks, relationship conventions, and required presentation block.
- User prompt: Validation rules and JSON output contract.
- Location: `src/app/ontology-builder/prompts.ts:1` for system message, further exports for behavior and user prompts.

## State & Data Flow
- Modules keep local UI state (prompt, temperature, tokens, progress) and may persist outputs into the Redux model-universe slice when appropriate (e.g., saving suggested ontology to library).

## Adding a New Module
1) Create a route:
   - Add `src/app/<module-name>/page.tsx` using `ThreePanelLayout` with left (context), middle (chat/generation), and right (preview) panels.
2) Create an orchestrator component:
   - Under `src/components/<module-name>/`, build a React component that collects prompt + parameters and calls `/api/vercel-ai/generate` for free-form text or `/api/genmodel` for structured output.
3) Reuse shared panels:
   - Use `DocumentPanel` for Markdown context, and `FileOperations` for file/library actions.
4) Define prompts & schema:
   - The goal is to have a prompt array in Redux store, so users can edit their own prompts.
   - If using `/api/genmodel`, define `schemaName` and ensure the UI can parse/validate the JSON it returns.
5) Navigation:
   - Add a link in `src/components/nav-main.tsx` so the module is reachable in the sidebar.
   - The link is also added to the top-bar as tabs.
6) Persistence & preview:
   - Decide what to persist in Redux and what to render in a preview panel (Markdown, cards, tables, diagrams, etc.).

## Model Controls
- Selection: Components commonly expose a `model` selector (e.g., `gpt-5-mini`, `mistral`, `deepseek-chat`).
- Temperature: Saved to localStorage (`aiDashboard_temperature`) and used on requests.
- Tokens: `max_completion_tokens` and other limits are user-configurable per module.

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
  - Verify `ThreePanelLayout` initializes `activeTab` state from `defaultTab` on mount using lazy initialization: `useState(() => defaultTab || firstTab.key)`.
  - Ensure `useEffect` in `ThreePanelLayout` updates active tabs when panel content/defaultTab changes.
  - Common fix: Use function-based state initialization instead of plain value: `useState(() => panelContent.defaultTab)`.
- **Invalid markdown tags (e.g. `<rowid>`):**
  - Sanitize markdown content before rendering with `MarkdownPreview`.
  - Use whitelist of valid HTML tags, escape invalid tags: `<rowid>` → `&lt;rowid&gt;`.
  - Implemented in `MarkdownPreview.tsx` via `sanitizeMarkdown()` function.
- **Focus project not displaying:**
  - Verify `focusProject` exists in Redux state with valid `id` field.
  - Check that matching document exists in `documents` array.
  - Ensure `useEffect` dependency array includes both `focusProject` and `documents`.
  - Confirm `projectDocument` state is being set correctly.
- **React hooks violations:**
  - Never call hooks inside `useMemo` or other hooks.
  - Move `useSelector` calls to parent component and pass as props.
  - Example: `ChatModeContent` receives `ontology` as prop instead of calling `useSelector` internally.

## Tips
- Keep prompts short, specific, and scoped; move background into the Document Panel.
- Start with free-form generation to explore ideas, then switch to `/api/genmodel` once the target structure is clear.
- Log payloads and map model ids carefully; mismatch can cause provider errors.
- **ThreePanelLayout flexibility:** Pass either `{ tabs: [...], defaultTab: '...' }` for tabbed panels, or plain JSX (React.ReactNode) for single-content panels. The layout component auto-detects and renders accordingly.
- **Default tab initialization:** Use lazy state initialization for active tabs: `useState(() => panelContent.defaultTab || panelContent.tabs[0]?.key)`.
- **Mode switching:** Use URL params for bookmarkable states, localStorage for persistence, both managed by `useAIChatMode` hook.
- **Focus project workflow:** Set focus project in View mode library, access in Edit mode left panel for quick reference while editing other documents.
- **Header pattern migration:** When adding action buttons to modules, use `middlePanelHeader` prop instead of floating buttons for consistency and accessibility.

