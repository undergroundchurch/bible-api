#!/bin/bash
set -e

# Start redis in background
redis-server --daemonize yes

echo "Starting Bible API on internal port 3001..."
cd /bible-api
node CreateUsers.js
# Ensure Bible API uses its own port, not the one Cloud Run assigned to the container
PORT=3001 npm start
