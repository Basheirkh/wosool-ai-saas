FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm install && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Copy schema.sql to dist (needed at runtime)
RUN mkdir -p dist/database/global && \
    cp src/database/global/schema.sql dist/database/global/schema.sql

# Remove dev dependencies and source files
RUN rm -rf src/ tsconfig.json && \
    npm prune --production && \
    npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

CMD ["node", "dist/index.js"]

