#!/bin/bash

# Simple Vercel Monitoring Script
# Monitors for build errors and deployment status

PROJECT_NAME="gamemakeragent1"
LOG_FILE="vercel-monitor.log"

echo "🚀 Vercel Monitoring for $PROJECT_NAME"
echo "📝 Logging to $LOG_FILE"
echo "=================================="

# Function to log with timestamp
log_msg() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check current deployments
log_msg "🔍 Checking deployment status..."

# Get deployment list and check for errors
DEPLOYMENT_OUTPUT=$(vercel ls 2>&1)

if echo "$DEPLOYMENT_OUTPUT" | grep -q "● Error"; then
    log_msg "🚨 ERROR DEPLOYMENTS DETECTED!"
    echo "$DEPLOYMENT_OUTPUT" | grep "● Error" | while read line; do
        log_msg "❌ $line"
    done
else
    log_msg "✅ No error deployments found"
fi

# Count ready deployments
READY_COUNT=$(echo "$DEPLOYMENT_OUTPUT" | grep -c "● Ready")
log_msg "✅ Ready deployments: $READY_COUNT"

# Show latest deployment status
LATEST_LINE=$(echo "$DEPLOYMENT_OUTPUT" | grep -E "● (Ready|Error|Building)" | head -1)
if [ ! -z "$LATEST_LINE" ]; then
    log_msg "🎯 Latest: $LATEST_LINE"
fi

# Check if we can access the production URL
PROD_URL="https://gamemakeragent1.vercel.app"
log_msg "🌐 Testing production URL: $PROD_URL"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" --max-time 10)
if [ "$HTTP_STATUS" = "200" ]; then
    log_msg "✅ Production site is accessible (HTTP $HTTP_STATUS)"
else
    log_msg "⚠️  Production site returned HTTP $HTTP_STATUS"
fi

log_msg "=================================="
echo ""
echo "✅ Monitoring check complete. See $LOG_FILE for full log."
echo ""
echo "🔄 To run continuous monitoring:"
echo "   watch -n 30 ./scripts/simple-vercel-monitor.sh"
echo ""
echo "📊 To view recent logs:"
echo "   tail -f $LOG_FILE"
