#!/bin/bash

# TrustTrade Keep-Alive Shell Script
# Use this in a cron job or background process to ping your Render URL externally.
# NO dependent libraries needed, uses built-in 'curl'.

# 1. Update your URL below
URL="https://trusttrade-6d81.onrender.com/api/health"

# 2. Run the ping
echo "[$(date)] Pinging $URL..."
RESPONSE=$(curl -s -w "\nCode: %{http_code}\nTime: %{time_total}s\n" "$URL")

echo "$RESPONSE"

# TIP: To run this every 10 minutes on your computer/server:
# crontab -e
# Then add: */10 * * * * /path/to/ping.sh >> /path/to/ping.log 2>&1
