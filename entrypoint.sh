#!/bin/bash
set -e

# Start redis in background
echo "Starting Redis server..."
redis-server --daemonize yes --protected-mode no

# Wait for redis to be ready
echo "Waiting for Redis to start..."
MAX_RETRIES=10
COUNT=0
while ! redis-cli ping > /dev/null 2>&1; do
    sleep 1
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Redis failed to start"
        exit 1
    fi
done
echo "Redis is ready."

echo "Starting Bible API on port 3001..."

# Ensure we are in the app directory
cd /app

# Run initialization script
node CreateUsers.js || true

# Start the application
# We use node server.js directly to avoid npm/dotenvx overhead in production
# Environment variables are managed by Docker
export PORT=3001
exec node server.js
