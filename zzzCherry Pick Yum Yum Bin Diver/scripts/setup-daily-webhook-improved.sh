#!/bin/bash

# ==============================================
# DAILY.CO WEBHOOK SETUP SCRIPT (IMPROVED)
# Based on Daily.co official API documentation
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DAILY_API_KEY="${DAILY_API_KEY:-}"
WEBHOOK_URL="${WEBHOOK_URL:-https://www.bpoc.io/api/video/webhook}"
DAILY_API_URL="https://api.daily.co/v1"

# Generate a secure webhook secret (base64 encoded)
generate_webhook_secret() {
  openssl rand -base64 32
}

echo -e "${BLUE}🔧 Daily.co Webhook Setup Script${NC}"
echo -e "${BLUE}================================${NC}\n"

# Step 1: Check API Key
if [ -z "$DAILY_API_KEY" ]; then
  echo -e "${RED}❌ ERROR: DAILY_API_KEY is not set!${NC}"
  echo ""
  echo "Set it using one of these methods:"
  echo "  export DAILY_API_KEY=your_api_key_here"
  echo "  DAILY_API_KEY=your_api_key_here $0"
  echo ""
  echo "Get your API key from: https://dashboard.daily.co/developers"
  exit 1
fi

echo -e "${GREEN}✅ DAILY_API_KEY found${NC}"
echo ""

# Step 2: Verify webhook endpoint is reachable
echo -e "${BLUE}📡 Step 1: Verifying webhook endpoint is reachable...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" | grep -q "200\|404\|405"; then
  echo -e "${GREEN}✅ Webhook endpoint is reachable: $WEBHOOK_URL${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: Could not verify webhook endpoint reachability${NC}"
  echo "   Make sure $WEBHOOK_URL is deployed and accessible"
fi
echo ""

# Step 3: List existing webhooks
echo -e "${BLUE}📋 Step 2: Checking existing webhooks...${NC}"
EXISTING_RESPONSE=$(curl -s -X GET "$DAILY_API_URL/webhooks" \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json")

if echo "$EXISTING_RESPONSE" | grep -q '"error"'; then
  echo -e "${RED}❌ Error fetching webhooks:${NC}"
  echo "$EXISTING_RESPONSE" | jq '.' 2>/dev/null || echo "$EXISTING_RESPONSE"
  exit 1
fi

EXISTING_WEBHOOKS=$(echo "$EXISTING_RESPONSE" | jq -r '.data[]? | "\(.id)|\(.url)"' 2>/dev/null || echo "")

if [ -n "$EXISTING_WEBHOOKS" ]; then
  echo -e "${YELLOW}Found existing webhooks:${NC}"
  echo "$EXISTING_WEBHOOKS" | while IFS='|' read -r id url; do
    echo "  - ID: $id"
    echo "    URL: $url"
    
    # Check if this is our webhook or an old one
    if [[ "$url" == *"bpoc"* ]] || [[ "$url" == *"vercel.app"* ]]; then
      echo -e "    ${YELLOW}→ Will be deleted (old/duplicate)${NC}"
    fi
  done
else
  echo -e "${GREEN}No existing webhooks found${NC}"
fi
echo ""

# Step 4: Clean up old webhooks
echo -e "${BLUE}🧹 Step 3: Cleaning up old webhooks...${NC}"
if [ -n "$EXISTING_WEBHOOKS" ]; then
  echo "$EXISTING_WEBHOOKS" | while IFS='|' read -r id url; do
    if [[ "$url" == *"bpoc"* ]] || [[ "$url" == *"vercel.app"* ]]; then
      echo "  Deleting old webhook: $id ($url)"
      DELETE_RESPONSE=$(curl -s -X DELETE "$DAILY_API_URL/webhooks/$id" \
        -H "Authorization: Bearer $DAILY_API_KEY")
      
      if echo "$DELETE_RESPONSE" | grep -q '"error"'; then
        echo -e "    ${RED}❌ Failed to delete${NC}"
      else
        echo -e "    ${GREEN}✅ Deleted${NC}"
      fi
    fi
  done
fi
echo ""

# Step 5: Generate webhook secret (optional but recommended)
echo -e "${BLUE}🔐 Step 4: Generating webhook secret for HMAC verification...${NC}"
if command -v openssl &> /dev/null; then
  WEBHOOK_SECRET=$(generate_webhook_secret)
  echo -e "${GREEN}✅ Generated secret: ${WEBHOOK_SECRET}${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  IMPORTANT: Save this secret!${NC}"
  echo "   Add it to your .env.local as:"
  echo "   DAILY_WEBHOOK_SECRET=$WEBHOOK_SECRET"
  echo ""
else
  echo -e "${YELLOW}⚠️  openssl not found, skipping secret generation${NC}"
  echo "   You can generate one manually: openssl rand -base64 32"
  WEBHOOK_SECRET=""
fi

# Step 6: Create webhook with CORRECT event types
echo -e "${BLUE}🚀 Step 5: Creating webhook with correct event types...${NC}"

# CORRECT event types based on Daily.co API documentation
# Daily.co uses specific event names - see error message for full list
EVENT_TYPES='[
  "recording.started",
  "recording.ready-to-download",
  "recording.error",
  "meeting.started",
  "meeting.ended",
  "participant.joined",
  "participant.left"
]'

WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "url": "$WEBHOOK_URL",
  "eventTypes": $EVENT_TYPES
}
EOF
)

# Add HMAC secret if we generated one
if [ -n "$WEBHOOK_SECRET" ]; then
  WEBHOOK_PAYLOAD=$(echo "$WEBHOOK_PAYLOAD" | jq ". + {hmac: \"$WEBHOOK_SECRET\"}")
fi

echo "Webhook payload:"
echo "$WEBHOOK_PAYLOAD" | jq '.' 2>/dev/null || echo "$WEBHOOK_PAYLOAD"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "$DAILY_API_URL/webhooks" \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD")

# Check response
if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
  WEBHOOK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
  WEBHOOK_STATUS=$(echo "$CREATE_RESPONSE" | jq -r '.status' 2>/dev/null || echo "")
  
  echo -e "${GREEN}✅ Webhook created successfully!${NC}"
  echo ""
  echo "Webhook Details:"
  echo "  ID: $WEBHOOK_ID"
  echo "  URL: $WEBHOOK_URL"
  echo "  Status: $WEBHOOK_STATUS"
  echo ""
  echo "Subscribed Events:"
  echo "  ✅ recording.started"
  echo "  ✅ recording.ready-to-download"
  echo "  ✅ recording.error"
  echo "  ✅ meeting.started"
  echo "  ✅ meeting.ended"
  echo "  ✅ participant.joined"
  echo "  ✅ participant.left"
  echo ""
  
  if [ -n "$WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠️  REMEMBER: Add this to your .env.local:${NC}"
    echo "   DAILY_WEBHOOK_SECRET=$WEBHOOK_SECRET"
    echo ""
  fi
  
  echo -e "${GREEN}🎉 Setup complete!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Test the webhook by creating a video room"
  echo "  2. Check logs at: https://dashboard.daily.co/webhooks"
  echo "  3. Monitor webhook events in your application logs"
  
else
  echo -e "${RED}❌ Failed to create webhook${NC}"
  echo ""
  echo "Response:"
  echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
  echo ""
  echo "Common issues:"
  echo "  - Invalid API key"
  echo "  - Webhook URL not reachable (must return 200 OK)"
  echo "  - Webhook URL already exists"
  echo "  - Invalid event types"
  exit 1
fi

