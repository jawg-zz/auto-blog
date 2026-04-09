FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy client package files and install client deps
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

# Go back to app directory
WORKDIR /app

# Copy source code
COPY client/ ./client/
COPY prisma/ ./prisma/
COPY src/ ./src/

# Build client
WORKDIR /app/client
RUN npm run build

# Generate Prisma client and run migrations
WORKDIR /app
RUN npx prisma generate
RUN npx prisma migrate deploy

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "src/index.js"]
