ARG BASE_IMAGE=node:22-slim
ARG SLIM_IMAGE=node:22-slim

# ── Build stage ──────────────────────────────────────────────────────────────
# node:22-slim includes Node.js + npm and is sufficient for pure TypeScript
# compilation (no native module build tools required for this project).
FROM ${BASE_IMAGE} AS build

WORKDIR /app

# Copy manifests first for layer caching (REQ-DK-10)
COPY package*.json ./

RUN npm ci

# Copy source files needed for both server and client compilation
COPY tsconfig.json tsconfig.client.json ./
COPY src/ ./src/
COPY client/ ./client/
COPY public/ ./public/

# Compile server TypeScript → dist/
RUN npx tsc

# Compile client TypeScript → public/js/
RUN npx tsc -p tsconfig.client.json

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM ${SLIM_IMAGE}

WORKDIR /app

# Copy manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Create non-root user (REQ-DK-06)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy compiled server and static assets from build stage (REQ-DK-04)
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

USER appuser

EXPOSE 8080

CMD ["node", "dist/server.js"]
