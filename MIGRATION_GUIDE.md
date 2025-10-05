# AI Chat Multi-Mode Migration Guide

## Overview
The AI Chat interface has been consolidated from three separate pages into a single multi-mode page with seamless mode switching.

## URL Changes

### Old URLs → New URLs

| Old URL                | New URL                           | Description                            |
| ---------------------- | --------------------------------- | -------------------------------------- |
| `/ai-chat`             | `/ai-chat?mode=view`              | Default view mode (document browser)   |
| `/ai-chat/aiAssistant` | `/ai-chat?mode=chat&sub=advanced` | Advanced chat with multi-model support |
| `/ai-chat/edit`        | `/ai-chat?mode=edit`              | Document editor                        |

### Legacy Support
- Old URLs automatically redirect to new multi-mode page
- Redirects preserve functionality
- Can be removed after migration period

## Mode System

### Three Primary Modes
1. **View Mode** (`?mode=view`) - Browse and preview documents
2. **Chat Mode** (`?mode=chat`) - AI chat with context
3. **Edit Mode** (`?mode=edit`) - Document editing

### Chat Sub-Modes
- **General** (`?mode=chat&sub=general`) - Basic chat features
- **Advanced** (`?mode=chat&sub=advanced`) - Multi-model, experiments

## API Changes

### For Components
Instead of navigation:
```tsx
// Old
router.push('/ai-chat/edit');

// New
router.push('/ai-chat?mode=edit');
// Or use mode switching in context
switchMode('edit');
```

### For Links
```tsx
// Old
<Link href="/ai-chat/aiAssistant">AI Assistant</Link>

// New
<Link href="/ai-chat?mode=chat&sub=advanced">AI Assistant</Link>
```

## State Management

### Mode State
- Managed by `useAIChatMode` hook
- Synced to URL query parameters
- Persisted to localStorage
- Available via: `{ mode, chatSubMode, switchMode, switchChatSubMode }`

### Shared State
- `contextContent` - Shared across all modes
- `currentDocument` - Shared across all modes
- `documents` (Redux) - Shared across all modes

### Mode-Specific State
- View: `selectedDocument`
- Chat: `additionalContext`
- Edit: `documentName`, `documentType`, `previewContent`

## Component Updates

### useAIChatMode Hook
```tsx
import { useAIChatMode } from '@/hooks/useAIChatMode';

function MyComponent() {
  const { mode, chatSubMode, switchMode, switchChatSubMode } = useAIChatMode();
  
  // Switch modes
  switchMode('edit');
  switchChatSubMode('advanced');
}
```

### Mode Header
```tsx
import { ModeHeader } from '@/components/ai-chat/ModeHeader';

<ModeHeader
  mode={mode}
  chatSubMode={chatSubMode}
  onModeChange={switchMode}
  onChatSubModeChange={switchChatSubMode}
/>
```

## Benefits

✅ Instant mode switching (no page reload)
✅ State preservation across modes
✅ Bookmarkable URLs with mode
✅ Single codebase to maintain
✅ Consistent user experience
✅ Better performance (less navigation)

## Migration Checklist

### Phase 1: Infrastructure ✅
- [x] Mode types and state management
- [x] Mode switcher components
- [x] Mode management hook

### Phase 2: Mode Components ✅
- [x] View mode panels
- [x] Chat mode panels (general & advanced)
- [x] Edit mode panels

### Phase 3: Main Page ✅
- [x] Consolidated page.tsx
- [x] Mode-based panel rendering
- [x] State management integration

### Phase 4: Navigation 🔄
- [ ] Update nav-main.tsx
- [ ] Update internal links
- [ ] Create redirect pages
- [ ] Update ontology builder links
- [ ] Update floating action buttons
- [ ] Test all navigation paths

### Phase 5: Cleanup
- [ ] Delete old pages (after testing)
- [ ] Remove backup files
- [ ] Update documentation
- [ ] Performance testing

## Testing

### Test Scenarios
1. Navigate to `/ai-chat` - Should show view mode
2. Navigate to `/ai-chat?mode=chat` - Should show general chat
3. Navigate to `/ai-chat?mode=chat&sub=advanced` - Should show advanced chat
4. Navigate to `/ai-chat?mode=edit` - Should show edit mode
5. Navigate to `/ai-chat/aiAssistant` - Should redirect to advanced chat
6. Navigate to `/ai-chat/edit` - Should redirect to edit mode
7. Switch modes using switcher - URL should update
8. Refresh page - Mode should persist
9. Use browser back/forward - Modes should navigate correctly
10. Document state should persist across mode changes

## Rollback Plan

If critical issues are found:
1. Restore backup files from `MIGRATION_BACKUP.md`
2. Revert `src/app/ai-chat/page.tsx` to git history
3. Remove redirect pages
4. Remove new mode infrastructure files
5. Test original functionality
6. Document issues for fix

## Support

For questions or issues:
- Check MIGRATION_BACKUP.md for backup file locations
- Review SEARCH_PATTERNS.md for finding update locations
- Test with URL parameters directly in browser
- Check browser console for routing errors
