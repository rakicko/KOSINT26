# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Stage 1: Build & Native Dependencies Compilation
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Install production dependencies including native addon compilation
RUN npm ci --only=production

# ─────────────────────────────────────────────────────────────
# Stage 2: Minimal Production Image
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Install wget for healthchecks
RUN apk add --no-cache wget

# Copy compiled dependencies and source code
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server ./server
COPY public ./public
COPY skills ./skills

# Ensure server/data directory exists with proper non-root permissions
RUN mkdir -p server/data && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

CMD ["node", "server/index.js"]
