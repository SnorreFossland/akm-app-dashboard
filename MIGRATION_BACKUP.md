# AI Chat Migration Backup

## Current Status: Redirect Pages Active

The old page routes have been **converted to redirect pages** (not deleted):
- `/src/app/ai-chat/aiAssistant/page.tsx` → Redirects to `?mode=chat&sub=advanced`
- `/src/app/ai-chat/edit/page.tsx` → Redirects to `?mode=edit`

**Recommendation:** Keep these redirect pages for backward compatibility.

## If You Want to Delete Redirect Pages (Optional)

**Warning:** Only do this after:
1. All users have migrated to new URLs
2. External links have been updated
3. Bookmarks have been updated
4. At least 30 days grace period

**To delete:**
```bash
# Full deletion (breaks old URLs)
bash DELETE_OLD_PAGES.sh

# Or manually:
rm -rf src/app/ai-chat/aiAssistant/
rm -rf src/app/ai-chat/edit/
```

## Backup Files (can be deleted after testing):
- `/src/app/ai-chat/page.backup.tsx` (if exists)
- Any manual backups you created

## Migration completed:
- [x] Phase 1: Mode infrastructure
- [x] Phase 2: Mode-specific components
- [x] Phase 3: Main page consolidation
- [x] Phase 4: Navigation updates + Redirect pages created
- [ ] Phase 5: Testing and optional cleanup

## Testing checklist:
- [ ] View mode: Library browsing, document selection, metadata display
- [ ] View mode: Edit/Chat/Delete actions work
- [ ] Chat mode (general): Context docs, AI chat, preview
- [ ] Chat mode (advanced): Additional context, multi-model, experiments placeholders
- [ ] Edit mode: Document name/type editing, live preview
- [ ] Edit mode: Save to library with conflict resolution
- [ ] Mode switching: URL sync works
- [ ] Mode switching: localStorage persistence works
- [ ] Library modal: Opens correctly for context and document targets
- [ ] State persistence: Context and documents persist across mode changes
- [ ] **Redirect pages: Old URLs redirect correctly**

## Rollback procedure:
If issues are found:
1. Revert `/src/app/ai-chat/page.tsx` to git history
2. Restore old page implementations from git
3. Remove new mode infrastructure files
4. Test original functionality

## Recommended Approach

**Keep redirect pages indefinitely** or at least for 60-90 days:
- Provides seamless user experience
- Old bookmarks continue to work
- External links continue to work
- No breaking changes for users
- Minimal cost (tiny redirect components)

**Benefits of keeping redirects:**
✅ No broken links
✅ Better user experience
✅ SEO-friendly (301-like redirects)
✅ Time for gradual migration
✅ Can update documentation at leisure

**Delete only if:**
❌ You're absolutely sure no one uses old URLs
❌ All documentation has been updated
❌ All external links have been updated
❌ Analytics show zero traffic to old URLs
