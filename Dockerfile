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

# Expose port (Cloud Run will override, but good practice)
EXPOSE 5001

# Start the server
CMD ["npm", "start"]
