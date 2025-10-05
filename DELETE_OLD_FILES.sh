#!/bin/bash

# Script to delete old AI Chat pages after successful migration
# Run this only after all tests pass!

echo "⚠️  This will permanently delete old AI Chat pages"
echo "Make sure you have:"
echo "  1. Completed all tests in TESTING_CHECKLIST.md"
echo "  2. Verified redirect pages work"
echo "  3. Committed current working state to git"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Deleting old page files..."

# Delete old aiAssistant page (keep redirect)
# The redirect page was created in Phase 4, so we're keeping it

# Delete old edit page (keep redirect)
# The redirect page was created in Phase 4, so we're keeping it

# Delete backup files if they exist
rm -f src/app/ai-chat/page.backup.tsx
rm -f src/app/ai-chat/aiAssistant/page.backup.tsx

echo "✅ Old files deleted"
echo ""
echo "Note: Redirect pages at /aiAssistant and /edit are kept for backward compatibility"
echo "You can remove them later after users have migrated to new URLs"
