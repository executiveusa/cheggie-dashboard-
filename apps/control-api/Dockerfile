FROM node:20-alpine AS base
RUN npm install -g pnpm@8
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY packages/skills/package.json packages/skills/
COPY packages/agents/package.json packages/agents/
COPY apps/control-api/package.json apps/control-api/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/skills/node_modules ./packages/skills/node_modules
COPY --from=deps /app/packages/agents/node_modules ./packages/agents/node_modules
COPY --from=deps /app/apps/control-api/node_modules ./apps/control-api/node_modules
COPY . .
RUN pnpm --filter @cheggie/shared build
RUN pnpm --filter @cheggie/skills build
RUN pnpm --filter @cheggie/agents build
RUN pnpm --filter @cheggie/control-api build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@8
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/agents/package.json packages/agents/
COPY apps/control-api/package.json apps/control-api/
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/agents/dist packages/agents/dist
COPY --from=build /app/apps/control-api/dist apps/control-api/dist
EXPOSE 3001
CMD ["node", "apps/control-api/dist/index.js"]
