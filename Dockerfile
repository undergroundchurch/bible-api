# Use Node.js 22 as the base for building native modules
FROM node:22-bullseye AS builder

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

# Install ALL dependencies (including devDependencies for build scripts)
RUN npm ci

# Copy the rest of the application source
COPY . .

# Generate Swagger documentation (server.js expects swagger-output.json)
RUN npm run build:swagger || true

# --- Production Image ---
FROM node:22-bullseye-slim

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Set the working directory
WORKDIR /app

# Copy the application from the builder stage
COPY --from=builder /app /app

# Ensure the database directory is writable (for better-sqlite3)
RUN mkdir -p /app/db && chmod 777 /app/db

# Expose the port used by the application (Makefile uses 3000)
EXPOSE 3000

# Start the application
# We use node directly to avoid issues with dev-only dependencies
CMD ["node", "server.js"]
