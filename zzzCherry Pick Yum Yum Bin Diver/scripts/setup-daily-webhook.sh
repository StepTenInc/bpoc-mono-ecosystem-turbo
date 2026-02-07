#!/bin/bash

# ==============================================
# DAILY.CO WEBHOOK SETUP SCRIPT
# Run this to configure Daily.co to send recording
# and meeting events to your BPOC webhook endpoint
# ==============================================

# Your Daily.co API Key (get from dashboard.daily.co -> Developers)
DAILY_API_KEY="${DAILY_API_KEY:-YOUR_API_KEY_HERE}"

# Your webhook URL - MUST match your production domain!
WEBHOOK_URL="https://www.bpoc.io/api/video/webhook"

echo "🔧 Setting up Daily.co webhook..."
echo "   Webhook URL: $WEBHOOK_URL"
echo ""

if [ "$DAILY_API_KEY" = "YOUR_API_KEY_HERE" ]; then
  echo "❌ ERROR: Please set your DAILY_API_KEY first!"
  echo ""
  echo "   Option 1: Export it:"
  echo "   export DAILY_API_KEY=your_api_key_here"
  echo "   ./scripts/setup-daily-webhook.sh"
  echo ""
  echo "   Option 2: Run inline:"
  echo "   DAILY_API_KEY=your_api_key_here ./scripts/setup-daily-webhook.sh"
  echo ""
  exit 1
fi

# First, list existing webhooks
echo "📋 Checking existing webhooks..."
EXISTING=$(curl -s -X GET "https://api.daily.co/v1/webhooks" \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json")

echo "$EXISTING" | head -c 500
echo ""
echo ""

# Create the webhook
echo "🚀 Creating webhook..."
RESPONSE=$(curl -s -X POST "https://api.daily.co/v1/webhooks" \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"eventTypes\": [
      \"recording.started\",
      \"recording.ready-to-download\",
      \"recording.error\",
      \"meeting.started\",
      \"meeting.ended\",
      \"meeting.participant-joined\",
      \"meeting.participant-left\"
    ]
  }")

echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"id"'; then
  echo "✅ Webhook created successfully!"
  echo ""
  echo "Events subscribed:"
  echo "  - recording.started"
  echo "  - recording.ready-to-download"
  echo "  - recording.error"
  echo "  - meeting.started"
  echo "  - meeting.ended"
  echo "  - meeting.participant-joined"
  echo "  - meeting.participant-left"
else
  echo "❌ Failed to create webhook. Check the response above."
  echo ""
  echo "Common issues:"
  echo "  - Invalid API key"
  echo "  - Webhook URL not reachable"
  echo "  - Webhook already exists for this URL"
fi











