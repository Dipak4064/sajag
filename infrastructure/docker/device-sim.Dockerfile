FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/device-sim ./apps/device-sim

RUN npx tsc -p packages/types \
  && npx tsc -p packages/validation \
  && npx tsc -p apps/device-sim/tsconfig.json

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/device-sim ./apps/device-sim
COPY --from=build /app/packages ./packages
COPY --from=build /app/tsconfig.base.json ./

USER node
EXPOSE 4001

CMD ["node", "apps/device-sim/dist/index.js"]
