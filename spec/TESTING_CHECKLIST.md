# AI Chat Multi-Mode Testing Checklist

## Pre-Testing Setup
- [ ] Clear browser cache and localStorage
- [ ] Test in incognito/private mode
- [ ] Test with different browser sizes
- [ ] Have sample documents in library

## Mode Navigation Tests

### Direct URL Access
- [ ] Navigate to `/ai-chat` → Should show view mode (default)
- [ ] Navigate to `/ai-chat?mode=view` → Should show view mode
- [ ] Navigate to `/ai-chat?mode=chat` → Should show general chat mode
- [ ] Navigate to `/ai-chat?mode=chat&sub=general` → Should show general chat
- [ ] Navigate to `/ai-chat?mode=chat&sub=advanced` → Should show advanced chat
- [ ] Navigate to `/ai-chat?mode=edit` → Should show edit mode

### Legacy URL Redirects
- [ ] Navigate to `/ai-chat/aiAssistant` → Should redirect to advanced chat
- [ ] Navigate to `/ai-chat/edit` → Should redirect to edit mode
- [ ] Verify redirect shows loading message briefly
- [ ] Verify URL changes after redirect

### Mode Switcher UI
- [ ] Click View button → Switches to view mode, URL updates
- [ ] Click Chat button → Switches to chat mode, URL updates
- [ ] Click Edit button → Switches to edit mode, URL updates
- [ ] Active mode button shows correct styling
- [ ] Mode title in header updates correctly

### Chat Sub-Mode Toggle
- [ ] In chat mode, click General button → Switches to general, URL updates
- [ ] In chat mode, click Advanced button → Switches to advanced, URL updates
- [ ] Sub-mode toggle only visible in chat mode
- [ ] Active sub-mode button shows correct styling

## View Mode Tests

### Document Library
- [ ] Library tab shows list of documents
- [ ] Click document → Loads in middle panel
- [ ] Document metadata displays correctly (name, type, dates)
- [ ] Search/filter functionality works (if implemented)

### Middle Panel
- [ ] Selected document preview renders correctly
- [ ] Metadata section shows all fields
- [ ] Edit button → Switches to edit mode with document loaded
- [ ] Chat button → Switches to chat mode with document as context
- [ ] Delete button shows confirmation dialog

### Right Panel
- [ ] Document Info tab shows metadata
- [ ] Statistics calculate correctly (chars, words, lines)
- [ ] Shows placeholder when no document selected

### Domain Tab
- [ ] Domain presentation renders if available
- [ ] Shows placeholder if no domain

## Chat Mode Tests (General)

### Left Panel
- [ ] Domain tab shows domain presentation
- [ ] Context Docs tab allows editing
- [ ] Can open library modal from Context Docs
- [ ] Library modal loads documents correctly

### Middle Panel
- [ ] AI Chat tab shows chat interface
- [ ] Can send messages
- [ ] Messages display correctly
- [ ] Current Document tab shows active document
- [ ] Context is included in chat requests

### Right Panel
- [ ] Preview tab shows generated content
- [ ] Library tab allows document selection
- [ ] Selecting document updates current document

## Chat Mode Tests (Advanced)

### Left Panel
- [ ] Domain tab available
- [ ] Context Docs tab available
- [ ] Additional Context tab available
- [ ] Can edit both context fields independently

### Middle Panel
- [ ] AI Chat tab functional
- [ ] Multi-Model Compare tab shows placeholder
- [ ] Experiments tab shows placeholder
- [ ] Context from both fields combined in chat

### Right Panel
- [ ] Suggestions tab shows placeholder
- [ ] Analysis tab shows placeholder
- [ ] Tools tab shows placeholder

## Edit Mode Tests

### Header & Metadata
- [ ] Orange border visible around page
- [ ] "Focused edit session" text shows
- [ ] Document name field editable
- [ ] Document type dropdown functional
- [ ] Placeholder suggests first line when name empty

### Left Panel
- [ ] Domain tab accessible
- [ ] Context Docs tab accessible
- [ ] Can open library modal for context

