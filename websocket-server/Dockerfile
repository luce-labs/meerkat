# Use official Node.js image as the base
FROM node:18 AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install -g typescript

RUN npm install -g ts-node

RUN npm install

# Install all dependencies (including dev)
RUN npm ci

# Copy the entire source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:18 AS production

WORKDIR /usr/src/app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist

# Expose the desired port
EXPOSE 1234

# Run the built JavaScript application
CMD ["node", "dist/index.js"]
