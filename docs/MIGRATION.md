# Ontology Builder Header Migration

## Summary
The ontology builder still uses the legacy floating action buttons to toggle the project plan editor and AI assistant. This migration aligns it with the Domain Builder header pattern so all agents share the same UX for mode toggles and panel guidance.

## Goals
- Replace floating buttons with a header bar rendered via the `middlePanelHeader` slot on `ThreePanelLayout`.
- Provide explicit view/edit/AI toggle buttons with consistent styling and active state behaviour.
- Ensure toggles manage panel visibility and routing just like the domain builder implementation.

## Implementation Outline
1. **Add Header Component**  
   - Create `src/components/ontology-builder/OntologyBuilderHeader.tsx` modelled after `DomainBuilderHeader`.  
   - Accept handlers/flags for `onViewMode`, `onToggleEdit`, `onOpenAIAssistant`, `isEditDocumentActive`, `isAIAssistantActive`, plus `showLeftPanel`/`showRightPanel` hints.  
   - Use gray inactive buttons with blue (edit) / purple (AI) / emerald (view) active states for parity.
2. **Update Page State**  
   - In `src/app/ontology-builder/page.tsx` introduce local state to track which mode is active (view vs edit).  
   - Add helpers so edit mode ensures the left panel is open and the Project Plan tab is selected; AI button should `router.push('/ai-chat?mode=chat&sub=advanced')`.  
   - Pass the header component to `ThreePanelLayout` via `middlePanelHeader`.
3. **Remove Floating Buttons**  
   - Delete the fixed-position floating button block and any redundant state it used.  
   - Confirm there are no lingering references to the removed controls.
4. **Polish & Parity Checks**  
   - Verify panel hint text appears when panels are hidden.  
   - Double-check default tab selection still uses lazy initialisation in `ThreePanelLayout`.  
   - Keep typography/padding aligned with Domain Builder header so the experience feels consistent.

## Testing
- Toggle each mode and ensure the expected panel/tab state updates (view, edit).  
- Hit the AI assistant button and confirm navigation to advanced chat.  
- Hide/show panels and confirm the header hint text appears.  
- Run existing lint/tests if applicable to catch regression in shared layout components.

## Notes
- No Redux changes required; all new state is local to the page.  
- When removing floating buttons make sure any CSS utilities tied to them can be deleted as well.  
- If additional ontology routes still rely on floating buttons, replicate this pattern there in a follow-up PR.
