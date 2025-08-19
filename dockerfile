# ------------------------
# 1. Build client (Vite)
# ------------------------
FROM node:22 AS client-builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:client


# ------------------------
# 2. Build server (esbuild)
# ------------------------
FROM node:22 AS server-builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:server


# ------------------------
# 3. Final runtime
# ------------------------
FROM node:22

WORKDIR /app

# Copy server build
COPY --from=server-builder /app/dist/server.js ./dist/server.js

# Copy client build into dist/public
COPY --from=client-builder /app/dist ./dist/public

# Install only prod deps
COPY package*.json ./
RUN npm install --omit=dev

EXPOSE 5000
CMD ["node", "dist/server.js"]
