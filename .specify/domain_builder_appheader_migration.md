# Domain Builder AppHeader Migration Spec

## Meta
- Project: AI Mimris Dashboard
- Component: Domain Builder
- Phase: Refactor
- Related: AI Chat mode system (completed)

## Problem Statement
Domain Builder currently uses floating buttons positioned at the bottom-right of the viewport for "Edit Document" and "Open AI Assistant" actions. This is inconsistent with the AI Chat agent pattern where mode controls are in the AppHeader via `middlePanelHeader` prop.

## Goals
1. Move floating buttons from bottom-right overlay to AppHeader via `middlePanelHeader` prop in `ThreePanelLayout`.
2. Match AI Chat pattern: buttons in header between panel toggle buttons.
3. Improve consistency across agents (Domain Builder, Ontology Builder, AI Chat).
4. Remove floating button z-index conflicts and viewport obstruction.

## Current State

### Current Implementation
```tsx
// src/app/domain-builder/page.tsx
- Floating buttons positioned at bottom-right with fixed positioning
- "Edit Document" button opens left panel
- "Open AI Assistant" button (functionality TBD)
- Z-index: 40 to float above panels
```

### Issues
- Inconsistent with AI Chat pattern
- Buttons can obstruct content
- Z-index management complexity
- No integration with ThreePanelLayout header system

## Proposed Solution

### Architecture Changes

#### 1. Create DomainBuilderHeader Component
```tsx
// New file: src/components/domain-builder/DomainBuilderHeader.tsx
interface DomainBuilderHeaderProps {
  onEditDocument: () => void;
  onOpenAIAssistant: () => void;
  showLeftPanel: boolean;
  showRightPanel: boolean;
}

export function DomainBuilderHeader({
  onEditDocument,
  onOpenAIAssistant,
  showLeftPanel,
  showRightPanel
}: DomainBuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/50">
      <div className="flex items-center gap-2">
        {/* Left: Panel toggle hints */}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Center: Action buttons */}
        <button
          onClick={onEditDocument}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit Document
        </button>
        
        <button
          onClick={onOpenAIAssistant}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Right: Additional controls */}
      </div>
    </div>
  );
}
```

#### 2. Update Domain Builder Page
```tsx
// src/app/domain-builder/page.tsx

// Remove floating buttons section (lines with fixed positioning)
// Add header component

const domainBuilderHeader = (
  <DomainBuilderHeader
    onEditDocument={handleEditDocument}
    onOpenAIAssistant={handleOpenAIAssistant}
    showLeftPanel={showLeftPanel}
    showRightPanel={showRightPanel}
  />
);

<ThreePanelLayout
  // ...existing props...
  middlePanelHeader={domainBuilderHeader}
>
  {/* ...existing children... */}
</ThreePanelLayout>
```

#### 3. Update FileOperations Integration
```tsx
// Ensure FileOperations remains at top of page
<div className="mb-2 pb-2 border-b border-gray-700">
  <FileOperations />
</div>
```

### Visual Design

#### Layout Structure
