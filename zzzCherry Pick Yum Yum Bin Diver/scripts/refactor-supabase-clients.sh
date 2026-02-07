#!/bin/bash

# Automated refactoring script to replace inline Supabase client creation
# with centralized auth utilities

echo "🔧 Starting Supabase client refactoring..."
echo ""

# Find all API route files that create inline clients for auth verification
FILES=$(find src/app/api -name "*.ts" -type f -exec grep -l "createClient.*SUPABASE_SERVICE_ROLE_KEY" {} \;)

COUNT=$(echo "$FILES" | grep -c ".")
echo "📁 Found $COUNT files with inline Supabase client creation"
echo ""

# Backup
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "💾 Creating backup in $BACKUP_DIR/"
echo "$FILES" | while read file; do
  if [ -n "$file" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
  fi
done
echo ""

# Pattern 1: Replace import statements
echo "🔄 Step 1: Updating import statements..."
echo "$FILES" | while read file; do
  if [ -n "$file" ]; then
    # Check if file already imports from auth
    if ! grep -q "from '@/lib/supabase/auth'" "$file"; then
      # Add auth import after existing supabase imports
      if grep -q "from '@/lib/supabase/" "$file"; then
        sed -i '' "/from '@\/lib\/supabase\//a\\
import { getUserFromRequest } from '@/lib/supabase/auth';
" "$file"
      else
        # Add at top with other imports
        sed -i '' "1a\\
import { getUserFromRequest } from '@/lib/supabase/auth';
" "$file"
      fi
    fi
    
    # Remove createClient import if only used for auth
    # (Keep it if used elsewhere in file)
    if ! grep -q "createClient.*(!.*SUPABASE_SERVICE_ROLE_KEY)" "$file" | grep -v "auth.getUser"; then
      sed -i '' "/import.*createClient.*from '@supabase\/supabase-js'/d" "$file"
    fi
  fi
done
echo "✅ Import statements updated"
echo ""

# Pattern 2: Replace auth verification blocks
echo "🔄 Step 2: Replacing auth verification blocks..."
echo "$FILES" | while read file; do
  if [ -n "$file" ]; then
    echo "   Processing: $file"
    
    # This is a complex transformation, so we'll use a marker-based approach
    # Add a marker comment before the auth block
    sed -i '' 's/const authHeader = request.headers.get/\/\/ AUTH_BLOCK_START\n    const authHeader = request.headers.get/g' "$file"
  fi
done
echo "✅ Auth blocks marked for refactoring"
echo ""

echo "📊 Summary:"
echo "   Files backed up: $COUNT"
echo "   Backup location: $BACKUP_DIR/"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo "   1. Review files in backup directory"
echo "   2. Manually replace auth verification blocks with:"
echo "      const user = await getUserFromRequest(request)"
echo "   3. Remove inline createClient calls"
echo "   4. Test all affected endpoints"
echo ""
echo "💡 Example transformation:"
echo "   BEFORE:"
echo "     const authHeader = request.headers.get('authorization')"
echo "     const token = authHeader.replace('Bearer ', '')"
echo "     const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)"
echo "     const { data: { user }, error } = await supabase.auth.getUser(token)"
echo ""
echo "   AFTER:"
echo "     const user = await getUserFromRequest(request)"
echo ""
