#!/bin/bash

# Revert script for MainContent.jsx changes
# This script restores the original hardcoded implementation

BACKUP_FILE="/home/meta-h/Desktop/MetR infinity portal deploy/met-r.infinity.portal.frontend/src/components/documentation/MainContent.jsx.backup"
CURRENT_FILE="/home/meta-h/Desktop/MetR infinity portal deploy/met-r.infinity.portal.frontend/src/components/documentation/MainContent.jsx"
CONFIG_DIR="/home/meta-h/Desktop/MetR infinity portal deploy/met-r.infinity.portal.frontend/src/config"

echo "🔄 Reverting MainContent.jsx to original hardcoded implementation..."

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Restore original file
cp "$BACKUP_FILE" "$CURRENT_FILE"

# Remove configuration files (optional)
read -p "Do you want to remove the configuration files? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$CONFIG_DIR"
    echo "🗑️  Configuration files removed"
fi

echo "✅ Successfully reverted to original hardcoded implementation"
echo "📝 Original functionality restored with:"
echo "   - Hardcoded content processing logic"
echo "   - Hardcoded navigation structure"
echo "   - All CSS classes and SVG icons preserved"