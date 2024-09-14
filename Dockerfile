# Stage 1: Build the application
FROM node:18-alpine AS builder

# Install dependencies required by Puppeteer and build tools
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    # Build dependencies
    && apk add --no-cache --virtual .build-deps \
        g++ \
        gcc \
        libgcc \
        libstdc++ \
        make \
        python3 \
    && rm -rf /var/cache/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if you use Yarn)
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy all source code
COPY . .

# Ensure Nest CLI uses the correct tsconfig.build.json
ENV NEST_CLI_CONFIG=./nest-cli.json

# Build the NestJS application
RUN npm run build

# Remove build dependencies to reduce image size
RUN apk del .build-deps

# Stage 2: Create the production image
FROM node:18-alpine

# Install dependencies required by Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    # Runtime dependencies
    && apk add --no-cache --virtual .runtime-deps \
        dumb-init \
    && rm -rf /var/cache/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set NODE_ENV to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary configuration files
# If you have environment-specific files, you can copy them here
COPY --from=builder /app/.env.production ./

# Use a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the desired port
EXPOSE 3005

# Use dumb-init as the init system to handle signal forwarding and zombie processes
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Define the command to run the application using dotenvx
CMD ["node_modules/@dotenvx/dotenvx/src/cli/dotenvx.js", "run", "-f", ".env.production", "--", "node", "dist/main.js"]
