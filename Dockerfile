# --- Builder Stage ---
FROM node:22-bookworm AS builder

# Set the working directory
WORKDIR /app

# Install build tools for native modules (better-sqlite3, text-similarity-node)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package management files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy the rest of the application source
COPY . .

# Generate Swagger documentation (server.js expects swagger-output.json)
RUN npm run build:swagger || true

# --- Production Image ---
FROM node:22-bookworm-slim

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV REDIS_HOST=localhost

# Set the working directory
WORKDIR /app

# Install redis-server and runtime dependencies
RUN apt-get update && apt-get install -y \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Copy the application from the builder stage
COPY --from=builder /app /app

# Ensure the database directory is writable (for better-sqlite3)
RUN mkdir -p /app/db && chmod 777 /app/db

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Expose the port (3001 as requested)
EXPOSE 3001

# Use the entrypoint script to start Redis and the app
ENTRYPOINT ["/app/entrypoint.sh"]
