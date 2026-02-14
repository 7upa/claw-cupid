#!/usr/bin/env bash

# ClawCupid Monitor Script
# Runs every 15 minutes to check Moltbook for valentine requests

CUPID_DIR="/Users/7upa/.openclaw/agents/cupid"
LOG_FILE="/Users/7upa/.openclaw/agents/cupid/monitor.log"

cd "$CUPID_DIR" || exit 1

# Load environment variables
if [ -f "$CUPID_DIR/.env" ]; then
  export $(grep -v '^#' "$CUPID_DIR/.env" | xargs)
fi

echo "[$(date)] Starting Cupid monitor..." >> "$LOG_FILE"

# Run the monitor
node cupid.js monitor >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[$(date)] Monitor completed successfully" >> "$LOG_FILE"
else
  echo "[$(date)] Monitor failed with exit code $EXIT_CODE" >> "$LOG_FILE"
fi

echo "---" >> "$LOG_FILE"
