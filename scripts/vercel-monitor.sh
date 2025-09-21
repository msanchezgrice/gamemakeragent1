#!/bin/bash

# Vercel Continuous Monitoring Script
# This script monitors Vercel deployments for build errors and status changes

PROJECT_NAME="gamemakeragent1"
CHECK_INTERVAL=30  # seconds
LOG_FILE="vercel-monitor.log"

echo "🚀 Starting Vercel monitoring for $PROJECT_NAME..."
echo "📊 Checking every $CHECK_INTERVAL seconds"
echo "📝 Logging to $LOG_FILE"
echo ""

# Function to log with timestamp
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check deployment status
check_deployments() {
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Get latest deployments
    local deployments=$(vercel ls --json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        log_with_timestamp "❌ ERROR: Failed to fetch deployments"
        return 1
    fi
    
    # Parse and check for errors
    local error_count=$(echo "$deployments" | jq '[.deployments[] | select(.state == "ERROR")] | length' 2>/dev/null)
    local ready_count=$(echo "$deployments" | jq '[.deployments[] | select(.state == "READY")] | length' 2>/dev/null)
    local building_count=$(echo "$deployments" | jq '[.deployments[] | select(.state == "BUILDING")] | length' 2>/dev/null)
    
    if [ "$error_count" -gt 0 ]; then
        log_with_timestamp "🚨 ALERT: $error_count deployment(s) with errors detected!"
        
        # Get details of failed deployments
        echo "$deployments" | jq -r '.deployments[] | select(.state == "ERROR") | "❌ Failed: \(.url) (Created: \(.created))"' | while read line; do
            log_with_timestamp "$line"
        done
        
        # Show build logs for latest failed deployment
        local latest_error_url=$(echo "$deployments" | jq -r '.deployments[] | select(.state == "ERROR") | .url' | head -1)
        if [ ! -z "$latest_error_url" ]; then
            log_with_timestamp "📋 Fetching build logs for $latest_error_url..."
            vercel logs "$latest_error_url" --output json 2>/dev/null | jq -r '.[] | select(.level == "error") | .message' | while read error_msg; do
                log_with_timestamp "🔍 Build Error: $error_msg"
            done
        fi
    fi
    
    if [ "$building_count" -gt 0 ]; then
        log_with_timestamp "🔨 $building_count deployment(s) currently building..."
    fi
    
    if [ "$ready_count" -gt 0 ]; then
        log_with_timestamp "✅ $ready_count deployment(s) ready"
    fi
    
    # Check latest deployment specifically
    local latest_deployment=$(echo "$deployments" | jq -r '.deployments[0]')
    local latest_state=$(echo "$latest_deployment" | jq -r '.state')
    local latest_url=$(echo "$latest_deployment" | jq -r '.url')
    
    if [ "$latest_state" = "READY" ]; then
        log_with_timestamp "🎉 Latest deployment is READY: $latest_url"
    elif [ "$latest_state" = "ERROR" ]; then
        log_with_timestamp "💥 Latest deployment FAILED: $latest_url"
    elif [ "$latest_state" = "BUILDING" ]; then
        log_with_timestamp "⏳ Latest deployment is BUILDING: $latest_url"
    fi
}

# Function to handle script termination
cleanup() {
    log_with_timestamp "🛑 Monitoring stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Initial status check
log_with_timestamp "🔍 Initial deployment status check..."
check_deployments

# Main monitoring loop
while true; do
    sleep $CHECK_INTERVAL
    check_deployments
done
