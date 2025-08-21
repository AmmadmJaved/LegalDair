# -------------------------------
# 1. Base image
# -------------------------------
FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# -------------------------------
# 2. Build stage
# -------------------------------
FROM base AS build

# Copy everything
COPY package*.json ./
COPY client ./client
COPY server ./server
COPY tsconfig*.json ./

# Install all deps (client + server build time)
RUN npm install

# Build client (Vite) → dist/public
RUN npm run build:client

# Build server (esbuild/tsc) → dist/server.js
RUN npm run build:server

# -------------------------------
# 3. Runtime stage
# -------------------------------
FROM base AS runtime

# Copy only what we need from build
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Default port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
