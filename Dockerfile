# ========================
# Build client (React/Vite)
# ========================
FROM node:22-alpine as client
WORKDIR /client

# Install client dependencies
COPY client/package*.json ./
RUN npm install

# Copy client source and build
COPY client . 
RUN npm run build


# ========================
# Build server (Node/Express/etc)
# ========================
FROM node:22-alpine as server
WORKDIR /app

# Install only production dependencies for server
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server source code
COPY server . 

# Copy client build into server's public directory
COPY --from=client /client/dist ./dist/public

# Start the server
CMD ["node", "dist/server.js"]
