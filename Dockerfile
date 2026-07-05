FROM node:20-alpine

# Install Python and uv for the Kenyan news scraper
RUN apk add --no-cache python3 py3-pip libxml2-dev libxslt-dev libjpeg-turbo-dev zlib-dev libpng-dev curl && \
    curl -LsSf https://astral.sh/uv/install.sh | sh && \
    ln -sf /root/.cargo/bin/uv /usr/local/bin/uv

# Pre-install Python deps for Kenyan news scraper
COPY server/scripts/requirements.txt /tmp/requirements.txt
RUN uv pip install --system -r /tmp/requirements.txt && \
    python3 -m playwright install chromium --with-deps 2>/dev/null || true && \
    rm -f /tmp/requirements.txt && \
    rm -rf /var/cache/apk/* /root/.cache

# Install dependencies and tools
RUN npm install -g yarn --force

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN yarn install --network-timeout 100000

# Copy client source files
COPY server/client/ ./client/

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
COPY server/scripts/ ./scripts/

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

CMD ["node", "src/index.js"]
