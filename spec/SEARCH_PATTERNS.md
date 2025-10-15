# Search patterns for finding navigation links to update

## Patterns to search for:
1. `/ai-chat/aiAssistant` - Replace with `/ai-chat?mode=chat&sub=advanced`
2. `/ai-chat/edit` - Replace with `/ai-chat?mode=edit`
3. `router.push('/ai-chat/` - Check context and update accordingly
4. `<Link href="/ai-chat/` - Check context and update accordingly
5. `navigate('/ai-chat/` - Check context and update accordingly

## Files to check:
- All components in `/src/components/ai-chat/`
- All pages in `/src/app/`
- Any shared components that might link to AI Chat
- Navigation components (`nav-main.tsx`, `nav-secondary.tsx`, etc.)
- Any floating action button components
- Any breadcrumb or tab navigation components

## Test checklist after updates:
- [ ] Clicking "AI Chat" in sidebar opens default view mode
- [ ] Legacy `/ai-chat/aiAssistant` URLs redirect to advanced chat
- [ ] Legacy `/ai-chat/edit` URLs redirect to edit mode
- [ ] All "Edit Document" buttons switch to edit mode
- [ ] All "Chat" buttons switch to chat mode
- [ ] All "View" buttons switch to view mode
- [ ] Mode persists in URL and can be bookmarked
- [ ] Back/forward browser buttons work correctly
