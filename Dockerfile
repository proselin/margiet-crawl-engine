# Stage 1: Build the application
FROM node:20 AS build

# Set the working directory
WORKDIR /app

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# copy libs
COPY libs ./libs

# add NPMrc
COPY .npmrc ./.npmrc

ADD package.json /tmp/package.json
ADD node_modules /tmp/node_modules
COPY libs /tmp/libs
RUN cd /tmp
RUN npm ci -verbose --ignore-scripts --perfer-offline --no-audit
RUN cp -a /tmp/node_modules /app/

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Run the application
FROM node:20

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y
RUN curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update
RUN apt-get install google-chrome-stable -y
RUN rm -rf /var/lib/apt/lists/*


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
