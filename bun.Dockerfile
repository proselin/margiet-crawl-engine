FROM oven/bun AS base

WORKDIR /app

COPY . .

FROM oven/bun AS install

WORKDIR /app

COPY --from=base /app/libs ./libs
COPY --from=base /app/package*.json ./

RUN bun install --production

FROM oven/bun AS build

WORKDIR /app

COPY --from=base /app/* .
COPY --from=base /app/libs ./libs
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/package-lock.json .

RUN bun install @nestjs/cli

RUN bun run build


FROM oven/bun AS release

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/package*.json ./

EXPOSE 3000

# Start the application
CMD ["bun", "dist/main"]
