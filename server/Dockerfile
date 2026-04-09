FROM node:20-alpine

WORKDIR /app

# Install yarn
RUN npm install -g yarn

# Copy package files
COPY package*.json ./

# Install dependencies using yarn
RUN yarn install --network-timeout 100000

# Copy source files
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

CMD ["node", "src/index.js"]
