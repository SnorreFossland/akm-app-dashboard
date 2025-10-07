#!/bin/bash

echo "⚠️  WARNING: This will delete old AI Chat pages completely"
echo "This will break any bookmarks or external links to:"
echo "  - /ai-chat/aiAssistant"
echo "  - /ai-chat/edit"
echo ""
echo "Recommended: Keep the redirect pages for backward compatibility"
echo ""
read -p "Are you sure you want to delete them? (type 'DELETE' to confirm): " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "Aborted. Redirect pages kept."
    exit 1
fi

echo ""
echo "Deleting old page directories..."

# Delete old aiAssistant directory completely
rm -rf src/app/ai-chat/aiAssistant/

# Delete old edit directory completely  
rm -rf src/app/ai-chat/edit/

# Delete any backup files
rm -f src/app/ai-chat/page.backup.tsx

echo "✅ Old pages deleted"
echo ""
echo "⚠️  Note: Old URLs will now return 404 errors"
echo "Users must use the new multi-mode page at /ai-chat"
