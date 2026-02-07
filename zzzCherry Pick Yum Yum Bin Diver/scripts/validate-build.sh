#!/bin/bash

# Build Validation Script for Next.js + Vercel Deployment
# This script ensures all required build artifacts are present

echo "🔍 Starting build validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
ERRORS=0

# Check if .next directory exists
if [ ! -d ".next" ]; then
    echo -e "${RED}❌ .next directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .next directory exists${NC}"

# Critical files that must exist for production
CRITICAL_FILES=(
    ".next/BUILD_ID"
    ".next/build-manifest.json"
    ".next/routes-manifest.json"
    ".next/required-server-files.json"
)

# Optional but recommended files
RECOMMENDED_FILES=(
    ".next/prerender-manifest.json"
    ".next/react-loadable-manifest.json"
)

echo ""
echo "📋 Checking critical build artifacts..."
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ Missing: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "📋 Checking recommended build artifacts..."
for file in "${RECOMMENDED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${YELLOW}⚠ Missing (optional): $file${NC}"
    fi
done

# Check server directory
if [ ! -d ".next/server" ]; then
    echo -e "${RED}❌ .next/server directory missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ .next/server directory exists${NC}"
fi

# Check static directory
if [ ! -d ".next/static" ]; then
    echo -e "${RED}❌ .next/static directory missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ .next/static directory exists${NC}"
fi

# Check for standalone output (if configured)
if grep -q '"output".*"standalone"' next.config.ts 2>/dev/null || grep -q '"output".*"standalone"' next.config.js 2>/dev/null; then
    if [ -d ".next/standalone" ]; then
        echo -e "${GREEN}✓ Standalone build output exists${NC}"
    else
        echo -e "${YELLOW}⚠ Standalone output configured but directory missing${NC}"
    fi
fi

echo ""
echo "🔧 Checking configuration files..."

# Check Next.js config
if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
    echo -e "${GREEN}✓ Next.js config found${NC}"
else
    echo -e "${RED}✗ No Next.js config file found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json exists${NC}"
    
    # Validate required scripts
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✓ Build script defined${NC}"
    else
        echo -e "${RED}✗ No build script in package.json${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q '"start"' package.json; then
        echo -e "${GREEN}✓ Start script defined${NC}"
    else
        echo -e "${RED}✗ No start script in package.json${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ package.json not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "/.next/" .gitignore || grep -q ".next" .gitignore; then
        echo -e "${GREEN}✓ .next directory in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠ .next should be in .gitignore${NC}"
    fi
fi

# Check for environment variables setup
if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo -e "${GREEN}✓ Environment file exists${NC}"
else
    echo -e "${YELLOW}⚠ No .env file found (may not be needed)${NC}"
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules not found. Run 'npm install' first.${NC}"
fi

echo ""
echo "📊 Build Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ BUILD VALIDATION PASSED${NC}"
    echo "Your build is ready for deployment!"
    echo ""
    echo "To deploy to Vercel:"
    echo "  1. Push to GitHub: git push origin main"
    echo "  2. Vercel will automatically deploy"
    echo ""
    echo "To run locally on port 3001:"
    echo "  npm start"
    exit 0
else
    echo -e "${RED}❌ BUILD VALIDATION FAILED${NC}"
    echo "Found $ERRORS critical error(s)"
    echo ""
    echo "To fix, run:"
    echo "  1. rm -rf .next"
    echo "  2. npm run build"
    echo "  3. bash scripts/validate-build.sh"
    exit 1
fi
