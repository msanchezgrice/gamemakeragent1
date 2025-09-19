FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/agents/package.json ./packages/agents/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/utils/package.json ./packages/utils/
COPY services/orchestrator/package.json ./services/orchestrator/

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.4
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY services/orchestrator/ ./services/orchestrator/

# Build packages
RUN pnpm --filter @gametok/schemas build
RUN pnpm --filter @gametok/utils build  
RUN pnpm --filter @gametok/agents build
RUN pnpm --filter services-orchestrator build

WORKDIR /app/services/orchestrator

EXPOSE 3333

CMD ["node", "dist/devServer.js"]
