# Use official Node.js image as the base
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the entire source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the desired port
EXPOSE 1234

# Run the built JavaScript application
CMD ["node", "dist/index.js"]
