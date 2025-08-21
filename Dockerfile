# -------------------------------
# 1. Base image
# -------------------------------
FROM node:22-alpine AS base
WORKDIR /app

# -------------------------------
# 2. Build stage
# -------------------------------
FROM base AS build

# Copy package files first (better caching)
COPY app/package*.json ./

# Install ALL deps (including dev)
RUN npm install

# Copy rest of the code
COPY app .

# Build client (Vite) → dist/public
RUN npm run build:client

# Build server (tsc/esbuild) → dist/server.js
RUN npm run build:server

# -------------------------------
# 3. Runtime stage
# -------------------------------
FROM base AS runtime

ENV NODE_ENV=production

# Copy only package files first (for caching)
COPY app/package*.json ./
# Install only production dependencies
RUN npm install --omit=dev

# Copy built artifacts from build stage
COPY --from=build /app/dist ./dist

# Default port
EXPOSE 5000

CMD ["npm", "start"]
