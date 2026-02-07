#!/bin/bash
# Quick script to setup webhook using .env.local

cd "$(dirname "$0")/.."

# Load .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep DAILY_API_KEY | xargs)
fi

if [ -z "$DAILY_API_KEY" ]; then
  echo "❌ DAILY_API_KEY not found in .env.local"
  echo "Please add it to .env.local first"
  exit 1
fi

./scripts/setup-daily-webhook-improved.sh






