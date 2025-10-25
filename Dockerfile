# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the code
COPY . .

# Build frontend and backend
RUN npm run build

# Expose port and set it as an environment variable
EXPOSE 8080
ENV PORT 8080

# Start the server directly
CMD ["node", "dist/index.js"]
