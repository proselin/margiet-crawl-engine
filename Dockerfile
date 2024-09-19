# Stage 1: Build Stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies (including Puppeteer dependencies)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install runtime dependencies (including Puppeteer dependencies)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Copy only the necessary files from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules

# Expose the necessary port (default NestJS port)
EXPOSE 3005

# Set Puppeteer executable path for Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Command to run the application using environment file
CMD ["node", "dist/main"]
