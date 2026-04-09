FROM node:20-alpine

# Install dependencies and tools
RUN npm install -g yarn --force

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN yarn install --network-timeout 100000

# Copy client directory
COPY server/client/ ./client/

# Install client dependencies
WORKDIR /app/client
RUN yarn install --network-timeout 100000

# Build client
RUN yarn build

# Go back to app directory
WORKDIR /app

# Copy source files from server/
COPY server/src/ ./src/
COPY server/prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Note: DB migrations run at runtime via docker-compose command

EXPOSE 3000

CMD ["node", "src/index.js"]
