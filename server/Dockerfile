FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies
RUN npm install && cd client && npm install

# Copy source code
COPY client/ ./client/
COPY prisma/ ./prisma/
COPY src/ ./src/

# Build client
RUN cd client && npm run build

# Generate Prisma client and run migrations
RUN npx prisma generate && npx prisma migrate deploy

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "src/index.js"]
