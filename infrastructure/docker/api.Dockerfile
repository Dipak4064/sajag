FROM node:22-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npx tsc -p packages/types \
  && npx tsc -p packages/validation \
  && npx prisma generate --schema apps/api/prisma/schema.prisma \
  && npx tsc -p apps/api/tsconfig.json

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Use --chown on every COPY so the node user already owns the files at copy time.
# This avoids a slow "RUN chown -R node:node /app" layer that walks all node_modules.
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api ./apps/api
COPY --from=build --chown=node:node /app/packages ./packages
COPY --from=build --chown=node:node /app/tsconfig.base.json ./
# Static assets served by res.sendFile (not emitted by tsc, must be copied explicitly)
COPY --from=build --chown=node:node /app/apps/api/src/public ./apps/api/dist/public

USER node
EXPOSE 4000

ENV DB_MIGRATE_ON_START=true
CMD ["node", "apps/api/dist/index.js"]
