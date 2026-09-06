FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/device-sim/package.json apps/device-sim/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/validation/package.json packages/validation/package.json
RUN npm ci --workspace=apps/api --workspace=apps/device-sim --workspace=packages/types --workspace=packages/validation --include-workspace-root=false
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/device-sim ./apps/device-sim
RUN npm run build --workspace=packages/types && npm run build --workspace=packages/validation

FROM base AS api
COPY tests ./tests
RUN npm run db:generate && npm run build --workspace=apps/api
EXPOSE 4000
CMD ["sh", "-c", "npm run db:push && exec node apps/api/dist/index.js"]

FROM base AS simulator
RUN npm run build --workspace=apps/device-sim
USER node
EXPOSE 4001
CMD ["node", "apps/device-sim/dist/index.js"]
