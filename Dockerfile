#############################################
# Builder stage: install dev deps and build
#############################################
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first so we can leverage layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including dev) needed for the build
RUN npm ci

# Copy full source and run the build
COPY . .
RUN npm run build

#############################################
# Runner stage: production image with only prod deps
#############################################
FROM node:20-alpine AS runner
WORKDIR /app

# Copy package files and install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# If you need any other runtime assets (e.g. public files), copy them here
# COPY --from=builder /app/some-static-folder ./some-static-folder

# Expose port (Cloud Run will override), keep in sync with your app's PORT usage
EXPOSE 5001

# Start the server (relies on package.json start script)
CMD ["npm", "start"]
