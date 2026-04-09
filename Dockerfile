# Build stage for client
FROM node:20-slim AS client-builder

WORKDIR /app/client
COPY client/ ./
RUN npm install && npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install bash and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy server source
COPY server/ ./server/
COPY prisma/ ./prisma/

# Copy built client from builder
COPY --from=client-builder /app/client/dist ./client/dist

# Generate Prisma client and run migrations
RUN cd server && npx prisma generate
RUN cd server && npx prisma migrate deploy

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server/src/index.js"]
