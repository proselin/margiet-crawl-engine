# Stage 1: Build the application
FROM ghcr.io/puppeteer/puppeteer:latest AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Run the application
FROM ghcr.io/puppeteer/puppeteer:latest

# Set the working directory
WORKDIR /app

# Copy the built application and node_modules from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Expose the port your NestJS app runs on (default is 3000)
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