### Middle Panel
- [ ] Document editor loads correctly
- [ ] Can edit document content
- [ ] Edit mode active by default
- [ ] No duplicate buttons (library/save/apply)

### Right Panel
- [ ] Live preview updates as you type
- [ ] Preview renders markdown correctly
- [ ] Save to Library button visible and functional

### Save Functionality
- [ ] Save new document with unique name → Creates new
- [ ] Save with existing name → Shows conflict dialog
- [ ] Choose replace → Updates existing document
- [ ] Choose new name → Creates with timestamp
- [ ] After save → Returns to view mode
- [ ] Saved document appears in library

## State Persistence Tests

### localStorage Persistence
- [ ] Switch modes → Refresh page → Mode persists
- [ ] Edit context → Refresh → Context persists
- [ ] Edit additional context → Refresh → Persists
- [ ] Current document persists across refresh

### Cross-Mode State
- [ ] Edit context in chat mode → Switch to edit → Context available
- [ ] Load document in view → Switch to edit → Document loaded
- [ ] Save in edit mode → Switch to view → Document visible

### Browser Navigation
- [ ] Use mode switcher → Browser back button → Returns to previous mode
- [ ] Browser forward button works
- [ ] URL always reflects current mode
- [ ] Can bookmark specific mode URLs

## Library Modal Tests

### Opening & Closing
- [ ] Opens from Context Docs (left panel)
- [ ] Opens from document editor (middle panel)
- [ ] Close button (X) works
- [ ] Click outside modal closes it
- [ ] ESC key closes modal (if implemented)

### Document Selection
- [ ] Select document for context → Updates context field
- [ ] Select document for editing → Loads in editor
- [ ] Modal closes after selection
- [ ] Correct target receives document content

## Panel Visibility Tests

### Toggle Controls
- [ ] Left panel toggle button works
- [ ] Right panel toggle button works
- [ ] Panels collapse/expand smoothly
- [ ] Middle panel expands when side panels collapse
- [ ] Toggle state persists during mode switches

## Error Handling Tests

### Invalid URLs
- [ ] `/ai-chat?mode=invalid` → Defaults to view mode
- [ ] `/ai-chat?sub=invalid` → Defaults to general
- [ ] Malformed query params handled gracefully

### Empty States
- [ ] View mode with no documents → Shows helpful message
- [ ] Edit mode with empty document → Allows editing
- [ ] Chat with no context → Works without context

### Edge Cases
- [ ] Very long document names → Displays correctly
- [ ] Documents with special characters → Handles correctly
- [ ] Rapid mode switching → No visual glitches
- [ ] Multiple tabs open → State syncs correctly (if applicable)

## Performance Tests

### Load Times
- [ ] Initial page load under 2 seconds
- [ ] Mode switching feels instant (< 100ms)
- [ ] Large documents render without lag
- [ ] Library modal opens quickly

### Memory
- [ ] No memory leaks during extended use
- [ ] Switching modes doesn't accumulate memory
- [ ] Large document editing doesn't freeze UI

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through mode switcher buttons
- [ ] Enter/Space activates buttons
- [ ] Tab through form fields in edit mode
- [ ] Focus visible on all interactive elements

### ARIA Labels
- [ ] Mode switcher buttons have aria-labels
- [ ] aria-pressed reflects active state
- [ ] Modal has proper aria attributes
- [ ] Screen reader friendly

## Cross-Browser Tests
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (if applicable)

## Integration Tests

### With Other Agents
- [ ] Links from ontology builder work
- [ ] Links from other agents work
- [ ] Shared Redux state works correctly

### With Backend
- [ ] AI chat requests work
- [ ] Document save to Redux works
- [ ] Context injection in chat works

## Rollback Tests

### Backup Verification
- [ ] Backup files exist and are complete
- [ ] Can restore from backup if needed
- [ ] Git history accessible

## Post-Migration Cleanup
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] agents.md reflects new structure
- [ ] MIGRATION_GUIDE.md accurate

## Sign-Off
- [ ] Developer tested all scenarios
- [ ] No critical bugs found
- [ ] Ready for user testing
- [ ] Ready to delete old pages

**Testing completed by:** _______________
**Date:** _______________
**Notes:** _______________
