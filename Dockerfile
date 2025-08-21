# -------------------------------
# 1. Base image
# -------------------------------
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# -------------------------------
# 2. Build stage
# -------------------------------
FROM base AS build

# Copy package files first (better caching)
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy rest of the project
COPY . .

# Build client (Vite) → dist/public
RUN npm run build:client

# Build server (esbuild/tsc) → dist/server.js
RUN npm run build:server

# -------------------------------
# 3. Runtime stage
# -------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed from build
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
