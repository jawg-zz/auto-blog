FROM node:20-alpine

WORKDIR /app

# Copy package files only
COPY package*.json ./

# Install with verbose output
RUN npm install --loglevel=verbose

# Copy rest of files
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

CMD ["node", "src/index.js"]
