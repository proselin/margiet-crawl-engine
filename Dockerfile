FROM node:22 AS base

WORKDIR /app

COPY . .

FROM node:22 AS install

WORKDIR /app

COPY --from=base /app/libs ./libs
COPY --from=base /app/package*.json ./

RUN npm install --production

FROM node:22 AS build
WORKDIR /app
COPY --from=base /app/* .
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/package-lock.json .

RUN npm i @nestjs/cli

RUN npm run build

FROM node:22-alpine AS release

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/package*.json ./

EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
