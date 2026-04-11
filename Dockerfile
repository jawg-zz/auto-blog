FROM node:20-alpine

# Install dependencies and tools
RUN npm install -g yarn

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN yarn install --network-timeout 100000

# Copy client package files
COPY server/client/package*.json ./client/

# Install client dependencies
WORKDIR /app/client
RUN yarn install --network-timeout 100000

# Build client
RUN yarn build

# Go back to app directory
WORKDIR /app

# Copy source files
COPY server/src/ ./src/
COPY server/prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

CMD ["node", "src/index.js"]
