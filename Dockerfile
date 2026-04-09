FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies (both server and client)
RUN npm install && \
    cd server && npm install && \
    cd ../client && npm install

# Copy source code
COPY server/ ./server/
COPY client/ ./client/
COPY prisma/ ./prisma/

# Build client
RUN cd client && npm run build

# Generate Prisma client and run migrations
RUN cd server && npx prisma generate
RUN cd server && npx prisma migrate deploy

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server/src/index.js"]
