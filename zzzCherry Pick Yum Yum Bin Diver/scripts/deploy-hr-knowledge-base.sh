#!/bin/bash

# 🚀 HR Knowledge Base - Complete Deployment Script
# This script will deploy the entire HR Knowledge Base system

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║    🚀 HR KNOWLEDGE BASE - DEPLOYMENT SCRIPT                          ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if required env vars exist
echo "📋 Step 1: Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ ERROR: OPENAI_API_KEY not found in environment"
    echo "   Please add it to your .env.local file:"
    echo "   OPENAI_API_KEY=sk-your-key"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not found"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found"
    exit 1
fi

echo "✅ All environment variables found"
echo ""

# Step 2: Run migration
echo "📋 Step 2: Running database migration..."
echo "⚠️  This will create the hr_embeddings_kb table and search functions"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🔄 Running migration..."
# Note: Replace this with your actual database connection
# psql $DATABASE_URL < Supabase: 20260109_create_hr_embeddings_kb.sql
echo "⚠️  Please run this manually via Supabase Dashboard SQL Editor:"
echo "   File: Supabase: 20260109_create_hr_embeddings_kb.sql"
echo ""
read -p "Have you run the migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please run the migration first"
    exit 1
fi

echo "✅ Migration complete"
echo ""

# Step 3: Populate embeddings
echo "📋 Step 3: Populating HR embeddings..."
echo "⏱️  This will take 20-30 minutes"
echo "💰 OpenAI API cost: approximately $0.50-$1.00"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🔄 Starting population script..."
npm run populate-hr-embeddings

echo "✅ Embeddings populated"
echo ""

# Step 4: Test
echo "📋 Step 4: Running tests..."
echo ""
read -p "Run test script? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run test-hr-search
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║    ✅ DEPLOYMENT COMPLETE!                                           ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 HR Knowledge Base is now ready to use!"
echo ""
echo "📊 Next Steps:"
echo "   1. Start dev server: npm run dev"
echo "   2. Visit demo page: http://localhost:3000/hr-assistant-demo"
echo "   3. Integrate into your dashboards"
echo ""
echo "📚 Documentation:"
echo "   • Quick Start: HR_QUICK_START.md"
echo "   • Full Setup: HR_KNOWLEDGE_BASE_SETUP.md"
echo "   • Architecture: HR_SYSTEM_ARCHITECTURE.md"
echo ""
echo "🎯 Integration Example:"
echo "   import { HRAssistant } from '@/components/hr/HRAssistant';"
echo "   <HRAssistant role=\"candidate\" />"
echo ""

