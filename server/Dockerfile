FROM node:20-alpine

WORKDIR /app

# Copy package files only
COPY package*.json ./

# Debug: check what's in the image
RUN node --version && npm --version

# Install dependencies with error output
RUN npm config set fetch-retries 5 && \
    npm config set fetch-timeout 60000 && \
    npm install --loglevel=error

# Copy rest of files
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

CMD ["node", "src/index.js"]
