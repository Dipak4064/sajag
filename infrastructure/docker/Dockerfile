FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl python3 python3-venv && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY infrastructure/lora-sim/requirements.txt ./infrastructure/lora-sim/requirements.txt
RUN npm ci && python3 -m venv /opt/lora-venv && /opt/lora-venv/bin/pip install --no-cache-dir -r infrastructure/lora-sim/requirements.txt
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/device-sim ./apps/device-sim
COPY tests ./tests
COPY infrastructure/lora-sim ./infrastructure/lora-sim
RUN npm run build && npm run db:generate
ENV PATH="/opt/lora-venv/bin:${PATH}"
EXPOSE 4000 4001 4002
USER node
CMD ["node", "apps/api/dist/index.js"]
