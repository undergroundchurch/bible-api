FROM node:22-bullseye-slim

# Install git and build tools required for native dependencies
RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone the bible-api repository (requires SSH keys to be available at build time)
RUN git clone git@github.com:undergroundchurch/bible-api.git .

# Install application dependencies
RUN npm ci

# Expose the port the app runs on (adjust if different)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
