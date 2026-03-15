FROM node:20-alpine AS base
RUN npm install -g pnpm@8
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/jobs/package.json apps/jobs/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @cheggie/shared build
RUN pnpm --filter @cheggie/jobs build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@8
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/jobs/package.json apps/jobs/
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/jobs/dist apps/jobs/dist
CMD ["node", "apps/jobs/dist/index.js"]
